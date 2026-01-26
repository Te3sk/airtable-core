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