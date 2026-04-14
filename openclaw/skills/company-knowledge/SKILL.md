---
name: company-knowledge
description: >-
  Queries the internal enterprise semantic search HTTP API for facts about the
  organization, business, projects, meetings, and classified documents. Use
  when the user needs company-specific context, internal sources, or answers
  grounded in the corporate knowledge base; also when the user mentions 企业知识、
  内部检索、业务/项目资料、会议纪要、知识库搜索.
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

## API 约定

| 项 | 说明 |
|----|------|
| 方法 | `POST` |
| 路径 | `/v1/search`（与基址拼接，例如 `http://127.0.0.1:3001/v1/search`） |
| `Content-Type` | `application/json; charset=utf-8` |
| 请求体 | JSON 对象，字段见下表 |

### 请求体字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `query` | string | 是 | 自然语言检索语句；可用中文关键词、项目名、主题；宜具体、可区分歧义。 |
| `topK` | number 或 string | 否 | 返回条数上限；示例中可为字符串 `"5"`。未约定时默认使用较小值（如 5～10）以控制上下文长度。 |

### 响应（成功时）

顶层常见字段：

| 字段 | 说明 |
|------|------|
| `query` | 服务端回显或规范化后的查询。 |
| `results` | 命中片段数组；可能为空。 |
| `rerank_skipped` | 布尔值，表示是否跳过重排序（若存在）。 |

`results[]` 中每条通常包含：

| 字段 | 说明 |
|------|------|
| `chunk_id` | 片段唯一标识。 |
| `document_id` | 所属文档标识。 |
| `raw_key` | 文档在库中的路径或键名，**作答时作为引用来源列出**。 |
| `classification` | 密级或分类标签（如 `S0`）；回答中应尊重其敏感性表述。 |
| `text` | 片段正文；可能含表格、换行、OCR 噪声。 |
| `score` | 相关性分数；越高通常越相关。 |
| `score_source` | 分数来源说明（如 `rerank`）。 |

## 调用方式

使用环境或配置中的**知识库服务基址**（示例：`http://127.0.0.1:3001`），与 `/v1/search` 拼接后发起请求。可用 `curl`、脚本或任意 HTTP 客户端；须设置正确的 `Content-Type` 与 UTF-8 编码的 JSON 体。

**请求示例：**

```http
POST /v1/search HTTP/1.1
Host: 127.0.0.1:3001
Content-Type: application/json; charset=utf-8

{"query":"量子科技","topK":"5"}
```

## 检索与作答流程

1. **改写查询**：将用户问题浓缩为 1～3 条检索式；专有名词保持原样；可拆成「主题 + 场景」（如「超算中心 量子」）。
2. **执行检索**：调用接口；若结果为空，调整关键词或 `topK` 后最多再试 1～2 次。
3. **筛选片段**：优先采用 `score` 较高且 `text` 与问题直接相关的条目；明显无关或分数极低的片段可忽略并在答复中说明依据有限。
4. **综合答案**：用自然语言归纳，不逐字堆砌 OCR 表格线；矛盾信息需并列说明并标注来源 `raw_key`。
5. **引用规范**：在答复末尾或对应论断旁列出使用的 `raw_key`（及必要时 `classification`）；勿编造未出现在 `results` 中的文件名或结论。

## 结果解读注意

- `text` 可能来自 PDF/幻灯片，含竖排、表格竖线、乱码式分隔符；先理解语义再表述。
- 低分条目可能为弱相关；勿过度推断。
- 若仅部分问题被片段覆盖，明确写出**已知/未知**边界。

## 安全与合规

- 基址与内网访问权限由部署环境决定；勿在对话中复述 API 密钥或令牌。
- 遵守 `classification` 与组织的信息公开要求；不确定时采用更保守的表述或建议走正式渠道确认。
