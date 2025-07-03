const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/images");

  // Date formatting filter
  eleventyConfig.addFilter("dateFormat", function(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  });

  // Smart time filter - relative time for < 24h, formatted date otherwise
  eleventyConfig.addFilter("smartTime", function(date) {
    const now = new Date();
    const postDate = new Date(date);
    const hoursDiff = Math.floor((now - postDate) / (1000 * 60 * 60));

    if (hoursDiff < 24) {
      // Relative time formatting
      if (hoursDiff < 1) {
        const minutes = Math.floor((now - postDate) / (1000 * 60));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      } else {
        return `${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''} ago`;
      }
    } else {
      return postDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
  });

  // Collections
  eleventyConfig.addCollection("jobs", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => item.data.category === "job")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("internships", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => item.data.category === "internship")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("scholarships", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => item.data.category === "scholarship")
      .sort((a, b) => b.date - a.date);
  });

  // Popular posts collection (sorted by views)
  eleventyConfig.addCollection("popular", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .sort((a, b) => (b.data.views || 0) - (a.data.views || 0))
      .slice(0, 5);
  });

  // New posts collection
  eleventyConfig.addCollection("newPosts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => item.data.isNew)
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_includes"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
}; 