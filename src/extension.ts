import * as vscode from 'vscode';
import * as os from 'os';
import { TokenCountingService } from './services/TokenCountingService';
import { CacheManager } from './services/CacheManager';
import { TokenDecorationProvider } from './TokenDecorationProvider';
import { TokenStatsManager } from './services/TokenStatsManager';

let decorationProvider: TokenDecorationProvider | undefined;
let statsManager: TokenStatsManager | undefined;

export function activate(context: vscode.ExtensionContext) {
    const counter = new TokenCountingService();
    const concurrency = Math.min(16, Math.floor(os.cpus().length / 2));
    const cache = new CacheManager(counter, concurrency);
    statsManager = new TokenStatsManager(cache);
    decorationProvider = new TokenDecorationProvider(statsManager.getFileMap(), statsManager.getFolderMap());
    statsManager.setProvider(decorationProvider);
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(decorationProvider));

    void statsManager.scanWorkspace();

    const watcher = vscode.workspace.createFileSystemWatcher('**/*');
    watcher.onDidChange(uri => statsManager?.handleChange(uri));
    watcher.onDidCreate(uri => statsManager?.handleChange(uri));
    watcher.onDidDelete(uri => {
        statsManager?.handleDelete(uri);
    });
    context.subscriptions.push(watcher);

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('tokenCounter.tokenizer')) {
            counter.refreshConfig();
            decorationProvider?.refreshAll();
        }
    }));
}

export async function deactivate() {
    await statsManager?.dispose();
}
