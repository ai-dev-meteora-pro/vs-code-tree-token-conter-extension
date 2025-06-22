import { workspace } from 'vscode';
import { encoding_for_model } from 'tiktoken';
import { countTokens } from '@anthropic-ai/tokenizer';

export class TokenCountingService {
    private tokenizerChoice: 'openai' | 'anthropic';
    private openAI = encoding_for_model('gpt-4');

    constructor() {
        this.tokenizerChoice = workspace.getConfiguration('tokenCounter').get<'openai' | 'anthropic'>('tokenizer', 'openai');
    }

    public refreshConfig(): void {
        this.tokenizerChoice = workspace.getConfiguration('tokenCounter').get<'openai' | 'anthropic'>('tokenizer', 'openai');
    }

    public count(text: string): number {
        if (this.tokenizerChoice === 'anthropic') {
            return countTokens(text);
        }
        return this.openAI.encode(text).length;
    }
}
