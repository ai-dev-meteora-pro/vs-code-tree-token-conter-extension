# VS Code Token Counter

This extension shows the approximate number of LLM tokens used by text files in your workspace. Token counts appear as small badges next to file names in the explorer.

## Features
- Counts tokens using either OpenAI or Anthropic tokenizers
- Processes all files under 2MB regardless of file extension
- Respects `.gitignore` patterns when scanning files
- Caches token counts based on file content (SHA-256 hash)
- Updates automatically when files change
- Shows counting progress in the status bar
- Displays total tokens for folders once all children are processed
- Shows cache size and saves it periodically to `.vscode/token-cache.txt`

## Badge Notation

Due to VS Code's 2-character limit for file decoration badges, token counts are displayed using a compact notation:

| Token Range | Badge | Example |
|------------|-------|---------|
| 0 | `0` | 0 tokens |
| 1-999 | `.0` to `.9` | `.1` = ~100 tokens, `.5` = ~500 tokens |
| 1,000-99,999 | `1` to `99` | `2` = ~2,000 tokens, `15` = ~15,000 tokens |
| 100,000-999,999 | `^1` to `^9` | `^2` = ~200,000 tokens, `^5` = ~500,000 tokens |
| 1,000,000-9,999,999 | `*1` to `*9` | `*1` = ~1 million tokens, `*3` = ~3 million tokens |
| 10,000,000+ | `∞` | More than 10 million tokens |

Special badges:
- `•` - File is being processed
- `⚠` - Error occurred during token counting
- `∞` - File is too large to process (>2MB)

## Extension Settings
- `tokenCounter.tokenizer`: choose `openai` or `anthropic`
