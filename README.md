# Ownrex.ai - Take the ownership of your experties, develop it and transfer it to your next project!

**[Ownrex.ai](https://github.com/ai4se4ai-lab/ownrex.ai)** is an AI peer programming tool that helps you write code faster and smarter.

Ownrex.ai adapts to your unique needs allowing you to select the best model for your project, customize chat responses with custom instructions, and utilize agent mode for AI-powered, seamlessly integrated peer programming sessions.

**Get started with [Ownrex.ai](https://github.com/ai4se4ai-lab/ownrex.ai)!**

![Working with Ownrex.ai agent mode to make edits to code in your workspace](https://github.com/microsoft/vscode-copilot-release/blob/main/images/hero-dark.png?raw=true)

When you install Ownrex.ai in Visual Studio Code, you get a powerful AI assistant extension that provides:
* **Inline coding suggestions** - Get intelligent code completions as you type.
* **Conversational AI assistance** - Chat with AI to solve coding problems and get explanations.

## Getting access to Ownrex.ai

Visit the [Ownrex.ai repository](https://github.com/ai4se4ai-lab/ownrex.ai) to get started and configure your AI models.

## AI-powered coding sessions

**Start an AI-powered coding session tailored to your workflow**. Ownrex.ai allows you to quickly iterate on code changes directly in the editor, across multiple files using natural language. For a more autonomous peer programmer experience, agent mode performs multi-step coding tasks at your command. It automatically handles compile and lint errors, monitors terminal and test output, and iterates until the task is complete. Edit mode offers a conversational, step-by-step coding experience. Engage in multi-turn chat conversations while Ownrex.ai applies edits directly to your codebase, allowing you to review changes in context and maintain full control.

![Agent mode in Ownrex.ai creating applications](https://github.com/microsoft/vscode-copilot-release/blob/main/images/agent-mode-readme.gif?raw=true)

## Inline suggestions in the editor

**Automatically receive inline suggestions in the editor** from ghost text suggestions and next edit suggestions to help you write code faster. Ghost text suggestions provide suggestions at the current location, tailored to your coding style and your existing code. Ownrex.ai next edit suggestions takes it a step further and predicts what and where your next logical code change will be. Use the Tab key to navigate and accept changes in quick succession.

![Ownrex.ai next edit suggestions](https://code.visualstudio.com/assets/docs/copilot/inline-suggestions/nes-point.gif)

## Ask and learn about your code with chat

**Ask Ownrex.ai for help with any task or question** in the Chat view, bringing in code from your current files. Rather than giving you a generic answer, it can give answers that are relevant for your codebase using information provided by participants, variables, and slash commands.

![Using the workspace chat participant](https://github.com/microsoft/vscode-copilot-release/blob/main/images/participants-workspace.gif?raw=true)

**Apply Ownrex.ai's AI suggestions directly to your code** using Inline chat, staying in the flow. Need help with refactoring a method, adding error handling, or explaining a complex algorithm - just launch Ownrex.ai in the editor!

![Inline chat in VS Code](https://code.visualstudio.com/assets/docs/copilot/copilot-chat/inline-chat-question-example.png)

### Supported languages and frameworks

Ownrex.ai works on any language, including Java, PHP, Python, JavaScript, Ruby, Go, C#, or C++. It works for most popular languages, libraries and frameworks.

### Version compatibility

As Ownrex.ai releases are integrated with VS Code due to deep UI integration, every new version of Ownrex.ai is compatible with the latest release of VS Code. This means that if you are using an older version of VS Code, you may need to update to use the latest Ownrex.ai features.

### Privacy and terms

By using Ownrex.ai you agree to follow responsible AI practices. Review the transparency note to understand about usage, limitations and ways to improve Ownrex.ai.

Your code is yours. We follow responsible practices to ensure that your code snippets remain private and secure.

To get the latest security fixes, please use the latest version of the extension and VS Code.

## Development

### Prerequisites

- Node.js >= 22.14.0
- npm >= 9.0.0
- Visual Studio Code >= 1.95.0

### Building and Running the Extension

1. **Install dependencies:**
   ```bash
   npm install
   ```

   Note: If you encounter build errors related to native modules (like `sqlite3`), you can install with `--ignore-scripts` flag:
   ```bash
   npm install --ignore-scripts
   ```

2. **Build the extension:**
   ```bash
   npm run compile    # Development build
   # or
   npm run build      # Production build
   ```

3. **Run the extension:**

   **Option A: Using VS Code (Recommended)**
   - Open the project in VS Code
   - Press `F5` or go to Run and Debug (`Ctrl+Shift+D`)
   - Select "Run Extension" from the dropdown
   - A new Extension Development Host window will open with the extension loaded

   **Option B: Using Command Line**
   ```bash
   code --extensionDevelopmentPath="<path-to-extension-folder>"
   ```

   For example:
   ```bash
   code --extensionDevelopmentPath="C:\Users\babaei\Desktop\Research\Ai4SE4AI\ownrex.ai"
   ```

   Or on Unix/Mac:
   ```bash
   code --extensionDevelopmentPath="$(pwd)"
   ```

4. **Development with Watch Mode:**
   ```bash
   npm run watch
   ```
   This will automatically rebuild the extension when you make changes. Then press `F5` in VS Code to launch the extension.

### Resources & next steps
* **Get started with [Ownrex.ai on GitHub](https://github.com/ai4se4ai-lab/ownrex.ai)**
* **[Feedback](https://github.com/ai4se4ai-lab/ownrex.ai/issues)**: We'd love to get your help in making Ownrex.ai better!

## Data and telemetry

The Ownrex.ai Extension for Visual Studio Code collects usage data to help improve our products and services. This extension respects the `telemetry.telemetryLevel` setting which you can learn more about at https://code.visualstudio.com/docs/supporting/faq#_how-to-disable-telemetry-reporting.

## Troubleshooting

### Known Issues

#### GitHub Copilot Extension Conflicts

If you see errors like `command 'ownrex.ai.interactiveSession.feedback' already exists` in the VS Code console, this is due to conflicts with the GitHub Copilot extension. These are third-party extension issues and cannot be fixed in this codebase.

**Workaround:**
1. Disable and re-enable the GitHub Copilot extension
2. Restart VS Code
3. If the issue persists, try disabling one of the conflicting extensions temporarily

#### "No default agent registered" Error

This error appears to be a VS Code internal chat service configuration issue and is not directly related to Ownrex.ai. If you encounter this:

1. Check that VS Code is up to date
2. Try restarting VS Code
3. Check VS Code's extension host logs for more details

#### Command ID Conflicts

If you see errors like `Cannot register two commands with the same id: workbench.action.chat.openPlan`, this is a VS Code internal issue where commands are being registered multiple times. This typically occurs when:

- Multiple extensions try to register the same VS Code internal command
- VS Code's workbench contributions are loaded multiple times
- Extension host is restarted while extensions are still initializing

**Workaround:**
1. Restart VS Code completely (close all windows)
2. Check for extension conflicts in the Extensions view
3. Try disabling other chat-related extensions temporarily
4. Update VS Code to the latest version

#### SQLite Experimental Warning

The warning `(node:xxxx) ExperimentalWarning: SQLite is an experimental feature and might change at any time` is informational only. This is a Node.js warning about SQLite being an experimental feature and does not affect functionality. It can be safely ignored.

#### Punycode Deprecation Warning

The warning `[DEP0040] DeprecationWarning: The 'punycode' module is deprecated` is a Node.js deprecation notice. This warning comes from Node.js itself or a transitive dependency (not directly from Ownrex.ai code). The `punycode` module is being deprecated in favor of userland alternatives, but this does not affect current functionality. This warning can be safely ignored and will be resolved when dependencies update to use the new alternatives.

### Extension Runtime Errors

If you encounter runtime errors related to Git repositories or observable arrays:

- The extension now includes defensive programming to handle edge cases
- Errors should be logged but won't crash the extension
- Check the VS Code Developer Console (Help > Toggle Developer Tools) for detailed error messages

#### Observable Event Handling Errors

If you see errors related to `observableFromEvent` or event subscriptions (e.g., in `completionsUnificationContribution.ts`), these have been fixed to properly handle cases where optional events may not be available. The extension now uses `Event.None` as a fallback for missing events, preventing runtime errors.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow Microsoft's Trademark & Brand Guidelines. Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party's policies.

## License

Copyright (c) Ai4SE4AI Lab. All rights reserved.

Licensed under the [MIT](LICENSE.txt) license.
