/**
 * Base class for errors raised by the BandTools API example client.
 */
export class BandToolsError extends Error {
  constructor(message) {
    super(message);
    this.name = "BandToolsError";
  }
}

/**
 * Raised when the BandTools API returns a non-successful HTTP response.
 */
export class BandToolsApiError extends BandToolsError {
  constructor(statusCode, message, response = null) {
    super(`BandTools API error ${statusCode}: ${message}`);
    this.name = "BandToolsApiError";
    this.statusCode = statusCode;
    this.response = response;
    this.apiMessage = message;
  }
}

/**
 * Raised when the client cannot connect to the BandTools API.
 */
export class BandToolsConnectionError extends BandToolsError {
  constructor(message, cause = undefined) {
    super(message);
    this.name = "BandToolsConnectionError";
    this.cause = cause;
  }
}
