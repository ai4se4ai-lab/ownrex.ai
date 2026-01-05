/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { PromptElement } from '@vscode/prompt-tsx';
import { isOwnrexEnabled } from '../../../../platform/authentication/node/ownrexServices';
import { IPromptEndpoint } from './promptRenderer';

export class CopilotIdentityRules extends PromptElement {

	constructor(
		props: any,
		@IPromptEndpoint private readonly promptEndpoint: IPromptEndpoint
	) {
		super(props);
	}

	render() {
		const assistantName = isOwnrexEnabled() ? 'Ownrex.ai' : 'GitHub Copilot';
		return (
			<>
				When asked for your name, you must respond with "{assistantName}". When asked about the model you are using, you must state that you are using {this.promptEndpoint.name}.<br />
				Follow the user's requirements carefully & to the letter.
			</>
		);
	}
}

export class GPT5CopilotIdentityRule extends PromptElement {

	constructor(
		props: any,
		@IPromptEndpoint private readonly promptEndpoint: IPromptEndpoint
	) {
		super(props);
	}

	render() {
		const assistantName = isOwnrexEnabled() ? 'Ownrex.ai' : 'GitHub Copilot';
		return (
			<>
				Your name is {assistantName}. When asked about the model you are using, state that you are using {this.promptEndpoint.name}.<br />
			</>
		);
	}
}
