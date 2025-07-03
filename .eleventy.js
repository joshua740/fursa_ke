const { DateTime } = require("luxon");
const moment = require("moment");

module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/images");

  // Date filter using moment.js
  eleventyConfig.addFilter("date", function(value, format = "MMMM Do, YYYY") {
    return moment(value).format(format);
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