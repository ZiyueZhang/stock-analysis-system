# Markdown 渲染问题分析与修复

用户反馈输出的富文本（特别是表格）没有正确生成。从提供的文本来看，Markdown 源码中的表格语法存在格式问题，导致 `react-markdown` 无法正确解析。

## 问题分析 (Diagnosis)

1.  **表格格式错误**:
    *   Markdown 表格要求每行必须独立，并且分隔符行 (`|---|---|`) 必须正确对齐。
    *   用户提供的文本中，表格内容似乎被压缩到了同一行或者换行符 (`\n`) 丢失/不规范。
    *   例如：`| 估值指标 | ... | 备注 | |---|---|---|---| | 市盈率...` 这种紧凑格式在某些解析器中会失效。

2.  **换行符问题**:
    *   `react-markdown` (依赖 `remark-gfm`) 对换行非常敏感。
    *   LLM 输出时可能偶尔输出不规范的 Markdown，或者在前端 `stream` 拼接过程中丢失了必要的换行。

3.  **ReactMarkdown 配置**:
    *   当前的 `ChatWindow` 中使用了 `react-markdown`，但可能未启用 `remark-gfm` 插件，导致不支持表格 (GFM Table) 语法。

## 解决方案 (Solution)

### 1. 引入 `remark-gfm`
*   `react-markdown` 默认不支持表格、删除线等 GitHub Flavored Markdown (GFM) 特性。
*   **Action**: 安装 `remark-gfm` 并在 `ChatWindow` 中配置它。

### 2. 样式优化
*   即使解析了表格，默认的 HTML `<table>` 没有任何样式。
*   **Action**: 使用 Tailwind Typography 插件 (`prose`)，目前已经使用了 `prose` 类，但可能需要检查 CSS 是否覆盖了表格样式。

## 实施步骤
1.  **安装依赖**: `npm install remark-gfm`
2.  **代码修改**:
    *   修改 `ChatWindow.tsx`，导入 `remarkGfm` 并传给 `<ReactMarkdown>`.
    *   检查 Tailwind 配置，确保 `typography` 插件已启用（通常在 `tailwind.config.js`）。

请确认执行？