# HTML 标签 (`<br>`) 渲染支持计划

用户反馈 `<br>` 标签直接显示为了文本，而不是换行。这是因为 `react-markdown` 默认出于安全考虑，会转义或忽略 HTML 标签（即 `rehype-raw` 插件默认未启用）。

## 解决方案

为了让 Markdown 中的 HTML 标签（如 `<br>`, `<sup>`, `<sub>` 等）生效，我们需要引入 `rehype-raw` 插件。

### 1. 引入 `rehype-raw`
*   **功能**: 允许解析 Markdown 中的原始 HTML。
*   **注意**: 启用此插件需要确保内容安全，虽然 LLM 输出相对可控，但通常建议配合 `rehype-sanitize` 使用（可选，鉴于这是本地工具，可暂略过严格清洗）。

### 2. 实施步骤
1.  **安装依赖**: `npm install rehype-raw`
2.  **代码修改**:
    *   修改 `ChatWindow.tsx`。
    *   导入 `rehypeRaw`。
    *   将其传给 `<ReactMarkdown>` 的 `rehypePlugins` 属性。

## 验证
输入包含 `<br>` 的文本，确认其被渲染为换行。

请确认执行？