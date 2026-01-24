# 完善 LLM 智能分析功能的开发计划

**现状确认**：
目前的后端仅实现了“Prompt 模版管理”和“Tavily 数据获取”，**尚未实现**将 Prompt 发送给大模型进行分析的功能。点击前端 Prompt 目前仅能查看模版内容，无法真正执行分析。

为了实现“点击即分析”的完整闭环，我制定了以下计划，核心流程为：**用户选择 Prompt -> 后端自动调用 Tavily 获取实时数据 -> 组装完整 Prompt -> 调用 LLM 进行深度分析 -> 前端展示报告**。

## 1. 后端开发 (Backend)

### 1.1 引入 LLM 服务层 (`llm_service.py`)
*   **技术选型**: 使用 `openai` 标准 SDK（兼容 DeepSeek, OpenAI, Claude 等主流模型）。
*   **功能**:
    *   支持配置 `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (方便切换不同模型)。
    *   实现 `analyze_stock(ticker, prompt_template, data_context)` 方法。

### 1.2 升级分析接口 (`main.py`)
*   新增 `POST /api/analyze` 接口。
*   **智能编排逻辑**:
    1.  接收用户请求 (Ticker + Prompt ID)。
    2.  **自动数据增强**: 调用 `TavilyService` 获取该 Ticker 的实时价格、新闻和基本面数据。
    3.  **Prompt 填充**: 将 Tavily 获取的数据自动填入 Prompt 模版的 `[[Price]]`, `[[Context]]` 等槽位。
    4.  **LLM 推理**: 将填充好的 Prompt 发送给大模型。
    5.  返回流式或完整的分析报告。

### 1.3 依赖更新
*   使用 `uv` 添加 `openai` 依赖。
*   更新 `.env` 增加 LLM 配置项。

## 2. 前端开发 (Frontend)

*由于前端目前仅为初始化状态，需要实现核心交互界面：*

### 2.1 提示词工作台 (Prompt Workbench)
*   **列表页**: 展示所有可用 Prompt (复用原有设计风格)。
*   **输入区**: 允许用户输入 Ticker (股票代码)。

### 2.2 分析执行与展示
*   **执行按钮**: "开始 AI 分析" —— 触发后端接口。
*   **加载状态**: 展示 "正在搜索 Tavily 数据...", "正在进行 LLM 推理..." 等实时状态。
*   **Markdown 渲染**: 引入 `react-markdown` 优雅展示大模型生成的分析报告。

## 3. 执行步骤

1.  **Backend**: `uv add openai`，创建 `llm_service.py`，更新 `.env`。
2.  **Backend**: 实现 `POST /api/analyze` 编排逻辑 (Tavily + LLM)。
3.  **Frontend**: 安装 `axios`, `react-markdown`, `lucide-react` (图标)。
4.  **Frontend**: 开发 `App.tsx` 和组件，实现从选择 Prompt 到展示结果的完整 UI。

请确认是否开始执行此计划？(执行后您需要在 `.env` 中填入您的大模型 API Key)