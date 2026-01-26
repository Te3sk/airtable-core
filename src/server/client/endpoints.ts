import type { AirtableListParams } from "../../core/types/airtable";

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
export const DEFAULT_AIRTABLE_API_URL = "https://api.airtable.com/v0";

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
export function buildBaseUrl(apiUrl: string, baseId: string): string {
  const trimmed = apiUrl.replace(/\/+$/, "");
  return `${trimmed}/${encodeURIComponent(baseId)}`;
}

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
export function buildTablePath(tableName: string): string {
  // Airtable expects the raw table name in the path; we still encode it for safety.
  return `/${encodeURIComponent(tableName)}`;
}

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
export function buildRecordPath(tableName: string, recordId: string): string {
  return `${buildTablePath(tableName)}/${encodeURIComponent(recordId)}`;
}

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
export function buildListQuery(params?: AirtableListParams): string {
  if (!params) return "";

  const q = new URLSearchParams();

  if (params.view) q.set("view", params.view);
  if (params.filterByFormula) q.set("filterByFormula", params.filterByFormula);
  if (typeof params.maxRecords === "number") q.set("maxRecords", String(params.maxRecords));
  if (typeof params.pageSize === "number") q.set("pageSize", String(params.pageSize));
  if (params.offset) q.set("offset", params.offset);

  if (params.sort?.length) {
    params.sort.forEach((s, i) => {
      q.set(`sort[${i}][field]`, s.field);
      if (s.direction) q.set(`sort[${i}][direction]`, s.direction);
    });
  }

  const qs = q.toString();
  return qs ? `?${qs}` : "";
}
