module.exports = function(eleventyConfig) {
  const baseUrl = process.env.BASE_URL || "/";

  eleventyConfig.addPassthroughCopy({"src/assets": "assets"});
  eleventyConfig.addPassthroughCopy({"index.html": "index.html"});
  eleventyConfig.addGlobalData("baseUrl", baseUrl);

  const getIsoWeek = (value) => {
    if (!value) return { week: 0, label: "Week 0", iso: "0000-W00" };
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { week: 0, label: "Week 0", iso: "0000-W00" };

    const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = temp.getUTCDay() || 7;
    temp.setUTCDate(temp.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);

    return {
      week,
      label: `Week ${week}`,
      iso: `${temp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
    };
  };

  const getLanguageFromPath = (inputPath, frontmatter = {}) => {
    const fileName = (inputPath || "").split(/[\\/]/).pop() || "";
    const explicit = (frontmatter.language || frontmatter.lang || "").toLowerCase();
    if (explicit) return explicit;
    if (/[-_](zh|cn|zh-cn)$/i.test(fileName)) return "zh";
    if (/[-_](en|eng|english)$/i.test(fileName)) return "en";
    return "zh";
  };

  const getBaseKey = (inputPath, frontmatter = {}) => {
    const fileName = (inputPath || "").split(/[\\/]/).pop() || "";
    const cleanName = fileName.replace(/\.(md|markdown)$/i, "");
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
