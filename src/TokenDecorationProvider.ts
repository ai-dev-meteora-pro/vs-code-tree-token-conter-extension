import * as vscode from 'vscode';
import { FileStatus } from './services/TokenStatsManager';

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
        // Логируем каждый 100-й запрос для отладки
        if (Math.random() < 0.01) {
            console.log(`TokenDecorationProvider: проверяем ${uri.fsPath}`);
            console.log(`  В карте файлов: ${this.files.has(uri.fsPath)}`);
            if (this.files.has(uri.fsPath)) {
                const data = this.files.get(uri.fsPath)!;
                console.log(`  Данные: tokens=${data.tokens}, status=${data.status}`);
            }
        }

        // Проверяем данные файла
        const fileData = this.files.get(uri.fsPath);
        if (fileData) {
            switch (fileData.status) {
                case FileStatus.Pending:
                case FileStatus.Processing:
                    return {
                        badge: '•',
                        tooltip: 'Подсчет токенов...'
                    };
                case FileStatus.Processed:
                    // Форматируем число токенов компактно (максимум 2 символа)
                    const badge = this.formatTokenCount(fileData.tokens);
                    return {
                        badge: badge,
                        tooltip: `${fileData.tokens} токенов`
                    };
                case FileStatus.Error:
                    return {
                        badge: '⚠',
                        tooltip: 'Ошибка при подсчете токенов'
                    };
                case FileStatus.TooLarge:
                    return {
                        badge: '∞',
                        tooltip: 'Файл слишком большой'
                    };
            }
        }

        // Проверяем данные папки
        const folderData = this.folders.get(uri.fsPath);
        if (folderData && folderData.remaining === 0 && folderData.tokenSum > 0) {
            const badge = this.formatTokenCount(folderData.tokenSum);
            return {
                badge: badge,
                tooltip: `Всего токенов: ${folderData.tokenSum}`
            };
        }

        return undefined;
    }

    /**
     * Форматирует количество токенов в строку не более 2 символов
     */
    private formatTokenCount(tokens: number): string {
        if (tokens === 0) {
            return '0';
        } else if (tokens < 1000) {
            // 0-999: показываем как .0-.9 (сотни)
            return '.' + Math.round(tokens / 100);
        } else if (tokens < 100000) {
            // 1k-99k: показываем просто число тысяч без 'k'
            return Math.round(tokens / 1000).toString();
        } else if (tokens < 1000000) {
            // 100k-999k: показываем как ^1-^9 (сотни тысяч)
            return '^' + Math.round(tokens / 100000);
        } else if (tokens < 10000000) {
            // 1m-9m: показываем как *1-*9 (миллионы)
            return '*' + Math.round(tokens / 1000000);
        } else {
            // 10m+: показываем символ бесконечности
            return '∞';
        }
    }

    public refreshAll(): void {
        console.log('TokenDecorationProvider: обновляем все декорации');
        console.log(`  Файлов в карте: ${this.files.size}`);
        console.log(`  Папок в карте: ${this.folders.size}`);
        this._onDidChangeFileDecorations.fire(undefined);
    }

    public updateDecorations(): void {
        this.refreshAll();
    }

    public invalidate(uri: vscode.Uri): void {
        console.log(`TokenDecorationProvider: инвалидируем ${uri.fsPath}`);
        this._onDidChangeFileDecorations.fire(uri);
    }
}