/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Disposable } from '../../../util/vs/base/common/lifecycle';

/**
 * Ownrex.ai Commands Contribution
 * Registers commands for Ownrex.ai configuration and backend management
 */
export class OwnrexCommandsContribution extends Disposable {
	readonly id = 'ownrexCommands';

	constructor() {
		super();
		this._registerCommands();
	}

	private _registerCommands(): void {
		// Set API Key command
		this._register(
			vscode.commands.registerCommand('ownrex.setApiKey', async () => {
				await this._setApiKey();
			})
		);

		// Test Connection command
		this._register(
			vscode.commands.registerCommand('ownrex.testConnection', async () => {
				await this._testConnection();
			})
		);

		// Open Settings command
		this._register(
			vscode.commands.registerCommand('ownrex.openSettings', async () => {
				await vscode.commands.executeCommand('workbench.action.openSettings', 'ownrex');
			})
		);

		console.log('[OwnrexCommands] Commands registered');
	}

	private async _setApiKey(): Promise<void> {
		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter your Ownrex.ai API Key',
			placeHolder: 'Your API key from Ownrex.ai backend',
			password: true,
			ignoreFocusOut: true,
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return 'API key cannot be empty';
				}
				return null;
			}
		});

		if (apiKey) {
			try {
				// Store in VSCode settings
				const config = vscode.workspace.getConfiguration('ownrex');
				await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);

				// Test the connection
				const backendUrl = config.get<string>('backendUrl') || 'http://localhost:8000';
				const isValid = await this._validateApiKey(backendUrl, apiKey);

				if (isValid) {
					vscode.window.showInformationMessage('Ownrex.ai API key saved and validated successfully!');
					console.log('[OwnrexCommands] API key set and validated');

					// Reload window to apply changes
					const reload = await vscode.window.showInformationMessage(
						'Reload window to apply API key changes?',
						'Reload',
						'Later'
					);
					if (reload === 'Reload') {
						vscode.commands.executeCommand('workbench.action.reloadWindow');
					}
				} else {
					vscode.window.showWarningMessage('API key saved, but backend validation failed. Make sure your backend is running.');
					console.warn('[OwnrexCommands] API key saved but validation failed');
				}
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to save API key: ${error}`);
				console.error('[OwnrexCommands] Failed to set API key', error);
			}
		}
	}

	private async _testConnection(): Promise<void> {
		const config = vscode.workspace.getConfiguration('ownrex');
		const backendUrl = config.get<string>('backendUrl') || 'http://localhost:8000';
		const apiKey = config.get<string>('apiKey') || '';

		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Testing Ownrex.ai backend connection...',
				cancellable: false
			},
			async () => {
				try {
					const response = await fetch(`${backendUrl}/health`, {
						method: 'GET',
						headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
					});

					if (response.ok) {
						const data = await response.json() as { status?: string };
						vscode.window.showInformationMessage(
							`✅ Ownrex.ai backend is healthy! Status: ${data.status || 'OK'}`
						);
						console.log('[OwnrexCommands] Backend connection test successful', data);
					} else {
						vscode.window.showErrorMessage(
							`❌ Backend returned status ${response.status}: ${response.statusText}`
						);
						console.error('[OwnrexCommands] Backend connection test failed', { status: response.status });
					}
				} catch (error) {
					vscode.window.showErrorMessage(
						`❌ Cannot connect to Ownrex.ai backend at ${backendUrl}. Make sure the backend server is running.`
					);
					console.error('[OwnrexCommands] Backend connection test error', error);
				}
			}
		);
	}

	private async _validateApiKey(backendUrl: string, apiKey: string): Promise<boolean> {
		try {
			const response = await fetch(`${backendUrl}/health`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${apiKey}`
				}
			});
			return response.ok;
		} catch (error) {
			console.warn('[OwnrexCommands] API key validation failed', error);
			return false;
		}
	}
}

// Export for use in contributions
export default OwnrexCommandsContribution;

