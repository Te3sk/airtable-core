import { AirtableFields, AirtableListParams, AirtableListResponse, AirtableRecord } from '../core/index.js';

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
 * @returns {Object} Object with methods: listRecords, getRecord, createRecord, updateRecord, deleteRecord.
 *
 * @example
 * // Basic usage
 * const client = createAirtableClient({ token: "pat...", baseId: "app..." });
 * const records = await client.listRecords("Tasks");
 *
 * @example
 * // Advanced usage with typed fields
 * type TaskFields = { Title: string; Status: string };
 * const record = await client.getRecord<TaskFields>("Tasks", "rec123");
 *
 * @remarks
 * All methods return Promises and should be awaited. Methods are generic over TFields for type safety.
 *
 * @see createAirtableClient
 * @see AirtableClientConfig
 */
type AirtableClient = {
    listRecords: <TFields extends AirtableFields = AirtableFields>(tableName: string, params?: AirtableListParams) => Promise<AirtableListResponse<TFields>>;
    getRecord: <TFields extends AirtableFields = AirtableFields>(tableName: string, recordId: string) => Promise<AirtableRecord<TFields>>;
    createRecord: <TFields extends AirtableFields = AirtableFields>(tableName: string, fields: Partial<TFields>) => Promise<AirtableRecord<TFields>>;
    updateRecord: <TFields extends AirtableFields = AirtableFields>(tableName: string, recordId: string, fields: Partial<TFields>) => Promise<AirtableRecord<TFields>>;
    deleteRecord: (tableName: string, recordId: string) => Promise<{
        id: string;
        deleted: boolean;
    }>;
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
 * @returns {AirtableClient} Client instance with methods: listRecords, getRecord, createRecord, updateRecord, deleteRecord.
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

export { type AirtableClient, type AirtableClientConfig, AirtableHttpError, type AirtableListAllOptions, type AirtableRequestConfig, DEFAULT_AIRTABLE_API_URL, airtableRequest, buildBaseUrl, buildListQuery, buildRecordPath, buildTablePath, createAirtableClient, listAllRecords };
