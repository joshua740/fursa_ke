const { DateTime } = require("luxon");
const moment = require("moment");

module.exports = function(eleventyConfig) {
  // Add site metadata
  eleventyConfig.addGlobalData("metadata", {
    title: "Fursa Kenya",
    url: "https://fursa.co.ke",
    description: "Discover the latest jobs, internships, and scholarships in Kenya.",
    author: {
      name: "Fursa Kenya",
      email: "joshuajay596@gmail.com"
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

  // Category-specific collections
  eleventyConfig.addCollection("job", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => item.data.category && item.data.category.toLowerCase() === "job")
      .sort(sortByDate);
  });

  eleventyConfig.addCollection("internship", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => item.data.category && item.data.category.toLowerCase() === "internship")
      .sort(sortByDate);
  });

  eleventyConfig.addCollection("scholarship", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => item.data.category && item.data.category.toLowerCase() === "scholarship")
      .sort(sortByDate);
  });

  // Popular posts collection (most recent from each category)
  eleventyConfig.addCollection("popular", function(collectionApi) {
    const allPosts = collectionApi.getFilteredByGlob("src/opportunities/*.md");
    
    // Get most recent post from each category
    const categories = ['job', 'internship', 'scholarship'];
    const popularPosts = [];
    
    categories.forEach(category => {
      const categoryPosts = allPosts
        .filter(item => item.data.category && item.data.category.toLowerCase() === category)
        .sort(sortByDate);
      
      if (categoryPosts.length > 0) {
        popularPosts.push(categoryPosts[0]); // Add most recent post from category
      }
    });
    
    // Add any manually marked popular posts
    const manualPopular = allPosts
      .filter(item => item.data.popular === true)
      .sort(sortByDate);
    
    // Combine and remove duplicates
    const combined = [...popularPosts, ...manualPopular];
    const uniquePosts = Array.from(new Set(combined));
    
    // Return top 4 posts
    return uniquePosts.slice(0, 4);
  });

  // New posts collection (combines recent posts and manually marked new posts)
  eleventyConfig.addCollection("newPosts", function(collectionApi) {
    const sevenDaysAgo = DateTime.now().minus({ days: 7 });
    const fourteenDaysAgo = DateTime.now().minus({ days: 14 });
    
    return collectionApi.getFilteredByGlob("src/opportunities/*.md")
      .filter(item => {
        const postDate = item.date ? DateTime.fromJSDate(item.date) : null;
        // Include if:
        // 1. Manually marked as new OR
        // 2. Less than 14 days old
        return (item.data.isNew === true) || (postDate && postDate >= fourteenDaysAgo);
      })
      .sort(sortByDate)
      .map(post => {
        // Add isRecent flag for posts less than 7 days old
        const postDate = post.date ? DateTime.fromJSDate(post.date) : null;
        post.data.isRecent = postDate && postDate >= sevenDaysAgo;
        return post;
      })
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