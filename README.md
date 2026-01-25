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
git clone <repository-url> # replace with actual repository URL
#or download the zip file and extract it
```

### 2. Backend Setup
```bash
cd backend
# Install backend dependencies (recommended)
# This creates/updates backend/.venv based on pyproject.toml + uv.lock
uv sync

# Configure Environment
cp .env.example .env  # Windows PowerShell: Copy-Item .env.example .env
# Edit .env and set at least:
# - TAVILY_API_KEY
# - LLM_API_KEY
#
# Optional:
# - LLM_BASE_URL / LLM_MODEL
# - DATABASE_URL
#
# For ENCRYPTION_KEY you can generate a Fernet key with:
# python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Security note: never commit real secrets into the repository. Treat any keys that were previously shared in plain text as compromised and rotate them.

On first backend start, the default strategies/prompts are automatically seeded into the local SQLite database. If you ever need to reseed manually, run:
```bash
cd backend
.venv\Scripts\python seed_prompts.py  # Windows
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

## 🧰 Troubleshooting

### Windows console shows `ANOMALY: meaningless REX prefix used`
- This message is typically emitted by an external/system-level component (e.g., injected hook/driver/security software), not by this project’s Python code.
- This repo starts the backend via a small wrapper to filter the line from stdout so it won’t pollute logs (see [run_backend.py](file:///f:/Trae/stock-test2/backend/run_backend.py)).
- Root fix (outside the repo): update/disable/uninstall the software component producing the message (commonly: GPU overlay tools, security/AV, terminal injection tools).

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
