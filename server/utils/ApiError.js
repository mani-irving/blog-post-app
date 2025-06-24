/**
 * @class ApiError
 * @extends Error
 *
 * Custom error class to standardize error responses in APIs.
 * Adds HTTP status code, success flag, and optional error details.
 */

class ApiError extends Error {
  /**
   * Creates a new ApiError instance.
   *
   * @param {number} statusCode - HTTP status code (e.g., 400, 404, 500)
   * @param {string} message - Error message to show in the response
   * @param {Array} errors - Optional array of additional error details (e.g., validation errors)
   */

  constructor(statusCode = 500, message = "Something went wrong", errors = []) {
    super(message); // Pass message to built-in Error constructor

    this.statusCode = statusCode; // Used for setting HTTP response status
    this.success = false; // Always false for errors in API
    this.errors = errors; // Optional extra info like validation errors

    // Captures stack trace (helps in debugging by excluding constructor stack)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
