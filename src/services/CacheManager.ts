import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import * as path from 'path';
import { workspace } from 'vscode';
import { TokenCountingService } from './TokenCountingService';
import { AsyncQueue } from './AsyncQueue';

export class CacheManager {
    private cache = new Map<string, { hash: string; tokens: number }>();
    private queue: AsyncQueue;
    private cacheFile: string | undefined;
    private saveInterval: NodeJS.Timeout | undefined;

    constructor(private counter: TokenCountingService, concurrency: number) {
        this.queue = new AsyncQueue(concurrency);

        const folder = workspace.workspaceFolders?.[0];
        if (folder) {
            this.cacheFile = path.join(folder.uri.fsPath, '.vscode', 'token-cache.txt');
            void this.loadFromFile();
            this.saveInterval = setInterval(() => {
                void this.saveToFile();
            }, 30000);
        }
    }

    private async computeHash(path: string): Promise<string> {
        const buf = await fs.readFile(path);
        return createHash('sha256').update(buf).digest('hex');
    }

    public async getTokenCount(path: string): Promise<number> {
        return this.queue.run(async () => {
            const hash = await this.computeHash(path);
            const entry = this.cache.get(path);
            if (entry && entry.hash === hash) {
                console.log(`Кеш попадание для ${path}: ${entry.tokens} токенов`);
                return entry.tokens;
            }
            const text = await fs.readFile(path, 'utf8');
            const tokens = this.counter.count(text);
            this.cache.set(path, { hash, tokens });
            console.log(`Подсчитано для ${path}: ${tokens} токенов, кеш размер: ${this.cache.size}`);
            return tokens;
        });
    }

    public invalidate(path: string): void {
        this.cache.delete(path);
    }

    public size(): number {
        return this.cache.size;
    }

    private async loadFromFile(): Promise<void> {
        if (!this.cacheFile) return;
        try {
            const content = await fs.readFile(this.cacheFile, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            this.cache.clear();
            for (const line of lines) {
                const colonIndex = line.indexOf(':');
                const lastColonIndex = line.lastIndexOf(':');
                
                if (colonIndex !== -1 && lastColonIndex !== -1 && colonIndex !== lastColonIndex) {
                    const tokensStr = line.substring(0, colonIndex);
                    const filename = line.substring(colonIndex + 1, lastColonIndex);
                    const hash = line.substring(lastColonIndex + 1);
                    
                    const tokens = parseInt(tokensStr, 10);
                    if (!isNaN(tokens)) {
                        this.cache.set(filename, { hash, tokens });
                    }
                }
            }
            console.log(`Кеш загружен из ${this.cacheFile}: ${this.cache.size} записей`);
        } catch (error) {
            console.error(`Ошибка при загрузке кэша из файла ${this.cacheFile}:`, error);
            // ignore
        }
    }

    public async saveToFile(): Promise<void> {
        if (!this.cacheFile) return;
        try {
            await fs.mkdir(path.dirname(this.cacheFile), { recursive: true });
            
            const lines: string[] = [];
            for (const [filename, entry] of this.cache) {
                const paddedTokens = entry.tokens.toString().padStart(5, '0');
                lines.push(`${paddedTokens}:${filename}:${entry.hash}`);
            }
            
            await fs.writeFile(this.cacheFile, lines.join('\n'), 'utf8');
            console.log(`Кеш сохранен в ${this.cacheFile}: ${this.cache.size} записей`);
        } catch (error) {
            console.error(`Ошибка при сохранении кэша в файл ${this.cacheFile}:`, error);
            // ignore
        }
    }

    public async dispose(): Promise<void> {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = undefined;
        }
        await this.saveToFile();
    }
}
