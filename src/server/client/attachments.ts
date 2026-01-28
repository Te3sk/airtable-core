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
  // Determine filename
  const finalFilename = filename || getFilenameFromPath(filePath);

  // Determine content type
  const finalContentType = contentType || getMimeTypeFromExtension(filePath);

  // Check file size first (read stats without reading entire file)
  const stats = await fs.stat(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size (${stats.size} bytes) exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (5MB)`,
    );
  }

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

  // Read file as Buffer
  const buffer = await fs.readFile(filePath);

  // Create FormData for multipart/form-data upload
  // Note: In Node.js 18+, FormData is available globally
  // The endpoint expects the file as multipart/form-data with field name "file"
  const formData = new FormData();
  
  // Create a Blob from the buffer with the correct MIME type
  // In Node.js, Blob is more reliably supported than File across versions
  const blob = new Blob([buffer], { type: finalContentType });
  
  // Append blob to FormData with filename as third parameter
  // This ensures the filename is properly included in the multipart/form-data encoding
  // The third parameter is important for Node.js FormData to correctly encode the filename
  formData.append("file", blob, finalFilename);

  // Make the upload request with multipart/form-data using the client's multipart method
  const response = await client._requestMultipart<import("../../core/types/airtable").AirtableRecord<TFields>>(
    uploadUrl,
    formData,
  );

  return response;
}

export async function addAttachmentToRecord<TFields extends AirtableFields = AirtableFields>(
  args: {
    client: AirtableClient;
    tableName: string;
    recordId: string;
    fieldName: string;
    attachment?: AirtableAttachment;
    // Alternative: allow passing attachment properties directly for convenience
    url?: string;
    filePath?: string;
    filename?: string;
    contentType?: string;
    size?: number;
    type?: string;
  },
): Promise<import("../../core/types/airtable").AirtableRecord<TFields>> {
  const { client, tableName, recordId, fieldName, attachment, url, filePath, filename, contentType, size, type } = args;

  // Build attachment object from either the attachment parameter or individual properties
  // If attachment is provided, use it; otherwise, construct from individual properties
  const attachmentObj: AirtableAttachment = attachment || {
    url,
    filePath,
    filename,
    size,
    type: type || contentType, // Support both 'type' and 'contentType' for convenience
  };

  // Validate that either url or filePath is provided
  if (!attachmentObj.url && !attachmentObj.filePath) {
    throw new Error(
      "addAttachmentToRecord: Either 'url' or 'filePath' must be provided (either in attachment object or as direct parameters)",
    );
  }

  // If filePath is provided, use uploadAttachment endpoint for local files
  if (attachmentObj.filePath) {
    return uploadLocalFile<TFields>(
      client,
      tableName,
      recordId,
      fieldName,
      attachmentObj.filePath,
      attachmentObj.filename,
      attachmentObj.type,
    );
  }

  // For URLs, use the existing method (GET + PATCH)
  // Validate that url is provided and is a valid URL
  if (!attachmentObj.url) {
    throw new Error("addAttachmentToRecord: 'url' is required when 'filePath' is not provided");
  }

  // Check if it's a URL (starts with http:// or https://)
  if (!isUrl(attachmentObj.url)) {
    throw new Error(
      `addAttachmentToRecord: Invalid URL format. URL must start with 'http://' or 'https://'. Got: ${attachmentObj.url}`,
    );
  }

  // Fetch the current record to get existing attachments
  const currentRecord = await client.getRecord<TFields>(tableName, recordId);

  // Get existing attachments from the field, or empty array if field is empty/undefined
  const existingAttachments = (currentRecord.fields[fieldName] as AirtableAttachment[] | undefined) ?? [];

  // Append the new attachment to the existing array
  const updatedAttachments = [...existingAttachments, attachmentObj];

  // Update the record with the complete attachment array
  return client.updateRecord<TFields>(tableName, recordId, {
    [fieldName]: updatedAttachments,
  } as Partial<TFields>);
}
