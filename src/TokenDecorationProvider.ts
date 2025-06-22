import * as vscode from 'vscode';
import * as path from 'path';
import { CacheManager } from './services/CacheManager';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const TEXT_EXTS = ['.ts', '.js', '.jsx', '.tsx', '.py', '.md', '.txt', '.json', '.yaml', '.yml'];

export class TokenDecorationProvider implements vscode.FileDecorationProvider {
    private emitter = new vscode.EventEmitter<vscode.Uri>();
    readonly onDidChangeFileDecorations = this.emitter.event;

    constructor(private cache: CacheManager) {}

    public refreshAll(): void {
        this.emitter.fire(undefined as unknown as vscode.Uri);
    }

    public async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
        try {
            if (uri.scheme !== 'file') {
                return;
            }
            const ext = path.extname(uri.fsPath).toLowerCase();
            if (!TEXT_EXTS.includes(ext)) {
                return;
            }
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.size > MAX_SIZE) {
                return;
            }
            const tokens = await this.cache.getTokenCount(uri.fsPath);
            return { badge: tokens.toString() };
        } catch {
            return;
        }
    }

    public invalidate(uri: vscode.Uri): void {
        this.cache.invalidate(uri.fsPath);
        this.emitter.fire(uri);
    }
}
