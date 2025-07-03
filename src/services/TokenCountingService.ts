import { workspace } from 'vscode';

type SupportedEncoding = 'cl100k_base' | 'o200k_base' | 'p50k_base' | 'r50k_base';

export class TokenCountingService {
    private encoding: any;
    private encodingLoaded = false;
    private encodingPromise: Promise<void> | null = null;
    private currentEncoding: SupportedEncoding;

    constructor() {
        console.log('TokenCountingService: Initializing with js-tiktoken...');
        this.currentEncoding = workspace.getConfiguration('tokenCounter').get<SupportedEncoding>('encoding', 'cl100k_base');
        console.log('TokenCountingService: Using encoding:', this.currentEncoding);
        
        // Load encoding asynchronously
        this.loadEncoding();
    }

    private async loadEncoding(): Promise<void> {
        // Always reload encoding if config changed
        this.encodingPromise = null;
        this.encodingLoaded = false;
        
        if (this.encodingPromise) {
            return this.encodingPromise;
        }
        
        this.encodingPromise = (async () => {
            try {
                console.log(`TokenCountingService: Loading js-tiktoken encoding: ${this.currentEncoding}`);
                // Dynamic import for ESM module
                const { getEncoding } = await import('js-tiktoken');
                this.encoding = getEncoding(this.currentEncoding);
                this.encodingLoaded = true;
                console.log('TokenCountingService: js-tiktoken loaded successfully');
            } catch (error) {
                console.error('TokenCountingService: Failed to load js-tiktoken', error);
                throw error;
            }
        })();
        
        return this.encodingPromise;
    }

    public refreshConfig(): void {
        const newEncoding = workspace.getConfiguration('tokenCounter').get<SupportedEncoding>('encoding', 'cl100k_base');
        if (newEncoding !== this.currentEncoding) {
            console.log(`TokenCountingService: Encoding changed from ${this.currentEncoding} to ${newEncoding}`);
            this.currentEncoding = newEncoding;
            // Reload encoding with new setting
            void this.loadEncoding();
        }
    }

    public async count(text: string): Promise<number> {
        try {
            // Ensure encoding is loaded
            if (!this.encodingLoaded) {
                console.log('TokenCountingService: Waiting for encoding to load...');
                await this.loadEncoding();
            }
            
            const tokens = this.encoding.encode(text).length;
            console.log(`TokenCountingService: Counted ${tokens} tokens for text of length ${text.length}`);
            return tokens;
        } catch (error) {
            console.error('TokenCountingService: Error counting tokens', error);
            // Fallback: rough estimate of tokens (1 token ≈ 4 characters)
            const estimate = Math.ceil(text.length / 4);
            console.log(`TokenCountingService: Using fallback estimate: ${estimate} tokens`);
            return estimate;
        }
    }
}
