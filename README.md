AI Weekly — Eleventy scaffold

Overview
- Simple Eleventy (11ty) static site scaffold for an "AI Weekly" site.
- Contributors add episodes as Markdown files in src/episodes/*.md. New files will be picked up automatically by Eleventy.

How episode files should look (frontmatter):
---
layout: layouts/episode.njk  # required
title: "Episode 12 — Title"
date: 2026-09-01            # YYYY-MM-DD
tags: ["models","multimodal"]
summary: "Short plain-language summary"
---

Content in Markdown. Use headings for sections. The first H1 is used as the page title if frontmatter.title is omitted.

Local development (run on your machine)
1. Install dependencies: npm install
2. Start dev server with auto-reload: npm run dev
3. Build for production: npm run build

If npm is not available in this environment, run the commands above on your development machine.

Search
- Eleventy generates /search.json at build time. Client-side search uses Fuse.js and can filter by week (input type=week) and date.
- The search looks at title, content, tags and summary.

Themes
- Light/dark theme toggle is available in the header and persisted to localStorage; the site respects prefers-color-scheme when set to "auto".

Deployment to Cloudflare Pages
- Build command: npm run build
- Build output directory: _site
- Cloudflare Pages will serve the generated static site. Alternatively any static host (Netlify, Vercel, GitHub Pages) works.

Next steps I can take for you
- Run npm install and build locally (I cannot run npm here if your environment lacks npm). I can generate a deploy config for Cloudflare Pages.
- Add more UI polish, pagination, RSS feed, or content migration tooling.

If you want any changes (different folder for episodes, different search behavior, or richer metadata), tell me and I'll update the scaffold.
