import * as vscode from 'vscode';
import { TokenCountingService } from './tokenCountingService';
import { TokenCounterProvider } from './tokenCounterProvider';

export class FileWatcher implements vscode.Disposable {
    private fileWatcher: vscode.FileSystemWatcher;
    private disposables: vscode.Disposable[] = [];

    constructor(
        private tokenCountingService: TokenCountingService,
        private tokenCounterProvider: TokenCounterProvider
    ) {
        // Watch for file changes in the workspace
        this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
        
        // Listen for file changes
        this.fileWatcher.onDidChange(this.onFileChanged, this, this.disposables);
        this.fileWatcher.onDidCreate(this.onFileCreated, this, this.disposables);
        this.fileWatcher.onDidDelete(this.onFileDeleted, this, this.disposables);

        // Listen for workspace folder changes
        vscode.workspace.onDidChangeWorkspaceFolders(this.onWorkspaceFoldersChanged, this, this.disposables);

        // Add file watcher to disposables
        this.disposables.push(this.fileWatcher);
    }

    private onFileChanged(uri: vscode.Uri) {
        if (this.isRelevantFile(uri.fsPath)) {
            // Clear cache for changed file and refresh
            this.tokenCountingService.clearCacheForFile(uri.fsPath);
            
            // Re-count tokens for the changed file
            this.tokenCountingService.getTokenCount(uri.fsPath).then(() => {
                this.tokenCounterProvider.refresh();
            }).catch(error => {
                console.error(`Error processing changed file ${uri.fsPath}:`, error);
            });
        }
    }

    private onFileCreated(uri: vscode.Uri) {
        if (this.isRelevantFile(uri.fsPath)) {
            // Process new file
            this.tokenCountingService.getTokenCount(uri.fsPath).then(() => {
                this.tokenCounterProvider.refresh();
            }).catch(error => {
                console.error(`Error processing new file ${uri.fsPath}:`, error);
            });
        }
    }

    private onFileDeleted(uri: vscode.Uri) {
        // Clear cache for deleted file
        this.tokenCountingService.clearCacheForFile(uri.fsPath);
        this.tokenCounterProvider.refresh();
    }

    private onWorkspaceFoldersChanged() {
        // Re-process workspace when folders change
        this.tokenCountingService.clearCache();
        this.tokenCountingService.processWorkspace();
        this.tokenCounterProvider.refresh();
    }

    private isRelevantFile(filePath: string): boolean {
        const config = vscode.workspace.getConfiguration('tokenCounter');
        const extensions = config.get<string[]>('fileExtensions', []);
        const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
        return extensions.includes(extension);
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}