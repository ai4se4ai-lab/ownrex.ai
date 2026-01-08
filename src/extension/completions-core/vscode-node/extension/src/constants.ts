/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Commands ending with "Client" refer to the command ID used in the legacy Copilot extension.
// - These IDs should not appear in the package.json file
// - These IDs should be registered to support all functionality (except if this command needs to be supported when both extensions are loaded/active).
// Commands ending with "Chat" refer to the command ID used in the Copilot Chat extension.
// - These IDs should be used in package.json
// - These IDs should only be registered if they appear in the package.json (meaning the command palette) or if the command needs to be supported when both extensions are loaded/active.

export const CMDOpenPanelClient = 'ownrex.ai.generate';
export const CMDOpenPanelChat = 'ownrex.ai.chat.openSuggestionsPanel'; // "ownrex.ai.chat.generate" is already being used

export const CMDAcceptCursorPanelSolutionClient = 'ownrex.ai.acceptCursorPanelSolution';
export const CMDNavigatePreviousPanelSolutionClient = 'ownrex.ai.previousPanelSolution';
export const CMDNavigateNextPanelSolutionClient = 'ownrex.ai.nextPanelSolution';

export const CMDToggleStatusMenuClient = 'ownrex.ai.toggleStatusMenu';
export const CMDToggleStatusMenuChat = 'ownrex.ai.chat.toggleStatusMenu';

// Needs to be supported in both extensions when they are loaded/active. Requires a different ID.
export const CMDSendCompletionsFeedbackChat = 'ownrex.ai.chat.sendCompletionFeedback';

export const CMDEnableCompletionsChat = 'ownrex.ai.chat.completions.enable';
export const CMDDisableCompletionsChat = 'ownrex.ai.chat.completions.disable';
export const CMDToggleCompletionsChat = 'ownrex.ai.chat.completions.toggle';
export const CMDEnableCompletionsClient = 'ownrex.ai.completions.enable';
export const CMDDisableCompletionsClient = 'ownrex.ai.completions.disable';
export const CMDToggleCompletionsClient = 'ownrex.ai.completions.toggle';

export const CMDOpenLogsClient = 'ownrex.ai.openLogs';
export const CMDOpenDocumentationClient = 'ownrex.ai.openDocs';

// Existing chat command reused for diagnostics
export const CMDCollectDiagnosticsChat = 'ownrex.ai.debug.collectDiagnostics';

// Context variable that enable/disable panel-specific commands
export const CopilotPanelVisible = 'ownrex.ai.panelVisible';
export const ComparisonPanelVisible = 'ownrex.ai.comparisonPanelVisible';

export const CMDOpenModelPickerClient = 'ownrex.ai.openModelPicker';
export const CMDOpenModelPickerChat = 'ownrex.ai.chat.openModelPicker';