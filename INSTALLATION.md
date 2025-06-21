# VSCode Token Counter Extension - Installation & Usage Guide

## 🎯 What This Extension Does

This VSCode extension displays token counts directly next to file names in the Explorer sidebar. It supports both Anthropic's tokenizer and OpenAI's tiktoken library, making it perfect for developers working with AI models that have token limits.

## ✨ Key Features

- **Real-time Token Counting**: See token counts immediately in the file explorer
- **Dual Tokenizer Support**: Choose between Anthropic (default) or OpenAI tokenizers
- **Smart Performance**: 
  - CPU-based async processing (max 16 concurrent operations)
  - Intelligent caching with file change detection
  - Only processes text files under 2MB
- **Configurable**: Customize file types, tokenizer choice, and performance settings

## 🚀 Installation Methods

### Method 1: Development Installation (Current)
Since this is a custom extension, you'll install it in development mode:

1. **Open the extension folder in VSCode**:
   ```bash
   code /app
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Compile the TypeScript**:
   ```bash
   npm run compile
   ```

4. **Run the extension**:
   - Press `F5` in VSCode
   - This opens a new "Extension Development Host" window
   - The extension will be active in this new window

### Method 2: Package as VSIX (For Distribution)
To create a distributable package:

```bash
# Install vsce (Visual Studio Code Extension CLI)
npm install -g vsce

# Package the extension
vsce package

# This creates a .vsix file that can be installed via:
# code --install-extension token-counter-1.0.0.vsix
```

## 🔧 Configuration

Access settings via `File > Preferences > Settings` and search for "Token Counter":

### Core Settings

- **`tokenCounter.tokenizer`**: 
  - Options: `"anthropic"` (default) or `"openai"`
  - Choose which tokenizer library to use

- **`tokenCounter.fileExtensions`**:
  - Default: `[".txt", ".md", ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".cpp", ".c", ".h", ".css", ".html", ".json", ".xml", ".yaml", ".yml", ".sql", ".sh"]`
  - Add or remove file extensions to analyze

- **`tokenCounter.maxFileSize`**:
  - Default: `2097152` (2MB)
  - Maximum file size in bytes to process

- **`tokenCounter.maxConcurrency`**:
  - Default: `8`
  - Maximum concurrent token counting operations

## 📖 Usage

### Basic Usage
1. Open a workspace containing text files
2. Token counts appear automatically next to file names in the Explorer
3. Format: `filename.ext (123 tokens)`

### Commands
Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **`Token Counter: Refresh Token Counts`**: Manually refresh all token counts
- **`Token Counter: Show Token Count`**: Show token count for selected file

### Visual Indicators
- **`filename.txt (123 tokens)`**: Token count displayed
- **`filename.txt (counting...)`**: Processing in progress
- **`filename.txt`**: File type not configured for analysis

## 🧪 Testing the Extension

The extension comes with test files to verify functionality:

### Test Files Included:
- `test-files/sample.txt` - Basic text file (~138 tokens)
- `test-files/sample.js` - JavaScript file (~133 tokens)  
- `test-files/sample.md` - Markdown file (~166 tokens)
- `test-files/large-sample.py` - Large Python file for performance testing

### Test Scenarios:
1. **Basic Functionality**: Open the extension and verify token counts appear
2. **Tokenizer Switching**: Change settings between Anthropic and OpenAI
3. **File Changes**: Edit a file and verify count updates automatically
4. **Performance**: Test with the large Python file
5. **Configuration**: Modify file extensions and verify behavior

## 🛠️ Troubleshooting

### Extension Not Loading
- Ensure all dependencies are installed: `npm install`
- Compile TypeScript: `npm run compile`
- Check VSCode Developer Console: `Help > Toggle Developer Tools`

### Token Counts Not Appearing
- Verify file extensions are in the configured list
- Check file size is under the limit (default 2MB)
- Try refreshing: `Ctrl+Shift+P` → "Token Counter: Refresh Token Counts"

### Performance Issues
- Reduce `maxConcurrency` in settings
- Exclude large directories by modifying `fileExtensions`
- Clear cache by reloading the window

### Tokenizer Errors
- Ensure both `@anthropic-ai/tokenizer` and `tiktoken` packages are installed
- Check the VSCode output console for error messages
- Try switching between tokenizers in settings

## 📊 Token Count Differences

Different tokenizers may produce different counts:

```
Sample text: "Hello world! This is a test."

Anthropic tokenizer: ~8 tokens
OpenAI tiktoken: ~8 tokens
```

This is normal - each tokenizer uses different encoding methods optimized for their respective AI models.

## 🚀 Advanced Usage

### Custom File Types
Add support for custom file extensions:

1. Open Settings (`Ctrl+,`)
2. Search "Token Counter"  
3. Edit "File Extensions" array
4. Add extensions like `".custom"`, `".config"`, etc.

### Performance Tuning
For large projects:

1. **Adjust concurrency**: Lower `maxConcurrency` for slower systems
2. **File size limits**: Reduce `maxFileSize` to skip large files
3. **Selective extensions**: Only include file types you need

### Integration with AI Workflows
This extension is particularly useful when:
- Preparing content for AI models with token limits
- Analyzing code snippets for ChatGPT/Claude
- Managing documentation that needs to fit within context windows
- Optimizing prompts and responses

## 🤝 Development

### Architecture Overview
- **`extension.ts`**: Main extension entry point and activation
- **`tokenCountingService.ts`**: Core tokenization logic and caching
- **`tokenCounterProvider.ts`**: VSCode Explorer tree integration  
- **`fileWatcher.ts`**: File system change monitoring

### Key Features Implemented
- Async job queue with CPU-based concurrency limits
- MD5-based file change detection and caching
- VSCode TreeDataProvider for Explorer integration
- Real-time file watching and cache invalidation

This extension demonstrates advanced VSCode API usage including tree data providers, file system watchers, and configuration management.

## 📄 License

This extension is provided as-is for educational and development purposes.