// # Imports
// imports from core types
import type {
  AirtableFields,
  AirtableListParams,
  AirtableListResponse,
  AirtableRecord,
  AirtableCreatePayload,
  AirtableUpdatePayload,
} from "../../core/types/airtable";
// imports from server client request
import { airtableRequest, type AirtableRequestConfig } from "./request";
// imports from server client endpoints
import {
  DEFAULT_AIRTABLE_API_URL,
  buildBaseUrl,
  buildListQuery,
  buildRecordPath,
  buildTablePath,
} from "./endpoints";

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
export type AirtableClientConfig = {
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
export type AirtableClient = {
  readonly baseId: string;
  readonly apiUrl: string;

  listRecords: <TFields extends AirtableFields = AirtableFields>(
    tableName: string,
    params?: AirtableListParams,
  ) => Promise<AirtableListResponse<TFields>>;

  listPage: <TFields extends AirtableFields = AirtableFields>(
    tableName: string,
    params?: AirtableListParams,
  ) => Promise<AirtableListResponse<TFields>>;

  getRecord: <TFields extends AirtableFields = AirtableFields>(
    tableName: string,
    recordId: string,
  ) => Promise<AirtableRecord<TFields>>;

  createRecord: <TFields extends AirtableFields = AirtableFields>(
    tableName: string,
    fields: Partial<TFields>,
  ) => Promise<AirtableRecord<TFields>>;

  updateRecord: <TFields extends AirtableFields = AirtableFields>(
    tableName: string,
    recordId: string,
    fields: Partial<TFields>,
  ) => Promise<AirtableRecord<TFields>>;

  deleteRecord: (
    tableName: string,
    recordId: string,
  ) => Promise<{ id: string; deleted: boolean }>;

  /**
   * Makes a custom request to the Airtable API. Used internally for endpoints not covered by standard methods.
   * @internal
   */
  _request: <TResponse = unknown>(
    url: string,
    method: "GET" | "POST" | "PATCH" | "DELETE",
    body?: unknown,
  ) => Promise<TResponse>;
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
export function createAirtableClient(
  config: AirtableClientConfig,
): AirtableClient {
  const apiUrl = config.apiUrl ?? DEFAULT_AIRTABLE_API_URL;
  const timeoutMs = config.timeoutMs ?? 15000;

  if (!config.token)
    throw new Error("createAirtableClient: `token` is required");
  if (!config.baseId)
    throw new Error("createAirtableClient: `baseId` is required");

  const baseUrl = buildBaseUrl(apiUrl, config.baseId);

  const reqConfig: AirtableRequestConfig = {
    token: config.token,
    timeoutMs,
  };

  async function listRecords<TFields extends AirtableFields = AirtableFields>(
    tableName: string,
    params?: AirtableListParams,
  ): Promise<AirtableListResponse<TFields>> {
    const url = `${baseUrl}${buildTablePath(tableName)}${buildListQuery(params)}`;
    return airtableRequest<AirtableListResponse<TFields>>({
      url,
      method: "GET",
      config: reqConfig,
    });
  }

  return {
    baseId: config.baseId,
    apiUrl,

    listRecords,
    listPage: listRecords,

    async getRecord<TFields extends AirtableFields = AirtableFields>(
      tableName: string,
      recordId: string,
    ): Promise<AirtableRecord<TFields>> {
      const url = `${baseUrl}${buildRecordPath(tableName, recordId)}`;
      return airtableRequest<AirtableRecord<TFields>>({
        url,
        method: "GET",
        config: reqConfig,
      });
    },

    async createRecord<TFields extends AirtableFields = AirtableFields>(
      tableName: string,
      fields: Partial<TFields>,
    ): Promise<AirtableRecord<TFields>> {
      const url = `${baseUrl}${buildTablePath(tableName)}`;
      return airtableRequest<AirtableRecord<TFields>>({
        url,
        method: "POST",
        config: reqConfig,
        body: { fields } as AirtableCreatePayload<TFields>,
      });
    },

    async updateRecord<TFields extends AirtableFields = AirtableFields>(
      tableName: string,
      recordId: string,
      fields: Partial<TFields>,
    ): Promise<AirtableRecord<TFields>> {
      const url = `${baseUrl}${buildRecordPath(tableName, recordId)}`;
      return airtableRequest<AirtableRecord<TFields>>({
        url,
        method: "PATCH",
        config: reqConfig,
        body: { fields } as AirtableUpdatePayload<TFields>,
      });
    },

    async deleteRecord(
      tableName: string,
      recordId: string,
    ): Promise<{ id: string; deleted: boolean }> {
      const url = `${baseUrl}${buildRecordPath(tableName, recordId)}`;
      return airtableRequest<{ id: string; deleted: boolean }>({
        url,
        method: "DELETE",
        config: reqConfig,
      });
    },

    async _request<TResponse = unknown>(
      url: string,
      method: "GET" | "POST" | "PATCH" | "DELETE",
      body?: unknown,
    ): Promise<TResponse> {
      return airtableRequest<TResponse>({
        url,
        method,
        config: reqConfig,
        body,
      });
    },
  };
}