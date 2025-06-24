/**
 * @function asyncHandler
 * @description Wraps an asynchronous route handler and catches any unhandled promise rejections,
 * automatically forwarding them to Express's error-handling middleware via `next()`.
 *
 * This helps avoid repetitive try-catch blocks in each async route.
 *
 * @param {Function} fn - The asynchronous route handler function (req, res, next) => Promise
 * @returns {Function} A middleware function compatible with Express, which handles errors gracefully.
 */

const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Ensure that if fn throws an error or a rejected promise, it's caught and passed to next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
