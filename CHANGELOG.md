# Change Log

All notable changes to the "LLM Token Counter Summarizer DevBoy.pro" extension will be documented in this file.

## [0.0.1] - 2025-07-03

### Initial Release
- 🚀 First release of LLM Token Counter Summarizer DevBoy.pro
- ✨ Token counting using OpenAI and Anthropic tokenizers
- 📊 Compact badge notation for displaying token counts (2-character limit)
- 🗂️ Process all files under 2MB regardless of extension
- 🔍 Respect .gitignore patterns
- 💾 SHA-256 based caching system
- 🔄 Real-time updates when files change
- 📁 Folder token summaries
- 🌍 Full internationalization support (English and Russian)
- 🎨 Custom TreeDataProvider for token visualization
- ⚡ Performance optimized with concurrent processing
- 📈 Progress tracking in status bar

### Badge Notation
- `0` - 0 tokens
- `.0` to `.9` - 1-999 tokens (hundreds)
- `1` to `99` - 1k-99k tokens
- `^1` to `^9` - 100k-999k tokens
- `*1` to `*9` - 1M-9M tokens
- `1∞` to `9∞` - 10M-99M tokens
- `∞∞` - 100M+ tokens

### Special Badges
- `•` - Processing
- `⚠` - Error
- `∞` - File too large (>2MB)

---
Made with ❤️ by DevBoy.pro