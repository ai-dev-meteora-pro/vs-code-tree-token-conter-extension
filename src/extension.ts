import * as vscode from 'vscode';
import * as os from 'os';
import { TokenCountingService } from './services/TokenCountingService';
import { CacheManager } from './services/CacheManager';
import { TokenDecorationProvider } from './TokenDecorationProvider';

let decorationProvider: TokenDecorationProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
    const counter = new TokenCountingService();
    const concurrency = Math.min(16, Math.floor(os.cpus().length / 2));
    const cache = new CacheManager(counter, concurrency);
    decorationProvider = new TokenDecorationProvider(cache);
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(decorationProvider));

    const watcher = vscode.workspace.createFileSystemWatcher('**/*');
    watcher.onDidChange(uri => decorationProvider?.invalidate(uri));
    watcher.onDidCreate(uri => decorationProvider?.invalidate(uri));
    watcher.onDidDelete(uri => decorationProvider?.invalidate(uri));
    context.subscriptions.push(watcher);

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('tokenCounter.tokenizer')) {
            counter.refreshConfig();
            decorationProvider?.refreshAll();
        }
    }));
}

export function deactivate() {}
