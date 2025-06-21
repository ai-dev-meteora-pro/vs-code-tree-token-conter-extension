# Token Counter VSCode Extension

This extension counts tokens in text files using either Anthropic's tokenizer or OpenAI's tiktoken library.

## Features

- **Dual Tokenizer Support**: Choose between Anthropic (@anthropic-ai/tokenizer) and OpenAI (tiktoken) tokenizers
- **Explorer Integration**: Token counts appear directly in the file explorer next to file names
- **Smart Caching**: Results are cached and only recalculated when files change
- **Async Processing**: Uses CPU-based concurrency (max 16, default half CPU count) for efficient processing
- **File Size Limit**: Only processes text files under 2MB
- **Configurable**: Customize file extensions, tokenizer choice, and other settings

## Configuration

Access settings via `File > Preferences > Settings` and search for "Token Counter":

- `tokenCounter.tokenizer`: Choose between "anthropic" (default) or "openai"
- `tokenCounter.fileExtensions`: Array of file extensions to analyze
- `tokenCounter.maxFileSize`: Maximum file size in bytes (default: 2MB)
- `tokenCounter.maxConcurrency`: Maximum concurrent operations
- `tokenCounter.showInExplorer`: Enable/disable explorer integration

## Usage

1. Open a workspace with text files
2. Token counts will appear automatically next to file names in the explorer
3. Use "Refresh Token Counts" command to manually refresh
4. Hover over files to see detailed token information

## File Types Supported

By default, the extension analyzes these file types:
- Text files (.txt, .md)
- Source code (.js, .ts, .jsx, .tsx, .py, .java, .cpp, .c, .h)
- Web files (.css, .html, .json, .xml)
- Config files (.yaml, .yml, .sql, .sh)

## Performance

- Uses async job queue with CPU-based concurrency limits
- Intelligent caching based on file content and modification time
- Background processing to avoid blocking the UI
- Efficient file watching for real-time updates

This extension helps developers understand the token usage of their files, which is particularly useful when working with AI models that have token limits.