/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { ConfigurationChangeEvent } from 'vscode';
import { Emitter, Event } from '../../../util/vs/base/common/event';
import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { CopilotToken } from '../../authentication/common/copilotToken';
import { ICopilotTokenStore } from '../../authentication/common/copilotTokenStore';
import { IBackendTokenService } from '../../authentication/common/backendTokenService';
import { IOwnrexTokenManager } from '../../authentication/node/ownrexTokenManager';
import { isOwnrexEnabled } from '../../authentication/node/ownrexServices';
import { AuthProviderId, ConfigKey, CopilotConfigPrefix, IConfigurationService } from '../../configuration/common/configurationService';
import { ICAPIClientService } from '../common/capiClient';
import { IDomainChangeEvent, IDomainService } from '../common/domainService';

const EnterpriseURLConfig = 'github-enterprise.uri';

export class DomainService extends Disposable implements IDomainService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidChangeDomains = this._register(new Emitter<IDomainChangeEvent>());
	onDidChangeDomains: Event<IDomainChangeEvent> = this._onDidChangeDomains.event;

	constructor(
		@IConfigurationService private readonly _configurationService: IConfigurationService,
		@ICopilotTokenStore private readonly _tokenStore: ICopilotTokenStore,
		@ICAPIClientService private readonly _capiClientService: ICAPIClientService,
		@IBackendTokenService private readonly _backendTokenService: IBackendTokenService | undefined,
		@IOwnrexTokenManager private readonly _ownrexTokenManager: IOwnrexTokenManager | undefined
	) {
		super();
		this._register(this._configurationService.onDidChangeConfiguration(e => this._onDidConfigChangeHandler(e)));
		void this._processToken();
		this._register(this._tokenStore.onDidStoreUpdate(() => void this._processToken()));

	}

	private _onDidConfigChangeHandler(event: ConfigurationChangeEvent) {
		// Updated configs that have to do with GHE Domains
		if (
			event.affectsConfiguration(`${CopilotConfigPrefix}.advanced`) ||
			event.affectsConfiguration(EnterpriseURLConfig)
		) {
			this._processToken();
		}
	}

	private async _processToken(): Promise<void> {
		if (isOwnrexEnabled() && this._backendTokenService && this._ownrexTokenManager) {
			// Use backend token service for Ownrex
			try {
				const apiKey = this._ownrexTokenManager.getApiKey();
				const backendUrl = this._ownrexTokenManager.getBackendUrl();
				const endpoints = await this._backendTokenService.getEndpoints(apiKey, backendUrl);
				const tokenInfo = await this._ownrexTokenManager.getBackendTokenInfo();

				this._processCAPIModuleChangeWithEndpoints(endpoints, tokenInfo.sku);
			} catch (error) {
				// Fallback to token store if backend call fails
				this._processCAPIModuleChange(this._tokenStore.copilotToken);
			}
		} else {
			// Use CopilotToken from store for GitHub Copilot
			this._processCAPIModuleChange(this._tokenStore.copilotToken);
		}
	}

	private _processCAPIModuleChange(token: CopilotToken | undefined): void {
		let capiConfigUrl = this._configurationService.getConfig(ConfigKey.Shared.DebugOverrideCAPIUrl);
		if (capiConfigUrl && capiConfigUrl.endsWith('/')) {
			capiConfigUrl = capiConfigUrl.slice(0, -1);
		}
		let proxyConfigUrl = this._configurationService.getConfig(ConfigKey.Shared.DebugOverrideProxyUrl);
		if (proxyConfigUrl) {
			proxyConfigUrl = proxyConfigUrl.replace(/\/$/, '');
		}
		const enterpriseValue = this._configurationService.getConfig(ConfigKey.Shared.AuthProvider) === AuthProviderId.GitHubEnterprise ? this._configurationService.getNonExtensionConfig<string>(EnterpriseURLConfig) : undefined;
		const moduleToken = {
			endpoints: {
				api: capiConfigUrl || token?.endpoints?.api,
				proxy: proxyConfigUrl || token?.endpoints?.proxy,
				telemetry: token?.endpoints?.telemetry,
				'origin-tracker': token?.endpoints?.['origin-tracker']
			},
			sku: token?.sku || 'unknown',
		};
		this._updateDomains(moduleToken, enterpriseValue);
	}

	private _processCAPIModuleChangeWithEndpoints(endpoints: { api: string; proxy: string; telemetry: string; 'origin-tracker'?: string }, sku: string): void {
		let capiConfigUrl = this._configurationService.getConfig(ConfigKey.Shared.DebugOverrideCAPIUrl);
		if (capiConfigUrl && capiConfigUrl.endsWith('/')) {
			capiConfigUrl = capiConfigUrl.slice(0, -1);
		}
		let proxyConfigUrl = this._configurationService.getConfig(ConfigKey.Shared.DebugOverrideProxyUrl);
		if (proxyConfigUrl) {
			proxyConfigUrl = proxyConfigUrl.replace(/\/$/, '');
		}
		const enterpriseValue = this._configurationService.getConfig(ConfigKey.Shared.AuthProvider) === AuthProviderId.GitHubEnterprise ? this._configurationService.getNonExtensionConfig<string>(EnterpriseURLConfig) : undefined;
		const moduleToken = {
			endpoints: {
				api: capiConfigUrl || endpoints.api,
				proxy: proxyConfigUrl || endpoints.proxy,
				telemetry: endpoints.telemetry,
				'origin-tracker': endpoints['origin-tracker']
			},
			sku: sku || 'unknown',
		};
		this._updateDomains(moduleToken, enterpriseValue);
	}

	private _updateDomains(moduleToken: { endpoints: { api: string; proxy: string; telemetry: string; 'origin-tracker'?: string }; sku: string }, enterpriseValue: string | undefined): void {
		const domainsChanged = this._capiClientService.updateDomains(moduleToken, enterpriseValue);
		if (domainsChanged.capiUrlChanged || domainsChanged.proxyUrlChanged || domainsChanged.telemetryUrlChanged || domainsChanged.dotcomUrlChanged) {
			this._onDidChangeDomains.fire({
				capiUrlChanged: domainsChanged.capiUrlChanged,
				telemetryUrlChanged: domainsChanged.telemetryUrlChanged,
				proxyUrlChanged: domainsChanged.proxyUrlChanged,
				dotcomUrlChanged: domainsChanged.dotcomUrlChanged
			});
		}
	}

}
