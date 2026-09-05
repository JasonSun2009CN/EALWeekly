---
layout: layouts/episode.njk
title: 同日宕机提醒了什么：ChatGPT、Claude 与 Grok 的服务中断
date: 2026-09-03T00:00:00.000Z
language: zh
tags:
  - openai
  - anthropic
  - xai
  - outage
  - reliability
  - tools
summary: 9 月 3 日美国早间，多家主流 AI 服务先后出现故障。Grok 官方记录为 3 小时 37 分；三家服务的恢复节奏与根因并不相同。
---

> 日期按 UTC+8（北京时间）归属：2026 年 9 月 3 日。Grok 的官方事件从 21:30 开始，至 9 月 4 日 01:07 结束；文件日期按开始时间归属。

## 发生了什么？

9 月 3 日美国早间，OpenAI 的 ChatGPT 与 Codex、Anthropic 的 Claude，以及 xAI 的 Grok 都出现服务问题。多家媒体和状态页记录到用户报错和服务降级；Google Gemini 也出现用户报告，但当时未见 Google 确认的同类宕机公告。

需要避免把这些事件写成“一次完全相同的集体宕机”。xAI 的 Grok 状态页记录为 13:30–17:07 UTC，持续 3 小时 37 分。OpenAI 的状态页则记录 ChatGPT 与 Codex 出现 elevated errors（错误率升高），受影响组件和恢复时间与 Grok 并不相同。Anthropic 也报告部分模型与服务受到影响。公开资料尚未确认三者具有同一根因。

## 为什么会影响普通人？

对把 AI 当作聊天工具的用户，一次中断只是“暂时用不了”；但对依赖 AI 写代码、处理客服、整理文件或支持内部流程的人，它会立刻变成工作中断。尤其当团队把一个模型接入自动化流程，却没有人工兜底或替代路径时，小范围故障可能放大为业务延误。

这次事件还说明，AI 服务并不是独立存在的。模型公司、云服务、身份认证、网络连接和企业内部系统共同组成一条供应链。即使不同产品在同一时间出现故障，也不能在没有证据时直接断言它们使用同一基础设施或由同一原因造成。

## 企业应该怎么准备？

第一，给关键流程设计“降级模式”：AI 不可用时，用户能否转人工、使用缓存结果或延后处理。第二，区分“可以稍后重试”的任务和“必须立即完成”的任务，后者不应只依赖单一模型提供商。第三，保存模型调用日志和业务影响指标，避免只看到技术错误却无法判断客户、订单或安全风险受到什么影响。

可靠性不是选择一家“永不宕机”的厂商，而是在假设服务会偶尔不可用的前提下，设计出仍可工作的流程。

## 参考来源

- [xAI 状态页：Grok Web Models outage](https://status.x.ai/grok-com/INC25664c15)
- [OpenAI 状态页：ChatGPT 与 Codex 错误率升高](https://status.openai.com/incidents/2rm6gqeh)
- [Axios：多家 AI 服务同日出现故障](https://www.axios.com/2026/09/03/chatgpt-claude-grok-outages)
