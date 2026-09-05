#!/usr/bin/env node
/**
 * 自动给 src/episodes/*.md 文章打 tag
 *
 * 用法：
 *   node scripts/auto-tag.js                    # 扫描整个 src/episodes/ 目录
 *   node scripts/auto-tag.js src/episodes/xxx.md # 只处理单篇文章
 *
 * 规则：
 *   - 读取 frontmatter 中已有的 tags，不会重复添加
 *   - 基于正文关键词匹配生成标签
 *   - 默认最多保留 6 个标签，避免过多
 *   - 只会修改 tags 字段，不会动其他内容
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

// 关键词库：标签 -> 匹配规则
// 每个规则可以是字符串或正则表达式
// 匹配时会忽略大小写
const TAG_RULES = [
  {
    tag: "openai",
    patterns: [
      /\bopenai\b/i,
      /\bchatgpt\b/i,
      /\bgpt-?4\b/i,
      /\bgpt-?3\b/i,
      /\bgpt-?o\d?\b/i,
      /\bo1\b/,
      /\bo3\b/,
      /\bdall-?e\b/i,
      /\bsora\b/i,
      /\bwhisper\b/i,
    ],
  },
  {
    tag: "agent",
    patterns: [
      /\bagent\b/i,
      /\bagents\b/i,
      /智能体/,
      /ai agent/i,
      /autonomous/i,
    ],
  },
  {
    tag: "llm",
    patterns: [
      /\bllm\b/i,
      /\bllms\b/i,
      /large language model/i,
      /大模型/,
      /大语言模型/,
      /foundation model/i,
    ],
  },
  {
    tag: "rag",
    patterns: [
      /\brag\b/i,
      /retrieval[- ]?augmented generation/i,
      /检索增强/,
      /向量数据库/,
      /vector database/i,
    ],
  },
  {
    tag: "multimodal",
    patterns: [
      /\bmultimodal\b/i,
      /多模态/,
      /vision model/i,
      /image generation/i,
      /video generation/i,
    ],
  },
  {
    tag: "reasoning",
    patterns: [
      /\breasoning\b/i,
      /推理/,
      /chain[- ]?of[- ]?thought/i,
      /\bcot\b/i,
      /test[- ]?time compute/i,
    ],
  },
  {
    tag: "tutorial",
    patterns: [
      /\btutorial\b/i,
      /教程/,
      /how to/i,
      /\bguide\b/i,
      /step[- ]?by[- ]?step/i,
      /quickstart/i,
    ],
  },
  {
    tag: "news",
    patterns: [
      /\bnews\b/i,
      /新闻/,
      /\brelease\b/i,
      /announce/i,
      /\blaunch\b/i,
      /发布/,
    ],
  },
  {
    tag: "research",
    patterns: [
      /\bresearch\b/i,
      /研究/,
      /\bpaper\b/i,
      /\barxiv\b/i,
      /\bbenchmark\b/i,
    ],
  },
  {
    tag: "education",
    patterns: [
      /\beducation\b/i,
      /教育/,
      /\blearning\b/i,
      /学习/,
      /\bcourse\b/i,
    ],
  },
  {
    tag: "tools",
    patterns: [
      /\btools\b/i,
      /工具/,
      /\bproduct\b/i,
      /\bsoftware\b/i,
      /\bplatform\b/i,
    ],
  },
  {
    tag: "open-source",
    patterns: [
      /\bopen[- ]?source\b/i,
      /开源/,
      /\bgithub\b/i,
      /\bhuggingface\b/i,
    ],
  },
];

const EPISODES_DIR = path.join(__dirname, "..", "src", "episodes");
const MAX_TAGS = 6;

function findTags(content) {
  const text = String(content || "");
  const matched = new Set();

  for (const rule of TAG_RULES) {
    for (const pattern of rule.patterns) {
      const regex = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
      if (regex.test(text)) {
        matched.add(rule.tag);
        break;
      }
    }
  }

  return Array.from(matched);
}

function normalizeTag(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function processFile(filePath) {
  const fileName = path.basename(filePath);
  if (fileName.startsWith("_")) {
    console.log(`跳过模板文件: ${fileName}`);
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const existingTags = (parsed.data.tags || [])
    .filter((t) => t && t !== "post")
    .map(normalizeTag);

  const detectedTags = findTags(parsed.content);

  // 合并已有标签和检测到的标签，保留顺序，去重
  const merged = new Map();
  for (const tag of existingTags) merged.set(tag, true);
  for (const tag of detectedTags) merged.set(tag, true);

  // 如果标签过多，优先保留原标签，再按检测顺序保留
  let finalTags = [];
  for (const tag of existingTags) {
    if (finalTags.length >= MAX_TAGS) break;
    if (!finalTags.includes(tag)) finalTags.push(tag);
  }
  for (const tag of detectedTags) {
    if (finalTags.length >= MAX_TAGS) break;
    if (!finalTags.includes(tag)) finalTags.push(tag);
  }

  // 如果标签没有变化，就不写回文件
  const before = existingTags.slice().sort().join(",");
  const after = finalTags.slice().sort().join(",");
  if (before === after) {
    console.log(`无变化: ${fileName} [${finalTags.join(", ")}]`);
    return;
  }

  parsed.data.tags = finalTags;
  const updated = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(filePath, updated, "utf8");
  console.log(`已更新: ${fileName} [${finalTags.join(", ")}]`);
}

function main() {
  const input = process.argv[2];
  const targets = [];

  if (input) {
    const resolved = path.resolve(input);
    if (fs.statSync(resolved).isDirectory()) {
      targets.push(
        ...fs
          .readdirSync(resolved)
          .filter((f) => f.endsWith(".md"))
          .map((f) => path.join(resolved, f))
      );
    } else {
      targets.push(resolved);
    }
  } else {
    targets.push(
      ...fs
        .readdirSync(EPISODES_DIR)
        .filter((f) => f.endsWith(".md"))
        .map((f) => path.join(EPISODES_DIR, f))
    );
  }

  if (targets.length === 0) {
    console.log("没有找到 Markdown 文件");
    return;
  }

  for (const filePath of targets) {
    processFile(filePath);
  }
}

main();
