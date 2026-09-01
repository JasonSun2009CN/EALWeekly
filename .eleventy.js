module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({"src/assets": "assets"});
  eleventyConfig.addPassthroughCopy({"index.html": "index.html"});

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

  eleventyConfig.addCollection("episodes", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/episodes/*.md").sort(function(a, b) {
      let ad = a.date || new Date(0);
      let bd = b.date || new Date(0);
      return bd - ad;
    });
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    templateFormats: ["md", "njk", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
