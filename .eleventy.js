module.exports = function(eleventyConfig) {
  // Passthrough static assets
  eleventyConfig.addPassthroughCopy({"src/assets": "assets"});

  // Collection for episodes: read from src/episodes/*.md and sort latest-first
  eleventyConfig.addCollection("episodes", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/episodes/*.md").sort(function(a, b) {
      let ad = a.date || new Date(0);
      let bd = b.date || new Date(0);
      return bd - ad; // latest first
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
