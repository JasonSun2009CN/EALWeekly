module.exports = function(eleventyConfig) {
  const baseUrl = process.env.BASE_URL || "/";

  eleventyConfig.addPassthroughCopy({"src/assets": "assets"});
  eleventyConfig.addGlobalData("baseUrl", baseUrl);

  const getIsoWeek = (value) => {
    if (!value) return { week: 1, label: "Week 1", iso: "2026-W01" };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { week: 1, label: "Week 1", iso: "2026-W01" };

    const start = new Date("2026-08-24T00:00:00Z");
    const diffDays = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000);
    const week = Math.max(1, Math.floor(diffDays / 7) + 1);

    return {
      week,
      label: `Week ${week}`,
      iso: `2026-W${String(week).padStart(2, "0")}`
    };
  };

  const normalizeFileName = (inputPath) => {
    return ((inputPath || "").split(/[\\/]/).pop() || "").replace(/\.(md|markdown)$/i, "");
  };

  const getLanguageFromPath = (inputPath, frontmatter = {}) => {
    const fileName = normalizeFileName(inputPath);
    const explicit = (frontmatter.language || frontmatter.lang || "").toLowerCase();
    if (explicit) return explicit;
    if (/[-_](zh|cn|zh-cn)$/i.test(fileName)) return "zh";
    if (/[-_](en|eng|english)$/i.test(fileName)) return "en";
    return "zh";
  };

  const getBaseKey = (inputPath, frontmatter = {}) => {
    const cleanName = normalizeFileName(inputPath);
    const explicitBase = frontmatter.baseKey || frontmatter.slug || "";
    if (explicitBase) return String(explicitBase).trim();
    const match = cleanName.match(/^(.*?)(?:[-_](zh|cn|en|eng|english))$/i);
    return match ? match[1] : cleanName;
  };

  eleventyConfig.addFilter("date", function(date, format) {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    if (!format) format = "yyyy-LL-dd";
    return format
      .replace("yyyy", d.getFullYear())
      .replace("LL", pad(d.getMonth() + 1))
      .replace("dd", pad(d.getDate()));
  });

  eleventyConfig.addFilter("jsonify", function(value) {
    return JSON.stringify(value || []);
  });

  eleventyConfig.addFilter("json", function(value) {
    return JSON.stringify(value == null ? "" : String(value));
  });

  eleventyConfig.addFilter("relatedEpisodes", function(items, page, limit = 4) {
    if (!items || !page) return [];

    const currentPath = page.inputPath || page.url || "";
    const currentName = normalizeFileName(currentPath);
    const currentData = page.data || {};
    const currentLanguage = getLanguageFromPath(currentPath, currentData);
    const currentBaseKey = getBaseKey(currentPath, currentData);
    const currentTags = new Set((currentData.tags || []).filter((t) => t && t !== "post"));
    const currentWeekIso = currentData.weekIso;
    const currentDate = new Date(currentData.date || page.date || 0);

    const scored = items
      .filter((item) => {
        const itemPath = item.inputPath || "";
        const itemName = normalizeFileName(itemPath);
        const itemBaseKey = getBaseKey(itemPath, item.data || {});
        return itemName !== currentName && itemBaseKey !== currentBaseKey;
      })
      .map((item) => {
        const itemData = item.data || {};
        const itemLanguage = getLanguageFromPath(item.inputPath, itemData);
        const itemTags = new Set((itemData.tags || []).filter((t) => t && t !== "post"));
        const itemDate = new Date(itemData.date || item.date || 0);

        let score = 0;
        let commonTags = 0;
        if (currentTags.size && itemTags.size) {
          for (const tag of currentTags) {
            if (itemTags.has(tag)) commonTags += 1;
          }
        }
        score += commonTags * 3;

        if (currentLanguage && itemLanguage === currentLanguage) {
          score += 2;
        }

        if (currentWeekIso && itemData.weekIso === currentWeekIso) {
          score += 2;
        }

        const diffMs = currentDate.getTime() - itemDate.getTime();
        const diffDays = Math.abs(diffMs) / 86400000;
        if (!isNaN(diffDays)) {
          score += Math.max(0, 10 - diffDays) * 0.5;
        }

        return { item, score };
      });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.item.data.date || b.item.date || 0) - new Date(a.item.data.date || a.item.date || 0);
    });

    return scored.slice(0, limit).map((s) => s.item);
  });

  eleventyConfig.addFilter("withBase", function(value) {
    if (!value || typeof value !== "string") return value;
    if (/^https?:\/\//i.test(value) || value.startsWith("#") || value.startsWith("mailto:")) {
      return value;
    }
    const normalizedBase = (baseUrl || "/").replace(/\/$/, "");
    const normalizedValue = value.startsWith("/") ? value.slice(1) : value;
    return normalizedBase === "/" ? `/${normalizedValue}` : `${normalizedBase}/${normalizedValue}`;
  });

  eleventyConfig.addFilter("translationFor", function(items, page) {
    if (!items || !page) return null;
    const currentPath = page.inputPath || page.url || "";
    const currentName = (currentPath.split(/[\\/]/).pop() || "").replace(/\.(md|markdown)$/i, "");
    const currentLanguage = getLanguageFromPath(currentPath, page.data || {});
    const currentBaseKey = getBaseKey(currentPath, page.data || {});

    return (items || []).find((item) => {
      const itemPath = item.inputPath || "";
      const itemName = (itemPath.split(/[\\/]/).pop() || "").replace(/\.(md|markdown)$/i, "");
      const itemLanguage = getLanguageFromPath(itemPath, item.data || {});
      const itemBaseKey = getBaseKey(itemPath, item.data || {});
      return itemName !== currentName && itemBaseKey === currentBaseKey && itemLanguage !== currentLanguage;
    }) || null;
  });

  eleventyConfig.addCollection("episodes", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/episodes/*.md")
      .filter((entry) => {
        const fileName = (entry.inputPath || "").split(/[\\/]/).pop() || "";
        return !fileName.startsWith("_");
      })
      .map((entry) => {
        const dateValue = entry.data.date || entry.date || new Date(0);
        const week = getIsoWeek(dateValue);
        const language = getLanguageFromPath(entry.inputPath, entry.data || {});
        const baseKey = getBaseKey(entry.inputPath, entry.data || {});

        entry.data.language = language;
        entry.data.baseKey = baseKey;
        entry.data.weekNumber = week.week;
        entry.data.weekLabel = week.label;
        entry.data.weekIso = week.iso;

        return entry;
      }).sort(function(a, b) {
        let ad = new Date(a.data.date || a.date || 0).getTime();
        let bd = new Date(b.data.date || b.date || 0).getTime();
        return bd - ad;
      });
  });

  eleventyConfig.addCollection("weekGroups", function(collectionApi) {
    const entries = collectionApi.getFilteredByGlob("src/episodes/*.md")
      .filter((entry) => {
        const fileName = (entry.inputPath || "").split(/[\\/]/).pop() || "";
        return !fileName.startsWith("_");
      })
      .map((entry) => {
        const dateValue = entry.data.date || entry.date || new Date(0);
        const week = getIsoWeek(dateValue);
        const language = getLanguageFromPath(entry.inputPath, entry.data || {});
        const baseKey = getBaseKey(entry.inputPath, entry.data || {});

        entry.data.language = language;
        entry.data.baseKey = baseKey;
        entry.data.weekNumber = week.week;
        entry.data.weekLabel = week.label;
        entry.data.weekIso = week.iso;

        return entry;
      })
      .sort(function(a, b) {
        return new Date(b.data.date || b.date || 0) - new Date(a.data.date || a.date || 0);
      });

    const groups = new Map();

    entries.forEach((entry) => {
      const key = entry.data.weekIso || entry.data.weekLabel || "unknown";
      if (!groups.has(key)) {
        groups.set(key, {
          weekIso: key,
          weekLabel: entry.data.weekLabel || "Week 0",
          start: null,
          end: null,
          zh: [],
          en: []
        });
      }

      const group = groups.get(key);
      const dateValue = new Date(entry.data.date || entry.date || 0);
      if (!group.start || dateValue < new Date(group.start)) group.start = dateValue;
      if (!group.end || dateValue > new Date(group.end)) group.end = dateValue;

      if ((entry.data.language || "zh") === "zh") {
        group.zh.push(entry);
      } else {
        group.en.push(entry);
      }
    });

    return Array.from(groups.values())
      .map((group) => {
        group.start = group.start ? new Date(group.start) : new Date();
        group.end = group.end ? new Date(group.end) : new Date();
        group.zh = group.zh.sort((a, b) => new Date(b.data.date || b.date || 0) - new Date(a.data.date || a.date || 0));
        group.en = group.en.sort((a, b) => new Date(b.data.date || b.date || 0) - new Date(a.data.date || a.date || 0));
        return group;
      })
      .sort((a, b) => new Date(b.end) - new Date(a.end));
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    pathPrefix: baseUrl,
    templateFormats: ["md", "njk", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
