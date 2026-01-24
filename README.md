# AI Stock Analyst (v1.0.0)

A powerful, AI-driven stock analysis platform that combines DeepSeek/OpenAI LLMs with real-time market data from Tavily to provide in-depth financial insights.

## 🚀 Features

### 1. Intelligent Chat Interface
- **Seamless Interaction**: Unified chat input for both ticker analysis and follow-up questions.
- **Auto-Detection**: Automatically recognizes stock tickers (e.g., "NVDA", "TSLA") to trigger analysis.
- **Context Awareness**: Remembers conversation history for deep, multi-turn discussions.

### 2. Strategy-Based Analysis
- **Modular Strategies**: Choose from various analysis frameworks (e.g., "Initial Research", "PVP vs PVE", "Valuation").
- **Flexible Execution**: Switch strategies mid-conversation to view the same stock from different angles.
- **Decoupled Logic**: Strategies can be applied at any time, not just at the start of a session.

### 3. Real-Time Web Search (New!)
- **Tavily Integration**: Fetches up-to-the-minute market data, news, and events.
- **Smart Tool Use**: The AI automatically decides when to search the web based on your questions.
- **Toggle Control**: Enable or disable web search on the fly via the configuration panel.

### 4. Robust History Management
- **Conversation Tracking**: Auto-saves all analyses and chats to a local SQLite database.
- **Management Tools**: Rename conversations for better organization or delete old ones.
- **Searchable History**: Quickly find past analyses using the sidebar search.

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- API Keys:
  - **Tavily**: For web search (Get one at [tavily.com](https://tavily.com))
  - **DeepSeek / OpenAI**: For LLM reasoning

### 1. Clone the Repository
```bash
git clone <repository-url>
cd stock-test2
```

### 2. Backend Setup
```bash
cd backend
# Create virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
# OR if using uv
uv pip install -r pyproject.toml

# Configure Environment
cp .env.example .env
# Edit .env and add your TAVILY_API_KEY
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Run the Application
We provide a unified startup script for Windows:
```bash
# In the root directory
start.bat
```
Access the app at `http://localhost:5173`.

## 📖 Usage Guide

### Starting an Analysis
1. Click **"New Analysis"** in the sidebar.
2. (Optional) Select a **Strategy** from the right panel.
3. Enter a stock ticker (e.g., `AAPL`) or company name in the chat input.
4. The AI will perform the analysis using real-time data.

### Free Chat & Follow-ups
- Ask questions like *"What are the risks?"* or *"Compare with Microsoft"*.
- If **Web Search** is enabled, you can ask for current events: *"What is the stock price today?"*.

### Managing Strategies
- You can change the active strategy at any time by clicking a different card in the right panel.
- The status badge above the chat input will indicate the current mode (e.g., `🚀 Starting Analysis` or `💬 Free Chat`).

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **LLM Core**: OpenAI SDK (Compatible with DeepSeek)
- **Search**: Tavily API via Function Calling

## 📄 License
MIT
