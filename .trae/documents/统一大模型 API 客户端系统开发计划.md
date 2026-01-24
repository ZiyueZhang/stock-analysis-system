# 统一大模型 API 客户端系统开发计划

基于您提出的“开发统一的大模型 API 客户端系统”的需求，我制定了以下全栈开发计划。本计划旨在构建一个高扩展、安全且支持流式响应的 LLM 中台服务。

## 1. 技术架构设计

*   **核心理念**: Adapter 模式封装不同 LLM 厂商，对外暴露统一的 OpenAI 兼容接口。
*   **后端 (FastAPI + SQLAlchemy)**:
    *   **Provider Layer**: 抽象 `LLMProvider` 基类，实现 `OpenAIProvider`, `ClaudeProvider`, `DeepSeekProvider`。
    *   **Service Layer**: `UnifiedLLMService` 负责路由分发、流式响应处理 (SSE)、错误重试。
    *   **Data Layer**: 新增 `Conversation` (对话会话) 和 `Message` (具体消息) 表，以及 `APIKey` 表（加密存储）。
    *   **Security**: 使用 `cryptography` 库对 API Key 进行 AES 加密存储。
*   **前端 (React + Tailwind)**:
    *   **Settings UI**: 配置不同厂商的 API Key，支持连接测试。
    *   **Chat UI**: 升级现有的“分析结果展示”，支持流式打字机效果 (Streaming Markdown)。
    *   **History UI**: 侧边栏展示历史对话，支持分页加载。

## 2. 实施路线图

### 第一阶段：后端核心架构 (Unified LLM Core)
1.  **依赖安装**: 添加 `cryptography` (加密), `tenacity` (重试机制)。
2.  **数据模型 (`models.py`)**:
    *   `APIKey`: 存储加密后的 Key、Provider 类型、别名。
    *   `Conversation`: 存储会话 ID、标题、创建时间。
    *   `Message`: 存储 role (user/assistant)、content、timestamp。
3.  **加密服务 (`crypto_service.py`)**: 实现 AES-256 加密/解密工具类。
4.  **LLM 适配器 (`llm_providers/`)**:
    *   定义 `BaseProvider` 抽象类 (支持 `stream_chat` 方法)。
    *   实现 `OpenAIProvider` (兼容 DeepSeek, 通义千问等 OpenAI 协议模型)。
    *   实现 `ClaudeProvider` (Anthropic 协议)。
5.  **统一服务 (`unified_llm_service.py`)**:
    *   实现密钥解密与 Provider 实例化。
    *   封装 SSE 生成器，统一输出格式。

### 第二阶段：流式 API 与对话管理
1.  **API 接口 (`routers/llm.py`)**:
    *   `POST /api/config/keys`: 管理 API Key。
    *   `POST /api/chat/completions`: 统一对话接口 (支持 `stream=True`)。
    *   `GET /api/conversations`: 获取历史列表 (分页)。
    *   `GET /api/conversations/{id}/messages`: 获取详情。
2.  **流式响应实现**: 使用 FastAPI 的 `StreamingResponse` 返回 SSE 数据流。

### 第三阶段：前端重构与集成
1.  **配置中心**: 开发 "设置面板"，允许用户添加/测试/删除不同厂商的 Key。
2.  **流式客户端**: 封装 `useLLMStream` Hook，处理 SSE 连接、断线重连和增量渲染。
3.  **分析页升级**: 将原有的“一键分析”升级为“对话式分析”，分析结果实时流式输出，并自动保存到历史记录。

## 3. 立即执行计划 (本轮)

为了确保核心功能落地，我将优先完成 **后端核心架构** 和 **流式接口实现**：

1.  **安装依赖**: `cryptography`, `tenacity`。
2.  **数据库升级**: 创建 `APIKey`, `Conversation`, `Message` 模型并迁移。
3.  **核心代码**:
    *   实现 `CryptoService`。
    *   实现 `UnifiedLLMService` (含 OpenAI/DeepSeek 适配)。
    *   实现 `POST /api/chat` 流式接口。
4.  **前端适配**: 修改 `App.tsx` 使用流式接口接收数据。

您是否同意开始执行此计划？(执行前请确保您已备份 `.env` 中的现有 Key)