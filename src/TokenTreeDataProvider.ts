import * as vscode from 'vscode';

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
        const item = new vscode.TreeItem(
            element.resourceUri,
            vscode.TreeItemCollapsibleState.None
        );

        // Устанавливаем описание с количеством токенов
        switch (element.status) {
            case 'processed':
                item.description = `${element.tokens} tokens`;
                break;
            case 'pending':
            case 'processing':
                item.description = '• counting...';
                break;
            case 'error':
                item.description = '⚠ error';
                break;
            case 'too_large':
                item.description = '∞ too large';
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
            vscode.window.showInformationMessage('No workspace folder open');
            return Promise.resolve([]);
        }

        if (element) {
            // Если элемент передан, возвращаем пустой массив (у нас нет вложенности)
            return Promise.resolve([]);
        } else {
            // Возвращаем список всех файлов с токенами
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

            // Сортируем по количеству токенов (по убыванию)
            items.sort((a, b) => b.tokens - a.tokens);
            
            return Promise.resolve(items);
        }
    }
}