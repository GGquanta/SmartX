---
name: company-knowledge
description: >-
  Queries the internal enterprise semantic search HTTP API for facts about the
  organization, business, projects, meetings, and classified documents. Use
  when the user needs company-specific context, internal sources, or answers
  grounded in the corporate knowledge base; also when the user mentions 企业知识、
  内部检索、业务/项目资料、会议纪要、知识库搜索、量子技术.
---

# 企业知识库检索

通过可访问的 HTTP 接口对企业知识库做语义检索，用返回的文档片段回答与公司情况、业务、项目、会议等相关的**事实性问题**。不用于泛泛闲聊；若检索无结果，应如实说明并建议换关键词或缩小/扩大查询范围。

## 何时使用

- 需要**组织内部**信息：战略、合作、产品路线、项目进展、会议要点等。
- 用户问题包含专有名词、项目名、合作方、内部文档类型（如会议纪要、汇报材料）。
- 需要**可追溯出处**的答案（文档路径/分类见返回字段）。

## 何时不使用

- 公开常识、与本公司无关的一般知识（直接用模型知识即可）。
- 接口不可用、未配置基址或用户明确禁止访问内网服务时。
- 用户禁止访问内网、或未配置可用 `{BASE}` / Token 时。

## API 约定

通过 **Base URL**（默认为 `http://localhost:5001`）访问企业知识库。**程序化访问**须使用正确的API Key；文档中以占位符 **`<API_KEY>`** 表示，实际请求替换为真实密钥且**不得在对话中复述**。

可以查看OpenClaw的配置文件来获取API Key，位置是skills.entries.company-knowledge.apiKey。

无需向用户告知和回复API Key的获取过程。

## 鉴权（所有下列接口）

| 项 | 说明 |
|----|------|
| 请求头 | `Authorization: Bearer <API_KEY>` |
| 说明 | 仅接受 Bearer；与 Cookie 会话混用时优先 Bearer，失败返回 401，不回退 Cookie。 |
| 权限 | Token 绑定用户密级；检索与读文档均受 `classification`（S0/S1/S2）约束。 |

未配置 `AUTH_SESSION_SECRET` 时受保护路由不可用（503）。

## 主要接口

下列路径均与 **API 基址** `{BASE}` 拼接。

### 1. 检索数据（语义检索）

| 项 | 说明 |
|----|------|
| 方法 / 路径 | `POST {BASE}/v1/search` |
| `Content-Type` | `application/json; charset=utf-8` |

**请求体（JSON）：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `query` | string | 是 | 自然语言检索语句；中文关键词、项目名、主题；宜具体。 |
| `topK` | number | 否 | 返回条数上限；未传时可用较小默认值（如 5～10）控制上下文长度。 |

**成功响应（常见顶层字段）：** `query`、`results`（可能为空）、`rerank_skipped`；`results[]` 中常含 `chunk_id`、`document_id`、`raw_key`、`classification`、`text`、`score`、`score_source`。作答时以 `raw_key`（及必要时 `classification`）作为出处；勿编造未出现在结果中的结论。

**示例：**

```http
POST /v1/search HTTP/1.1
Host: 127.0.0.1:3001
Authorization: Bearer <API_KEY>
Content-Type: application/json; charset=utf-8

{"query":"量子科技项目进展","topK":5}
```

### 2. 查看衍生数据

| 项 | 说明 |
|----|------|
| 方法 / 路径 | `GET {BASE}/v1/documents/{document_id}/derived-markdown` |
| 路径参数 | `document_id`：UUID，通常来自检索结果 `document_id`。 |

**响应：** `200` 时为 **Markdown 正文**（`text/markdown; charset=utf-8`），即衍生桶中该文档的 `main.md`。尚未生成衍生内容时可能 `404`（如「衍生内容尚未就绪」）。

内嵌图片等相对路径需经网关加载时，可使用同一 Bearer 调用  
`GET {BASE}/v1/documents/{document_id}/derived-object?path=<URL 编码的相对路径>`（如 `media/xxx.png`）。

### 3. 查看原始数据

| 项 | 说明 |
|----|------|
| 方法 / 路径 | `GET {BASE}/v1/documents/{document_id}/raw-url` |
| 路径参数 | `document_id`：UUID。 |

**响应（JSON）：** 含预签名下载信息，例如 `url`（限时有效）、`expiresIn`、`bucket`、`key`、`contentType`。用返回的 `url` 发起 **GET** 下载原始文件（第二次请求一般**不需要**再带 `Authorization`，依预签名 URL 即可）。

若部署关闭原始访问，会返回与 `DOCUMENTS_ALLOW_RAW_ACCESS` 相关的 **403**，应如实告知用户。

## 推荐调用顺序

1. 用 **接口 1** 按用户问题检索，从 `results` 取相关 `document_id` 与 `raw_key` / `text`。
2. 需要完整转换正文时，对同一 `document_id` 调用 **接口 2**。
3. 需要 PDF/Office 等原文件时，调用 **接口 3** 再跟随 `url` 下载。

## 检索与作答要点

- 将用户问题改写成 1～3 条具体检索式；专有名词保持原样。
- 结果为空时可调整关键词或略增大 `topK`，**最多再试 1～2 次**。
- `text` 可能含 OCR/表格噪声；先理解语义再归纳，矛盾处并列说明并标注 `raw_key`。
- 遵守密级与内网合规；不在对话中泄露 `<API_KEY>` 或完整预签名 URL 中的敏感参数。

## 图片渲染

- 如果用户需要查看知识库中包含的图片时，直接以MARKDOWN格式返回文本。
- 知识库文本中可能存在类似于media/{file_name}这样的图片链接，请使用![]({BASE}/v1/documents/{document_id}/derived-object?path=media%2F{file_name})的格式输出。前端页面会自动完成渲染过程。
