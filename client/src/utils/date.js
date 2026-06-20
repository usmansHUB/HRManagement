/**
 * Standardizes formatting of a date string or object to YYYY-MM-DD in UTC.
 * Prevents off-by-one errors when loading UTC midnight timestamps in local timezones.
 * @param {string|Date} dateInput 
 * @returns {string} Formatted date (YYYY-MM-DD) or '--'
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '--';
  try {
    const dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) return '--';
    
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return '--';
  }
};

/**
 * Formats a date into a reader-friendly format: DD MMM YYYY (e.g. 20 Jun 2026).
 * Uses UTC getters to prevent local client offset displacement.
 * @param {string|Date} dateInput 
 * @returns {string} Formatted date (DD MMM YYYY) or '--'
 */
export const formatLocalDate = (dateInput) => {
  if (!dateInput) return '--';
  try {
    const dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) return '--';
    
    const year = dateObj.getUTCFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[dateObj.getUTCMonth()];
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    return '--';
  }
};
