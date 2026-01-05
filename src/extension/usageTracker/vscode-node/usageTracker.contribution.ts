/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, StatusBarAlignment, StatusBarItem, ViewColumn, WebviewPanel, window, workspace } from 'vscode';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { escape } from '../../../util/vs/base/common/strings';
import { IExtensionContribution } from '../../common/contributions';

interface UsageStatsResponse {
	uptime: number;
	requests: {
		totalRequests: number;
		successfulRequests: number;
		failedRequests: number;
		totalTokens: number;
		averageLatencyMs: number;
		requestsByEndpoint: Record<string, number>;
		requestsByModel: Record<string, number>;
		errorsByType: Record<string, number>;
	};
	cache?: unknown;
	memory?: unknown;
	timestamp: string;
}

export class UsageTrackerContribution extends Disposable implements IExtensionContribution {
	public readonly id = 'usageTracker';

	private statusBarItem: StatusBarItem;
	private webviewPanel: WebviewPanel | undefined;
	private refreshInterval: TimeoutHandle | undefined;

	constructor() {
		super();

		// Create status bar item on the right side
		this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
		this.statusBarItem.text = '$(graph) Usage';
		this.statusBarItem.tooltip = 'View backend service usage statistics';
		this.statusBarItem.command = 'ownrex.showUsageStats';
		this.statusBarItem.show();

		// Register command to show usage stats
		this._register(
			commands.registerCommand('ownrex.showUsageStats', () => {
				this.showUsageStats();
			})
		);

		// Clean up on dispose
		this._register(this.statusBarItem);
	}

	private async showUsageStats(): Promise<void> {
		// If panel already exists, reveal it
		if (this.webviewPanel) {
			this.webviewPanel.reveal();
			return;
		}

		// Create webview panel
		this.webviewPanel = window.createWebviewPanel(
			'ownrexUsageStats',
			'Backend Usage Statistics',
			ViewColumn.Beside,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		// Set initial content
		this.updateWebviewContent();

		// Handle panel disposal
		this._register(this.webviewPanel.onDidDispose(() => {
			this.webviewPanel = undefined;
			if (this.refreshInterval) {
				clearInterval(this.refreshInterval);
				this.refreshInterval = undefined;
			}
		}));

		// Refresh data every 5 seconds
		this.refreshInterval = setInterval(() => {
			if (this.webviewPanel) {
				void this.updateWebviewContent();
			}
		}, 5000);

		// Initial refresh after 1 second
		setTimeout(() => {
			if (this.webviewPanel) {
				void this.updateWebviewContent();
			}
		}, 1000);
	}

	private async updateWebviewContent(): Promise<void> {
		if (!this.webviewPanel) {
			return;
		}

		try {
			// Get backend URL and API key from configuration
			const config = workspace.getConfiguration('ownrex');
			const backendUrl = config.get<string>('backendUrl') || 'http://localhost:8000';
			const apiKey = config.get<string>('apiKey') || '';

			// Fetch usage stats from backend
			const statsUrl = `${backendUrl.replace(/\/$/, '')}/health/stats`;
			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};

			if (apiKey) {
				headers['Authorization'] = `Bearer ${apiKey}`;
			}

			let statsData: UsageStatsResponse | null = null;
			let error: string | null = null;

			try {
				const response = await fetch(statsUrl, { headers });
				if (response.ok) {
					statsData = await response.json() as UsageStatsResponse;
				} else {
					error = `Failed to fetch stats: ${response.status} ${response.statusText}`;
				}
			} catch (fetchError) {
				error = `Connection error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`;
			}

			// Generate HTML content
			const html = this.generateHtmlContent(statsData, error, backendUrl);

			this.webviewPanel.webview.html = html;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			this.webviewPanel.webview.html = this.generateHtmlContent(null, errorMessage, '');
		}
	}

	private generateHtmlContent(statsData: UsageStatsResponse | null, error: string | null, backendUrl: string): string {
		if (error) {
			return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Backend Usage Statistics</title>
	<style>
		body {
			font-family: var(--vscode-font-family);
			padding: 20px;
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
		}
		.error {
			color: var(--vscode-errorForeground);
			padding: 10px;
			background-color: var(--vscode-inputValidation-errorBackground);
			border: 1px solid var(--vscode-inputValidation-errorBorder);
			border-radius: 4px;
			margin: 10px 0;
		}
	</style>
</head>
<body>
	<h1>Backend Usage Statistics</h1>
	<div class="error">
		<strong>Error:</strong> ${this.escapeHtml(error)}
	</div>
	<p>Backend URL: <code>${this.escapeHtml(backendUrl)}</code></p>
	<p>Make sure the backend server is running and accessible.</p>
</body>
</html>`;
		}

		if (!statsData) {
			return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Backend Usage Statistics</title>
	<style>
		body {
			font-family: var(--vscode-font-family);
			padding: 20px;
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
		}
	</style>
</head>
<body>
	<h1>Backend Usage Statistics</h1>
	<p>Loading...</p>
</body>
</html>`;
		}

		const requests = statsData.requests || {};
		const uptime = statsData.uptime || 0;
		const totalRequests = requests.totalRequests || 0;
		const successfulRequests = requests.successfulRequests || 0;
		const failedRequests = requests.failedRequests || 0;
		const totalTokens = requests.totalTokens || 0;
		const averageLatency = requests.averageLatencyMs || 0;
		const requestsByEndpoint = requests.requestsByEndpoint || {};
		const requestsByModel = requests.requestsByModel || {};

		// Format uptime
		const hours = Math.floor(uptime / 3600);
		const minutes = Math.floor((uptime % 3600) / 60);
		const seconds = uptime % 60;
		const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

		// Calculate success rate
		const successRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(1) : '0.0';

		// Format tokens
		const tokensStr = totalTokens >= 1000000
			? `${(totalTokens / 1000000).toFixed(2)}M`
			: totalTokens >= 1000
				? `${(totalTokens / 1000).toFixed(2)}K`
				: totalTokens.toString();

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Backend Usage Statistics</title>
	<style>
		body {
			font-family: var(--vscode-font-family);
			padding: 20px;
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
		}
		.stats-container {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 15px;
			margin: 20px 0;
		}
		.stat-card {
			background-color: var(--vscode-editor-background);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 4px;
			padding: 15px;
		}
		.stat-label {
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
			margin-bottom: 5px;
		}
		.stat-value {
			font-size: 24px;
			font-weight: bold;
			color: var(--vscode-foreground);
		}
		.progress-bar {
			width: 100%;
			height: 8px;
			background-color: var(--vscode-progressBar-background);
			border-radius: 4px;
			overflow: hidden;
			margin-top: 10px;
		}
		.progress-fill {
			height: 100%;
			background-color: var(--vscode-progressBar-background);
			transition: width 0.3s ease;
		}
		.progress-fill.success {
			background-color: var(--vscode-testing-iconPassed);
		}
		.progress-fill.error {
			background-color: var(--vscode-testing-iconFailed);
		}
		.section {
			margin-top: 30px;
		}
		.section-title {
			font-size: 16px;
			font-weight: bold;
			margin-bottom: 10px;
			border-bottom: 1px solid var(--vscode-panel-border);
			padding-bottom: 5px;
		}
		.endpoint-list, .model-list {
			list-style: none;
			padding: 0;
			margin: 0;
		}
		.endpoint-item, .model-item {
			padding: 8px;
			margin: 5px 0;
			background-color: var(--vscode-list-inactiveSelectionBackground);
			border-radius: 3px;
			display: flex;
			justify-content: space-between;
		}
		.endpoint-name, .model-name {
			font-family: var(--vscode-editor-font-family);
		}
		.endpoint-count, .model-count {
			font-weight: bold;
		}
		.info-text {
			font-size: 11px;
			color: var(--vscode-descriptionForeground);
			margin-top: 20px;
			text-align: center;
		}
	</style>
</head>
<body>
	<h1>Backend Usage Statistics</h1>

	<div class="stats-container">
		<div class="stat-card">
			<div class="stat-label">Total Requests</div>
			<div class="stat-value">${totalRequests.toLocaleString()}</div>
		</div>

		<div class="stat-card">
			<div class="stat-label">Successful Requests</div>
			<div class="stat-value">${successfulRequests.toLocaleString()}</div>
			<div class="progress-bar">
				<div class="progress-fill success" style="width: ${successRate}%"></div>
			</div>
			<div style="font-size: 11px; margin-top: 5px; color: var(--vscode-descriptionForeground);">
				${successRate}% success rate
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-label">Failed Requests</div>
			<div class="stat-value">${failedRequests.toLocaleString()}</div>
			${failedRequests > 0 ? `
			<div class="progress-bar">
				<div class="progress-fill error" style="width: ${totalRequests > 0 ? ((failedRequests / totalRequests) * 100).toFixed(1) : 0}%"></div>
			</div>
			` : ''}
		</div>

		<div class="stat-card">
			<div class="stat-label">Total Tokens</div>
			<div class="stat-value">${tokensStr}</div>
			<div style="font-size: 11px; margin-top: 5px; color: var(--vscode-descriptionForeground);">
				${totalTokens.toLocaleString()} tokens
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-label">Average Latency</div>
			<div class="stat-value">${averageLatency}ms</div>
		</div>

		<div class="stat-card">
			<div class="stat-label">Server Uptime</div>
			<div class="stat-value" style="font-size: 18px;">${uptimeStr}</div>
		</div>
	</div>

	${Object.keys(requestsByEndpoint).length > 0 ? `
	<div class="section">
		<div class="section-title">Requests by Endpoint</div>
		<ul class="endpoint-list">
			${Object.entries(requestsByEndpoint)
					.sort(([, a], [, b]) => b - a)
					.map(([endpoint, count]) => `
				<li class="endpoint-item">
					<span class="endpoint-name">${this.escapeHtml(endpoint)}</span>
					<span class="endpoint-count">${count.toLocaleString()}</span>
				</li>
			`).join('')}
		</ul>
	</div>
	` : ''}

	${Object.keys(requestsByModel).length > 0 ? `
	<div class="section">
		<div class="section-title">Requests by Model</div>
		<ul class="model-list">
			${Object.entries(requestsByModel)
					.sort(([, a], [, b]) => b - a)
					.map(([model, count]) => `
				<li class="model-item">
					<span class="model-name">${this.escapeHtml(model)}</span>
					<span class="model-count">${count.toLocaleString()}</span>
				</li>
			`).join('')}
		</ul>
	</div>
	` : ''}

	<div class="info-text">
		Data refreshes automatically every 5 seconds<br>
		Backend URL: <code>${this.escapeHtml(backendUrl)}</code>
	</div>
</body>
</html>`;
	}

	private escapeHtml(text: string): string {
		// Use built-in escape function for <, >, &
		// Quotes don't need escaping for innerHTML content (only for attributes)
		return escape(text);
	}
}

