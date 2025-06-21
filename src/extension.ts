import * as vscode from 'vscode';
import { TokenCounterProvider } from './tokenCounterProvider';
import { TokenCountingService } from './tokenCountingService';
import { FileWatcher } from './fileWatcher';

let tokenCounterProvider: TokenCounterProvider;
let tokenCountingService: TokenCountingService;
let fileWatcher: FileWatcher;

export function activate(context: vscode.ExtensionContext) {
    console.log('Token Counter extension is now active!');

    // Initialize services
    tokenCountingService = new TokenCountingService(context);
    tokenCounterProvider = new TokenCounterProvider(context, tokenCountingService);
    fileWatcher = new FileWatcher(tokenCountingService, tokenCounterProvider);

    // Register the tree data provider
    const treeView = vscode.window.createTreeView('explorer', {
        treeDataProvider: tokenCounterProvider,
        showCollapseAll: true
    });

    // Register commands
    const refreshCommand = vscode.commands.registerCommand('tokenCounter.refresh', () => {
        tokenCounterProvider.refresh();
    });

    const showTokenCountCommand = vscode.commands.registerCommand('tokenCounter.showTokenCount', (uri: vscode.Uri) => {
        if (uri) {
            tokenCountingService.getTokenCount(uri.fsPath).then(count => {
                vscode.window.showInformationMessage(`Token count: ${count}`);
            });
        }
    });

    // Listen for configuration changes
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('tokenCounter')) {
            tokenCountingService.clearCache();
            tokenCounterProvider.refresh();
        }
    });

    // Add to subscriptions
    context.subscriptions.push(
        treeView,
        refreshCommand,
        showTokenCountCommand,
        configChangeListener,
        fileWatcher
    );

    // Start initial token counting for workspace
    if (vscode.workspace.workspaceFolders) {
        tokenCountingService.processWorkspace();
    }
}

export function deactivate() {
    if (fileWatcher) {
        fileWatcher.dispose();
    }
}