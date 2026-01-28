import type { AirtableClient } from "./createClient";
import type { AirtableFields } from "../../core/types/airtable";
import { promises as fs } from "fs";
import { extname } from "path";

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
export type AirtableAttachment = {
  url?: string;
  filePath?: string;
  filename?: string;
  size?: number;
  type?: string;
};

/**
 * Maximum file size for uploadAttachment endpoint (5MB in bytes)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * MIME type mapping based on file extensions
 */
const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
  ".xml": "application/xml",
  ".zip": "application/zip",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/**
 * Infers MIME type from file extension
 */
function getMimeTypeFromExtension(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

/**
 * Reads a local file and converts it to base64
 */
async function readFileAsBase64(filePath: string): Promise<{ base64: string; size: number }> {
  try {
    const buffer = await fs.readFile(filePath);
    const size = buffer.length;

    if (size > MAX_FILE_SIZE) {
      throw new Error(
        `File size (${size} bytes) exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (5MB)`,
      );
    }

    const base64 = buffer.toString("base64");
    return { base64, size };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Extracts filename from file path
 */
function getFilenameFromPath(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || "file";
}

/**
 * Checks if a string is a URL (starts with http:// or https://)
 */
function isUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

/**
 * Uploads a local file to Airtable using the uploadAttachment endpoint
 * 
 * Note: 
 * - This endpoint requires multipart/form-data, not JSON
 * - The endpoint URL uses content.airtable.com, not api.airtable.com
 * - The endpoint accepts fieldId (like "fldXXXXXXXXXXXXXX") or fieldName
 * - FieldId is more reliable, but fieldName may work in some cases
 */
async function uploadLocalFile<TFields extends AirtableFields = AirtableFields>(
  client: AirtableClient,
  tableName: string,
  recordId: string,
  fieldName: string,
  filePath: string,
  filename?: string,
  contentType?: string,
): Promise<import("../../core/types/airtable").AirtableRecord<TFields>> {
  // Read file as Buffer (not base64 string)
  const buffer = await fs.readFile(filePath);
  const size = buffer.length;

  if (size > MAX_FILE_SIZE) {
    throw new Error(
      `File size (${size} bytes) exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (5MB)`,
    );
  }

  // Determine filename
  const finalFilename = filename || getFilenameFromPath(filePath);

  // Determine content type
  const finalContentType = contentType || getMimeTypeFromExtension(filePath);

  // Build upload URL: POST https://content.airtable.com/v0/{baseId}/{recordId}/{fieldId}/uploadAttachment
  // Note: uploadAttachment endpoint uses content.airtable.com, not api.airtable.com
  // The endpoint accepts fieldId (field ID like "fldXXXXXXXXXXXXXX") or fieldName
  // FieldId is preferred and more reliable, but we'll try with fieldName for convenience
  // If fieldName doesn't work, users should pass the fieldId instead
  const contentApiUrl = client.apiUrl.replace("api.airtable.com", "content.airtable.com").replace(/\/+$/, "");
  const encodedBaseId = encodeURIComponent(client.baseId);
  const encodedRecordId = encodeURIComponent(recordId);
  const encodedFieldName = encodeURIComponent(fieldName);
  const uploadUrl = `${contentApiUrl}/${encodedBaseId}/${encodedRecordId}/${encodedFieldName}/uploadAttachment`;

  // Create FormData for multipart/form-data upload
  // Note: In Node.js 18+, FormData is available globally
  // The endpoint expects the file as multipart/form-data with field name "file"
  const formData = new FormData();
  
  // In Node.js, we need to create a Blob from the buffer
  // FormData.append accepts Blob, File, or string
  const blob = new Blob([buffer], { type: finalContentType });
  formData.append("file", blob, finalFilename);

  // Make the upload request with multipart/form-data using the client's multipart method
  const response = await client._requestMultipart<import("../../core/types/airtable").AirtableRecord<TFields>>(
    uploadUrl,
    formData,
  );

  return response;
}

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
export async function addAttachmentToRecord<TFields extends AirtableFields = AirtableFields>(args: {
  client: AirtableClient;
  tableName: string;
  recordId: string;
  fieldName: string;
  attachment: AirtableAttachment;
}): Promise<import("../../core/types/airtable").AirtableRecord<TFields>> {
  const { client, tableName, recordId, fieldName, attachment } = args;

  // Validate that either url or filePath is provided
  if (!attachment.url && !attachment.filePath) {
    throw new Error(
      "addAttachmentToRecord: Either 'url' or 'filePath' must be provided in the attachment object",
    );
  }

  // If filePath is provided, use uploadAttachment endpoint for local files
  if (attachment.filePath) {
    return uploadLocalFile<TFields>(
      client,
      tableName,
      recordId,
      fieldName,
      attachment.filePath,
      attachment.filename,
      attachment.type,
    );
  }

  // For URLs, use the existing method (GET + PATCH)
  // Validate that url is provided and is a valid URL
  if (!attachment.url) {
    throw new Error("addAttachmentToRecord: 'url' is required when 'filePath' is not provided");
  }

  // Check if it's a URL (starts with http:// or https://)
  if (!isUrl(attachment.url)) {
    throw new Error(
      `addAttachmentToRecord: Invalid URL format. URL must start with 'http://' or 'https://'. Got: ${attachment.url}`,
    );
  }

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
