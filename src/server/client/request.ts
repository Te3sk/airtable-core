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
 * @summary Custom error class for Airtable API HTTP errors with status code, response details, and normalized error messages.
 *
 * @description
 * Error class extending native Error for representing HTTP errors from Airtable API requests.
 * Includes HTTP status code, status text, request URL, and optional response details.
 * Error message is normalized from Airtable error response format when available.
 * Thrown by airtableRequest when API returns non-2xx status codes or when requests timeout.
 * Provides structured error information for error handling and debugging.
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
 *
 * @see airtableRequest
 */
export class AirtableHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly details?: unknown;

  constructor(args: {
    status: number;
    statusText: string;
    url: string;
    message: string;
    details?: unknown;
  }) {
    super(args.message);
    this.name = "AirtableHttpError";
    this.status = args.status;
    this.statusText = args.statusText;
    this.url = args.url;
    this.details = args.details;
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
function normalizeErrorMessage(
  status: number,
  statusText: string,
  details?: unknown,
): string {
  // Airtable often returns: { error: { type, message } }
  if (details && typeof details === "object") {
    const anyDetails = details as any;
    const msg = anyDetails?.error?.message;
    const typ = anyDetails?.error?.type;
    if (typeof msg === "string" && typeof typ === "string")
      return `${typ}: ${msg}`;
    if (typeof msg === "string") return msg;
  }
  return `${status} ${statusText}`.trim();
}

/**
 * @name airtableRequest
 * @kind AsyncFunction
 * @summary Makes HTTP requests to Airtable REST API with authentication, timeout handling, and error normalization.
 *
 * @description
 * Async function that performs HTTP requests to Airtable REST API endpoints.
 * Handles authentication via Bearer token, request timeouts using AbortController,
 * JSON request/response parsing, and error normalization. Supports GET, POST, PATCH, and DELETE methods.
 * Automatically sets Content-Type header for requests with body. Parses JSON responses when content-type indicates JSON.
 * Throws AirtableHttpError for non-2xx responses or timeouts. Returns parsed response data typed as TResponse.
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
 * @throws {AirtableHttpError} When API returns non-2xx status code - includes status, statusText, url, message, and details
 * @throws {AirtableHttpError} When request times out - status 408, message includes timeout duration
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
 * @remarks
 * Request timeout is enforced using AbortController. Timeout errors are normalized to AirtableHttpError with status 408.
 * Response parsing: if content-type includes "application/json", attempts JSON parse; otherwise returns as string.
 * Error responses are parsed and normalized using Airtable error format when available.
 *
 * @see AirtableRequestConfig
 * @see AirtableHttpError
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
    const parsed = contentType.includes("application/json")
      ? safeJsonParse(rawText)
      : rawText;

    if (!res.ok) {
      const message = normalizeErrorMessage(res.status, res.statusText, parsed);
      throw new AirtableHttpError({
        status: res.status,
        statusText: res.statusText,
        url,
        message,
        details: parsed,
      });
    }

    // Successful response: if JSON -> return JSON, else return as string
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
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
