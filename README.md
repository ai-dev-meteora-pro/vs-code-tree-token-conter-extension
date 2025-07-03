# LLM Token Counter Summarizer DevBoy.pro

A powerful VS Code extension by DevBoy.pro that counts and summarizes LLM tokens in your project files. Token counts appear as small badges next to file names in the explorer, helping developers understand their code's token footprint for AI models.

## Features

### 🚀 Core Features
- **Multi-Model Support**: Counts tokens using either OpenAI or Anthropic tokenizers
- **Universal File Processing**: Processes all files under 2MB regardless of file extension
- **Smart Filtering**: Respects `.gitignore` patterns when scanning files
- **Performance Optimized**: Caches token counts based on file content (SHA-256 hash)
- **Real-time Updates**: Automatically recounts when files change
- **Progress Tracking**: Shows counting progress in the status bar
- **Folder Summaries**: Displays total tokens for folders once all children are processed
- **Persistent Cache**: Saves cache periodically to `.vscode/token-cache.txt`

### 🌍 Internationalization
- Full support for English and Russian languages
- Automatically uses VS Code's language setting

## Badge Notation

Due to VS Code's 2-character limit for file decoration badges, token counts are displayed using a compact notation:

| Token Range | Badge | Example |
|------------|-------|---------|
| 0 | `0` | 0 tokens |
| 1-999 | `.0` to `.9` | `.1` = ~100 tokens, `.5` = ~500 tokens |
| 1,000-99,999 | `1` to `99` | `2` = ~2,000 tokens, `15` = ~15,000 tokens |
| 100,000-999,999 | `^1` to `^9` | `^2` = ~200,000 tokens, `^5` = ~500,000 tokens |
| 1,000,000-9,999,999 | `*1` to `*9` | `*1` = ~1 million tokens, `*3` = ~3 million tokens |
| 10,000,000-99,999,999 | `1∞` to `9∞` | `1∞` = ~10 million tokens, `5∞` = ~50 million tokens |
| 100,000,000+ | `∞∞` | More than 100 million tokens |

Special badges:

- `•` - File is being processed
- `⚠` - Error occurred during token counting
- `∞` - File is too large to process (>2MB)

## Extension Settings
- `tokenCounter.tokenizer`: choose `openai` or `anthropic`
