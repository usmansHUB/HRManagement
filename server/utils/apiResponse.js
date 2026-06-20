/**
 * Sends a standardized JSON API response
 * @param {Object} res Express response object
 * @param {number} statusCode HTTP Status Code
 * @param {boolean} success Operation success status
 * @param {string} message Description message
 * @param {any} data Response payload
 * @param {Object} pagination Pagination metadata
 */
const sendResponse = (res, statusCode, success, message, data = null, pagination = null) => {
  const payload = {
    success,
    message,
  };
  
  if (data !== null) {
    payload.data = data;
  }
  
  if (pagination !== null) {
    payload.pagination = pagination;
  }
  
  return res.status(statusCode).json(payload);
};

module.exports = sendResponse;
