import { promises as fs } from 'fs';
import { createHash } from 'crypto';
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

    constructor(private counter: TokenCountingService, concurrency: number) {
        this.queue = new AsyncQueue(concurrency);
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
}
