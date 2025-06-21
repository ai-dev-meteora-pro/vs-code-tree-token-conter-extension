import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';

// Import tokenizers
import { countTokens as countAnthropicTokens } from '@anthropic-ai/tokenizer';

interface TokenCache {
    hash: string;
    tokenCount: number;
    timestamp: number;
}

interface QueueItem {
    filePath: string;
    resolve: (count: number) => void;
    reject: (error: Error) => void;
}

export class TokenCountingService {
    private cache: Map<string, TokenCache> = new Map();
    private queue: QueueItem[] = [];
    private activeJobs = 0;
    private maxConcurrency: number;
    private tiktoken: any = null;

    constructor(private context: vscode.ExtensionContext) {
        this.maxConcurrency = this.getMaxConcurrency();
        this.loadTiktoken();
    }

    private async loadTiktoken() {
        try {
            this.tiktoken = await import('tiktoken');
        } catch (error) {
            console.error('Failed to load tiktoken:', error);
        }
    }

    private getMaxConcurrency(): number {
        const config = vscode.workspace.getConfiguration('tokenCounter');
        const configuredMax = config.get<number>('maxConcurrency', 8);
        const cpuBasedMax = Math.min(16, Math.floor(os.cpus().length / 2));
        return Math.min(configuredMax, cpuBasedMax);
    }

    private getFileHash(filePath: string): string {
        try {
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf8');
            return crypto.createHash('md5')
                .update(content + stats.mtime.getTime())
                .digest('hex');
        } catch (error) {
            return '';
        }
    }

    private isTextFile(filePath: string): boolean {
        const config = vscode.workspace.getConfiguration('tokenCounter');
        const extensions = config.get<string[]>('fileExtensions', []);
        const ext = path.extname(filePath).toLowerCase();
        return extensions.includes(ext);
    }

    private isFileSizeValid(filePath: string): boolean {
        try {
            const config = vscode.workspace.getConfiguration('tokenCounter');
            const maxSize = config.get<number>('maxFileSize', 2097152); // 2MB default
            const stats = fs.statSync(filePath);
            return stats.size <= maxSize;
        } catch {
            return false;
        }
    }

    private async countTokensWithTokenizer(content: string): Promise<number> {
        const config = vscode.workspace.getConfiguration('tokenCounter');
        const tokenizer = config.get<string>('tokenizer', 'anthropic');

        try {
            if (tokenizer === 'anthropic') {
                return countAnthropicTokens(content);
            } else if (tokenizer === 'openai' && this.tiktoken) {
                const encoder = this.tiktoken.get_encoding('cl100k_base');
                const tokens = encoder.encode(content);
                encoder.free();
                return tokens.length;
            } else {
                // Fallback to simple word-based estimation
                return Math.ceil(content.split(/\s+/).length * 1.3);
            }
        } catch (error) {
            console.error('Error counting tokens:', error);
            // Fallback to simple word-based estimation
            return Math.ceil(content.split(/\s+/).length * 1.3);
        }
    }

    private async processFile(filePath: string): Promise<number> {
        try {
            if (!this.isTextFile(filePath) || !this.isFileSizeValid(filePath)) {
                return 0;
            }

            const fileHash = this.getFileHash(filePath);
            if (!fileHash) {
                return 0;
            }

            // Check cache
            const cached = this.cache.get(filePath);
            if (cached && cached.hash === fileHash) {
                return cached.tokenCount;
            }

            // Read and count tokens
            const content = fs.readFileSync(filePath, 'utf8');
            const tokenCount = await this.countTokensWithTokenizer(content);

            // Update cache
            this.cache.set(filePath, {
                hash: fileHash,
                tokenCount,
                timestamp: Date.now()
            });

            return tokenCount;
        } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
            return 0;
        }
    }

    private async processQueue() {
        while (this.queue.length > 0 && this.activeJobs < this.maxConcurrency) {
            const item = this.queue.shift();
            if (!item) continue;

            this.activeJobs++;
            
            this.processFile(item.filePath)
                .then(count => {
                    item.resolve(count);
                })
                .catch(error => {
                    item.reject(error);
                })
                .finally(() => {
                    this.activeJobs--;
                    // Process next item in queue
                    setImmediate(() => this.processQueue());
                });
        }
    }

    public async getTokenCount(filePath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            // Check if already in cache
            const cached = this.cache.get(filePath);
            if (cached) {
                const fileHash = this.getFileHash(filePath);
                if (fileHash && cached.hash === fileHash) {
                    resolve(cached.tokenCount);
                    return;
                }
            }

            // Add to queue
            this.queue.push({ filePath, resolve, reject });
            this.processQueue();
        });
    }

    public async processWorkspace() {
        if (!vscode.workspace.workspaceFolders) {
            return;
        }

        const processedFiles = new Set<string>();

        for (const folder of vscode.workspace.workspaceFolders) {
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(folder, '**/*'),
                '**/node_modules/**'
            );

            for (const file of files) {
                const filePath = file.fsPath;
                if (!processedFiles.has(filePath) && this.isTextFile(filePath)) {
                    processedFiles.add(filePath);
                    // Don't await - let it process in background
                    this.getTokenCount(filePath).catch(error => {
                        console.error(`Error processing ${filePath}:`, error);
                    });
                }
            }
        }
    }

    public clearCache() {
        this.cache.clear();
    }

    public getCachedTokenCount(filePath: string): number | null {
        const cached = this.cache.get(filePath);
        if (cached) {
            const fileHash = this.getFileHash(filePath);
            if (fileHash && cached.hash === fileHash) {
                return cached.tokenCount;
            }
        }
        return null;
    }
}