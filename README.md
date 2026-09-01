# EAL Weekly

EAL Weekly 是一个面向大众的 AI 周报与知识栏目，采用中英双语内容结构，文章以 Markdown 文件为源，自动生成页面、列表和周次排序。

## 1. 文章目录

所有文章统一放在 `src/episodes/` 目录下，文件名可以按下面的方式命名：

- `eal-weekly-what-is-it-zh.md`
- `eal-weekly-what-is-it-en.md`

其中：
- `zh` 表示中文版本
- `en` 表示英文版本
- 同一篇文章的中文和英文文件应使用相同的基础名称，例如 `eal-weekly-what-is-it`。

如果一篇文章有对应的另一语言版本，网页会自动识别并在文章页顶部显示语言切换按钮：

- 中文版本
- English Version

## 2. 文章必须写的日期格式

每篇 Markdown 文件的 frontmatter 必须包含日期，使用固定格式：

```yaml
---
layout: layouts/episode.njk
title: "EAL Weekly 是什么？"
date: 2026-08-24
language: zh
tags:
  - journal
  - introduction
summary: "我们为什么做这个期刊，以及它想解决什么问题。"
---
```

日期必须使用：

- `YYYY-MM-DD`
- 例如：`2026-08-24`

网页会根据这个日期自动计算周次，并按时间倒序排列。也就是说：

- 文章的写作日期 = 排序依据
- `date` 字段 = 周次归属与展示时间
- 如果没有日期，文章不会参与正确排序

## 3. 文章添加步骤

1. 在 `src/episodes/` 目录下新建一个 Markdown 文件。
2. 复制 `src/episodes/_template.md` 模版内容。
3. 修改 `title`、`date`、`language`、`summary` 和正文。
4. 如果该文章有中英双语版本，使用相同的基础命名，并分别写入 `zh` / `en`。
5. 运行：

```bash
npm run build
```

6. 生成静态站点后，文章会自动出现在首页精选列表与文章列表中。

## 4. MD 模版

模版文件：`src/episodes/_template.md`

内容示例：

```md
---
layout: layouts/episode.njk
title: "Article Title"
date: 2026-08-24
language: zh
tags:
  - journal
  - introduction
summary: "Short summary in one or two sentences."
---

## Overview

Write the article body here.

## Why this matters

Explain the topic in plain language.

## Key takeaways

- Point one
- Point two
- Point three
```

## 5. 周次识别规则

网页会读取每篇文章的 `date` 字段，并自动计算该文章所属周次，例如：

- `2026-08-24` → `Week 35`
- `2026-08-30` → `Week 35`

排序规则：

- 默认按日期从新到旧排列
- 首页精选列表展示最新的前几篇
- 文章页会显示当前文章所属周次与日期标签

## 6. 开发命令

```bash
npm install
npm run dev
npm run build
```

## 7. 说明

- 文章以 Markdown 为主源，不再依赖测试数据。
- 当前站点支持中英双语文章切换。
- 首页已保留“精选文章列表”区域，用于突出重要文章。
