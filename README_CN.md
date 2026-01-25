# AI 股票分析助手（v1.0.0）

一个 AI 驱动的股票分析平台，结合 DeepSeek/OpenAI 兼容的 LLM 与 Tavily 实时检索，为股票/事件提供结构化分析与多轮问答。

## 功能

### 1) 统一对话入口
- 自动识别股票代码（如 NVDA、TSLA）并触发分析
- 支持追问与多轮上下文

### 2) 策略化分析
- 可切换不同分析框架（例如初始研究、估值等）
- 同一只股票可随时切换策略重复分析

### 3) 实时 Web 检索
- 集成 Tavily 获取最新行情/新闻/事件
- 可在配置面板中随时启用/关闭

### 4) 历史管理
- 会话与分析结果保存到本地 SQLite
- 支持重命名、删除、搜索历史会话

## 安装与运行

### 环境要求
- Python 3.12+
- Node.js 18+
- API Key：
  - Tavily：用于 Web Search（https://tavily.com）
  - DeepSeek / OpenAI：用于 LLM 推理

### 1) 克隆代码
```bash
git clone <repository-url>
cd stock-test2
```

### 2) 后端安装（推荐 uv）
```bash
cd backend

# 基于 pyproject.toml + uv.lock 安装依赖，并创建/更新 backend/.venv
uv sync

# 配置环境变量
cp .env.example .env  # Windows PowerShell: Copy-Item .env.example .env

# 至少配置：
# - TAVILY_API_KEY
# - LLM_API_KEY
#
# 可选：
# - LLM_BASE_URL / LLM_MODEL
# - DATABASE_URL
#
# ENCRYPTION_KEY 可用 Fernet 生成：
# python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

后端首次启动时会自动将默认策略/提示词写入本地 SQLite 数据库。如需手动重新灌入，可执行：
```bash
cd backend
.venv\Scripts\python seed_prompts.py
```

### 3) 前端安装
```bash
cd frontend
npm install
```

### 4) 启动（Windows）
```bash
start.bat
```

访问：
- 前端：http://localhost:5173
- 后端：http://localhost:8000

## 常见问题

### Windows 控制台出现 `ANOMALY: meaningless REX prefix used`
- 该行通常来自系统级/第三方组件（例如注入 Hook、驱动、杀软/安全软件等），并非本项目 Python 代码抛出的异常。
- 本项目已通过后端启动包装器过滤该行，避免污染日志与输出（见 backend/run_backend.py）。
- 如需根治，需要在系统层面更新/禁用/卸载输出该信息的组件（常见：GPU overlay/录屏叠加层、安全软件、终端注入工具）。

## 架构
- 前端：React + TypeScript + Vite + Tailwind CSS
- 后端：FastAPI + SQLAlchemy + SQLite
- LLM：OpenAI SDK（兼容 DeepSeek）
- 搜索：Tavily API

## License
MIT
