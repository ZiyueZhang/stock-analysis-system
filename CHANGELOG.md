# Changelog

All notable changes to this project will be documented in this file.

## [v1.0.0] - 2025-01-27

### ✨ New Features
- **Real-Time Web Search**: Integrated Tavily API via Function Calling. The LLM can now autonomously search the web for stock prices, news, and market data.
- **Web Search Toggle**: Added a UI toggle in the configuration panel to enable/disable internet access for the model.
- **Dynamic Date Awareness**: Injected current system time into the System Prompt, allowing the model to understand relative dates (e.g., "today", "last week").
- **Flexible Strategy Execution**: 
  - Decoupled strategy logic from session initialization.
  - Strategies can now be switched mid-conversation.
  - Strategies are optional; users can start a "Free Chat" without selecting one.
- **Conversation Management**: Added support for renaming and deleting historical conversations.

### ⚡ Improvements
- **Simplified UI**: Merged the "Ticker Input" and "Run" button into the main Chat Input for a cleaner experience.
- **Smart Ticker Detection**: Relaxed validation logic to support company names (e.g., "阳关电源") and natural language queries, not just stock symbols.
- **Rich Text Rendering**:
  - Added `remark-gfm` support for rendering Markdown tables correctly.
  - Added `rehype-raw` support for rendering HTML tags (like `<br>`) in responses.
- **Status Indicators**: Added a dynamic badge above the chat input to clearly show the current mode (Analysis vs. Chat) and active strategy.

### 🐛 Bug Fixes
- Fixed an issue where the Chat Input was disabled in new sessions.
- Fixed table rendering issues where columns were collapsed into a single line.
- Fixed static date issues where the model didn't know the current date.

### 🔧 Technical
- Refactored `UnifiedLLMService` to support a streaming tool execution loop.
- Implemented a caching layer for Tavily API to reduce latency and costs.
- Migrated to a unified message construction pipeline in the frontend.
