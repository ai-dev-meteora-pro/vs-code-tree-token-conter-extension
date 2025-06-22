import * as vscode from 'vscode';
import * as path from 'path';
import { CacheManager } from './CacheManager';
import { TokenDecorationProvider } from '../TokenDecorationProvider';

interface FileData {
    tokens: number;
    processed: boolean;
}

interface FolderData {
    tokenSum: number;
    remaining: number;
}

export class TokenStatsManager {
    private fileData = new Map<string, FileData>();
    private folderData = new Map<string, FolderData>();
    private processedFiles = 0;
    private totalFiles = 0;
    private statusBar: vscode.StatusBarItem;

    constructor(private cache: CacheManager) {
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBar.show();
    }

    public async dispose(): Promise<void> {
        await this.cache.dispose();
        this.statusBar.dispose();
    }

    private provider: TokenDecorationProvider | undefined;

    public setProvider(provider: TokenDecorationProvider): void {
        this.provider = provider;
    }

    public getFileMap(): Map<string, FileData> {
        return this.fileData;
    }

    public getFolderMap(): Map<string, FolderData> {
        return this.folderData;
    }

    private updateStatusBar(): void {
        const remaining = this.totalFiles - this.processedFiles;
        const cacheSize = this.cache.size();
        this.statusBar.text = `Tokens ${this.processedFiles}/${this.totalFiles} (left ${remaining}) | Cache ${cacheSize}`;
    }

    private getAncestors(filePath: string, root: string): string[] {
        const res: string[] = [];
        let dir = path.dirname(filePath);
        while (dir.startsWith(root)) {
            res.push(dir);
            if (dir === root) break;
            dir = path.dirname(dir);
        }
        return res;
    }

    private registerFile(filePath: string): void {
        if (this.fileData.has(filePath)) {
            return;
        }
        this.fileData.set(filePath, { tokens: 0, processed: false });
        this.totalFiles++;
        const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        if (!folder) return;
        for (const dir of this.getAncestors(filePath, folder.uri.fsPath)) {
            const info = this.folderData.get(dir) ?? { tokenSum: 0, remaining: 0 };
            info.remaining++;
            this.folderData.set(dir, info);
        }
    }

    private async processFile(filePath: string): Promise<void> {
        try {
            const newTokens = await this.cache.getTokenCount(filePath);
            const data = this.fileData.get(filePath);
            if (!data) return;
            const first = !data.processed;
            const oldTokens = data.tokens;
            data.tokens = newTokens;
            data.processed = true;
            const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
            if (folder) {
                for (const dir of this.getAncestors(filePath, folder.uri.fsPath)) {
                    const info = this.folderData.get(dir);
                    if (!info) continue;
                    info.tokenSum += newTokens - oldTokens;
                    if (first) {
                        info.remaining = Math.max(0, info.remaining - 1);
                    }
                    this.folderData.set(dir, info);
                }
            }
            if (first) {
                this.processedFiles++;
            }
            this.updateStatusBar();
            this.provider?.invalidate(vscode.Uri.file(filePath));
            if (folder) {
                for (const dir of this.getAncestors(filePath, folder.uri.fsPath)) {
                    this.provider?.invalidate(vscode.Uri.file(dir));
                }
            }
        } catch {
            // ignore errors
        }
    }

    public async scanWorkspace(): Promise<void> {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) return;
        const TEXT_EXTS = ['.ts', '.js', '.jsx', '.tsx', '.py', '.md', '.txt', '.json', '.yaml', '.yml'];
        const MAX_SIZE = 2 * 1024 * 1024;
        for (const folder of folders) {
            const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*'));
            for (const uri of files) {
                const ext = path.extname(uri.fsPath).toLowerCase();
                if (!TEXT_EXTS.includes(ext)) continue;
                try {
                    const stat = await vscode.workspace.fs.stat(uri);
                    if (stat.size > MAX_SIZE) continue;
                } catch {
                    continue;
                }
                this.registerFile(uri.fsPath);
            }
        }
        this.updateStatusBar();
        for (const file of this.fileData.keys()) {
            void this.processFile(file);
        }
    }

    public async handleChange(uri: vscode.Uri): Promise<void> {
        const TEXT_EXTS = ['.ts', '.js', '.jsx', '.tsx', '.py', '.md', '.txt', '.json', '.yaml', '.yml'];
        const MAX_SIZE = 2 * 1024 * 1024;
        const ext = path.extname(uri.fsPath).toLowerCase();
        if (!TEXT_EXTS.includes(ext)) return;
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.size > MAX_SIZE) return;
        } catch {
            return;
        }
        if (!this.fileData.has(uri.fsPath)) {
            this.registerFile(uri.fsPath);
            this.updateStatusBar();
        } else {
            this.cache.invalidate(uri.fsPath);
        }
        void this.processFile(uri.fsPath);
    }

    public handleDelete(uri: vscode.Uri): void {
        const data = this.fileData.get(uri.fsPath);
        if (!data) return;
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        if (folder) {
            for (const dir of this.getAncestors(uri.fsPath, folder.uri.fsPath)) {
                const info = this.folderData.get(dir);
                if (!info) continue;
                info.tokenSum -= data.tokens;
                if (!data.processed) {
                    info.remaining = Math.max(0, info.remaining - 1);
                }
                this.folderData.set(dir, info);
                this.provider?.invalidate(vscode.Uri.file(dir));
            }
        }
        if (data.processed) {
            this.processedFiles--;
        }
        this.totalFiles--;
        this.fileData.delete(uri.fsPath);
        this.provider?.invalidate(uri);
        this.updateStatusBar();
    }
}
