import * as vscode from 'vscode';
import { FileStatus } from './services/TokenStatsManager';
import { getLocalizedStrings, formatNumber } from './localization';

interface FileData {
    tokens: number;
    processed: boolean;
    status: FileStatus;
}

interface FolderData {
    tokenSum: number;
    remaining: number;
}

export class TokenDecorationProvider implements vscode.FileDecorationProvider {
    private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    constructor(
        private files: Map<string, FileData>,
        private folders: Map<string, FolderData>,
    ) {}

    provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
        const l10n = getLocalizedStrings();
        
        // Log every 100th request for debugging
        if (Math.random() < 0.01) {
            console.log(`TokenDecorationProvider: checking ${uri.fsPath}`);
            console.log(`  In file map: ${this.files.has(uri.fsPath)}`);
            if (this.files.has(uri.fsPath)) {
                const data = this.files.get(uri.fsPath)!;
                console.log(`  Data: tokens=${data.tokens}, status=${data.status}`);
            }
        }

        // Check file data
        const fileData = this.files.get(uri.fsPath);
        if (fileData) {
            switch (fileData.status) {
                case FileStatus.Pending:
                case FileStatus.Processing:
                    return {
                        badge: '•',
                        tooltip: l10n.processingTooltip
                    };
                case FileStatus.Processed:
                    // Format token count compactly (maximum 2 characters)
                    const badge = this.formatTokenCount(fileData.tokens);
                    return {
                        badge: badge,
                        tooltip: l10n.tokensTooltip(formatNumber(fileData.tokens))
                    };
                case FileStatus.Error:
                    return {
                        badge: '⚠',
                        tooltip: l10n.errorTooltip
                    };
                case FileStatus.TooLarge:
                    return {
                        badge: '∞',
                        tooltip: l10n.fileTooLargeTooltip
                    };
            }
        }

        // Check folder data
        const folderData = this.folders.get(uri.fsPath);
        if (folderData && folderData.remaining === 0 && folderData.tokenSum > 0) {
            const badge = this.formatTokenCount(folderData.tokenSum);
            return {
                badge: badge,
                tooltip: l10n.totalTokensTooltip(formatNumber(folderData.tokenSum))
            };
        }

        return undefined;
    }

    /**
     * Formats token count into a string of no more than 2 characters
     */
    private formatTokenCount(tokens: number): string {
        if (tokens === 0) {
            return '0';
        } else if (tokens < 1000) {
            // 0-999: show as .0-.9 (hundreds)
            return '.' + Math.round(tokens / 100);
        } else if (tokens < 100000) {
            // 1k-99k: show just the number of thousands without 'k'
            return Math.round(tokens / 1000).toString();
        } else if (tokens < 1000000) {
            // 100k-999k: show as ^1-^9 (hundreds of thousands)
            return '^' + Math.round(tokens / 100000);
        } else if (tokens < 10000000) {
            // 1m-9m: show as *1-*9 (millions)
            return '*' + Math.round(tokens / 1000000);
        } else if (tokens < 100000000) {
            // 10m-99m: show as 1∞-9∞ (tens of millions)
            return Math.floor(tokens / 10000000) + '∞';
        } else {
            // 100m+: show two infinity symbols
            return '∞∞';
        }
    }

    public refreshAll(): void {
        const l10n = getLocalizedStrings();
        console.log(l10n.updatingDecorations);
        console.log(`  ${l10n.filesInMap} ${this.files.size}`);
        console.log(`  ${l10n.foldersInMap} ${this.folders.size}`);
        this._onDidChangeFileDecorations.fire(undefined);
    }

    public updateDecorations(): void {
        this.refreshAll();
    }

    public invalidate(uri: vscode.Uri): void {
        const l10n = getLocalizedStrings();
        console.log(`${l10n.invalidating} ${uri.fsPath}`);
        this._onDidChangeFileDecorations.fire(uri);
    }
}