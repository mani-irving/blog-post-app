/**
 * Class representing a standard API success response
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (e.g., 200, 201)
   * @param {string} message - Description of the success
   * @param {any} data - Data to return in response
   */
  constructor(statusCode = 200, message = "Successful", data = null) {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;
