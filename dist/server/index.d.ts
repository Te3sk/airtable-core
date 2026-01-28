import { AirtableFields, AirtableListParams, AirtableListResponse, AirtableRecord, LeadFields, Lead } from '../core/index.js';

/**
 * @name AirtableClientConfig
 * @kind Type
 * @summary Configuration object for creating an Airtable client with authentication and API settings.
 *
 * @description
 * Type definition for configuration options required to create an Airtable client instance.
 * Contains authentication token, base ID, and optional API URL and timeout settings.
 * Used by createAirtableClient to initialize a client with proper credentials and behavior.
 * All HTTP requests made by the client will use these settings.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Node.js >= 18 (for fetch API) or browser with fetch support
 * @requiresPermissions Valid Airtable API token with appropriate base access
 * @requiresEnv Not specified
 * @requiresNetwork Internet required - makes HTTP requests to Airtable API
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
 * @inputSanitization Token and baseId are used directly in HTTP requests
 * @secretsHandling Token should be kept secret and never logged. Stored in config object.
 * @pii Not applicable
 *
 * @compatibility
 * @supported Node.js 18+, modern browsers with fetch API
 * @notSupported Node.js < 18 without fetch polyfill
 *
 * @param {string} token - Airtable API personal access token or OAuth token. Required for authentication.
 * @param {string} baseId - Airtable base identifier. Required to target the correct base.
 * @param {string} [apiUrl] - Base URL for Airtable API. Defaults to "https://api.airtable.com/v0" if omitted.
 * @param {number} [timeoutMs] - Request timeout in milliseconds. Defaults to 15000ms (15 seconds) if omitted.
 *
 * @returns {Object} Object with required token and baseId, and optional apiUrl and timeoutMs properties.
 *
 * @example
 * // Basic usage
 * const config: AirtableClientConfig = {
 *   token: "pat123...",
 *   baseId: "app123..."
 * };
 *
 * @example
 * // Advanced usage with custom settings
 * const config: AirtableClientConfig = {
 *   token: process.env.AIRTABLE_TOKEN!,
 *   baseId: process.env.AIRTABLE_BASE_ID!,
 *   apiUrl: "https://api.airtable.com/v0",
 *   timeoutMs: 30000
 * };
 *
 * @remarks
 * The token must have appropriate permissions for the base. Keep tokens secure and never commit them to version control.
 *
 * @see createAirtableClient
 */
type AirtableClientConfig = {
    token: string;
    baseId: string;
    /**
     * Defaults to https://api.airtable.com/v0
     */
    apiUrl?: string;
    /**
     * Defaults to 15000ms
     */
    timeoutMs?: number;
};
/**
 * @name AirtableClient
 * @kind Type
 * @summary Interface type defining methods for interacting with Airtable REST API (list, get, create, update, delete records).
 *
 * @description
 * Type definition representing an Airtable client instance with methods for CRUD operations.
 * Provides type-safe methods for listing, retrieving, creating, updating, and deleting records.
 * Includes listRecords and listPage methods (listPage is an alias for listRecords for semantic clarity).
 * All methods are generic over TFields to allow consumers to specify field shapes.
 * Returned by createAirtableClient after initialization with valid configuration.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Node.js >= 18 (for fetch API) or browser with fetch support
 * @requiresPermissions Valid Airtable API token with appropriate base and table access
 * @requiresEnv Not specified
 * @requiresNetwork Internet required - makes HTTP requests to Airtable API
 *
 * @dependencies
 * @requires ./request airtableRequest function for HTTP requests
 * @requires ./endpoints URL building utilities
 * @requires ../../core/types/airtable AirtableCreatePayload and AirtableUpdatePayload types for request bodies
 *
 * @performance
 * @complexity O(1) - type definition only
 * @latency Network-bound: depends on Airtable API response times (typically 100-500ms)
 * @memory Not applicable
 * @rateLimit Subject to Airtable API rate limits (typically 5 requests per second per base)
 * @notes All operations are network-bound. Consider batching and caching strategies for high-volume usage.
 *
 * @security
 * @inputSanitization Table names and record IDs are URL-encoded. Field values are JSON-stringified.
 * @secretsHandling Token is included in Authorization header, never logged
 * @pii May handle PII depending on table field contents
 *
 * @compatibility
 * @supported Node.js 18+, modern browsers with fetch API
 * @notSupported Node.js < 18 without fetch polyfill
 *
 * @returns {Object} Object with methods: listRecords, listPage, getRecord, createRecord, updateRecord, deleteRecord.
 *
 * @example
 * // Basic usage
 * const client = createAirtableClient({ token: "pat...", baseId: "app..." });
 * const records = await client.listRecords("Tasks");
 *
 * @example
 * // Using listPage alias (same as listRecords)
 * const page = await client.listPage("Tasks", { pageSize: 50 });
 *
 * @example
 * // Advanced usage with typed fields
 * type TaskFields = { Title: string; Status: string };
 * const record = await client.getRecord<TaskFields>("Tasks", "rec123");
 *
 * @remarks
 * All methods return Promises and should be awaited. Methods are generic over TFields for type safety.
 * listPage is an alias for listRecords, provided for semantic clarity when fetching paginated results.
 * createRecord and updateRecord use AirtableCreatePayload and AirtableUpdatePayload types respectively.
 *
 * @see createAirtableClient
 * @see AirtableClientConfig
 */
type AirtableClient = {
    readonly baseId: string;
    readonly apiUrl: string;
    listRecords: <TFields extends AirtableFields = AirtableFields>(tableName: string, params?: AirtableListParams) => Promise<AirtableListResponse<TFields>>;
    listPage: <TFields extends AirtableFields = AirtableFields>(tableName: string, params?: AirtableListParams) => Promise<AirtableListResponse<TFields>>;
    getRecord: <TFields extends AirtableFields = AirtableFields>(tableName: string, recordId: string) => Promise<AirtableRecord<TFields>>;
    createRecord: <TFields extends AirtableFields = AirtableFields>(tableName: string, fields: Partial<TFields>) => Promise<AirtableRecord<TFields>>;
    updateRecord: <TFields extends AirtableFields = AirtableFields>(tableName: string, recordId: string, fields: Partial<TFields>) => Promise<AirtableRecord<TFields>>;
    deleteRecord: (tableName: string, recordId: string) => Promise<{
        id: string;
        deleted: boolean;
    }>;
    /**
     * Makes a custom request to the Airtable API. Used internally for endpoints not covered by standard methods.
     * @internal
     */
    _request: <TResponse = unknown>(url: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: unknown) => Promise<TResponse>;
};
/**
 * @name createAirtableClient
 * @kind Function
 * @summary Creates and returns an Airtable client instance configured with provided settings for API interactions.
 *
 * @description
 * Factory function that creates an AirtableClient instance with methods for interacting with Airtable REST API.
 * Validates required configuration (token and baseId), sets defaults for optional settings (apiUrl, timeoutMs),
 * and initializes internal request configuration. Returns an object with CRUD methods for records.
 * All methods use the configured token and base ID for authentication and routing.
 * Creates listRecords and listPage methods (listPage is an alias for listRecords).
 * Uses AirtableCreatePayload and AirtableUpdatePayload types for request body validation.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Node.js >= 18 (for fetch API) or browser with fetch support
 * @requiresPermissions Valid Airtable API token with appropriate base access
 * @requiresEnv Not specified
 * @requiresNetwork Internet required - client makes HTTP requests to Airtable API
 *
 * @dependencies
 * @requires ./request airtableRequest function for HTTP requests
 * @requires ./endpoints URL building utilities (buildBaseUrl, buildTablePath, buildRecordPath, buildListQuery)
 * @requires ../../core/types/airtable AirtableCreatePayload and AirtableUpdatePayload types for request bodies
 *
 * @performance
 * @complexity O(1) - lightweight factory function, no heavy computation
 * @latency Not applicable - synchronous function
 * @memory O(1) - creates client object with method closures
 * @rateLimit Not applicable
 * @notes Function execution is lightweight. Network operations happen when client methods are called.
 *
 * @security
 * @inputSanitization Validates token and baseId are provided (throws if missing). Values used directly in requests.
 * @secretsHandling Token stored in closure, never logged. Passed to airtableRequest in Authorization header.
 * @pii Not applicable
 *
 * @compatibility
 * @supported Node.js 18+, modern browsers with fetch API
 * @notSupported Node.js < 18 without fetch polyfill
 *
 * @param {AirtableClientConfig} config - Configuration object with token, baseId, and optional apiUrl and timeoutMs.
 *
 * @returns {AirtableClient} Client instance with methods: listRecords, listPage, getRecord, createRecord, updateRecord, deleteRecord.
 *
 * @throws {Error} When token is missing or empty - message: "createAirtableClient: `token` is required"
 * @throws {Error} When baseId is missing or empty - message: "createAirtableClient: `baseId` is required"
 *
 * @example
 * // Basic usage
 * const client = createAirtableClient({
 *   token: "pat123...",
 *   baseId: "app456..."
 * });
 * const records = await client.listRecords("Tasks");
 *
 * @example
 * // Using listPage alias
 * const page = await client.listPage("Tasks", { pageSize: 50, offset: "itr123" });
 *
 * @example
 * // Advanced usage with custom settings
 * const client = createAirtableClient({
 *   token: process.env.AIRTABLE_TOKEN!,
 *   baseId: process.env.AIRTABLE_BASE_ID!,
 *   apiUrl: "https://api.airtable.com/v0",
 *   timeoutMs: 30000
 * });
 * const record = await client.getRecord("Users", "rec789");
 *
 * @remarks
 * The client instance maintains configuration in closures. Token and baseId are validated at creation time.
 * All client methods are async and return Promises. Network errors are thrown as AirtableHttpError.
 * listPage is an alias for listRecords, provided for semantic clarity when working with pagination.
 * createRecord and updateRecord use type assertions with AirtableCreatePayload and AirtableUpdatePayload respectively.
 *
 * @see AirtableClientConfig
 * @see AirtableClient
 */
declare function createAirtableClient(config: AirtableClientConfig): AirtableClient;

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
type AirtableRequestConfig = {
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
declare class AirtableHttpError extends Error {
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
    });
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
declare class AirtableAuthError extends AirtableHttpError {
    constructor(base: AirtableHttpError);
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
declare class AirtableRateLimitError extends AirtableHttpError {
    constructor(base: AirtableHttpError);
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
declare class AirtableNotFoundError extends AirtableHttpError {
    constructor(base: AirtableHttpError);
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
declare class AirtableValidationError extends AirtableHttpError {
    constructor(base: AirtableHttpError);
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
declare class AirtableNetworkError extends AirtableHttpError {
    constructor(args: {
        url: string;
        message: string;
        details?: unknown;
    });
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
declare function airtableRequest<TResponse>(args: {
    url: string;
    method: "GET" | "POST" | "PATCH" | "DELETE";
    config: AirtableRequestConfig;
    body?: unknown;
}): Promise<TResponse>;

/**
 * @name AirtableListAllOptions
 * @kind Type
 * @summary Configuration options for auto-pagination when fetching all records from a table.
 *
 * @description
 * Type definition for options controlling the behavior of listAllRecords function.
 * Provides safety limits to prevent accidental retrieval of extremely large datasets.
 * Used to configure maximum record limits and prevent infinite loops or memory issues.
 * All fields are optional with sensible defaults.
 *
 * @category Data
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
 * @complexity O(1) - type definition only
 * @latency Not applicable
 * @memory Not applicable
 * @rateLimit Not applicable
 * @notes Not applicable
 *
 * @security
 * @inputSanitization Not specified
 * @secretsHandling Not applicable
 * @pii Not applicable
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @param {number} [maxTotalRecords] - Maximum total records to fetch across all pages. Defaults to 10000 if omitted. Prevents accidental huge pulls.
 *
 * @returns {Object} Object with optional maxTotalRecords property.
 *
 * @example
 * // Basic usage with default limit
 * const options: AirtableListAllOptions = {};
 *
 * @example
 * // Advanced usage with custom limit
 * const options: AirtableListAllOptions = {
 *   maxTotalRecords: 5000
 * };
 *
 * @remarks
 * The maxTotalRecords limit is a safety mechanism. If exceeded, listAllRecords throws an error suggesting to add filters.
 *
 * @see listAllRecords
 */
type AirtableListAllOptions = {
    /**
     * Safety cap to prevent accidental infinite loops / huge pulls.
     * Defaults to 10_000.
     */
    maxTotalRecords?: number;
};
/**
 * @name listAllRecords
 * @kind AsyncFunction
 * @summary Fetches all records from an Airtable table by automatically following pagination offsets until all records are retrieved.
 *
 * @description
 * Async function that retrieves all records from a table by automatically paginating through Airtable API responses.
 * Makes repeated calls to client.listRecords, following the offset token from each response until no more pages remain.
 * Accumulates all records into a single array and returns them. Includes safety limit to prevent accidental huge pulls.
 * Respects filterByFormula and view parameters to reduce payload size. Generic over TFields for type safety.
 * Throws error if maxTotalRecords limit is exceeded, suggesting to add filters.
 *
 * @category Data
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Node.js >= 18 (for fetch API) or browser with fetch support
 * @requiresPermissions Valid Airtable API token with appropriate table access
 * @requiresEnv Not specified
 * @requiresNetwork Internet required - makes multiple HTTP requests to Airtable API
 *
 * @dependencies
 * @requires ./createClient AirtableClient type and instance
 * @requires ../../core/types/airtable AirtableFields, AirtableListParams, AirtableListResponse, AirtableRecord types
 *
 * @performance
 * @complexity O(n/p) where n is total records and p is page size - makes n/p API calls
 * @latency Network-bound: depends on number of pages and API response times (typically 100-500ms per page)
 * @memory O(n) - accumulates all records in memory array
 * @rateLimit Subject to Airtable API rate limits (typically 5 requests per second per base). Multiple pages = multiple requests.
 * @notes For large tables, consider using filters to reduce payload. Each page requires a separate API call.
 *
 * @security
 * @inputSanitization tableName and params passed through to client.listRecords which handles encoding
 * @secretsHandling Token handled by client, never logged
 * @pii May return PII depending on table field contents
 *
 * @compatibility
 * @supported Node.js 18+, modern browsers with fetch API
 * @notSupported Node.js < 18 without fetch polyfill
 *
 * @param {Object} args - Arguments object containing client, tableName, params, and options.
 * @param {AirtableClient} args.client - Airtable client instance for making API requests.
 * @param {string} args.tableName - Name of the Airtable table to fetch records from.
 * @param {Omit<AirtableListParams, "offset">} [args.params] - Query parameters (offset is excluded as it's managed internally). Use filterByFormula or view to reduce payload.
 * @param {AirtableListAllOptions} [args.options] - Options for controlling pagination behavior. Defaults to maxTotalRecords: 10000.
 *
 * @returns {Promise<Array<AirtableRecord<TFields>>>} Promise resolving to array of all records from the table.
 *
 * @throws {Error} When maxTotalRecords limit is exceeded - message includes limit value and suggests adding filters
 *
 * @example
 * // Basic usage
 * const allRecords = await listAllRecords({
 *   client,
 *   tableName: "Tasks"
 * });
 *
 * @example
 * // Advanced usage with filters and custom limit
 * const openTasks = await listAllRecords({
 *   client,
 *   tableName: "Tasks",
 *   params: {
 *     filterByFormula: "{Status}='Open'",
 *     sort: [{ field: "Created", direction: "desc" }]
 *   },
 *   options: { maxTotalRecords: 5000 }
 * });
 *
 * @remarks
 * Airtable may enforce its own max limits depending on plan. Use filterByFormula and view to reduce payload.
 * This function makes multiple API calls (one per page), so be mindful of rate limits for large tables.
 *
 * @see AirtableClient
 * @see AirtableListAllOptions
 * @see AirtableListParams
 */
declare function listAllRecords<TFields extends AirtableFields = AirtableFields>(args: {
    client: AirtableClient;
    tableName: string;
    params?: Omit<AirtableListParams, "offset">;
    options?: AirtableListAllOptions;
}): Promise<Array<AirtableRecord<TFields>>>;

/**
 * @name DEFAULT_AIRTABLE_API_URL
 * @kind Module
 * @summary Default base URL constant for Airtable REST API v0 endpoint.
 *
 * @description
 * Constant string representing the default base URL for Airtable REST API v0.
 * Used as fallback when apiUrl is not provided in AirtableClientConfig.
 * Points to the official Airtable API endpoint for version 0.
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
 * @complexity O(1) - constant value
 * @latency Not applicable
 * @memory Not applicable
 * @rateLimit Not applicable
 * @notes Not applicable
 *
 * @security
 * @inputSanitization Not applicable
 * @secretsHandling Not applicable
 * @pii Not applicable
 *
 * @compatibility
 * @supported All environments
 * @notSupported None
 *
 * @example
 * // Basic usage
 * const apiUrl = config.apiUrl ?? DEFAULT_AIRTABLE_API_URL;
 *
 * @remarks
 * Value: "https://api.airtable.com/v0". Can be overridden in client configuration for custom endpoints or testing.
 *
 * @see AirtableClientConfig
 */
declare const DEFAULT_AIRTABLE_API_URL = "https://api.airtable.com/v0";
/**
 * @name buildBaseUrl
 * @kind Function
 * @summary Constructs the base URL for Airtable API requests by combining API URL with base ID.
 *
 * @description
 * Utility function that builds the base URL for Airtable API requests.
 * Removes trailing slashes from apiUrl, then appends the URL-encoded baseId.
 * Result is used as the base path for all table and record endpoint URLs.
 * Ensures proper URL formatting and encoding for safe HTTP requests.
 *
 * @category Utility
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not applicable - pure string manipulation
 *
 * @dependencies
 *
 * @performance
 * @complexity O(1) - simple string operations
 * @latency Not applicable - synchronous function
 * @memory O(1) - creates single string result
 * @rateLimit Not applicable
 * @notes Lightweight string manipulation function.
 *
 * @security
 * @inputSanitization baseId is URL-encoded using encodeURIComponent to prevent injection
 * @secretsHandling Not applicable
 * @pii Not applicable
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {string} apiUrl - Base API URL (e.g., "https://api.airtable.com/v0"). Trailing slashes are removed.
 * @param {string} baseId - Airtable base identifier. Will be URL-encoded in the result.
 *
 * @returns {string} Combined URL string: "{trimmedApiUrl}/{encodedBaseId}".
 *
 * @example
 * // Basic usage
 * const baseUrl = buildBaseUrl("https://api.airtable.com/v0", "app123abc");
 * // Returns: "https://api.airtable.com/v0/app123abc"
 *
 * @example
 * // Handles trailing slashes
 * const baseUrl = buildBaseUrl("https://api.airtable.com/v0/", "app123abc");
 * // Returns: "https://api.airtable.com/v0/app123abc"
 *
 * @remarks
 * The baseId is URL-encoded to handle special characters safely. Trailing slashes in apiUrl are normalized.
 *
 * @see buildTablePath
 * @see buildRecordPath
 */
declare function buildBaseUrl(apiUrl: string, baseId: string): string;
/**
 * @name buildTablePath
 * @kind Function
 * @summary Constructs the URL path segment for a table endpoint by encoding the table name.
 *
 * @description
 * Utility function that builds the URL path segment for table-level operations.
 * Takes a table name and returns a path string with URL-encoded table name.
 * Used to construct endpoints for list and create operations on tables.
 * Table name is URL-encoded for safety, even though Airtable may accept raw names.
 *
 * @category Utility
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not applicable - pure string manipulation
 *
 * @dependencies
 *
 * @performance
 * @complexity O(1) - simple string operations
 * @latency Not applicable - synchronous function
 * @memory O(1) - creates single string result
 * @rateLimit Not applicable
 * @notes Lightweight string manipulation function.
 *
 * @security
 * @inputSanitization tableName is URL-encoded using encodeURIComponent to prevent injection
 * @secretsHandling Not applicable
 * @pii Not applicable
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {string} tableName - Name of the Airtable table. Will be URL-encoded in the result.
 *
 * @returns {string} Path string: "/{encodedTableName}".
 *
 * @example
 * // Basic usage
 * const path = buildTablePath("Tasks");
 * // Returns: "/Tasks"
 *
 * @example
 * // Handles special characters
 * const path = buildTablePath("My Table");
 * // Returns: "/My%20Table"
 *
 * @remarks
 * Table name is URL-encoded for safety. Result is a path segment, not a full URL. Combine with baseUrl for complete endpoint.
 *
 * @see buildBaseUrl
 * @see buildRecordPath
 */
declare function buildTablePath(tableName: string): string;
/**
 * @name buildRecordPath
 * @kind Function
 * @summary Constructs the URL path segment for a record endpoint by combining table name and record ID.
 *
 * @description
 * Utility function that builds the URL path segment for record-level operations (get, update, delete).
 * Combines table path with URL-encoded record ID to create the full record endpoint path.
 * Used to construct endpoints for operations on specific records within a table.
 * Both table name and record ID are URL-encoded for safety.
 *
 * @category Utility
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not applicable - pure string manipulation
 *
 * @dependencies
 * @requires buildTablePath Function to build table path segment
 *
 * @performance
 * @complexity O(1) - simple string operations
 * @latency Not applicable - synchronous function
 * @memory O(1) - creates single string result
 * @rateLimit Not applicable
 * @notes Lightweight string manipulation function.
 *
 * @security
 * @inputSanitization Both tableName and recordId are URL-encoded using encodeURIComponent to prevent injection
 * @secretsHandling Not applicable
 * @pii Not applicable
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments
 * @notSupported None
 *
 * @param {string} tableName - Name of the Airtable table. Will be URL-encoded.
 * @param {string} recordId - Airtable record identifier. Will be URL-encoded in the result.
 *
 * @returns {string} Path string: "/{encodedTableName}/{encodedRecordId}".
 *
 * @example
 * // Basic usage
 * const path = buildRecordPath("Tasks", "rec123abc");
 * // Returns: "/Tasks/rec123abc"
 *
 * @example
 * // Used in client methods
 * const url = `${baseUrl}${buildRecordPath("Users", recordId)}`;
 *
 * @remarks
 * Both parameters are URL-encoded for safety. Result is a path segment, not a full URL. Combine with baseUrl for complete endpoint.
 *
 * @see buildBaseUrl
 * @see buildTablePath
 */
declare function buildRecordPath(tableName: string, recordId: string): string;
/**
 * @name buildListQuery
 * @kind Function
 * @summary Constructs URL query string from AirtableListParams for list endpoint requests.
 *
 * @description
 * Utility function that converts AirtableListParams object into a URL query string.
 * Handles all supported list parameters: view, filterByFormula, maxRecords, pageSize, offset, and sort.
 * For sort parameters, builds array-style query params (sort[0][field], sort[0][direction], etc.).
 * Returns empty string if no params provided, or query string prefixed with "?" if params exist.
 * Used to append query parameters to list endpoint URLs.
 *
 * @category Utility
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Not specified
 * @requiresPermissions Not specified
 * @requiresEnv Not specified
 * @requiresNetwork Not applicable - pure string manipulation
 *
 * @dependencies
 * @requires ../../core/types/airtable AirtableListParams type definition
 *
 * @performance
 * @complexity O(n) where n is number of sort items - iterates through sort array
 * @latency Not applicable - synchronous function
 * @memory O(1) - creates single string result
 * @rateLimit Not applicable
 * @notes Lightweight function. Complexity is linear with number of sort parameters.
 *
 * @security
 * @inputSanitization All values are added to URLSearchParams which handles encoding automatically
 * @secretsHandling Not applicable
 * @pii filterByFormula may contain field references that could expose PII in query string
 *
 * @compatibility
 * @supported All JavaScript/TypeScript environments with URLSearchParams
 * @notSupported None
 *
 * @param {AirtableListParams} [params] - Optional query parameters object. If omitted, returns empty string.
 *
 * @returns {string} Empty string if no params, or query string prefixed with "?" (e.g., "?view=Active&maxRecords=50").
 *
 * @example
 * // Basic usage
 * const query = buildListQuery({ view: "Active", maxRecords: 50 });
 * // Returns: "?view=Active&maxRecords=50"
 *
 * @example
 * // Advanced usage with sorting
 * const query = buildListQuery({
 *   filterByFormula: "{Status}='Open'",
 *   sort: [
 *     { field: "Created", direction: "desc" },
 *     { field: "Priority", direction: "asc" }
 *   ]
 * });
 * // Returns: "?filterByFormula={Status}='Open'&sort[0][field]=Created&sort[0][direction]=desc&sort[1][field]=Priority&sort[1][direction]=asc"
 *
 * @remarks
 * URLSearchParams automatically handles encoding of special characters. Sort parameters use array notation for multi-level sorting.
 *
 * @see AirtableListParams
 * @see buildTablePath
 */
declare function buildListQuery(params?: AirtableListParams): string;

/**
 * @name AirtableAttachment
 * @kind Type
 * @summary Type definition for Airtable attachment objects.
 *
 * @description
 * Type definition representing an attachment object in Airtable attachment fields.
 * Supports both public URLs and local file paths. For URLs, attachments are stored as arrays
 * of objects with url, filename, size, and type properties. For local files, the filePath
 * is used to read and upload the file via Airtable's uploadAttachment endpoint.
 * Used when adding attachments to records via the API.
 *
 * @category Data
 * @since Not specified
 *
 * @param {string} [url] - Public URL of the attachment file. Must be directly downloadable. Required if filePath is not provided.
 * @param {string} [filePath] - Local file path to upload. File will be read from filesystem and uploaded as base64. Required if url is not provided. Only works in Node.js environment.
 * @param {string} [filename] - Optional filename for the attachment. If not provided and filePath is used, extracted from filePath.
 * @param {number} [size] - Optional file size in bytes.
 * @param {string} [type] - Optional MIME type of the file (e.g., "application/pdf", "image/png"). If not provided, inferred from file extension.
 *
 * @example
 * // Basic usage with URL
 * const attachment: AirtableAttachment = {
 *   url: "https://example.com/document.pdf",
 *   filename: "document.pdf",
 *   type: "application/pdf"
 * };
 *
 * @example
 * // Usage with local file (Node.js only)
 * const attachment: AirtableAttachment = {
 *   filePath: "/path/to/local/document.pdf",
 *   filename: "document.pdf",
 *   type: "application/pdf"
 * };
 *
 * @remarks
 * Either url or filePath must be provided. The URL must be publicly accessible and directly downloadable.
 * For local files, Airtable will upload the file via the uploadAttachment endpoint (max 5MB).
 * For PDFs, use type: "application/pdf". For images, use appropriate image MIME types.
 * If type is not provided and filePath is used, it will be inferred from the file extension.
 */
type AirtableAttachment = {
    url?: string;
    filePath?: string;
    filename?: string;
    size?: number;
    type?: string;
};
/**
 * @name addAttachmentToRecord
 * @kind AsyncFunction
 * @summary Adds an attachment to a specific field of an Airtable record without overwriting existing attachments.
 *
 * @description
 * Helper function that adds a new attachment to an attachment field in an Airtable record.
 * Supports both public URLs and local file paths. For URLs, retrieves the current record,
 * appends the new attachment to the existing attachments array, and updates the record.
 * For local files, uses Airtable's uploadAttachment endpoint to upload the file directly.
 * Preserves all existing attachments when using URLs. Local file uploads are handled automatically by Airtable.
 * Useful for adding PDFs, images, or other files to attachment fields programmatically.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Node.js >= 18 (for fetch API and fs module for local files) or browser with fetch support (URLs only)
 * @requiresPermissions Valid Airtable API token with write access to the table
 * @requiresEnv Not specified
 * @requiresNetwork Internet required - makes HTTP requests to Airtable API
 * @requiresFilesystem For local file uploads, requires Node.js filesystem access
 *
 * @dependencies
 * @requires ./createClient AirtableClient type
 * @requires ../../core/types/airtable AirtableFields type
 *
 * @performance
 * @complexity O(1) - makes 2 API calls (GET + PATCH)
 * @latency Network-bound: ~200-1000ms (depends on API response times)
 * @memory O(1) - stores record data temporarily
 * @rateLimit Subject to Airtable API rate limits (typically 5 requests per second per base)
 * @notes Makes two API calls: one to fetch the current record, one to update it.
 *
 * @security
 * @inputSanitization Field name and record ID are used directly in API requests (URL-encoded by client)
 * @secretsHandling Uses client's token for authentication
 * @pii May handle PII if attachment URLs or filenames contain sensitive information
 *
 * @compatibility
 * @supported Node.js 18+ (URLs and local files), modern browsers with fetch API (URLs only)
 * @notSupported Node.js < 18 without fetch polyfill. Local file uploads not supported in browser environment.
 *
 * @param {Object} args - Arguments object for adding the attachment.
 * @param {AirtableClient} args.client - Airtable client instance with authentication configured.
 * @param {string} args.tableName - Name of the Airtable table containing the record.
 * @param {string} args.recordId - ID of the record to update.
 * @param {string} args.fieldName - Name of the attachment field to update.
 * @param {AirtableAttachment} args.attachment - Attachment object with either url (for public URLs) or filePath (for local files) and optional metadata.
 *
 * @returns {Promise<AirtableRecord<TFields>>} Promise resolving to the updated record with the new attachment added.
 *
 * @throws {AirtableNotFoundError} When the record or table is not found (404)
 * @throws {AirtableAuthError} When authentication fails (401, 403)
 * @throws {AirtableValidationError} When the field is not an attachment field, attachment URL is invalid, or file size exceeds 5MB (422)
 * @throws {AirtableHttpError} When other API errors occur
 * @throws {Error} When neither url nor filePath is provided, or when file is not found (local files only)
 *
 * @example
 * // Basic usage - add a PDF to an attachment field
 * const updated = await addAttachmentToRecord({
 *   client,
 *   tableName: "Documents",
 *   recordId: "rec123",
 *   fieldName: "PDF File",
 *   attachment: {
 *     url: "https://example.com/document.pdf",
 *     filename: "document.pdf",
 *     type: "application/pdf"
 *   }
 * });
 *
 * @example
 * // Advanced usage with typed fields and URL
 * type DocFields = { "PDF File": AirtableAttachment[] };
 * const updated = await addAttachmentToRecord<DocFields>({
 *   client,
 *   tableName: "Documents",
 *   recordId: "rec123",
 *   fieldName: "PDF File",
 *   attachment: {
 *     url: "https://example.com/report.pdf",
 *     filename: "monthly-report.pdf",
 *     type: "application/pdf",
 *     size: 1024000
 *   }
 * });
 *
 * @example
 * // Local file upload (Node.js only)
 * const updated = await addAttachmentToRecord({
 *   client,
 *   tableName: "Documents",
 *   recordId: "rec123",
 *   fieldName: "PDF File",
 *   attachment: {
 *     filePath: "/path/to/local/document.pdf",
 *     filename: "document.pdf",
 *     type: "application/pdf"
 *   }
 * });
 *
 * @remarks
 * For URLs: The attachment URL must be publicly accessible and directly downloadable. Airtable will download the file from this URL.
 * If the field is empty, a new array is created. If the field already contains attachments, the new one is appended.
 * The function makes two API calls: one GET to fetch the current record, and one PATCH to update it with the new attachment.
 *
 * For local files: The file is read from the filesystem, converted to base64, and uploaded via Airtable's uploadAttachment endpoint.
 * The file size must not exceed 5MB. The MIME type is inferred from the file extension if not provided.
 * Local file uploads work only in Node.js environment (not in browsers).
 *
 * @see AirtableClient
 * @see AirtableAttachment
 */
declare function addAttachmentToRecord<TFields extends AirtableFields = AirtableFields>(args: {
    client: AirtableClient;
    tableName: string;
    recordId: string;
    fieldName: string;
    attachment: AirtableAttachment;
}): Promise<AirtableRecord<TFields>>;

type TableMapper<TFields extends AirtableFields, TModel> = {
    /**
     * Convert a domain model into Airtable fields (for create/update).
     * Keep this pure (no network).
     */
    toFields: (model: Partial<TModel>) => Partial<TFields>;
    /**
     * Convert an Airtable record into a domain model.
     * Should validate / normalize where appropriate.
     */
    fromRecord: (record: AirtableRecord<TFields>) => TModel;
};
type TableRepo<TFields extends AirtableFields, TModel> = {
    listPage: (params?: AirtableListParams) => Promise<{
        records: TModel[];
        offset?: string;
    }>;
    listAll: (params?: Omit<AirtableListParams, "offset">, options?: AirtableListAllOptions) => Promise<TModel[]>;
    get: (recordId: string) => Promise<TModel>;
    create: (model: Partial<TModel>) => Promise<TModel>;
    update: (recordId: string, patch: Partial<TModel>) => Promise<TModel>;
    delete: (recordId: string) => Promise<{
        id: string;
        deleted: boolean;
    }>;
};
declare function createTableRepo<TFields extends AirtableFields, TModel>(args: {
    client: AirtableClient;
    tableName: string;
    mapper: TableMapper<TFields, TModel>;
}): TableRepo<TFields, TModel>;

declare function createLeadsRepo(args: {
    client: AirtableClient;
    tableName?: string;
}): TableRepo<LeadFields, Lead>;

export { type AirtableAttachment, AirtableAuthError, type AirtableClient, type AirtableClientConfig, AirtableHttpError, type AirtableListAllOptions, AirtableNetworkError, AirtableNotFoundError, AirtableRateLimitError, type AirtableRequestConfig, AirtableValidationError, DEFAULT_AIRTABLE_API_URL, type TableMapper, type TableRepo, addAttachmentToRecord, airtableRequest, buildBaseUrl, buildListQuery, buildRecordPath, buildTablePath, createAirtableClient, createLeadsRepo, createTableRepo, listAllRecords };
