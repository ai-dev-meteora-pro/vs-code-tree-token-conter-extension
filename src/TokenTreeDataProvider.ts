import * as vscode from 'vscode';
import { getLocalizedStrings, formatNumber } from './localization';

export interface TokenFileItem {
    resourceUri: vscode.Uri;
    tokens: number;
    status: 'pending' | 'processing' | 'processed' | 'error' | 'too_large';
}

export class TokenTreeDataProvider implements vscode.TreeDataProvider<TokenFileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TokenFileItem | undefined | null | void> = new vscode.EventEmitter<TokenFileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TokenFileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private workspaceRoot: string | undefined,
        private fileData: Map<string, { tokens: number; processed: boolean; status: string }>
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TokenFileItem): vscode.TreeItem {
        const l10n = getLocalizedStrings();
        const item = new vscode.TreeItem(
            element.resourceUri,
            vscode.TreeItemCollapsibleState.None
        );

        // Set description with token count
        switch (element.status) {
            case 'processed':
                item.description = l10n.tokensTooltip(formatNumber(element.tokens));
                break;
            case 'pending':
            case 'processing':
                item.description = `• ${l10n.countingTokens}`;
                break;
            case 'error':
                item.description = `⚠ ${l10n.errorTooltip}`;
                break;
            case 'too_large':
                item.description = `∞ ${l10n.fileTooLargeTooltip}`;
                break;
        }

        item.contextValue = 'tokenFile';
        item.command = {
            command: 'vscode.open',
            title: 'Open File',
            arguments: [element.resourceUri]
        };

        return item;
    }

    getChildren(element?: TokenFileItem): Thenable<TokenFileItem[]> {
        if (!this.workspaceRoot) {
            const l10n = getLocalizedStrings();
            vscode.window.showInformationMessage(l10n.noWorkspaceFolder);
            return Promise.resolve([]);
        }

        if (element) {
            // If element is provided, return empty array (we have no nesting)
            return Promise.resolve([]);
        } else {
            // Return list of all files with tokens
            const items: TokenFileItem[] = [];
            
            for (const [filePath, data] of this.fileData) {
                if (data.processed || data.status) {
                    items.push({
                        resourceUri: vscode.Uri.file(filePath),
                        tokens: data.tokens,
                        status: data.status as any || (data.processed ? 'processed' : 'pending')
                    });
                }
            }

            // Sort by token count (descending)
            items.sort((a, b) => b.tokens - a.tokens);
            
            return Promise.resolve(items);
        }
    }
}