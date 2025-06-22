import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import * as path from 'path';
import { workspace } from 'vscode';
import { TokenCountingService } from './TokenCountingService';
import { AsyncQueue } from './AsyncQueue';

interface CacheEntry {
    hash: string;
    tokens: number;
}

export class CacheManager {
    private cache = new Map<string, CacheEntry>();
    private queue: AsyncQueue;
    private cacheFile: string | undefined;
    private saveInterval: NodeJS.Timeout | undefined;

    constructor(private counter: TokenCountingService, concurrency: number) {
        this.queue = new AsyncQueue(concurrency);

        const folder = workspace.workspaceFolders?.[0];
        if (folder) {
            this.cacheFile = path.join(folder.uri.fsPath, '.vscode', 'token-cache.json');
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
                return entry.tokens;
            }
            const text = await fs.readFile(path, 'utf8');
            const tokens = this.counter.count(text);
            this.cache.set(path, { hash, tokens });
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
            const buf = await fs.readFile(this.cacheFile, 'utf8');
            const data = JSON.parse(buf) as Record<string, CacheEntry>;
            this.cache = new Map(Object.entries(data));
        } catch {
            // ignore
        }
    }

    public async saveToFile(): Promise<void> {
        if (!this.cacheFile) return;
        try {
            await fs.mkdir(path.dirname(this.cacheFile), { recursive: true });
            const obj = Object.fromEntries(this.cache);
            await fs.writeFile(this.cacheFile, JSON.stringify(obj), 'utf8');
        } catch {
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
