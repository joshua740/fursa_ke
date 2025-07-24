const { DateTime } = require("luxon");
const moment = require("moment");
const sitemap = require("@quasibit/eleventy-plugin-sitemap");

module.exports = function(eleventyConfig) {
  
  // Clear cache settings
  eleventyConfig.setUseGitIgnore(false);
  eleventyConfig.setBrowserSyncConfig({
    files: ["src/opportunities/**/*"]
  });

  // Add watch target
  eleventyConfig.addWatchTarget("src/opportunities/");

  
  // Add sitemap plugin
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://fursakenya.com",
    },
  });

  // Add site metadata
  eleventyConfig.addGlobalData("metadata", {
    title: "Fursa Kenya",
    url: "https://fursakenya.com",
    description: "Discover the latest jobs, internships, and scholarships for young Kenyans.",
    author: {
      name: "Fursa Kenya",
      email: "joshuajay596@gmail.com"
    }
  });

  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Date filters
  eleventyConfig.addFilter("formatDate", (date, format = "MMMM d, yyyy") => {
    if (!date) return "";
    return DateTime.fromJSDate(date).toFormat(format);
  });

  eleventyConfig.addFilter("isoDate", date => {
    if (!date) return "";
    return DateTime.fromJSDate(date).toISO();
  });

  eleventyConfig.addFilter("date", (value, format = "MMMM Do, YYYY") => {
    return moment(value).format(format);
  });

  // Helper: Sort posts by date
  function sortByDate(a, b) {
    const dateA = a.date ? DateTime.fromJSDate(a.date) : DateTime.fromJSDate(new Date(0));
    const dateB = b.date ? DateTime.fromJSDate(b.date) : DateTime.fromJSDate(new Date(0));
    if (dateA < dateB) return 1;
    if (dateA > dateB) return -1;
    return (a.data.title || '').localeCompare(b.data.title || '');
  }

  // Search filter
  eleventyConfig.addFilter("search", (collection, searchTerm) => {
    if (!searchTerm) return [];
    searchTerm = searchTerm.toLowerCase();
    return collection.filter(item => {
      const searchContent = [
        item.data.title,
        item.data.description,
        item.data.company,
        item.data.location,
        item.data.category,
        item.templateContent
      ].filter(Boolean).join(" ").toLowerCase();
      return searchContent.includes(searchTerm);
    });
  });

  // Collections
  eleventyConfig.addCollection("search", collectionApi => ({
    get results() {
      const searchQuery = global.searchQuery || "";
      if (!searchQuery) return [];
      return collectionApi.getAll()
        .filter(item => {
          const searchContent = [
            item.data.title,
            item.data.description,
            item.data.company,
            item.data.location,
            item.data.category,
            item.templateContent
          ].filter(Boolean).join(" ").toLowerCase();
          return searchContent.includes(searchQuery.toLowerCase());
        })
        .sort(sortByDate);
    },
    get query() {
      return global.searchQuery || "";
    }
  }));

  eleventyConfig.addCollection("allPosts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => !!item.template?.inputPath) // Verify file exists
      .sort(sortByDate);
  });

  eleventyConfig.addCollection("job", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => !!item.template?.inputPath && item.data.category?.toLowerCase() === "job")
      .sort(sortByDate);
  });

  eleventyConfig.addCollection("internship", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => !!item.template?.inputPath && item.data.category?.toLowerCase() === "internship")
      .sort(sortByDate);
  });

  eleventyConfig.addCollection("scholarship", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => !!item.template?.inputPath && item.data.category?.toLowerCase() === "scholarship")
      .sort(sortByDate);
  });

  eleventyConfig.addCollection("popular", collectionApi => {
    const allPosts = collectionApi.getFilteredByGlob("src/opportunities/*.md");
    const categories = ['job', 'internship', 'scholarship'];
    const popularPosts = [];

    categories.forEach(category => {
      const categoryPosts = allPosts
        .filter(item => item.data.category?.toLowerCase() === category)
        .sort(sortByDate);
      if (categoryPosts.length > 0) {
        popularPosts.push(categoryPosts[0]);
      }
    });

    const manualPopular = allPosts
      .filter(item => item.data.popular === true)
      .sort(sortByDate);

    const combined = [...popularPosts, ...manualPopular];
    const uniquePosts = Array.from(new Set(combined));
    return uniquePosts.slice(0, 7);
  });

  eleventyConfig.addCollection("newPosts", collectionApi => {
    const sevenDaysAgo = DateTime.now().minus({ days: 7 });
    const fourteenDaysAgo = DateTime.now().minus({ days: 14 });

    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => {
        const postDate = item.date ? DateTime.fromJSDate(item.date) : null;
        return item.data.isNew === true || (postDate && postDate >= fourteenDaysAgo);
      })
      .sort(sortByDate)
      .map(post => {
        const postDate = post.date ? DateTime.fromJSDate(post.date) : null;
        post.data.isRecent = postDate && postDate >= sevenDaysAgo;
        return post;
      })
      .slice(0, 5);
  });

  // Return config
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