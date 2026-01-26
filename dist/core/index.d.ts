/**
 * Minimal, portable Airtable REST types.
 *
 * These types intentionally avoid opinionated field modeling.
 * Consumers can define their own `TFields` shapes per table.
 */
/**
 * @name AirtableRecordId
 * @kind Type
 * @summary Unique identifier string for an Airtable record.
 *
 * @description
 * Type alias representing the unique record identifier returned by Airtable REST API.
 * Used throughout the type system to reference specific records in tables.
 * Format is a string that Airtable generates and manages internally.
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
 * @complexity O(1) - simple string type
 * @latency Not applicable
 * @memory Not applicable
 * @rateLimit Not applicable
 * @notes Not applicable
 *
 * @security
 * @inputSanitization Not specified
 * @secretsHandling Not applicable - public identifier
 * @pii Not applicable
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @example
 * // Basic usage
 * const recordId: AirtableRecordId = "rec123abc456";
 *
 * @remarks
 * This is a branded string type for type safety. Values come from Airtable API responses.
 *
 * @see AirtableRecord
 */
type AirtableRecordId = string;
/**
 * @name AirtableCreatedTime
 * @kind Type
 * @summary ISO 8601 timestamp string representing when a record was created in Airtable.
 *
 * @description
 * Type alias for ISO 8601 formatted date-time strings representing record creation timestamps.
 * Returned by Airtable REST API in the `createdTime` field of records.
 * Format follows ISO 8601 standard (e.g., "2024-01-15T10:30:00.000Z").
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
 * @complexity O(1) - simple string type
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
 * @example
 * // Basic usage
 * const created: AirtableCreatedTime = "2024-01-15T10:30:00.000Z";
 *
 * @remarks
 * Optional field in AirtableRecord. Use Date constructor or date libraries to parse if needed.
 *
 * @see AirtableRecord
 */
type AirtableCreatedTime = string;
/**
 * @name AirtableOffset
 * @kind Type
 * @summary Pagination cursor string used by Airtable API for retrieving subsequent pages.
 *
 * @description
 * Type alias for pagination offset tokens returned by Airtable list endpoints.
 * Used to fetch the next page of results when paginating through large record sets.
 * Format is an opaque string managed by Airtable API.
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
 * @complexity O(1) - simple string type
 * @latency Not applicable
 * @memory Not applicable
 * @rateLimit Not applicable
 * @notes Not applicable
 *
 * @security
 * @inputSanitization Not specified
 * @secretsHandling Not applicable - pagination token
 * @pii Not applicable
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @example
 * // Basic usage
 * const offset: AirtableOffset = "itr123abc/rec456def";
 *
 * @remarks
 * Present in AirtableListResponse when more records are available. Pass to subsequent requests via AirtableListParams.offset.
 *
 * @see AirtableListResponse
 * @see AirtableListParams
 */
type AirtableOffset = string;
/**
 * @name AirtableFields
 * @kind Type
 * @summary Base type for record field data as a key-value record of unknown values.
 *
 * @description
 * Type alias representing the shape of field data in Airtable records.
 * Uses Record<string, unknown> to allow flexible field definitions without opinionated modeling.
 * Consumers should extend this with specific field shapes using generics.
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
 * @secretsHandling Not specified
 * @pii May contain PII depending on table schema
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @example
 * // Basic usage
 * type MyFields = AirtableFields & {
 *   Name: string;
 *   Age: number;
 * };
 *
 * @remarks
 * Intentionally generic to allow consumers to define their own field schemas. Used as constraint for generic type parameters.
 *
 * @see AirtableRecord
 */
type AirtableFields = Record<string, unknown>;
/**
 * @name AirtableRecord
 * @kind Type
 * @summary Generic type representing a single Airtable record with typed fields.
 *
 * @description
 * Generic type definition for records returned by Airtable REST API.
 * Contains record identifier, optional creation timestamp, and typed field data.
 * Uses generic type parameter TFields to allow consumers to define specific field shapes.
 * Defaults to AirtableFields for flexibility when field structure is unknown.
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
 * @secretsHandling Not specified
 * @pii May contain PII depending on TFields schema
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @param {AirtableFields} [TFields] - Field shape type extending AirtableFields. Defaults to AirtableFields if not specified.
 *
 * @returns {Object} Object with id (AirtableRecordId), optional createdTime (AirtableCreatedTime), and fields (TFields).
 *
 * @example
 * // Basic usage
 * type MyRecord = AirtableRecord<{ Name: string; Age: number }>;
 *
 * @example
 * // Advanced usage with custom fields
 * interface TaskFields {
 *   Title: string;
 *   Status: "Open" | "Closed";
 *   DueDate?: string;
 * }
 * const record: AirtableRecord<TaskFields> = {
 *   id: "rec123",
 *   createdTime: "2024-01-15T10:30:00.000Z",
 *   fields: { Title: "Task", Status: "Open" }
 * };
 *
 * @remarks
 * The createdTime field is optional and may not be present in all API responses. Fields are required and must match the TFields shape.
 *
 * @see AirtableRecordId
 * @see AirtableCreatedTime
 * @see AirtableFields
 */
type AirtableRecord<TFields extends AirtableFields = AirtableFields> = {
    id: AirtableRecordId;
    createdTime?: AirtableCreatedTime;
    fields: TFields;
};
/**
 * @name AirtableListResponse
 * @kind Type
 * @summary Generic response type for Airtable list endpoints containing records array and optional pagination offset.
 *
 * @description
 * Generic type definition for responses returned by Airtable REST API list endpoints.
 * Contains an array of records matching the query parameters and an optional offset token for pagination.
 * The offset field is present when more records are available beyond the current page.
 * Uses generic type parameter TFields to type the records array consistently.
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
 * @secretsHandling Not specified
 * @pii May contain PII depending on TFields schema
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @param {AirtableFields} [TFields] - Field shape type extending AirtableFields. Defaults to AirtableFields if not specified.
 *
 * @returns {Object} Object with records array (Array<AirtableRecord<TFields>>) and optional offset (AirtableOffset) for pagination.
 *
 * @example
 * // Basic usage
 * const response: AirtableListResponse<{ Name: string }> = {
 *   records: [{ id: "rec1", fields: { Name: "Test" } }],
 *   offset: "itr123/rec456"
 * };
 *
 * @example
 * // Advanced usage with pagination
 * async function fetchAllRecords() {
 *   let offset: AirtableOffset | undefined;
 *   const allRecords: AirtableRecord[] = [];
 *   do {
 *     const response: AirtableListResponse = await client.list({ offset });
 *     allRecords.push(...response.records);
 *     offset = response.offset;
 *   } while (offset);
 *   return allRecords;
 * }
 *
 * @remarks
 * The offset field is only present when there are more records to fetch. Use it in subsequent requests to retrieve the next page.
 *
 * @see AirtableRecord
 * @see AirtableOffset
 * @see AirtableListParams
 */
type AirtableListResponse<TFields extends AirtableFields = AirtableFields> = {
    records: Array<AirtableRecord<TFields>>;
    offset?: AirtableOffset;
};
/**
 * @name AirtableSort
 * @kind Type
 * @summary Sort configuration object specifying field name and sort direction for Airtable list queries.
 *
 * @description
 * Type definition for sort parameters used in Airtable list endpoint queries.
 * Specifies which field to sort by and the direction (ascending or descending).
 * Multiple sort objects can be provided in an array to create multi-level sorting.
 * Direction defaults to ascending if not specified.
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
 * @returns {Object} Object with field (string) and optional direction ("asc" | "desc").
 *
 * @example
 * // Basic usage
 * const sort: AirtableSort = { field: "Name", direction: "asc" };
 *
 * @example
 * // Multi-level sorting
 * const sorts: AirtableSort[] = [
 *   { field: "Status", direction: "asc" },
 *   { field: "Created", direction: "desc" }
 * ];
 *
 * @remarks
 * Field name must match an existing field in the Airtable table. Direction defaults to "asc" if omitted.
 *
 * @see AirtableListParams
 */
type AirtableSort = {
    field: string;
    direction?: "asc" | "desc";
};
/**
 * @name AirtableListParams
 * @kind Type
 * @summary Query parameters object for Airtable list endpoints supporting filtering, sorting, pagination, and view selection.
 *
 * @description
 * Type definition for query parameters accepted by Airtable REST API list endpoints.
 * Supports filtering via formula strings, sorting by field and direction, pagination with offset tokens,
 * view selection, and result size limits. All fields are optional, allowing flexible query construction.
 * Designed to be minimal and portable across different Airtable API implementations.
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
 * @pii filterByFormula may reference fields containing PII
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @param {string} [view] - A saved view name in Airtable. When provided, applies the view's filters and sorting.
 * @param {string} [filterByFormula] - Formula string used by Airtable to filter results. Example: "AND({Status}='Open',{Country}='IT')".
 * @param {number} [maxRecords] - Maximum number of records to return. Airtable will cap this value based on API limits.
 * @param {number} [pageSize] - Page size for pagination. Airtable default is 100. Affects how many records are returned per request.
 * @param {AirtableOffset} [offset] - Airtable pagination cursor from previous response. Use to fetch subsequent pages.
 * @param {AirtableSort[]} [sort] - Array of sort configurations. Multiple sorts create multi-level sorting (first sort is primary).
 *
 * @returns {Object} Object with optional view, filterByFormula, maxRecords, pageSize, offset, and sort properties.
 *
 * @example
 * // Basic usage
 * const params: AirtableListParams = {
 *   view: "Active Tasks",
 *   maxRecords: 50
 * };
 *
 * @example
 * // Advanced usage with filtering and sorting
 * const params: AirtableListParams = {
 *   filterByFormula: "AND({Status}='Open',{Priority}='High')",
 *   sort: [
 *     { field: "DueDate", direction: "asc" },
 *     { field: "Created", direction: "desc" }
 *   ],
 *   pageSize: 100,
 *   offset: "itr123/rec456"
 * };
 *
 * @remarks
 * All parameters are optional. When multiple parameters are provided, they are combined (e.g., view filters + filterByFormula).
 * The offset parameter is typically obtained from a previous AirtableListResponse.offset value.
 *
 * @see AirtableListResponse
 * @see AirtableSort
 * @see AirtableOffset
 */
type AirtableListParams = {
    /**
     * A saved view name in Airtable.
     */
    view?: string;
    /**
     * Formula string used by Airtable to filter results.
     * Example: "AND({Status}='Open',{Country}='IT')"
     */
    filterByFormula?: string;
    /**
     * Maximum number of records to return (Airtable will cap anyway).
     */
    maxRecords?: number;
    /**
     * Page size for pagination (Airtable default is 100).
     */
    pageSize?: number;
    /**
     * Airtable pagination cursor.
     */
    offset?: AirtableOffset;
    /**
     * Sort configuration.
     */
    sort?: AirtableSort[];
};
/**
 * @name AirtableCreatePayload
 * @kind Type
 * @summary Generic payload type for creating a new Airtable record with partial field data.
 *
 * @description
 * Generic type definition for payloads used when creating new records via Airtable REST API.
 * Contains a fields object with partial field data, allowing consumers to specify only the fields they want to set.
 * Uses generic type parameter TFields to ensure type safety for field names and values.
 * Fields are partial because not all fields need to be provided during creation.
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
 * @secretsHandling Not specified
 * @pii May contain PII depending on TFields schema
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @param {AirtableFields} [TFields] - Field shape type extending AirtableFields. Defaults to AirtableFields if not specified.
 *
 * @returns {Object} Object with fields property containing Partial<TFields>.
 *
 * @example
 * // Basic usage
 * type TaskFields = { Title: string; Status: string };
 * const payload: AirtableCreatePayload<TaskFields> = {
 *   fields: { Title: "New Task", Status: "Open" }
 * };
 *
 * @example
 * // Advanced usage with partial fields
 * type UserFields = { Name: string; Email: string; Age?: number };
 * const payload: AirtableCreatePayload<UserFields> = {
 *   fields: { Name: "John", Email: "john@example.com" }
 *   // Age is optional and can be omitted
 * };
 *
 * @remarks
 * All fields in the payload are optional (Partial<TFields>), allowing creation with only the necessary fields.
 * Required fields in Airtable will be validated by the API, not by this type system.
 *
 * @see AirtableUpdatePayload
 * @see AirtableBatchCreatePayload
 */
type AirtableCreatePayload<TFields extends AirtableFields = AirtableFields> = {
    fields: Partial<TFields>;
};
/**
 * @name AirtableUpdatePayload
 * @kind Type
 * @summary Generic payload type for updating an existing Airtable record via PATCH with partial field data.
 *
 * @description
 * Generic type definition for payloads used when updating existing records via Airtable REST API PATCH operations.
 * Contains a fields object with partial field data, allowing consumers to update only specific fields.
 * Uses generic type parameter TFields to ensure type safety for field names and values.
 * Fields are partial because PATCH operations only update the provided fields, leaving others unchanged.
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
 * @secretsHandling Not specified
 * @pii May contain PII depending on TFields schema
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @param {AirtableFields} [TFields] - Field shape type extending AirtableFields. Defaults to AirtableFields if not specified.
 *
 * @returns {Object} Object with fields property containing Partial<TFields>.
 *
 * @example
 * // Basic usage
 * type TaskFields = { Title: string; Status: string };
 * const payload: AirtableUpdatePayload<TaskFields> = {
 *   fields: { Status: "Closed" }
 * };
 *
 * @example
 * // Advanced usage updating multiple fields
 * type UserFields = { Name: string; Email: string; Age: number };
 * const payload: AirtableUpdatePayload<UserFields> = {
 *   fields: { Name: "Jane", Age: 30 }
 *   // Email remains unchanged
 * };
 *
 * @remarks
 * This payload is used for PATCH operations, which only update the specified fields. Other fields remain unchanged.
 * To update a record, combine this payload with the record ID (see AirtableBatchUpdatePayload).
 *
 * @see AirtableCreatePayload
 * @see AirtableBatchUpdatePayload
 */
type AirtableUpdatePayload<TFields extends AirtableFields = AirtableFields> = {
    fields: Partial<TFields>;
};
/**
 * @name AirtableBatchCreatePayload
 * @kind Type
 * @summary Generic payload type for batch creating multiple Airtable records in a single API request.
 *
 * @description
 * Generic type definition for payloads used when creating multiple records via Airtable REST API batch endpoints.
 * Contains an array of create payloads, each representing a new record to be created.
 * Allows efficient bulk record creation by sending multiple records in one API call.
 * Uses generic type parameter TFields to ensure type safety across all records in the batch.
 * Optional to use in v1, but useful to have typed early for future batch operations.
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
 * @notes Batch operations are more efficient than individual creates but may have API limits on batch size.
 *
 * @security
 * @inputSanitization Not specified
 * @secretsHandling Not specified
 * @pii May contain PII depending on TFields schema
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @param {AirtableFields} [TFields] - Field shape type extending AirtableFields. Defaults to AirtableFields if not specified.
 *
 * @returns {Object} Object with records array containing Array<AirtableCreatePayload<TFields>>.
 *
 * @example
 * // Basic usage
 * type TaskFields = { Title: string; Status: string };
 * const payload: AirtableBatchCreatePayload<TaskFields> = {
 *   records: [
 *     { fields: { Title: "Task 1", Status: "Open" } },
 *     { fields: { Title: "Task 2", Status: "Open" } }
 *   ]
 * };
 *
 * @example
 * // Advanced usage with many records
 * const tasks: AirtableBatchCreatePayload<TaskFields> = {
 *   records: Array.from({ length: 10 }, (_, i) => ({
 *     fields: { Title: `Task ${i + 1}`, Status: "Open" }
 *   }))
 * };
 *
 * @remarks
 * Batch operations are more efficient than individual API calls. Check Airtable API documentation for maximum batch size limits.
 *
 * @see AirtableCreatePayload
 * @see AirtableBatchUpdatePayload
 */
type AirtableBatchCreatePayload<TFields extends AirtableFields = AirtableFields> = {
    records: Array<AirtableCreatePayload<TFields>>;
};
/**
 * @name AirtableBatchUpdatePayload
 * @kind Type
 * @summary Generic payload type for batch updating multiple Airtable records in a single API request.
 *
 * @description
 * Generic type definition for payloads used when updating multiple records via Airtable REST API batch endpoints.
 * Contains an array of update payloads, each representing a record to be updated with its ID and field changes.
 * Each record in the array must include both the record ID and the fields to update.
 * Allows efficient bulk record updates by sending multiple updates in one API call.
 * Uses generic type parameter TFields to ensure type safety across all records in the batch.
 * Optional to use in v1, but useful to have typed early for future batch operations.
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
 * @notes Batch operations are more efficient than individual updates but may have API limits on batch size.
 *
 * @security
 * @inputSanitization Not specified
 * @secretsHandling Not specified
 * @pii May contain PII depending on TFields schema
 *
 * @compatibility
 * @supported All TypeScript/JavaScript environments
 * @notSupported None
 *
 * @param {AirtableFields} [TFields] - Field shape type extending AirtableFields. Defaults to AirtableFields if not specified.
 *
 * @returns {Object} Object with records array containing Array<AirtableUpdatePayload<TFields> & { id: AirtableRecordId }>.
 *
 * @example
 * // Basic usage
 * type TaskFields = { Title: string; Status: string };
 * const payload: AirtableBatchUpdatePayload<TaskFields> = {
 *   records: [
 *     { id: "rec123", fields: { Status: "Closed" } },
 *     { id: "rec456", fields: { Status: "In Progress" } }
 *   ]
 * };
 *
 * @example
 * // Advanced usage updating multiple fields per record
 * const payload: AirtableBatchUpdatePayload<TaskFields> = {
 *   records: [
 *     { id: "rec123", fields: { Title: "Updated Task", Status: "Closed" } },
 *     { id: "rec456", fields: { Status: "In Progress" } }
 *   ]
 * };
 *
 * @remarks
 * Each record in the array must include an id field (AirtableRecordId) to identify which record to update.
 * Batch operations are more efficient than individual API calls. Check Airtable API documentation for maximum batch size limits.
 *
 * @see AirtableUpdatePayload
 * @see AirtableRecordId
 * @see AirtableBatchCreatePayload
 */
type AirtableBatchUpdatePayload<TFields extends AirtableFields = AirtableFields> = {
    records: Array<AirtableUpdatePayload<TFields> & {
        id: AirtableRecordId;
    }>;
};

type Lead = {
    id?: string;
    createdTime?: string;
    name: string;
    email?: string;
    phone?: string;
};

/**
 * Airtable fields shape for the "Leads" table.
 * Keep field names exactly as they are in Airtable.
 */
type LeadFields = {
    Name: string;
    Email?: string;
    Phone?: string;
};
declare function leadToFields(model: Partial<Lead>): Partial<LeadFields>;
declare function leadFromRecord(record: AirtableRecord<LeadFields>): Lead;

export { type AirtableBatchCreatePayload, type AirtableBatchUpdatePayload, type AirtableCreatePayload, type AirtableCreatedTime, type AirtableFields, type AirtableListParams, type AirtableListResponse, type AirtableOffset, type AirtableRecord, type AirtableRecordId, type AirtableSort, type AirtableUpdatePayload, type Lead, type LeadFields, leadFromRecord, leadToFields };
