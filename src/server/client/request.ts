/**
 * @name AirtableRequestConfig
 * @kind Type
 * @summary Configuration object for Airtable HTTP requests containing authentication token and timeout settings.
 *
 * @description
 * Type definition for request configuration used by airtableRequest function.
 * Contains authentication token for Authorization header and timeout value for request cancellation.
 * Used internally by client methods to configure HTTP requests to Airtable API.
 * Token is included in Bearer authentication header for all requests.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Node.js >= 18 (for fetch API) or browser with fetch support
 * @requiresPermissions Valid Airtable API token
 * @requiresEnv Not specified
 * @requiresNetwork Internet required - used for HTTP requests
 *
 * @dependencies
 *
 * @performance
 * @complexity O(1) - type definition only
 * @latency Not applicable
 * @memory Not applicable
 * @rateLimit Not applicable
 * @notes Not applicable
 *
 * @security
 * @inputSanitization Not specified
 * @secretsHandling Token should be kept secret and never logged. Used in Authorization header.
 * @pii Not applicable
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @param {string} token - Airtable API personal access token or OAuth token. Required for authentication.
 * @param {number} timeoutMs - Request timeout in milliseconds. Request will be aborted if not completed within this time.
 *
 * @returns {Object} Object with required token and timeoutMs properties.
 *
 * @example
 * // Basic usage
 * const config: AirtableRequestConfig = {
 *   token: "pat123...",
 *   timeoutMs: 15000
 * };
 *
 * @remarks
 * Token is included in Authorization header as "Bearer {token}". Timeout uses AbortController for cancellation.
 *
 * @see airtableRequest
 */
export type AirtableRequestConfig = {
  token: string;
  timeoutMs: number;
};

/**
 * @name AirtableHttpError
 * @kind Class
 * @summary Base error class for Airtable API HTTP errors with status code, response details, and normalized error messages.
 *
 * @description
 * Error class extending native Error for representing HTTP errors from Airtable API requests.
 * Includes HTTP status code, status text, request URL, and optional response details.
 * Error message is normalized from Airtable error response format when available.
 * Thrown by airtableRequest when API returns non-2xx status codes or when requests timeout.
 * Provides structured error information for error handling and debugging.
 * Base class for specific error types (AirtableAuthError, AirtableNotFoundError, etc.).
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not specified
 *
 * @dependencies
 *
 * @performance
 * @complexity O(1) - simple error object creation
 * @latency Not applicable
 * @memory O(1) - stores error metadata
 * @rateLimit Not applicable
 * @notes Lightweight error class.
 *
 * @security
 * @inputSanitization Error messages are normalized from API responses. Details may contain API error structure.
 * @secretsHandling Details may contain API response data. Avoid logging full details in production.
 * @pii Details may contain PII if API error responses include record data
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {Object} args - Arguments object for constructing the error.
 * @param {number} args.status - HTTP status code from the API response (e.g., 400, 404, 500).
 * @param {string} args.statusText - HTTP status text from the response (e.g., "Bad Request", "Not Found").
 * @param {string} args.url - The URL that was requested when the error occurred.
 * @param {string} args.message - Normalized error message. May include Airtable error type and message if available.
 * @param {unknown} [args.details] - Optional parsed response body containing additional error details from Airtable API.
 *
 * @returns {AirtableHttpError} Error instance with status, statusText, url, message, and optional details properties.
 *
 * @example
 * // Basic usage (thrown by airtableRequest)
 * try {
 *   await airtableRequest({ url, method: "GET", config });
 * } catch (err) {
 *   if (err instanceof AirtableHttpError) {
 *     console.error(`API error ${err.status}: ${err.message}`);
 *     console.error(`URL: ${err.url}`);
 *   }
 * }
 *
 * @example
 * // Manual construction
 * throw new AirtableHttpError({
 *   status: 404,
 *   statusText: "Not Found",
 *   url: "https://api.airtable.com/v0/app123/Tasks/rec456",
 *   message: "NOT_FOUND: Record not found",
 *   details: { error: { type: "NOT_FOUND", message: "Record not found" } }
 * });
 *
 * @remarks
 * Error messages are normalized from Airtable API error format: "{type}: {message}" when available, otherwise "{status} {statusText}".
 * Status 408 is used for timeout errors. Details property contains the parsed API response body when available.
 * This is the base class; specific error types extend this for better error handling (e.g., AirtableAuthError, AirtableNotFoundError).
 *
 * @see airtableRequest
 * @see AirtableAuthError
 * @see AirtableNotFoundError
 * @see AirtableValidationError
 * @see AirtableRateLimitError
 * @see AirtableNetworkError
 */
export class AirtableHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly details?: unknown;

  constructor(args: { status: number; statusText: string; url: string; message: string; details?: unknown }) {
    super(args.message);
    this.name = "AirtableHttpError";
    this.status = args.status;
    this.statusText = args.statusText;
    this.url = args.url;
    this.details = args.details;
  }
}

/**
 * @name AirtableAuthError
 * @kind Class
 * @summary Specific error class for Airtable API authentication and authorization errors (401, 403).
 *
 * @description
 * Error class extending AirtableHttpError for representing authentication and authorization failures.
 * Thrown when API returns 401 (Unauthorized) or 403 (Forbidden) status codes.
 * Provides better developer experience by allowing specific error type checking.
 * Created automatically by toSpecificError function when status is 401 or 403.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not specified
 *
 * @dependencies
 * @requires AirtableHttpError Base error class
 *
 * @performance
 * @complexity O(1) - simple error object creation
 * @latency Not applicable
 * @memory O(1) - stores error metadata
 * @rateLimit Not applicable
 * @notes Lightweight error class.
 *
 * @security
 * @inputSanitization Error messages are normalized from API responses
 * @secretsHandling Details may contain API response data. Avoid logging full details in production.
 * @pii Details may contain PII if API error responses include record data
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {AirtableHttpError} base - Base AirtableHttpError instance to wrap. Must have status 401 or 403.
 *
 * @returns {AirtableAuthError} Error instance with status 401 or 403, inheriting all properties from base error.
 *
 * @example
 * // Basic usage (thrown by airtableRequest)
 * try {
 *   await airtableRequest({ url, method: "GET", config });
 * } catch (err) {
 *   if (err instanceof AirtableAuthError) {
 *     console.error("Authentication failed. Check your token.");
 *   }
 * }
 *
 * @remarks
 * This error type is provided for better developer experience (DX). Allows specific error handling for auth failures.
 * Created automatically by toSpecificError when status is 401 or 403.
 *
 * @see AirtableHttpError
 * @see toSpecificError
 */
export class AirtableAuthError extends AirtableHttpError {
  constructor(base: AirtableHttpError) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableAuthError";
  }
}

/**
 * @name AirtableRateLimitError
 * @kind Class
 * @summary Specific error class for Airtable API rate limit errors (429).
 *
 * @description
 * Error class extending AirtableHttpError for representing rate limit violations.
 * Thrown when API returns 429 (Too Many Requests) status code.
 * Provides better developer experience by allowing specific error type checking.
 * Created automatically by toSpecificError function when status is 429.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not specified
 *
 * @dependencies
 * @requires AirtableHttpError Base error class
 *
 * @performance
 * @complexity O(1) - simple error object creation
 * @latency Not applicable
 * @memory O(1) - stores error metadata
 * @rateLimit Not applicable
 * @notes Lightweight error class.
 *
 * @security
 * @inputSanitization Error messages are normalized from API responses
 * @secretsHandling Details may contain API response data. Avoid logging full details in production.
 * @pii Details may contain PII if API error responses include record data
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {AirtableHttpError} base - Base AirtableHttpError instance to wrap. Must have status 429.
 *
 * @returns {AirtableRateLimitError} Error instance with status 429, inheriting all properties from base error.
 *
 * @example
 * // Basic usage (thrown by airtableRequest)
 * try {
 *   await airtableRequest({ url, method: "GET", config });
 * } catch (err) {
 *   if (err instanceof AirtableRateLimitError) {
 *     console.error("Rate limit exceeded. Implement backoff strategy.");
 *   }
 * }
 *
 * @remarks
 * This error type is provided for better developer experience (DX). Allows specific error handling for rate limits.
 * Created automatically by toSpecificError when status is 429.
 *
 * @see AirtableHttpError
 * @see toSpecificError
 */
export class AirtableRateLimitError extends AirtableHttpError {
  constructor(base: AirtableHttpError) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableRateLimitError";
  }
}

/**
 * @name AirtableNotFoundError
 * @kind Class
 * @summary Specific error class for Airtable API not found errors (404).
 *
 * @description
 * Error class extending AirtableHttpError for representing resource not found errors.
 * Thrown when API returns 404 (Not Found) status code.
 * Provides better developer experience by allowing specific error type checking.
 * Created automatically by toSpecificError function when status is 404.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not specified
 *
 * @dependencies
 * @requires AirtableHttpError Base error class
 *
 * @performance
 * @complexity O(1) - simple error object creation
 * @latency Not applicable
 * @memory O(1) - stores error metadata
 * @rateLimit Not applicable
 * @notes Lightweight error class.
 *
 * @security
 * @inputSanitization Error messages are normalized from API responses
 * @secretsHandling Details may contain API response data. Avoid logging full details in production.
 * @pii Details may contain PII if API error responses include record data
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {AirtableHttpError} base - Base AirtableHttpError instance to wrap. Must have status 404.
 *
 * @returns {AirtableNotFoundError} Error instance with status 404, inheriting all properties from base error.
 *
 * @example
 * // Basic usage (thrown by airtableRequest)
 * try {
 *   await airtableRequest({ url, method: "GET", config });
 * } catch (err) {
 *   if (err instanceof AirtableNotFoundError) {
 *     console.error("Resource not found. Check table name or record ID.");
 *   }
 * }
 *
 * @remarks
 * This error type is provided for better developer experience (DX). Allows specific error handling for not found errors.
 * Created automatically by toSpecificError when status is 404.
 *
 * @see AirtableHttpError
 * @see toSpecificError
 */
export class AirtableNotFoundError extends AirtableHttpError {
  constructor(base: AirtableHttpError) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableNotFoundError";
  }
}

/**
 * @name AirtableValidationError
 * @kind Class
 * @summary Specific error class for Airtable API validation errors (422).
 *
 * @description
 * Error class extending AirtableHttpError for representing validation failures.
 * Thrown when API returns 422 (Unprocessable Entity) status code.
 * Typically indicates invalid field values or missing required fields.
 * Provides better developer experience by allowing specific error type checking.
 * Created automatically by toSpecificError function when status is 422.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not specified
 *
 * @dependencies
 * @requires AirtableHttpError Base error class
 *
 * @performance
 * @complexity O(1) - simple error object creation
 * @latency Not applicable
 * @memory O(1) - stores error metadata
 * @rateLimit Not applicable
 * @notes Lightweight error class.
 *
 * @security
 * @inputSanitization Error messages are normalized from API responses
 * @secretsHandling Details may contain API response data. Avoid logging full details in production.
 * @pii Details may contain PII if API error responses include record data
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {AirtableHttpError} base - Base AirtableHttpError instance to wrap. Must have status 422.
 *
 * @returns {AirtableValidationError} Error instance with status 422, inheriting all properties from base error.
 *
 * @example
 * // Basic usage (thrown by airtableRequest)
 * try {
 *   await airtableRequest({ url, method: "POST", config, body: { fields: {} } });
 * } catch (err) {
 *   if (err instanceof AirtableValidationError) {
 *     console.error("Validation failed. Check field values:", err.details);
 *   }
 * }
 *
 * @remarks
 * This error type is provided for better developer experience (DX). Allows specific error handling for validation failures.
 * Created automatically by toSpecificError when status is 422.
 *
 * @see AirtableHttpError
 * @see toSpecificError
 */
export class AirtableValidationError extends AirtableHttpError {
  constructor(base: AirtableHttpError) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableValidationError";
  }
}

/**
 * @name AirtableNetworkError
 * @kind Class
 * @summary Specific error class for network/transport failures (DNS, connection reset, etc.) during Airtable API requests.
 *
 * @description
 * Error class extending AirtableHttpError for representing network-level failures.
 * Thrown when fetch API encounters network errors (DNS failures, connection resets, timeouts, etc.).
 * Uses synthetic status code 503 (Service Unavailable) to normalize network errors with HTTP errors.
 * Provides better developer experience (DX) with specific error type for easier error handling and retry logic.
 * Created when fetch throws TypeError or other network-related exceptions.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Node.js >= 18 (for fetch API) or browser with fetch support
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Internet required - represents network failures
 *
 * @dependencies
 * @requires AirtableHttpError Base error class
 *
 * @performance
 * @complexity O(1) - simple error object creation
 * @latency Not applicable
 * @memory O(1) - stores error metadata
 * @rateLimit Not applicable
 * @notes Lightweight error class.
 *
 * @security
 * @inputSanitization Error messages are extracted from network error objects
 * @secretsHandling Details may contain network error information. Avoid logging full details in production.
 * @pii Not applicable
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {Object} args - Arguments object for constructing the error.
 * @param {string} args.url - The URL that was requested when the network error occurred.
 * @param {string} args.message - Error message describing the network failure.
 * @param {unknown} [args.details] - Optional network error details (e.g., original TypeError, fetch error).
 *
 * @returns {AirtableNetworkError} Error instance with name "AirtableNetworkError", status 503, and network error details.
 *
 * @example
 * // Error handling with retry logic
 * try {
 *   await client.listRecords("Tasks");
 * } catch (err) {
 *   if (err instanceof AirtableNetworkError) {
 *     // Implement retry logic for network failures
 *     console.error("Network error. Retrying...");
 *     await new Promise(resolve => setTimeout(resolve, 1000));
 *     return client.listRecords("Tasks");
 *   }
 * }
 *
 * @remarks
 * Created automatically by airtableRequest when fetch throws network errors (TypeError, etc.).
 * Uses synthetic status 503 to normalize network errors with HTTP errors for consistent error handling.
 * Consider implementing retry logic with exponential backoff for network errors.
 *
 * @see AirtableHttpError
 * @see airtableRequest
 */
export class AirtableNetworkError extends AirtableHttpError {
  constructor(args: { url: string; message: string; details?: unknown }) {
    super({ status: 503, statusText: "Network Error", url: args.url, message: args.message, details: args.details });
    this.name = "AirtableNetworkError";
  }
}

/**
 * @name safeJsonParse
 * @kind Function
 * @summary Safely parses JSON string, returning undefined on parse errors instead of throwing.
 *
 * @description
 * Internal utility function that attempts to parse a JSON string.
 * Returns the parsed object if successful, or undefined if parsing fails.
 * Used to handle API responses that may or may not be valid JSON.
 * Prevents crashes when API returns non-JSON content (e.g., plain text errors).
 *
 * @category Utility
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not applicable
 *
 * @dependencies
 *
 * @performance
 * @complexity O(n) where n is string length - JSON.parse complexity
 * @latency Not applicable - synchronous function
 * @memory O(n) - creates parsed object
 * @rateLimit Not applicable
 * @notes Lightweight wrapper around JSON.parse with error handling.
 *
 * @security
 * @inputSanitization No sanitization - trusts input string. Returns undefined for invalid JSON.
 * @secretsHandling Not applicable
 * @pii Parsed JSON may contain PII depending on content
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {string} text - JSON string to parse.
 *
 * @returns {unknown | undefined} Parsed JSON object if successful, undefined if parse fails.
 *
 * @example
 * // Basic usage
 * const parsed = safeJsonParse('{"key": "value"}');
 * // Returns: { key: "value" }
 *
 * @example
 * // Handles invalid JSON
 * const parsed = safeJsonParse('invalid json');
 * // Returns: undefined
 *
 * @remarks
 * Internal function used by airtableRequest. Does not throw errors, returns undefined on failure.
 *
 * @see airtableRequest
 */
function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * @name normalizeErrorMessage
 * @kind Function
 * @summary Normalizes error messages from Airtable API responses into readable format.
 *
 * @description
 * Internal utility function that extracts and formats error messages from Airtable API error responses.
 * Attempts to extract error type and message from Airtable error format: { error: { type, message } }.
 * Returns formatted string "{type}: {message}" if both available, "{message}" if only message available,
 * or "{status} {statusText}" as fallback. Used to create user-friendly error messages.
 *
 * @category Utility
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not applicable
 *
 * @dependencies
 *
 * @performance
 * @complexity O(1) - simple object property access
 * @latency Not applicable - synchronous function
 * @memory O(1) - creates single string result
 * @rateLimit Not applicable
 * @notes Lightweight string formatting function.
 *
 * @security
 * @inputSanitization No sanitization - formats error messages as-is from API
 * @secretsHandling Not applicable
 * @pii Error messages may contain field names or record identifiers
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {number} status - HTTP status code from the API response.
 * @param {string} statusText - HTTP status text from the response.
 * @param {unknown} [details] - Optional parsed response body that may contain Airtable error structure.
 *
 * @returns {string} Normalized error message string in format "{type}: {message}", "{message}", or "{status} {statusText}".
 *
 * @example
 * // Basic usage with Airtable error format
 * const msg = normalizeErrorMessage(400, "Bad Request", {
 *   error: { type: "INVALID_VALUE", message: "Field value is invalid" }
 * });
 * // Returns: "INVALID_VALUE: Field value is invalid"
 *
 * @example
 * // Fallback to status text
 * const msg = normalizeErrorMessage(404, "Not Found");
 * // Returns: "404 Not Found"
 *
 * @remarks
 * Internal function used by airtableRequest. Handles Airtable-specific error format but falls back gracefully.
 *
 * @see airtableRequest
 * @see AirtableHttpError
 */
function normalizeErrorMessage(status: number, statusText: string, details?: unknown): string {
  // Airtable often returns: { error: { type, message } }
  if (details && typeof details === "object") {
    const anyDetails = details as any;
    const msg = anyDetails?.error?.message;
    const typ = anyDetails?.error?.type;
    if (typeof msg === "string" && typeof typ === "string") return `${typ}: ${msg}`;
    if (typeof msg === "string") return msg;
  }
  return `${status} ${statusText}`.trim();
}

/**
 * @name toSpecificError
 * @kind Function
 * @summary Converts generic AirtableHttpError to specific error type based on HTTP status code.
 *
 * @description
 * Internal utility function that maps HTTP status codes to specific error classes for better developer experience.
 * Converts status codes: 401/403 -> AirtableAuthError, 404 -> AirtableNotFoundError,
 * 422 -> AirtableValidationError, 429 -> AirtableRateLimitError.
 * Returns the original error if no specific mapping exists.
 * Used by airtableRequest to provide type-safe error handling.
 *
 * @category Utility
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not applicable
 *
 * @dependencies
 * @requires AirtableHttpError Base error class
 * @requires AirtableAuthError, AirtableRateLimitError, AirtableNotFoundError, AirtableValidationError Specific error classes
 *
 * @performance
 * @complexity O(1) - simple conditional checks
 * @latency Not applicable - synchronous function
 * @memory O(1) - creates error instance
 * @rateLimit Not applicable
 * @notes Lightweight error mapping function.
 *
 * @security
 * @inputSanitization Not applicable - error object is passed through
 * @secretsHandling Not applicable
 * @pii Not applicable
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {AirtableHttpError} err - Base AirtableHttpError instance to convert.
 *
 * @returns {AirtableHttpError} Specific error instance (AirtableAuthError, AirtableRateLimitError, etc.) or original error if no mapping.
 *
 * @example
 * // Internal usage in airtableRequest
 * const baseErr = new AirtableHttpError({ status: 404, ... });
 * const specificErr = toSpecificError(baseErr);
 * // Returns: AirtableNotFoundError instance
 *
 * @remarks
 * Internal function used by airtableRequest. Provides better error types for type-safe error handling in catch blocks.
 *
 * @see airtableRequest
 * @see AirtableHttpError
 * @see AirtableAuthError
 * @see AirtableRateLimitError
 * @see AirtableNotFoundError
 * @see AirtableValidationError
 */
function toSpecificError(err: AirtableHttpError): AirtableHttpError {
  if (err.status === 401 || err.status === 403) return new AirtableAuthError(err);
  if (err.status === 404) return new AirtableNotFoundError(err);
  if (err.status === 422) return new AirtableValidationError(err);
  if (err.status === 429) return new AirtableRateLimitError(err);
  return err;
}

/**
 * @name airtableRequest
 * @kind AsyncFunction
 * @summary Makes HTTP requests to Airtable REST API with authentication, timeout handling, error normalization, and specific error types.
 *
 * @description
 * Async function that performs HTTP requests to Airtable REST API endpoints.
 * Handles authentication via Bearer token, request timeouts using AbortController,
 * JSON request/response parsing, and error normalization. Supports GET, POST, PATCH, and DELETE methods.
 * Automatically sets Content-Type header for requests with body. Parses JSON responses when content-type indicates JSON.
 * Throws specific error types (AirtableAuthError, AirtableRateLimitError, etc.) for better error handling.
 * Normalizes network errors to AirtableNetworkError. Returns parsed response data typed as TResponse.
 * Used internally by all client methods for API communication.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Node.js >= 18 (for fetch API) or browser with fetch support
 * @requiresPermissions Valid Airtable API token with appropriate permissions
 * @requiresEnv Not specified
 * @requiresNetwork Internet required - makes HTTP requests to Airtable API
 *
 * @dependencies
 * @requires safeJsonParse Internal function for safe JSON parsing
 * @requires normalizeErrorMessage Internal function for error message formatting
 * @requires toSpecificError Internal function for error type mapping
 *
 * @performance
 * @complexity O(1) - network-bound operation
 * @latency Network-bound: depends on API response time (typically 100-500ms, up to timeoutMs)
 * @memory O(1) - response data stored temporarily
 * @rateLimit Subject to Airtable API rate limits (typically 5 requests per second per base)
 * @notes Network-bound function. Timeout prevents hanging requests. Consider retry logic for production use.
 *
 * @security
 * @inputSanitization URL used directly in fetch. Body is JSON-stringified. Token included in Authorization header.
 * @secretsHandling Token included in Authorization header, never logged. Request details may be in error messages.
 * @pii Request/response may contain PII depending on table contents
 *
 * @compatibility
 * @supported Node.js 18+, modern browsers with fetch API
 * @notSupported Node.js < 18 without fetch polyfill
 *
 * @param {Object} args - Arguments object containing request configuration.
 * @param {string} args.url - Full URL for the Airtable API endpoint (including base URL, table path, and query params).
 * @param {"GET" | "POST" | "PATCH" | "DELETE"} args.method - HTTP method for the request.
 * @param {AirtableRequestConfig} args.config - Request configuration with token and timeoutMs.
 * @param {unknown} [args.body] - Optional request body. Will be JSON-stringified if provided. Omitted for GET requests.
 *
 * @returns {Promise<TResponse>} Promise resolving to parsed response data typed as TResponse. JSON if content-type is application/json, otherwise string.
 *
 * @throws {AirtableAuthError} When API returns 401 or 403 - authentication/authorization failure
 * @throws {AirtableNotFoundError} When API returns 404 - resource not found
 * @throws {AirtableValidationError} When API returns 422 - request validation failure
 * @throws {AirtableRateLimitError} When API returns 429 - rate limit exceeded
 * @throws {AirtableHttpError} When API returns other non-2xx status codes - generic HTTP error
 * @throws {AirtableHttpError} When request times out - status 408, message includes timeout duration
 * @throws {AirtableNetworkError} When network/transport failures occur - status 503, represents DNS/connection errors
 *
 * @example
 * // Basic usage - GET request
 * const response = await airtableRequest<AirtableListResponse>({
 *   url: "https://api.airtable.com/v0/app123/Tasks",
 *   method: "GET",
 *   config: { token: "pat...", timeoutMs: 15000 }
 * });
 *
 * @example
 * // Advanced usage - POST request with body
 * const record = await airtableRequest<AirtableRecord>({
 *   url: "https://api.airtable.com/v0/app123/Tasks",
 *   method: "POST",
 *   config: { token: "pat...", timeoutMs: 15000 },
 *   body: { fields: { Title: "New Task", Status: "Open" } }
 * });
 *
 * @example
 * // Error handling with specific error types
 * try {
 *   await airtableRequest({ url, method: "GET", config });
 * } catch (err) {
 *   if (err instanceof AirtableAuthError) {
 *     // Handle authentication error
 *   } else if (err instanceof AirtableRateLimitError) {
 *     // Implement retry with backoff
 *   } else if (err instanceof AirtableNetworkError) {
 *     // Handle network failure
 *   }
 * }
 *
 * @remarks
 * Request timeout is enforced using AbortController. Timeout errors are normalized to AirtableHttpError with status 408.
 * Response parsing: if content-type includes "application/json", attempts JSON parse; otherwise returns as string.
 * Error responses are parsed and normalized using Airtable error format when available.
 * Network errors (TypeError from fetch) are normalized to AirtableNetworkError with status 503.
 * Specific error types are automatically created based on HTTP status codes for better error handling.
 *
 * @see AirtableRequestConfig
 * @see AirtableHttpError
 * @see AirtableAuthError
 * @see AirtableRateLimitError
 * @see AirtableNotFoundError
 * @see AirtableValidationError
 * @see AirtableNetworkError
 */
export async function airtableRequest<TResponse>(args: {
  url: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  config: AirtableRequestConfig;
  body?: unknown;
}): Promise<TResponse> {
  const { url, method, config, body } = args;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") ?? "";
    const rawText = await res.text();
    const parsed = contentType.includes("application/json") ? safeJsonParse(rawText) : rawText;

    if (!res.ok) {
      const message = normalizeErrorMessage(res.status, res.statusText, parsed);
      const baseErr = new AirtableHttpError({
        status: res.status,
        statusText: res.statusText,
        url,
        message,
        details: parsed,
      });
      throw toSpecificError(baseErr);
    }

    return (parsed as TResponse) ?? (rawText as unknown as TResponse);
  } catch (err: any) {
    // Timeout / Abort normalization
    if (err?.name === "AbortError") {
      throw new AirtableHttpError({
        status: 408,
        statusText: "Request Timeout",
        url,
        message: `Request timed out after ${config.timeoutMs}ms`,
      });
    }

    // If it's already normalized, keep it
    if (err instanceof AirtableHttpError) {
      throw err;
    }

    // Normalize fetch/network errors (TypeError in many runtimes)
    const msg = typeof err?.message === "string" ? err.message : "Network request failed";
    throw new AirtableNetworkError({ url, message: msg, details: err });
  } finally {
    clearTimeout(timeout);
  }
}
