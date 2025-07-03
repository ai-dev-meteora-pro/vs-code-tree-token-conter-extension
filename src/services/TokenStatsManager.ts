import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import ignore from 'ignore';
import { CacheManager } from './CacheManager';
import { TokenDecorationProvider } from '../TokenDecorationProvider';
import { getLocalizedStrings } from '../localization';

export enum FileStatus {
    Pending = 'pending',
    Processing = 'processing',
    Processed = 'processed',
    Error = 'error',
    TooLarge = 'too_large',
    Ignored = 'ignored'
}

interface FileData {
    tokens: number;
    processed: boolean;
    status: FileStatus;
}

interface FolderData {
    tokenSum: number;
    remaining: number;
}

export class TokenStatsManager {
    private gitignore?: ReturnType<typeof ignore>;
    
    // Maximum file size for processing - 2MB
    public static readonly MAX_SIZE = 2 * 1024 * 1024;
    private fileData = new Map<string, FileData>();
    private folderData = new Map<string, FolderData>();
    private processedFiles = 0;
    private totalFiles = 0;
    private statusBar: vscode.StatusBarItem;

    constructor(private cache: CacheManager) {
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBar.show();
        this.loadGitignore();
    }

    private async loadGitignore(): Promise<void> {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) return;
        
        this.gitignore = ignore();
        // Add standard ignored files
        this.gitignore.add('.git');
        this.gitignore.add('node_modules');
        
        for (const folder of folders) {
            try {
                const gitignorePath = path.join(folder.uri.fsPath, '.gitignore');
                const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
                this.gitignore.add(gitignoreContent);
            } catch {
                // .gitignore not found, continue
            }
        }
    }

    private isIgnored(filePath: string): boolean {
        if (!this.gitignore) return false;
        
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) return false;
        
        // Check relative path for each workspace folder
        for (const folder of folders) {
            const relativePath = path.relative(folder.uri.fsPath, filePath);
            if (!relativePath.startsWith('..') && this.gitignore.ignores(relativePath)) {
                return true;
            }
        }
        
        return false;
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

    private registerFile(filePath: string, status: FileStatus = FileStatus.Pending): void {
        if (this.fileData.has(filePath)) {
            return;
        }
        this.fileData.set(filePath, { tokens: 0, processed: false, status });
        this.totalFiles++;
        const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        if (!folder) return;
        
        const ancestors = this.getAncestors(filePath, folder.uri.fsPath);
        console.log(`TokenStatsManager: Registering file ${filePath}`);
        console.log(`TokenStatsManager: Ancestors: ${ancestors.join(', ')}`);
        
        for (const dir of ancestors) {
            const info = this.folderData.get(dir) ?? { tokenSum: 0, remaining: 0 };
            info.remaining++;
            this.folderData.set(dir, info);
            console.log(`TokenStatsManager: Updated folder ${dir} - remaining: ${info.remaining}, tokenSum: ${info.tokenSum}`);
        }
    }

    private async processFile(filePath: string): Promise<void> {
        const data = this.fileData.get(filePath);
        if (!data) return;
        
        try {
            // Set status to "processing"
            data.status = FileStatus.Processing;
            this.provider?.invalidate(vscode.Uri.file(filePath));
            
            const newTokens = await this.cache.getTokenCount(filePath);
            const first = !data.processed;
            const oldTokens = data.tokens;
            data.tokens = newTokens;
            data.processed = true;
            data.status = FileStatus.Processed;
            
            // Debug: check that data is saved
            if (Math.random() < 0.1) { // 10% of files
                const l10n = getLocalizedStrings();
                console.log(l10n.processing + ' ' + filePath);
                console.log(l10n.tokensCounted(newTokens, data.status));
                console.log(l10n.inMap + ' ' + this.fileData.has(filePath));
            }
            
            const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
            if (folder) {
                for (const dir of this.getAncestors(filePath, folder.uri.fsPath)) {
                    const info = this.folderData.get(dir);
                    if (!info) {
                        console.log(`TokenStatsManager: WARNING - No folder info for ${dir}`);
                        continue;
                    }
                    info.tokenSum += newTokens - oldTokens;
                    if (first) {
                        info.remaining = Math.max(0, info.remaining - 1);
                    }
                    this.folderData.set(dir, info);
                    console.log(`TokenStatsManager: Updated folder ${dir} after processing file - remaining: ${info.remaining}, tokenSum: ${info.tokenSum}`);
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
        } catch (error) {
            const l10n = getLocalizedStrings();
            console.error(l10n.fileProcessingError(filePath, error));
            data.status = FileStatus.Error;
            data.processed = true;
            this.processedFiles++;
            this.updateStatusBar();
            this.provider?.invalidate(vscode.Uri.file(filePath));
        }
    }

    public async scanWorkspace(): Promise<void> {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) return;
        
        // Reload .gitignore in case it changed
        await this.loadGitignore();
        
        for (const folder of folders) {
            const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*'));
            
            // Sort files by depth (number of path separators)
            // This ensures processing files from top to bottom
            const sortedFiles = files.sort((a, b) => {
                const depthA = a.fsPath.split(path.sep).length;
                const depthB = b.fsPath.split(path.sep).length;
                if (depthA !== depthB) {
                    return depthA - depthB; // Files with less depth first
                }
                // For same depth, sort alphabetically
                return a.fsPath.localeCompare(b.fsPath);
            });
            
            for (const uri of sortedFiles) {
                // Check if file is ignored via .gitignore
                if (this.isIgnored(uri.fsPath)) {
                    continue;
                }
                
                // Process all files, only check size
                try {
                    const stat = await vscode.workspace.fs.stat(uri);
                    if (stat.size > TokenStatsManager.MAX_SIZE) {
                        const l10n = getLocalizedStrings();
                        console.warn(l10n.fileTooLarge(uri.fsPath, stat.size));
                        this.registerFile(uri.fsPath, FileStatus.TooLarge);
                        continue;
                    }
                    this.registerFile(uri.fsPath);
                } catch (error) {
                    const l10n = getLocalizedStrings();
                    console.error(l10n.fileProcessingError(uri.fsPath, error));
                    this.registerFile(uri.fsPath, FileStatus.Error);
                    continue;
                }
            }
        }
        this.updateStatusBar();
        
        // Process files in the same order (top to bottom)
        const sortedPaths = Array.from(this.fileData.keys()).sort((a, b) => {
            const depthA = a.split(path.sep).length;
            const depthB = b.split(path.sep).length;
            if (depthA !== depthB) {
                return depthA - depthB;
            }
            return a.localeCompare(b);
        });
        
        for (const file of sortedPaths) {
            void this.processFile(file);
        }
    }

    public async handleChange(uri: vscode.Uri): Promise<void> {
        // Проверяем, не игнорируется ли файл через .gitignore
        if (this.isIgnored(uri.fsPath)) {
            return;
        }
        
        // Обрабатываем все файлы, проверяем только размер
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.size > TokenStatsManager.MAX_SIZE) {
                if (!this.fileData.has(uri.fsPath)) {
                    this.registerFile(uri.fsPath, FileStatus.TooLarge);
                    this.updateStatusBar();
                }
                return;
            }
        } catch {
            console.error(`Error getting file size for ${uri.fsPath}, skipping.`);
            if (!this.fileData.has(uri.fsPath)) {
                this.registerFile(uri.fsPath, FileStatus.Error);
                this.updateStatusBar();
            }
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
