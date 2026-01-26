import type { AirtableFields, AirtableListParams, AirtableRecord } from "../../core/types/airtable";
import type { AirtableClient } from "./createClient";
import { listAllRecords } from "./pagination";

/**
 * @name listAll
 * @kind AsyncFunction
 * @summary Convenience wrapper function that fetches all records from an Airtable table by automatically following pagination.
 *
 * @description
 * Async function that retrieves all records from a table by automatically paginating through Airtable API responses.
 * Wrapper around listAllRecords that accepts parameters in a more direct function signature format.
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
 * @requires ./pagination listAllRecords function for pagination logic
 * @requires ./createClient AirtableClient type and instance
 * @requires ../../core/types/airtable AirtableFields, AirtableListParams, AirtableRecord types
 *
 * @performance
 * @complexity O(n/p) where n is total records and p is page size - makes n/p API calls
 * @latency Network-bound: depends on number of pages and API response times (typically 100-500ms per page)
 * @memory O(n) - accumulates all records in memory array
 * @rateLimit Subject to Airtable API rate limits (typically 5 requests per second per base). Multiple pages = multiple requests.
 * @notes For large tables, consider using filters to reduce payload. Each page requires a separate API call. Uses default maxTotalRecords of 10000.
 *
 * @security
 * @inputSanitization tableName and params passed through to listAllRecords which handles encoding
 * @secretsHandling Token handled by client, never logged
 * @pii May return PII depending on table field contents
 *
 * @compatibility
 * @supported Node.js 18+, modern browsers with fetch API
 * @notSupported Node.js < 18 without fetch polyfill
 *
 * @param {AirtableClient} client - Airtable client instance for making API requests.
 * @param {string} tableName - Name of the Airtable table to fetch records from.
 * @param {Omit<AirtableListParams, "offset">} [params] - Query parameters (offset is excluded as it's managed internally). Use filterByFormula or view to reduce payload.
 *
 * @returns {Promise<Array<AirtableRecord<TFields>>>} Promise resolving to array of all records from the table.
 *
 * @throws {Error} When maxTotalRecords limit (default 10000) is exceeded - message includes limit value and suggests adding filters
 *
 * @example
 * // Basic usage
 * const allRecords = await listAll(client, "Tasks");
 *
 * @example
 * // Advanced usage with filters
 * const openTasks = await listAll(client, "Tasks", {
 *   filterByFormula: "{Status}='Open'",
 *   sort: [{ field: "Created", direction: "desc" }]
 * });
 *
 * @remarks
 * This is a convenience wrapper around listAllRecords with a simpler function signature.
 * Airtable may enforce its own max limits depending on plan. Use filterByFormula and view to reduce payload.
 * This function makes multiple API calls (one per page), so be mindful of rate limits for large tables.
 * The offset parameter is automatically managed and should not be included in params.
 *
 * @see listAllRecords
 * @see AirtableClient
 * @see AirtableListParams
 */
export async function listAll<TFields extends AirtableFields = AirtableFields>(
  client: AirtableClient,
  tableName: string,
  params?: Omit<AirtableListParams, "offset">,
): Promise<Array<AirtableRecord<TFields>>> {
  return listAllRecords<TFields>({
    client,
    tableName,
    params,
  });
}
