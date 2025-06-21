import * as vscode from 'vscode';
import * as path from 'path';
import { TokenCountingService } from './tokenCountingService';

export class TokenCounterProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private context: vscode.ExtensionContext,
        private tokenCountingService: TokenCountingService
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!vscode.workspace.workspaceFolders) {
            return [];
        }

        if (!element) {
            // Return workspace folders
            return vscode.workspace.workspaceFolders.map(folder => {
                const item = new vscode.TreeItem(folder.name, vscode.TreeItemCollapsibleState.Expanded);
                item.resourceUri = folder.uri;
                item.contextValue = 'folder';
                return item;
            });
        }

        if (element.resourceUri) {
            try {
                const stat = await vscode.workspace.fs.stat(element.resourceUri);
                
                if (stat.type === vscode.FileType.Directory) {
                    // Return directory contents
                    const entries = await vscode.workspace.fs.readDirectory(element.resourceUri);
                    const items: vscode.TreeItem[] = [];

                    for (const [name, type] of entries) {
                        if (name.startsWith('.') && name !== '.env') {
                            continue; // Skip hidden files except .env
                        }

                        const resourceUri = vscode.Uri.joinPath(element.resourceUri, name);
                        
                        if (type === vscode.FileType.Directory) {
                            const item = new vscode.TreeItem(name, vscode.TreeItemCollapsibleState.Collapsed);
                            item.resourceUri = resourceUri;
                            item.contextValue = 'folder';
                            item.iconPath = new vscode.ThemeIcon('folder');
                            items.push(item);
                        } else {
                            const filePath = resourceUri.fsPath;
                            const cachedCount = this.tokenCountingService.getCachedTokenCount(filePath);
                            
                            let label = name;
                            if (cachedCount !== null && cachedCount > 0) {
                                label = `${name} (${cachedCount} tokens)`;
                            } else if (this.isTextFile(filePath)) {
                                label = `${name} (counting...)`;
                                // Trigger async counting
                                this.tokenCountingService.getTokenCount(filePath).then(() => {
                                    this.refresh();
                                }).catch(() => {
                                    // Silent fail
                                });
                            }

                            const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
                            item.resourceUri = resourceUri;
                            item.contextValue = 'file';
                            item.command = {
                                command: 'vscode.open',
                                title: 'Open',
                                arguments: [resourceUri]
                            };
                            
                            // Set appropriate icon
                            const ext = path.extname(name);
                            item.iconPath = this.getFileIcon(ext);
                            
                            items.push(item);
                        }
                    }

                    // Sort: folders first, then files
                    return items.sort((a, b) => {
                        if (a.contextValue === 'folder' && b.contextValue === 'file') return -1;
                        if (a.contextValue === 'file' && b.contextValue === 'folder') return 1;
                        return (a.label as string).localeCompare(b.label as string);
                    });
                }
            } catch (error) {
                console.error('Error reading directory:', error);
            }
        }

        return [];
    }

    private isTextFile(filePath: string): boolean {
        const config = vscode.workspace.getConfiguration('tokenCounter');
        const extensions = config.get<string[]>('fileExtensions', []);
        const ext = path.extname(filePath).toLowerCase();
        return extensions.includes(ext);
    }

    private getFileIcon(extension: string): vscode.ThemeIcon {
        const iconMap: { [key: string]: string } = {
            '.js': 'symbol-file',
            '.ts': 'symbol-file',
            '.jsx': 'symbol-file',
            '.tsx': 'symbol-file',
            '.py': 'symbol-file',
            '.java': 'symbol-file',
            '.cpp': 'symbol-file',
            '.c': 'symbol-file',
            '.h': 'symbol-file',
            '.css': 'symbol-color',
            '.html': 'symbol-misc',
            '.json': 'symbol-misc',
            '.xml': 'symbol-misc',
            '.md': 'markdown',
            '.txt': 'file-text',
            '.sql': 'database',
            '.sh': 'terminal'
        };

        const iconName = iconMap[extension.toLowerCase()] || 'file';
        return new vscode.ThemeIcon(iconName);
    }
}