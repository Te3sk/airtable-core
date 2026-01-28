import {
  leadFromRecord,
  leadToFields
} from "../chunk-IMLSMXJQ.js";

// src/server/client/request.ts
var AirtableHttpError = class extends Error {
  status;
  statusText;
  url;
  details;
  constructor(args) {
    super(args.message);
    this.name = "AirtableHttpError";
    this.status = args.status;
    this.statusText = args.statusText;
    this.url = args.url;
    this.details = args.details;
  }
};
var AirtableAuthError = class extends AirtableHttpError {
  constructor(base) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableAuthError";
  }
};
var AirtableRateLimitError = class extends AirtableHttpError {
  constructor(base) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableRateLimitError";
  }
};
var AirtableNotFoundError = class extends AirtableHttpError {
  constructor(base) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableNotFoundError";
  }
};
var AirtableValidationError = class extends AirtableHttpError {
  constructor(base) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableValidationError";
  }
};
var AirtableNetworkError = class extends AirtableHttpError {
  constructor(args) {
    super({ status: 503, statusText: "Network Error", url: args.url, message: args.message, details: args.details });
    this.name = "AirtableNetworkError";
  }
};
function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return void 0;
  }
}
function normalizeErrorMessage(status, statusText, details) {
  if (details && typeof details === "object") {
    const anyDetails = details;
    const msg = anyDetails?.error?.message;
    const typ = anyDetails?.error?.type;
    if (typeof msg === "string" && typeof typ === "string") return `${typ}: ${msg}`;
    if (typeof msg === "string") return msg;
  }
  return `${status} ${statusText}`.trim();
}
function toSpecificError(err) {
  if (err.status === 401 || err.status === 403) return new AirtableAuthError(err);
  if (err.status === 404) return new AirtableNotFoundError(err);
  if (err.status === 422) return new AirtableValidationError(err);
  if (err.status === 429) return new AirtableRateLimitError(err);
  return err;
}
async function airtableRequest(args) {
  const { url, method, config, body } = args;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json"
      },
      body: body === void 0 ? void 0 : JSON.stringify(body)
    });
    const contentType = res.headers.get("content-type") ?? "";
    const rawText = await res.text();
    const parsed = contentType.includes("application/json") ? safeJsonParse(rawText) : rawText;
    if (!res.ok) {
      const message = normalizeErrorMessage(res.status, res.statusText, parsed);
      const baseErr = new AirtableHttpError({
        status: res.status,
        statusText: res.statusText,
        url,
        message,
        details: parsed
      });
      throw toSpecificError(baseErr);
    }
    return parsed ?? rawText;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new AirtableHttpError({
        status: 408,
        statusText: "Request Timeout",
        url,
        message: `Request timed out after ${config.timeoutMs}ms`
      });
    }
    if (err instanceof AirtableHttpError) {
      throw err;
    }
    const msg = typeof err?.message === "string" ? err.message : "Network request failed";
    throw new AirtableNetworkError({ url, message: msg, details: err });
  } finally {
    clearTimeout(timeout);
  }
}

// src/server/client/endpoints.ts
var DEFAULT_AIRTABLE_API_URL = "https://api.airtable.com/v0";
function buildBaseUrl(apiUrl, baseId) {
  const trimmed = apiUrl.replace(/\/+$/, "");
  return `${trimmed}/${encodeURIComponent(baseId)}`;
}
function buildTablePath(tableName) {
  return `/${encodeURIComponent(tableName)}`;
}
function buildRecordPath(tableName, recordId) {
  return `${buildTablePath(tableName)}/${encodeURIComponent(recordId)}`;
}
function buildListQuery(params) {
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

// src/server/client/createClient.ts
function createAirtableClient(config) {
  const apiUrl = config.apiUrl ?? DEFAULT_AIRTABLE_API_URL;
  const timeoutMs = config.timeoutMs ?? 15e3;
  if (!config.token)
    throw new Error("createAirtableClient: `token` is required");
  if (!config.baseId)
    throw new Error("createAirtableClient: `baseId` is required");
  const baseUrl = buildBaseUrl(apiUrl, config.baseId);
  const reqConfig = {
    token: config.token,
    timeoutMs
  };
  async function listRecords(tableName, params) {
    const url = `${baseUrl}${buildTablePath(tableName)}${buildListQuery(params)}`;
    return airtableRequest({
      url,
      method: "GET",
      config: reqConfig
    });
  }
  return {
    baseId: config.baseId,
    apiUrl,
    listRecords,
    listPage: listRecords,
    async getRecord(tableName, recordId) {
      const url = `${baseUrl}${buildRecordPath(tableName, recordId)}`;
      return airtableRequest({
        url,
        method: "GET",
        config: reqConfig
      });
    },
    async createRecord(tableName, fields) {
      const url = `${baseUrl}${buildTablePath(tableName)}`;
      return airtableRequest({
        url,
        method: "POST",
        config: reqConfig,
        body: { fields }
      });
    },
    async updateRecord(tableName, recordId, fields) {
      const url = `${baseUrl}${buildRecordPath(tableName, recordId)}`;
      return airtableRequest({
        url,
        method: "PATCH",
        config: reqConfig,
        body: { fields }
      });
    },
    async deleteRecord(tableName, recordId) {
      const url = `${baseUrl}${buildRecordPath(tableName, recordId)}`;
      return airtableRequest({
        url,
        method: "DELETE",
        config: reqConfig
      });
    },
    async _request(url, method, body) {
      return airtableRequest({
        url,
        method,
        config: reqConfig,
        body
      });
    },
    async _requestMultipart(url, formData) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), reqConfig.timeoutMs);
      try {
        const res = await fetch(url, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${reqConfig.token}`
            // Don't set Content-Type - browser/fetch will set it with boundary for multipart/form-data
          },
          body: formData
        });
        const contentType = res.headers.get("content-type") ?? "";
        const rawText = await res.text();
        const parsed = contentType.includes("application/json") ? JSON.parse(rawText) : rawText;
        if (!res.ok) {
          const message = typeof parsed === "object" && parsed !== null && "error" in parsed && typeof parsed.error === "object" && parsed.error?.message ? parsed.error.message : `Request failed with status ${res.status}`;
          const baseErr = new AirtableHttpError({
            status: res.status,
            statusText: res.statusText,
            url,
            message,
            details: parsed
          });
          throw baseErr;
        }
        return parsed ?? rawText;
      } catch (err) {
        if (err?.name === "AbortError") {
          throw new AirtableHttpError({
            status: 408,
            statusText: "Request Timeout",
            url,
            message: `Request timed out after ${reqConfig.timeoutMs}ms`
          });
        }
        if (err instanceof AirtableHttpError) {
          throw err;
        }
        const msg = typeof err?.message === "string" ? err.message : "Network request failed";
        throw new AirtableNetworkError({ url, message: msg, details: err });
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

// src/server/client/pagination.ts
async function listAllRecords(args) {
  const { client, tableName, params, options } = args;
  const maxTotalRecords = options?.maxTotalRecords ?? 1e4;
  const out = [];
  let offset = void 0;
  while (true) {
    const page = await client.listRecords(tableName, {
      ...params ?? {},
      offset
    });
    out.push(...page.records);
    if (out.length > maxTotalRecords) {
      throw new Error(
        `listAllRecords: exceeded maxTotalRecords (${maxTotalRecords}). Add filters or increase the limit explicitly.`
      );
    }
    if (!page.offset) break;
    offset = page.offset;
  }
  return out;
}

// src/server/client/attachments.ts
import { promises as fs } from "fs";
import { extname } from "path";
var MAX_FILE_SIZE = 5 * 1024 * 1024;
var MIME_TYPES = {
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
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
};
function getMimeTypeFromExtension(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}
function getFilenameFromPath(filePath) {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || "file";
}
function isUrl(str) {
  return str.startsWith("http://") || str.startsWith("https://");
}
async function uploadLocalFile(client, tableName, recordId, fieldName, filePath, filename, contentType) {
  if (!tableName || typeof tableName !== "string" || tableName.trim().length === 0) {
    throw new Error(
      `uploadLocalFile: Invalid tableName. Expected non-empty string, got: ${JSON.stringify(tableName)}`
    );
  }
  if (!recordId || typeof recordId !== "string" || recordId.trim().length === 0) {
    throw new Error(
      `uploadLocalFile: Invalid recordId. Expected non-empty string, got: ${JSON.stringify(recordId)}`
    );
  }
  if (!fieldName || typeof fieldName !== "string" || fieldName.trim().length === 0) {
    throw new Error(
      `uploadLocalFile: Invalid fieldName. Expected non-empty string, got: ${JSON.stringify(fieldName)}`
    );
  }
  if (!filePath || typeof filePath !== "string" || filePath.trim().length === 0) {
    throw new Error(
      `uploadLocalFile: Invalid filePath. Expected non-empty string, got: ${JSON.stringify(filePath)}`
    );
  }
  const finalFilename = filename || getFilenameFromPath(filePath);
  if (!finalFilename || finalFilename.trim().length === 0) {
    throw new Error(
      `uploadLocalFile: Cannot determine filename from filePath "${filePath}". Please provide a valid filename parameter.`
    );
  }
  const finalContentType = contentType || getMimeTypeFromExtension(filePath);
  let stats;
  try {
    stats = await fs.stat(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        `uploadLocalFile: File not found at path "${filePath}". Please verify the file exists and the path is correct.`
      );
    }
    if (error.code === "EACCES") {
      throw new Error(
        `uploadLocalFile: Permission denied accessing file "${filePath}". Please check file permissions.`
      );
    }
    if (error.code === "EISDIR") {
      throw new Error(
        `uploadLocalFile: Path "${filePath}" is a directory, not a file. Please provide a file path.`
      );
    }
    if (error.code === "EMFILE" || error.code === "ENFILE") {
      throw new Error(
        `uploadLocalFile: Too many open files. System limit reached. Please close other file handles and try again.`
      );
    }
    throw new Error(
      `uploadLocalFile: Failed to access file "${filePath}": ${error.message || error.code || "Unknown error"}`
    );
  }
  if (!stats.isFile()) {
    throw new Error(
      `uploadLocalFile: Path "${filePath}" is not a regular file (isDirectory: ${stats.isDirectory()}, isSymbolicLink: ${stats.isSymbolicLink()}).`
    );
  }
  if (stats.size > MAX_FILE_SIZE) {
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    throw new Error(
      `uploadLocalFile: File size (${stats.size} bytes, ${sizeMB} MB) exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (${maxMB} MB). Please use a smaller file or compress the file before uploading.`
    );
  }
  if (stats.size === 0) {
    throw new Error(
      `uploadLocalFile: File "${filePath}" is empty (0 bytes). Cannot upload empty files.`
    );
  }
  let uploadUrl;
  try {
    const contentApiUrl = client.apiUrl.replace("api.airtable.com", "content.airtable.com").replace(/\/+$/, "");
    const encodedBaseId = encodeURIComponent(client.baseId);
    const encodedRecordId = encodeURIComponent(recordId);
    const encodedFieldName = encodeURIComponent(fieldName);
    uploadUrl = `${contentApiUrl}/${encodedBaseId}/${encodedRecordId}/${encodedFieldName}/uploadAttachment`;
  } catch (error) {
    throw new Error(
      `uploadLocalFile: Failed to build upload URL: ${error.message || "Unknown error"}. baseId: "${client.baseId}", recordId: "${recordId}", fieldName: "${fieldName}"`
    );
  }
  let buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        `uploadLocalFile: File not found at path "${filePath}" while reading. File may have been deleted.`
      );
    }
    if (error.code === "EACCES") {
      throw new Error(
        `uploadLocalFile: Permission denied reading file "${filePath}". Please check file read permissions.`
      );
    }
    if (error.code === "EISDIR") {
      throw new Error(
        `uploadLocalFile: Cannot read "${filePath}" - it is a directory, not a file.`
      );
    }
    if (error.code === "EMFILE" || error.code === "ENFILE") {
      throw new Error(
        `uploadLocalFile: Too many open files while reading "${filePath}". System limit reached.`
      );
    }
    throw new Error(
      `uploadLocalFile: Failed to read file "${filePath}": ${error.message || error.code || "Unknown error"}`
    );
  }
  if (!buffer || buffer.length === 0) {
    throw new Error(
      `uploadLocalFile: File "${filePath}" appears to be empty or could not be read properly.`
    );
  }
  let formData;
  try {
    formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: finalContentType });
    formData.append("file", blob, finalFilename);
  } catch (error) {
    throw new Error(
      `uploadLocalFile: Failed to create FormData for file "${filePath}": ${error.message || "Unknown error"}`
    );
  }
  try {
    const response = await client._requestMultipart(
      uploadUrl,
      formData
    );
    return response;
  } catch (error) {
    if (error instanceof AirtableHttpError) {
      const contextInfo = `Upload failed for file "${finalFilename}" (${stats.size} bytes, ${finalContentType}) to table "${tableName}", record "${recordId}", field "${fieldName}"`;
      let enhancedMessage;
      if (error instanceof AirtableAuthError) {
        enhancedMessage = `${contextInfo}. Authentication failed (${error.status}): ${error.message}. Please verify your Airtable API token has write permissions for this base.`;
      } else if (error instanceof AirtableNotFoundError) {
        enhancedMessage = `${contextInfo}. Resource not found (${error.status}): ${error.message}. Please verify that: 1) The base ID "${client.baseId}" is correct, 2) The record ID "${recordId}" exists, 3) The table "${tableName}" exists, 4) The field "${fieldName}" exists and is an attachment field. Note: If using fieldName, try using the fieldId (e.g., "fldXXXXXXXXXXXXXX") instead.`;
      } else if (error instanceof AirtableValidationError) {
        enhancedMessage = `${contextInfo}. Validation failed (${error.status}): ${error.message}. Common causes: 1) Field "${fieldName}" is not an attachment field, 2) File format or size is not supported, 3) Field name is invalid (try using fieldId instead), 4) Record or field is read-only. Check the error details for more information.`;
      } else if (error instanceof AirtableRateLimitError) {
        enhancedMessage = `${contextInfo}. Rate limit exceeded (${error.status}): ${error.message}. Please wait before retrying the upload. Consider implementing exponential backoff.`;
      } else if (error.status === 400) {
        enhancedMessage = `${contextInfo}. Bad request (${error.status}): ${error.message}. Common causes: 1) Invalid field name "${fieldName}" (try using fieldId like "fldXXXXXXXXXXXXXX"), 2) File format not supported, 3) Malformed request. Check the error details for more information.`;
      } else if (error.status === 413) {
        enhancedMessage = `${contextInfo}. Payload too large (${error.status}): ${error.message}. File size (${stats.size} bytes) may exceed Airtable's limits even if under 5MB. Try compressing the file or using a smaller file.`;
      } else if (error.status >= 500) {
        enhancedMessage = `${contextInfo}. Server error (${error.status}): ${error.message}. This is an Airtable server-side issue. Please retry the upload after a few moments.`;
      } else {
        enhancedMessage = `${contextInfo}. HTTP error (${error.status}): ${error.message}`;
      }
      const enhancedError = new AirtableHttpError({
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        message: enhancedMessage,
        details: {
          ...typeof error.details === "object" && error.details !== null ? error.details : {},
          uploadContext: {
            tableName,
            recordId,
            fieldName,
            filePath,
            filename: finalFilename,
            fileSize: stats.size,
            contentType: finalContentType
          }
        }
      });
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
    if (error instanceof AirtableNetworkError) {
      const contextInfo = `Network error during upload of file "${finalFilename}" (${stats.size} bytes) to table "${tableName}", record "${recordId}", field "${fieldName}"`;
      const enhancedMessage = `${contextInfo}. ${error.message}. This may be a temporary network issue. Please check your internet connection and try again. If the problem persists, the file may be too large for your network connection.`;
      throw new AirtableNetworkError({
        url: error.url,
        message: enhancedMessage,
        details: {
          ...typeof error.details === "object" && error.details !== null ? error.details : {},
          uploadContext: {
            tableName,
            recordId,
            fieldName,
            filePath,
            filename: finalFilename,
            fileSize: stats.size,
            contentType: finalContentType
          }
        }
      });
    }
    throw error;
  }
}
async function addAttachmentToRecord(args) {
  const { client, tableName, recordId, fieldName, attachment, url, filePath, filename, contentType, size, type } = args;
  const attachmentObj = attachment || {
    url,
    filePath,
    filename,
    size,
    type: type || contentType
    // Support both 'type' and 'contentType' for convenience
  };
  if (!attachmentObj.url && !attachmentObj.filePath) {
    throw new Error(
      "addAttachmentToRecord: Either 'url' or 'filePath' must be provided (either in attachment object or as direct parameters)"
    );
  }
  if (attachmentObj.filePath) {
    return uploadLocalFile(
      client,
      tableName,
      recordId,
      fieldName,
      attachmentObj.filePath,
      attachmentObj.filename,
      attachmentObj.type
    );
  }
  if (!attachmentObj.url) {
    throw new Error("addAttachmentToRecord: 'url' is required when 'filePath' is not provided");
  }
  if (!isUrl(attachmentObj.url)) {
    throw new Error(
      `addAttachmentToRecord: Invalid URL format. URL must start with 'http://' or 'https://'. Got: ${attachmentObj.url}`
    );
  }
  const currentRecord = await client.getRecord(tableName, recordId);
  const existingAttachments = currentRecord.fields[fieldName] ?? [];
  const updatedAttachments = [...existingAttachments, attachmentObj];
  return client.updateRecord(tableName, recordId, {
    [fieldName]: updatedAttachments
  });
}

// src/server/repos/createTableRepo.ts
function createTableRepo(args) {
  const { client, tableName, mapper } = args;
  return {
    async listPage(params) {
      const page = await client.listRecords(tableName, params);
      return {
        records: page.records.map(mapper.fromRecord),
        offset: page.offset
      };
    },
    async listAll(params, options) {
      const records = await listAllRecords({
        client,
        tableName,
        params,
        options
      });
      return records.map(mapper.fromRecord);
    },
    async get(recordId) {
      const record = await client.getRecord(tableName, recordId);
      return mapper.fromRecord(record);
    },
    async create(model) {
      const fields = mapper.toFields(model);
      const record = await client.createRecord(tableName, fields);
      return mapper.fromRecord(record);
    },
    async update(recordId, patch) {
      const fields = mapper.toFields(patch);
      const record = await client.updateRecord(tableName, recordId, fields);
      return mapper.fromRecord(record);
    },
    async delete(recordId) {
      return client.deleteRecord(tableName, recordId);
    }
  };
}

// src/server/repos/leadsRepo.ts
function createLeadsRepo(args) {
  return createTableRepo({
    client: args.client,
    tableName: args.tableName ?? "Leads",
    mapper: {
      toFields: leadToFields,
      fromRecord: leadFromRecord
    }
  });
}
export {
  AirtableAuthError,
  AirtableHttpError,
  AirtableNetworkError,
  AirtableNotFoundError,
  AirtableRateLimitError,
  AirtableValidationError,
  DEFAULT_AIRTABLE_API_URL,
  addAttachmentToRecord,
  airtableRequest,
  buildBaseUrl,
  buildListQuery,
  buildRecordPath,
  buildTablePath,
  createAirtableClient,
  createLeadsRepo,
  createTableRepo,
  listAllRecords
};
//# sourceMappingURL=index.js.map