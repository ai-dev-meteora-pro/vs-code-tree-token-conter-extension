import * as vscode from 'vscode';
import * as path from 'path';

interface FileData {
    tokens: number;
    processed: boolean;
}

interface FolderData {
    tokenSum: number;
    remaining: number;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const TEXT_EXTS = ['.ts', '.js', '.jsx', '.tsx', '.py', '.md', '.txt', '.json', '.yaml', '.yml'];

export class TokenDecorationProvider implements vscode.FileDecorationProvider {
    private emitter = new vscode.EventEmitter<vscode.Uri>();
    readonly onDidChangeFileDecorations = this.emitter.event;

    constructor(
        private files: Map<string, FileData>,
        private folders: Map<string, FolderData>,
    ) {}

    public refreshAll(): void {
        this.emitter.fire(undefined as unknown as vscode.Uri);
    }

    public async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
        try {
            if (uri.scheme !== 'file') {
                return;
            }
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.type === vscode.FileType.Directory) {
                const info = this.folders.get(uri.fsPath);
                if (info && info.remaining === 0) {
                    return { badge: info.tokenSum.toString() };
                }
                return;
            }
            const ext = path.extname(uri.fsPath).toLowerCase();
            if (!TEXT_EXTS.includes(ext)) {
                return;
            }
            if (stat.size > MAX_SIZE) {
                return;
            }
            const data = this.files.get(uri.fsPath);
            if (data && data.processed) {
                return { badge: data.tokens.toString() };
            }
            return;
        } catch {
            return;
        }
    }

    public invalidate(uri: vscode.Uri): void {
        this.emitter.fire(uri);
    }
}
