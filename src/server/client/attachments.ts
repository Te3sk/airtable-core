import type { AirtableClient } from "./createClient";
import type { AirtableFields } from "../../core/types/airtable";

/**
 * @name AirtableAttachment
 * @kind Type
 * @summary Type definition for Airtable attachment objects.
 *
 * @description
 * Type definition representing an attachment object in Airtable attachment fields.
 * Attachments are stored as arrays of objects with url, filename, size, and type properties.
 * Used when adding attachments to records via the API.
 *
 * @category Data
 * @since Not specified
 *
 * @param {string} url - Public URL of the attachment file. Must be directly downloadable.
 * @param {string} [filename] - Optional filename for the attachment.
 * @param {number} [size] - Optional file size in bytes.
 * @param {string} [type] - Optional MIME type of the file (e.g., "application/pdf", "image/png").
 *
 * @example
 * // Basic usage
 * const attachment: AirtableAttachment = {
 *   url: "https://example.com/document.pdf",
 *   filename: "document.pdf",
 *   type: "application/pdf"
 * };
 *
 * @remarks
 * The URL must be publicly accessible and directly downloadable. Airtable will download the file from this URL.
 * For PDFs, use type: "application/pdf". For images, use appropriate image MIME types.
 */
export type AirtableAttachment = {
  url: string;
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
 * Retrieves the current record, appends the new attachment to the existing attachments array,
 * and updates the record with the complete attachment list. Preserves all existing attachments.
 * Useful for adding PDFs, images, or other files to attachment fields programmatically.
 *
 * @category API
 * @since Not specified
 *
 * @requirements
 * @requiresRuntime Node.js >= 18 (for fetch API) or browser with fetch support
 * @requiresPermissions Valid Airtable API token with write access to the table
 * @requiresEnv Not specified
 * @requiresNetwork Internet required - makes HTTP requests to Airtable API
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
 * @supported Node.js 18+, modern browsers with fetch API
 * @notSupported Node.js < 18 without fetch polyfill
 *
 * @param {Object} args - Arguments object for adding the attachment.
 * @param {AirtableClient} args.client - Airtable client instance with authentication configured.
 * @param {string} args.tableName - Name of the Airtable table containing the record.
 * @param {string} args.recordId - ID of the record to update.
 * @param {string} args.fieldName - Name of the attachment field to update.
 * @param {AirtableAttachment} args.attachment - Attachment object with url and optional metadata.
 *
 * @returns {Promise<AirtableRecord<TFields>>} Promise resolving to the updated record with the new attachment added.
 *
 * @throws {AirtableNotFoundError} When the record or table is not found (404)
 * @throws {AirtableAuthError} When authentication fails (401, 403)
 * @throws {AirtableValidationError} When the field is not an attachment field or attachment URL is invalid (422)
 * @throws {AirtableHttpError} When other API errors occur
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
 * // Advanced usage with typed fields
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
 * @remarks
 * The attachment URL must be publicly accessible and directly downloadable. Airtable will download the file from this URL.
 * If the field is empty, a new array is created. If the field already contains attachments, the new one is appended.
 * The function makes two API calls: one GET to fetch the current record, and one PATCH to update it with the new attachment.
 *
 * @see AirtableClient
 * @see AirtableAttachment
 */
export async function addAttachmentToRecord<TFields extends AirtableFields = AirtableFields>(args: {
  client: AirtableClient;
  tableName: string;
  recordId: string;
  fieldName: string;
  attachment: AirtableAttachment;
}): Promise<import("../../core/types/airtable").AirtableRecord<TFields>> {
  const { client, tableName, recordId, fieldName, attachment } = args;

  // Fetch the current record to get existing attachments
  const currentRecord = await client.getRecord<TFields>(tableName, recordId);

  // Get existing attachments from the field, or empty array if field is empty/undefined
  const existingAttachments = (currentRecord.fields[fieldName] as AirtableAttachment[] | undefined) ?? [];

  // Append the new attachment to the existing array
  const updatedAttachments = [...existingAttachments, attachment];

  // Update the record with the complete attachment array
  return client.updateRecord<TFields>(tableName, recordId, {
    [fieldName]: updatedAttachments,
  } as Partial<TFields>);
}
