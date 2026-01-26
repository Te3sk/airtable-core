import type {
  AirtableFields,
  AirtableListParams,
  AirtableListResponse,
  AirtableRecord,
} from "../../core/types/airtable";
import type { AirtableClient } from "./createClient";

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
export type AirtableListAllOptions = {
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
export async function listAllRecords<
  TFields extends AirtableFields = AirtableFields,
>(args: {
  client: AirtableClient;
  tableName: string;
  params?: Omit<AirtableListParams, "offset">;
  options?: AirtableListAllOptions;
}): Promise<Array<AirtableRecord<TFields>>> {
  const { client, tableName, params, options } = args;

  const maxTotalRecords = options?.maxTotalRecords ?? 10_000;

  const out: Array<AirtableRecord<TFields>> = [];
  let offset: string | undefined = undefined;

  while (true) {
    const page: AirtableListResponse<TFields> = await client.listRecords<TFields>(tableName, {
      ...(params ?? {}),
      offset,
    });

    out.push(...page.records);

    if (out.length > maxTotalRecords) {
      throw new Error(
        `listAllRecords: exceeded maxTotalRecords (${maxTotalRecords}). ` +
          `Add filters or increase the limit explicitly.`,
      );
    }

    if (!page.offset) break;
    offset = page.offset;
  }

  return out;
}
