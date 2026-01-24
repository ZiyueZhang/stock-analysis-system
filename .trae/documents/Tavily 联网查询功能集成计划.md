# Tavily 联网查询功能集成计划

根据您的需求，我们将为 LLM 集成 Tavily 搜索能力，使其能够获取实时数据。虽然您提到了 MCP，但考虑到当前项目架构（FastAPI + OpenAI SDK），直接在后端服务层集成 Tavily API 并通过 Function Calling (Tools) 机制暴露给 LLM 是最轻量且高效的方案。

## 1. 技术方案设计

* **架构选择**: 采用 **Function Calling (Tool Use)** 模式。

  * 这是 OpenAI/DeepSeek 等现代模型支持的标准能力。

  * LLM 自动判断是否需要联网 -> 生成工具调用请求 -> 后端执行 Tavily 搜索 -> 将结果回传给 LLM -> LLM 生成最终回答。

  * 相比于 MCP（通常用于更复杂的跨进程/跨服务协议），Function Calling 在单一后端服务中更直接。

* **接口层**: 复用现有的 `UnifiedLLMService`，为其增加 `tools` 支持。

## 2. 核心模块实现

### A. Tavily Service 增强 (`backend/tavily_service.py`)

* **现状**: 已有基础 `TavilyClient`，但仅用于简单的 `get_stock_quote`。

* **增强**:

  * 实现通用的 `search(query, type)` 方法，支持新闻、通用搜索、金融数据。

  * 增加**缓存机制**（使用简单的内存缓存或 SQLite），减少重复 API 调用。

  * 优化结果解析，提取 Title, Content, URL, Published Date。

### B. LLM Provider 升级 (`backend/llm_core/openai_provider.py`)

* **Tool Binding**: 修改 `stream_chat` 方法，支持传入 `tools` 定义。

* **Tool Execution**: 实现工具调用的执行循环（Loop）：

  1. LLM 输出 `tool_calls`。
  2. Provider 捕获并暂停流式输出。
  3. 执行对应的 Python 函数（如 `tavily_search`）。
  4. 将执行结果作为 `tool` 角色消息追加到历史。
  5. 再次调用 LLM 获取最终响应。

### C. 统一服务层适配 (`backend/unified_llm_service.py`)

* 定义工具集（Schema）：

  ```json
  {
    "type": "function",
    "function": {
      "name": "search_web",
      "description": "Search the internet for real-time information, stock news, or market data.",
      "parameters": { ... }
    }
  }
  ```

* 在 `chat_stream` 中注入工具定义。

## 3. 安全与配置

* **API Key**: 继续使用 `.env` 中的 `TAVILY_API_KEY`，无需额外加密存储（服务器端环境变量是安全的）。

* **开关控制**: 在 `ChatRequest` 中增加 `enable_web_search` 字段（默认关闭或由前端控制），允许用户按需开启。

## 4. 实施步骤

1. **增强 TavilyClient**: 添加缓存、重试、结果格式化。
2. **定义 Tools Schema**: 在 `llm_core` 中定义搜索工具。
3. **升级 OpenAIProvider**: 支持 Function Calling 的流式处理（这是最复杂的部分，需要处理 `chunk.choices[0].delta.tool_calls`）。
4. **前端适配**: 在 `ChatWindow` 或设置中添加 "Enable Web Search" 开关（可选，或默认智能开启）。

## 5. 预期效果

* 用户问："英伟达今天股价多少？" -> LLM 调用 `search_web("NVDA stock price today")` -> Tavily 返回数据 -> LLM 回答："截至今日，英伟达股价为..."

* 用户问："分析一下特斯拉最近的新闻" -> LLM 调用搜索 -> 总结新闻。

请确认执行此集成计划？
