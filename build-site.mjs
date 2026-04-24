import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(__dirname, "../ragent/docs/ragent-open-study-guide.md");
const outputPath = path.resolve(__dirname, "index.html");
const markdown = fs.readFileSync(sourcePath, "utf8");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(text, used) {
  const base = text
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase() || "section";
  let slug = base;
  let index = 2;
  while (used.has(slug)) slug = `${base}-${index++}`;
  used.add(slug);
  return slug;
}

function inlineMarkdown(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return out;
}

function parseMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const used = new Set();
  const headings = [];
  const html = [];
  let paragraph = [];
  let list = [];
  let table = [];
  let inCode = false;
  let codeLang = "";
  let codeLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    html.push("<ul>");
    for (const item of list) html.push(`<li>${inlineMarkdown(item)}</li>`);
    html.push("</ul>");
    list = [];
  };

  const flushTable = () => {
    if (table.length < 2) {
      table = [];
      return;
    }
    const rows = table
      .filter((row, index) => index !== 1 || !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(row))
      .map((row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()));
    if (!rows.length) {
      table = [];
      return;
    }
    const [head, ...body] = rows;
    html.push('<div class="table-wrap"><table>');
    html.push("<thead><tr>");
    for (const cell of head) html.push(`<th>${inlineMarkdown(cell)}</th>`);
    html.push("</tr></thead>");
    if (body.length) {
      html.push("<tbody>");
      for (const row of body) {
        html.push("<tr>");
        for (const cell of row) html.push(`<td>${inlineMarkdown(cell)}</td>`);
        html.push("</tr>");
      }
      html.push("</tbody>");
    }
    html.push("</table></div>");
    table = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushTable();
  };

  for (const rawLine of lines) {
    const line = rawLine;

    if (inCode) {
      if (line.startsWith("```")) {
        html.push(`<pre><code class="language-${escapeHtml(codeLang)}">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
        codeLang = "";
        codeLines = [];
      } else {
        codeLines.push(line);
      }
      continue;
    }

    if (line.startsWith("```")) {
      flushAll();
      inCode = true;
      codeLang = line.slice(3).trim();
      codeLines = [];
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = slugify(text, used);
      headings.push({ level, text, id });
      html.push(`<h${level} id="${id}">${inlineMarkdown(text)}<a class="heading-anchor" href="#${id}" aria-label="Link to ${escapeHtml(text)}">#</a></h${level}>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      flushTable();
      list.push(line.replace(/^\s*[-*]\s+/, "").trim());
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph();
      flushTable();
      list.push(line.replace(/^\s*\d+\.\s+/, "").trim());
      continue;
    }

    if (/^\s*>/.test(line)) {
      flushAll();
      html.push(`<blockquote>${inlineMarkdown(line.replace(/^\s*>\s?/, ""))}</blockquote>`);
      continue;
    }

    if (line.includes("|") && /^\s*\|?[^|]+\|/.test(line)) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    }

    flushList();
    flushTable();
    paragraph.push(line.trim());
  }

  flushAll();
  return { html: html.join("\n"), headings };
}

const { html: articleHtml, headings } = parseMarkdown(markdown);

const officialMenu = [
  {
    label: "RAG基础概念",
    match: ["D. RAG 基础概念", "4. RAG 基础概念"],
    children: [
      { label: "什么是RAG技术?", match: ["D.1 什么是 RAG 技术", "4.1 什么是 RAG"] },
      {
        label: "基础篇",
        match: ["E. RAG 基础概念 - 基础篇", "4.2 基础篇"],
        children: [
          { label: "什么是大模型", match: ["E.1 什么是大模型", "4.2 基础篇"] },
          { label: "如何调用大模型", match: ["E.2", "4.2 基础篇"] },
          { label: "如何写好Prompt工程", match: ["E.3", "6.5 Prompt 构建"] }
        ]
      },
      {
        label: "数据篇",
        match: ["F. RAG 基础概念 - 数据篇", "4.3 数据篇"],
        children: [
          { label: "为什么需要文档解析", match: ["F.1", "8.4 文档解析"] },
          { label: "文档解析都有哪些坑", match: ["F.2", "8.4 文档解析"] },
          { label: "Ragent中如何解析文档", match: ["F.3", "8.4 文档解析"] },
          { label: "数据分块是什么", match: ["F.4", "8.5 文档分块"] },
          { label: "固定长度分块", match: ["FixedSizeTextChunker", "8.5 文档分块"] },
          { label: "结构感知分块", match: ["StructureAwareTextChunker", "8.5 文档分块"] }
        ]
      },
      {
        label: "向量篇",
        match: ["G. RAG 基础概念 - 向量篇", "4.4 向量篇"],
        children: [
          { label: "什么是Embedding", match: ["G.1", "4.4 向量篇"] },
          { label: "什么是向量数据库", match: ["G.2", "4.4 向量篇"] },
          { label: "pgvector向量存储", match: ["PgVectorStoreService", "4.4 向量篇"] },
          { label: "Milvus向量存储", match: ["MilvusVectorStoreService", "4.4 向量篇"] },
          { label: "HNSW索引与相似度", match: ["HNSW", "4.4 向量篇"] }
        ]
      },
      {
        label: "应用篇",
        match: ["H. RAG 基础概念 - 应用篇", "4.5 应用篇"],
        children: [
          { label: "知识库管理", match: ["8.1 知识库对象", "4.5 应用篇"] },
          { label: "文档管理", match: ["8.2 文档上传", "4.5 应用篇"] },
          { label: "意图树管理", match: ["11.2 为什么要意图树", "4.5 应用篇"] },
          { label: "Trace链路追踪", match: ["11.4 为什么要 Trace", "4.5 应用篇"] }
        ]
      },
      {
        label: "MCP篇",
        match: ["I. RAG 基础概念 - MCP 篇", "4.6 MCP 篇"],
        children: [
          { label: "MCP是什么", match: ["4.6 MCP 篇"] },
          { label: "MCP Server", match: ["mcp-server", "4.6 MCP 篇"] },
          { label: "tools/list与tools/call", match: ["tools/list", "4.6 MCP 篇"] },
          { label: "Ragent如何调用MCP", match: ["HttpMCPClient", "4.6 MCP 篇"] }
        ]
      },
      {
        label: "对话增强篇",
        match: ["J. RAG 基础概念 - 对话增强篇", "4.7 对话增强篇"],
        children: [
          { label: "会话记忆", match: ["6.1 会话记忆", "4.7 对话增强篇"] },
          { label: "问题改写", match: ["6.2 问题改写", "4.7 对话增强篇"] },
          { label: "多问题拆分", match: ["MultiQuestionRewriteService", "4.7 对话增强篇"] },
          { label: "意图澄清", match: ["IntentGuidanceService", "4.7 对话增强篇"] }
        ]
      },
      {
        label: "数据传输协议",
        match: ["K. 数据传输协议", "4.8 数据传输协议"],
        children: [
          { label: "SSE协议与流式响应", match: ["4.8 数据传输协议"] },
          { label: "SpringBoot SSE服务端实战", match: ["SseEmitter", "4.8 数据传输协议"] }
        ]
      },
      {
        label: "模型检索生成评估与优化",
        match: ["L. 模型检索生成评估与优化", "4.9 评估与优化"],
        children: [
          { label: "检索效果怎么判断", match: ["4.9 评估与优化"] },
          { label: "召回率与准确率", match: ["4.9 评估与优化"] },
          { label: "Rerank优化", match: ["RerankPostProcessor", "12.3 为什么要 Rerank"] },
          { label: "Trace辅助调优", match: ["11.4 为什么要 Trace"] }
        ]
      }
    ]
  },
  {
    label: "从零启动Ragent——前后端全流程",
    match: ["M. 从零启动 Ragent——前后端全流程", "5. 从零启动 Ragent"],
    children: [
      {
        label: "中间件初始化",
        match: ["M.1 中间件初始化", "5.1 中间件初始化"],
        children: [
          { label: "本地开发环境搭建", match: ["M.2 本地开发环境搭建", "5.2 本地开发环境搭建"] },
          { label: "Docker中间件部署", match: ["M.3 Docker 中间件部署", "5.3 Docker 中间件部署"] },
          { label: "PostgreSQL数据库初始化", match: ["M.4 PostgreSQL 数据库初始化", "5.4 PostgreSQL 数据库初始化"] }
        ]
      }
    ]
  },
  {
    label: "AI知识问答",
    match: ["N. AI 知识问答", "6. AI 知识问答链路"],
    children: [
      { label: "会话记忆", match: ["N.1", "6.1 会话记忆"] },
      { label: "问题改写", match: ["N.2", "6.2 问题改写"] },
      { label: "意图识别", match: ["N.3", "6.3 意图识别"] },
      { label: "多通道检索", match: ["N.4", "6.4 多通道检索"] },
      { label: "Prompt构建", match: ["N.5", "6.5 Prompt 构建"] },
      { label: "流式输出", match: ["N.6", "6.6 流式输出"] }
    ]
  },
  {
    label: "项目模块介绍",
    match: ["O. 项目模块介绍", "7. 项目模块介绍"],
    children: [
      { label: "bootstrap业务入口", match: ["7.1 bootstrap"] },
      { label: "framework通用能力", match: ["7.2 framework"] },
      { label: "infra-ai模型基础设施", match: ["7.3 infra-ai"] },
      { label: "mcp-server工具服务", match: ["7.4 mcp-server"] },
      { label: "frontend前端模块", match: ["7.5 frontend"] }
    ]
  },
  {
    label: "AI知识库建设",
    match: ["P. AI 知识库建设", "8. AI 知识库建设"],
    children: [
      { label: "知识库对象", match: ["P.1", "8.1 知识库对象"] },
      { label: "文档上传", match: ["P.2", "8.2 文档上传"] },
      { label: "文件存储", match: ["P.3", "8.3 文件存储"] },
      { label: "文档解析", match: ["P.4", "8.4 文档解析"] },
      { label: "文档分块", match: ["P.5", "8.5 文档分块"] },
      { label: "向量化", match: ["P.6", "8.6 向量化"] },
      { label: "异步入库", match: ["P.7", "8.7 异步入库"] },
      { label: "Pipeline入库", match: ["P.8", "8.8 Pipeline 入库"] }
    ]
  },
  {
    label: "Ollama vLLM扫盲",
    match: ["Q. Ollama vLLM 扫盲", "9. Ollama 与 vLLM 扫盲"],
    children: [
      { label: "Ollama是什么", match: ["Q.1", "9.1 Ollama 是什么"] },
      { label: "vLLM是什么", match: ["Q.2", "9.2 vLLM 是什么"] }
    ]
  },
  {
    label: "大模型调度引擎实战",
    match: ["R. 大模型调度引擎实战", "10. 大模型调度引擎实战"],
    children: [
      { label: "AI基础设施层宏观设计", match: ["R.1", "10.1 模型能力拆分"] },
      { label: "多模型路由与智能选择", match: ["R.2", "10.2 模型选择"] },
      { label: "三态熔断器与故障转移", match: ["R.3", "10.3 故障转移"] },
      { label: "Chat同步调用与模板方法", match: ["R.4"] },
      { label: "SSE流式解析与异步执行", match: ["R.5"] },
      { label: "流式路由的首包探测机制", match: ["R.6"] },
      { label: "Embedding向量化客户端", match: ["R.7"] },
      { label: "Rerank重排序与辅助工具", match: ["R.8"] }
    ]
  },
  {
    label: "AI知识问答篇",
    match: ["S. AI 知识问答篇", "11. AI 知识问答篇"],
    children: [
      { label: "一次问答从前端到后端", match: ["S.1", "11.1 一次问答从前端到后端"] },
      { label: "为什么要意图树", match: ["S.2", "11.2 为什么要意图树"] },
      { label: "为什么要查询词映射", match: ["S.3", "11.3 为什么要查询词映射"] },
      { label: "为什么要Trace", match: ["S.4", "11.4 为什么要 Trace"] }
    ]
  },
  {
    label: "面试高频考点",
    match: ["T. 面试高频考点", "12. 面试高频考点"],
    children: [
      { label: "RAG和微调有什么区别", match: ["T.1", "12.1 RAG 和微调有什么区别"] },
      { label: "为什么文档要分块", match: ["T.2", "12.2 为什么文档要分块"] },
      { label: "为什么要Rerank", match: ["T.3", "12.3 为什么要 Rerank"] },
      { label: "为什么要多通道检索", match: ["T.4", "12.4 为什么要多通道检索"] },
      { label: "为什么要MCP", match: ["T.5", "12.5 为什么要 MCP"] },
      { label: "为什么要异步文档入库", match: ["T.6", "12.6 为什么要异步文档入库"] },
      { label: "为什么要模型路由", match: ["T.7", "12.7 为什么要模型路由"] },
      { label: "项目亮点怎么讲", match: ["T.8", "12.8 项目最大的亮点怎么讲"] }
    ]
  },
  { label: "内容正在持续更新中...", disabled: true }
];

function cleanHeadingText(text) {
  return text.replace(/^[A-Z]\.\s*/, "").replace(/^\d+(\.\d+)*\s*/, "").trim();
}

function findHeadingId(matchers) {
  if (!matchers) return headings[0]?.id || "";
  for (const matcher of matchers) {
    const exact = headings.find((h) => h.text === matcher);
    if (exact) return exact.id;
    const fuzzy = headings.find((h) => h.text.includes(matcher) || cleanHeadingText(h.text) === matcher);
    if (fuzzy) return fuzzy.id;
  }
  return headings[0]?.id || "";
}

function buildMenu(items, depth = 0) {
  return items.map((item) => {
    const id = findHeadingId(item.match);
    const label = escapeHtml(item.label);
    const badge = item.badge ? `<span class="menu-badge">${escapeHtml(item.badge)}</span>` : "";
    if (item.disabled) return `<div class="menu-muted depth-${depth}">${label}</div>`;
    if (item.children?.length) {
      return `<div class="menu-group depth-${depth}">
        <button class="menu-toggle" type="button" data-target="${id}" data-heading="${label}">
          <span>${label}${badge}</span>
          <span class="chevron">›</span>
        </button>
        <div class="menu-children">
          ${buildMenu(item.children, depth + 1)}
        </div>
      </div>`;
    }
    return `<a href="#${id}" class="menu-link depth-${depth}" data-heading="${label}">${label}${badge}</a>`;
  }).join("\n");
}

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ragent 开源项目学习文档</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <div class="reading-progress" id="readingProgress"></div>
  <header class="topbar">
    <button class="icon-button only-mobile" id="menuToggle" aria-label="打开目录">☰</button>
    <div class="brand">
      <span class="brand-mark">拿</span>
      <div>
        <div class="brand-title">拿个offer · Java&AI 实战圈</div>
        <div class="brand-subtitle">Ragent 开源项目学习文档</div>
      </div>
    </div>
    <a class="source-link" href="../ragent/docs/ragent-open-study-guide.md">Markdown 原文</a>
  </header>
  <div class="layout">
    <aside class="sidebar" id="sidebar">
      <div class="search-box">
        <input id="searchInput" type="search" placeholder="搜索菜单，例如 RAG、Redis、MCP" />
      </div>
      <nav class="nav" id="nav">
        ${buildMenu(officialMenu)}
      </nav>
    </aside>
    <main class="content">
      <article class="doc" id="doc">
        ${articleHtml}
      </article>
    </main>
  </div>
  <button class="back-top" id="backTop" aria-label="回到顶部">↑</button>
  <script src="./site.js"></script>
</body>
</html>`;

fs.writeFileSync(outputPath, html, "utf8");
console.log(`Generated ${outputPath}`);
