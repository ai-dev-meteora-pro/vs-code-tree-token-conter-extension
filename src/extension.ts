import * as vscode from 'vscode';
import * as os from 'os';
import { TokenCountingService } from './services/TokenCountingService';
import { CacheManager } from './services/CacheManager';
import { TokenDecorationProvider } from './TokenDecorationProvider';
import { TokenStatsManager } from './services/TokenStatsManager';
import { TokenTreeDataProvider } from './TokenTreeDataProvider';

let decorationProvider: TokenDecorationProvider | undefined;
let statsManager: TokenStatsManager | undefined;
let treeDataProvider: TokenTreeDataProvider | undefined;
let treeView: vscode.TreeView<import('./TokenTreeDataProvider').TokenFileItem> | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Token Counter Extension активируется...');
    
    const counter = new TokenCountingService();
    const concurrency = Math.min(16, Math.floor(os.cpus().length / 2));
    const cache = new CacheManager(counter, concurrency);
    statsManager = new TokenStatsManager(cache);
    decorationProvider = new TokenDecorationProvider(statsManager.getFileMap(), statsManager.getFolderMap());
    statsManager.setProvider(decorationProvider);
    
    // Отладочная проверка декораций
    console.log('Проверяем декорации:');
    vscode.workspace.textDocuments.forEach(doc => {
        const decoration = decorationProvider?.provideFileDecoration(doc.uri);
        if (decoration) {
            console.log(`  ${doc.uri.fsPath}: badge=${decoration.badge}`);
        }
    });
    
    // Регистрируем FileDecorationProvider
    console.log('Регистрируем FileDecorationProvider...');
    const decorationDisposable = vscode.window.registerFileDecorationProvider(decorationProvider);
    context.subscriptions.push(decorationDisposable);
    console.log('FileDecorationProvider зарегистрирован');
    
    // Создаем и регистрируем TreeDataProvider
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    treeDataProvider = new TokenTreeDataProvider(workspaceRoot, statsManager.getFileMap());
    treeView = vscode.window.createTreeView('tokenCounterView', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);
    console.log('TreeDataProvider зарегистрирован');

    console.log('Начинаем сканирование workspace...');
    void statsManager.scanWorkspace().then(() => {
        console.log('Сканирование завершено, обновляем представление');
        decorationProvider?.updateDecorations();
        treeDataProvider?.refresh();
    });

    const watcher = vscode.workspace.createFileSystemWatcher('**/*');
    watcher.onDidChange(uri => {
        statsManager?.handleChange(uri);
        treeDataProvider?.refresh();
    });
    watcher.onDidCreate(uri => {
        statsManager?.handleChange(uri);
        treeDataProvider?.refresh();
    });
    watcher.onDidDelete(uri => {
        statsManager?.handleDelete(uri);
        treeDataProvider?.refresh();
    });
    context.subscriptions.push(watcher);

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('tokenCounter.tokenizer')) {
            counter.refreshConfig();
            decorationProvider?.refreshAll();
            treeDataProvider?.refresh();
        }
    }));
    
    // Регистрируем команду refresh
    context.subscriptions.push(vscode.commands.registerCommand('tokenCounter.refresh', () => {
        console.log('Обновляем token counter...');
        void statsManager?.scanWorkspace().then(() => {
            treeDataProvider?.refresh();
            vscode.window.showInformationMessage('Token count обновлен');
        });
    }));
    
    // Тестовая команда для декораций
    context.subscriptions.push(vscode.commands.registerCommand('tokenCounter.testDecoration', async () => {
        const uri = vscode.window.activeTextEditor?.document.uri;
        if (!uri) {
            vscode.window.showInformationMessage('Откройте файл для тестирования');
            return;
        }
        
        // Принудительно обновляем декорацию
        decorationProvider?.updateDecorations();
        
        // Получаем декорацию
        const decoration = decorationProvider?.provideFileDecoration(uri);
        
        if (decoration) {
            vscode.window.showInformationMessage(`Декорация: badge=${decoration.badge}, tooltip=${decoration.tooltip}`);
        } else {
            vscode.window.showWarningMessage('Декорация не найдена');
        }
    }));
    
    // Добавляем команду для отладки
    context.subscriptions.push(vscode.commands.registerCommand('tokenCounter.debug', () => {
        const fileMap = statsManager?.getFileMap();
        const folderMap = statsManager?.getFolderMap();
        
        console.log('=== Token Counter Debug Info ===');
        console.log(`Files in map: ${fileMap?.size || 0}`);
        console.log(`Folders in map: ${folderMap?.size || 0}`);
        
        if (fileMap) {
            console.log('\nFiles:');
            fileMap.forEach((data, path) => {
                console.log(`  ${path}: ${data.tokens} tokens, status: ${data.status}, processed: ${data.processed}`);
            });
        }
        
        // Тестируем декорации
        const activeFile = vscode.window.activeTextEditor?.document.uri;
        if (activeFile && decorationProvider) {
            const decoration = decorationProvider.provideFileDecoration(activeFile);
            console.log(`\nActive file decoration:`);
            console.log(`  URI: ${activeFile.toString()}`);
            console.log(`  fsPath: ${activeFile.fsPath}`);
            console.log(`  Decoration: ${decoration ? JSON.stringify(decoration) : 'none'}`);
        }
        
        vscode.window.showInformationMessage(`Token Counter: ${fileMap?.size || 0} files tracked. Check console for details.`);
    }));
}

export async function deactivate() {
    await statsManager?.dispose();
}
