import type { AirtableClient } from "./createClient";
import type { AirtableFields } from "../../core/types/airtable";
import { promises as fs } from "fs";
import { extname } from "path";
import {
  AirtableHttpError,
  AirtableNetworkError,
  AirtableAuthError,
  AirtableNotFoundError,
  AirtableValidationError,
  AirtableRateLimitError,
} from "./request";

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
 * - This endpoint expects JSON (not multipart): { contentType, file (base64), filename }
 * - The endpoint URL uses content.airtable.com, not api.airtable.com
 * - The endpoint accepts fieldId (like "fldXXXXXXXXXXXXXX") or fieldName
 * - FieldId is more reliable, but fieldName may work in some cases
 * 
 * @throws {Error} When file validation fails (not found, too large, permission denied, etc.)
 * @throws {AirtableHttpError} When API returns HTTP errors (400, 401, 403, 404, 422, 429, 500, etc.)
 * @throws {AirtableNetworkError} When network/transport failures occur
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
  // Validate input parameters
  if (!tableName || typeof tableName !== "string" || tableName.trim().length === 0) {
    throw new Error(
      `uploadLocalFile: Invalid tableName. Expected non-empty string, got: ${JSON.stringify(tableName)}`,
    );
  }
  if (!recordId || typeof recordId !== "string" || recordId.trim().length === 0) {
    throw new Error(
      `uploadLocalFile: Invalid recordId. Expected non-empty string, got: ${JSON.stringify(recordId)}`,
    );
  }
  if (!fieldName || typeof fieldName !== "string" || fieldName.trim().length === 0) {
    throw new Error(
      `uploadLocalFile: Invalid fieldName. Expected non-empty string, got: ${JSON.stringify(fieldName)}`,
    );
  }
  if (!filePath || typeof filePath !== "string" || filePath.trim().length === 0) {
    throw new Error(
      `uploadLocalFile: Invalid filePath. Expected non-empty string, got: ${JSON.stringify(filePath)}`,
    );
  }

  // Determine filename
  const finalFilename = filename || getFilenameFromPath(filePath);
  if (!finalFilename || finalFilename.trim().length === 0) {
    throw new Error(
      `uploadLocalFile: Cannot determine filename from filePath "${filePath}". Please provide a valid filename parameter.`,
    );
  }

  // Determine content type
  const finalContentType = contentType || getMimeTypeFromExtension(filePath);

  // Validate and read file stats
  let stats: import("fs").Stats;
  try {
    stats = await fs.stat(filePath);
  } catch (error: any) {
    // Handle filesystem errors with detailed messages
    if (error.code === "ENOENT") {
      throw new Error(
        `uploadLocalFile: File not found at path "${filePath}". Please verify the file exists and the path is correct.`,
      );
    }
    if (error.code === "EACCES") {
      throw new Error(
        `uploadLocalFile: Permission denied accessing file "${filePath}". Please check file permissions.`,
      );
    }
    if (error.code === "EISDIR") {
      throw new Error(
        `uploadLocalFile: Path "${filePath}" is a directory, not a file. Please provide a file path.`,
      );
    }
    if (error.code === "EMFILE" || error.code === "ENFILE") {
      throw new Error(
        `uploadLocalFile: Too many open files. System limit reached. Please close other file handles and try again.`,
      );
    }
    // Generic filesystem error
    throw new Error(
      `uploadLocalFile: Failed to access file "${filePath}": ${error.message || error.code || "Unknown error"}`,
    );
  }

  // Check if it's a file (not a directory)
  if (!stats.isFile()) {
    throw new Error(
      `uploadLocalFile: Path "${filePath}" is not a regular file (isDirectory: ${stats.isDirectory()}, isSymbolicLink: ${stats.isSymbolicLink()}).`,
    );
  }

  // Check file size
  if (stats.size > MAX_FILE_SIZE) {
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    throw new Error(
      `uploadLocalFile: File size (${stats.size} bytes, ${sizeMB} MB) exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (${maxMB} MB). ` +
        `Please use a smaller file or compress the file before uploading.`,
    );
  }

  // Check if file is empty
  if (stats.size === 0) {
    throw new Error(
      `uploadLocalFile: File "${filePath}" is empty (0 bytes). Cannot upload empty files.`,
    );
  }

  // Build upload URL: POST https://content.airtable.com/v0/{baseId}/{recordId}/{fieldId}/uploadAttachment
  // Note: uploadAttachment endpoint uses content.airtable.com, not api.airtable.com
  // The endpoint accepts fieldId (field ID like "fldXXXXXXXXXXXXXX") or fieldName
  // FieldId is preferred and more reliable, but we'll try with fieldName for convenience
  // If fieldName doesn't work, users should pass the fieldId instead
  let uploadUrl: string;
  try {
    const contentApiUrl = client.apiUrl.replace("api.airtable.com", "content.airtable.com").replace(/\/+$/, "");
    const encodedBaseId = encodeURIComponent(client.baseId);
    const encodedRecordId = encodeURIComponent(recordId);
    const encodedFieldName = encodeURIComponent(fieldName);
    uploadUrl = `${contentApiUrl}/${encodedBaseId}/${encodedRecordId}/${encodedFieldName}/uploadAttachment`;
  } catch (error: any) {
    throw new Error(
      `uploadLocalFile: Failed to build upload URL: ${error.message || "Unknown error"}. ` +
        `baseId: "${client.baseId}", recordId: "${recordId}", fieldName: "${fieldName}"`,
    );
  }

  // Read file as Buffer
  let base64: string;
  try {
    // Airtable uploadAttachment expects the file bytes as a base64 string (JSON body)
    const res = await readFileAsBase64(filePath);
    base64 = res.base64;
  } catch (error: any) {
    // Handle read errors with detailed messages
    if (error.code === "ENOENT") {
      throw new Error(
        `uploadLocalFile: File not found at path "${filePath}" while reading. File may have been deleted.`,
      );
    }
    if (error.code === "EACCES") {
      throw new Error(
        `uploadLocalFile: Permission denied reading file "${filePath}". Please check file read permissions.`,
      );
    }
    if (error.code === "EISDIR") {
      throw new Error(
        `uploadLocalFile: Cannot read "${filePath}" - it is a directory, not a file.`,
      );
    }
    if (error.code === "EMFILE" || error.code === "ENFILE") {
      throw new Error(
        `uploadLocalFile: Too many open files while reading "${filePath}". System limit reached.`,
      );
    }
    // Generic read error
    throw new Error(
      `uploadLocalFile: Failed to read file "${filePath}": ${error.message || error.code || "Unknown error"}`,
    );
  }

  // Validate base64 was read correctly
  if (!base64 || base64.length === 0) {
    throw new Error(
      `uploadLocalFile: File "${filePath}" appears to be empty or could not be read properly.`,
    );
  }

  // Make the upload request using JSON body as documented by Airtable:
  // POST https://content.airtable.com/v0/{baseId}/{recordId}/{attachmentFieldIdOrName}/uploadAttachment
  // Body: { contentType, file (base64), filename }
  try {
    const response = await client._request<import("../../core/types/airtable").AirtableRecord<TFields>>(
      uploadUrl,
      "POST",
      {
        contentType: finalContentType,
        file: base64,
        filename: finalFilename,
      },
    );
    return response;
  } catch (error: any) {
    // Enhance HTTP errors with upload-specific context
    if (error instanceof AirtableHttpError) {
      // Create enhanced error message with upload context
      const contextInfo = `Upload failed for file "${finalFilename}" (${stats.size} bytes, ${finalContentType}) ` +
        `to table "${tableName}", record "${recordId}", field "${fieldName}"`;
      
      let enhancedMessage: string;
      
      // Provide specific guidance based on error type
      if (error instanceof AirtableAuthError) {
        enhancedMessage = `${contextInfo}. Authentication failed (${error.status}): ${error.message}. ` +
          `Please verify your Airtable API token has write permissions for this base.`;
      } else if (error instanceof AirtableNotFoundError) {
        enhancedMessage = `${contextInfo}. Resource not found (${error.status}): ${error.message}. ` +
          `Please verify that: 1) The base ID "${client.baseId}" is correct, ` +
          `2) The record ID "${recordId}" exists, ` +
          `3) The table "${tableName}" exists, ` +
          `4) The field "${fieldName}" exists and is an attachment field. ` +
          `Note: If using fieldName, try using the fieldId (e.g., "fldXXXXXXXXXXXXXX") instead.`;
      } else if (error instanceof AirtableValidationError) {
        enhancedMessage = `${contextInfo}. Validation failed (${error.status}): ${error.message}. ` +
          `Common causes: 1) Field "${fieldName}" is not an attachment field, ` +
          `2) File format or size is not supported, ` +
          `3) Field name is invalid (try using fieldId instead), ` +
          `4) Record or field is read-only. ` +
          `Check the error details for more information.`;
      } else if (error instanceof AirtableRateLimitError) {
        enhancedMessage = `${contextInfo}. Rate limit exceeded (${error.status}): ${error.message}. ` +
          `Please wait before retrying the upload. Consider implementing exponential backoff.`;
      } else if (error.status === 400) {
        enhancedMessage = `${contextInfo}. Bad request (${error.status}): ${error.message}. ` +
          `Common causes: 1) Invalid field name "${fieldName}" (try using fieldId like "fldXXXXXXXXXXXXXX"), ` +
          `2) Field is not an attachment field, ` +
          `3) Request body is malformed (must be JSON with { contentType, file (base64), filename }), ` +
          `Check the error details for more information.`;
      } else if (error.status === 413) {
        enhancedMessage = `${contextInfo}. Payload too large (${error.status}): ${error.message}. ` +
          `File size (${stats.size} bytes) may exceed Airtable's limits even if under 5MB. ` +
          `Try compressing the file or using a smaller file.`;
      } else if (error.status >= 500) {
        enhancedMessage = `${contextInfo}. Server error (${error.status}): ${error.message}. ` +
          `This is an Airtable server-side issue. Please retry the upload after a few moments.`;
      } else {
        enhancedMessage = `${contextInfo}. HTTP error (${error.status}): ${error.message}`;
      }

      // Create a new error with enhanced message, preserving all original properties
      const enhancedError = new AirtableHttpError({
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        message: enhancedMessage,
        details: {
          ...(typeof error.details === "object" && error.details !== null ? error.details : {}),
          uploadContext: {
            tableName,
            recordId,
            fieldName,
            filePath,
            filename: finalFilename,
            fileSize: stats.size,
            contentType: finalContentType,
          },
        },
      });

      // Preserve the specific error type if it's a subclass
      if (error instanceof AirtableAuthError) {
        throw new AirtableAuthError(enhancedError);
      } else if (error instanceof AirtableNotFoundError) {
        throw new AirtableNotFoundError(enhancedError);
      } else if (error instanceof AirtableValidationError) {
        throw new AirtableValidationError(enhancedError);
      } else if (error instanceof AirtableRateLimitError) {
        throw new AirtableRateLimitError(enhancedError);
      } else {
        throw enhancedError;
      }
    }

    // Enhance network errors with upload-specific context
    if (error instanceof AirtableNetworkError) {
      const contextInfo = `Network error during upload of file "${finalFilename}" (${stats.size} bytes) ` +
        `to table "${tableName}", record "${recordId}", field "${fieldName}"`;
      
      const enhancedMessage = `${contextInfo}. ${error.message}. ` +
        `This may be a temporary network issue. Please check your internet connection and try again. ` +
        `If the problem persists, the file may be too large for your network connection.`;

      throw new AirtableNetworkError({
        url: error.url,
        message: enhancedMessage,
        details: {
          ...(typeof error.details === "object" && error.details !== null ? error.details : {}),
          uploadContext: {
            tableName,
            recordId,
            fieldName,
            filePath,
            filename: finalFilename,
            fileSize: stats.size,
            contentType: finalContentType,
          },
        },
      });
    }

    // Re-throw any other errors as-is
    throw error;
  }
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
