const { DateTime } = require("luxon");
const moment = require("moment");

module.exports = function(eleventyConfig) {
  // Add site metadata
  eleventyConfig.addGlobalData("metadata", {
    title: "Fursa KE",
    url: "https://fursa.ke",
    description: "Discover the latest jobs, internships, and scholarships in Kenya.",
    author: {
      name: "Fursa KE",
      email: "info@fursa.ke"
    }
  });

  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/images");

  // Date filter using Luxon (preferred) - display format
  eleventyConfig.addFilter("formatDate", function(date, format = "MMMM d, yyyy") {
    if (!date) return "";
    return DateTime.fromJSDate(date).toFormat(format);
  });

  // ISO date filter for datetime attributes - keeps full precision for sorting
  eleventyConfig.addFilter("isoDate", function(date) {
    if (!date) return "";
    return DateTime.fromJSDate(date).toISO();
  });

  // Legacy date filter using moment.js (kept for backward compatibility)
  eleventyConfig.addFilter("date", function(value, format = "MMMM Do, YYYY") {
    return moment(value).format(format);
  });

  // Helper function to sort posts by date
  function sortByDate(a, b) {
    // Convert dates to Luxon DateTime objects for precise comparison including time
    const dateA = a.date ? DateTime.fromJSDate(a.date) : DateTime.fromJSDate(new Date(0));
    const dateB = b.date ? DateTime.fromJSDate(b.date) : DateTime.fromJSDate(new Date(0));

    // Compare dates including time for sorting
    if (dateA < dateB) return 1;
    if (dateA > dateB) return -1;

    // If dates are exactly equal (unlikely with time precision), sort by title
    const titleA = a.data.title || '';
    const titleB = b.data.title || '';
    return titleA.localeCompare(titleB);
  }

  // Search functionality
  eleventyConfig.addFilter("search", function(collection, searchTerm) {
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

  // Add search data to search page
  eleventyConfig.addCollection("search", function(collectionApi) {
    return {
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
    };
  });

  // All posts collection sorted by date
  eleventyConfig.addCollection("allPosts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .sort(sortByDate);
  });

  // Collections with category filtering and date sorting
  eleventyConfig.addCollection("jobs", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => {
        const category = item.data.category || '';
        return category.toLowerCase() === "job";
      })
      .sort(sortByDate);
  });

  eleventyConfig.addCollection("internships", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => {
        const category = item.data.category || '';
        return category.toLowerCase() === "internship";
      })
      .sort(sortByDate);
  });

  eleventyConfig.addCollection("scholarships", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => {
        const category = item.data.category || '';
        return category.toLowerCase() === "scholarship";
      })
      .sort(sortByDate);
  });

  // Popular posts collection (manually marked as popular)
  eleventyConfig.addCollection("popular", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => item.data.popular === true)
      .sort(sortByDate)
      .slice(0, 4);
  });

  // New posts collection
  eleventyConfig.addCollection("newPosts", function(collectionApi) {
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 });
    
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => {
        // Check if manually marked as new
        if (item.data.isNew === true) return true;
        
        // Check if post is less than 30 days old
        const postDate = item.date ? DateTime.fromJSDate(item.date) : null;
        return postDate && postDate >= thirtyDaysAgo;
      })
      .sort(sortByDate)
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