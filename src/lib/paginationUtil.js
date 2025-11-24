// Maximum number of properties to show on a page
export const PROPERTIES_PER_PAGE = 6;

/**
 * Gets the Array of page numbers to shown in the pagination component. The first and last page should always be shown
 * and curPage should be centered among the remaining pages if possible.
 * @param {Number}  totalPages - The total number of pages
 * @param {Number} curPage - The page number that is currently selected. This is 1 indexed so the first page would be 1
 * @param {Number} maxLabels - The maximum number of page numbers to show in the pagination component
 * @return {Array} - Array of page numbers to show in the pagination component.
 * @example getPaginationLabels(100, 50, 5) //returns [1, 49, 50, 51, 100]
 */
export const getPaginationLabels = (totalPages, curPage, maxLabels) => {
  if (totalPages === 0) {
    return [];
  }

  // If all pages fit within maxLabels, return all pages
  if (totalPages <= maxLabels) {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Start with first, current, and last pages
  const pages = new Set([1, curPage, totalPages]);

  // Calculate how many additional pages we can add
  const remainingSlots = maxLabels - pages.size;

  if (remainingSlots > 0) {
    // Try to center curPage by adding pages around it
    let leftCount = Math.floor(remainingSlots / 2);
    let rightCount = remainingSlots - leftCount;

    // Add pages to the left of curPage
    for (let i = 1; i <= leftCount; i++) {
      const page = curPage - i;
      if (page > 1) {
        pages.add(page);
      } else {
        // If we can't add more to the left, add to the right instead
        rightCount++;
      }
    }

    // Add pages to the right of curPage
    for (let i = 1; i <= rightCount; i++) {
      const page = curPage + i;
      if (page < totalPages) {
        pages.add(page);
      }
    }
  }

  // Convert set to sorted array
  return Array.from(pages).sort((a, b) => a - b);
};

/**
 * Get the properties to show for the specified page from the full list of properties
 * @param {Array}  properties - Array containing all properties
 * @param {Number} page - The current paginated page the UI should display
 * @return {Array} - The properties for the specified page
 */
export const getPropertiesForPage = (properties, page) => {
  const firstPropertyIndex = PROPERTIES_PER_PAGE * (page - 1);
  const lastPropertyIndex = PROPERTIES_PER_PAGE * page;
  return properties.slice(firstPropertyIndex, lastPropertyIndex);
};
