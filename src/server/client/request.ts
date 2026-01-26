export type AirtableRequestConfig = {
  token: string;
  timeoutMs: number;
};

export class AirtableHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly details?: unknown;

  constructor(args: { status: number; statusText: string; url: string; message: string; details?: unknown }) {
    super(args.message);
    this.name = "AirtableHttpError";
    this.status = args.status;
    this.statusText = args.statusText;
    this.url = args.url;
    this.details = args.details;
  }
}

/** Optional specific errors (DX) */
export class AirtableAuthError extends AirtableHttpError {
  constructor(base: AirtableHttpError) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableAuthError";
  }
}

export class AirtableRateLimitError extends AirtableHttpError {
  constructor(base: AirtableHttpError) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableRateLimitError";
  }
}

export class AirtableNotFoundError extends AirtableHttpError {
  constructor(base: AirtableHttpError) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableNotFoundError";
  }
}

export class AirtableValidationError extends AirtableHttpError {
  constructor(base: AirtableHttpError) {
    super({ status: base.status, statusText: base.statusText, url: base.url, message: base.message, details: base.details });
    this.name = "AirtableValidationError";
  }
}

/**
 * Represents network/transport failures (DNS, connection reset, etc.).
 * We keep it as a normalized AirtableHttpError with a synthetic status.
 */
export class AirtableNetworkError extends AirtableHttpError {
  constructor(args: { url: string; message: string; details?: unknown }) {
    super({ status: 503, statusText: "Network Error", url: args.url, message: args.message, details: args.details });
    this.name = "AirtableNetworkError";
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function normalizeErrorMessage(status: number, statusText: string, details?: unknown): string {
  // Airtable often returns: { error: { type, message } }
  if (details && typeof details === "object") {
    const anyDetails = details as any;
    const msg = anyDetails?.error?.message;
    const typ = anyDetails?.error?.type;
    if (typeof msg === "string" && typeof typ === "string") return `${typ}: ${msg}`;
    if (typeof msg === "string") return msg;
  }
  return `${status} ${statusText}`.trim();
}

function toSpecificError(err: AirtableHttpError): AirtableHttpError {
  if (err.status === 401 || err.status === 403) return new AirtableAuthError(err);
  if (err.status === 404) return new AirtableNotFoundError(err);
  if (err.status === 422) return new AirtableValidationError(err);
  if (err.status === 429) return new AirtableRateLimitError(err);
  return err;
}

export async function airtableRequest<TResponse>(args: {
  url: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  config: AirtableRequestConfig;
  body?: unknown;
}): Promise<TResponse> {
  const { url, method, config, body } = args;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
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
        details: parsed,
      });
      throw toSpecificError(baseErr);
    }

    return (parsed as TResponse) ?? (rawText as unknown as TResponse);
  } catch (err: any) {
    // Timeout / Abort normalization
    if (err?.name === "AbortError") {
      throw new AirtableHttpError({
        status: 408,
        statusText: "Request Timeout",
        url,
        message: `Request timed out after ${config.timeoutMs}ms`,
      });
    }

    // If it's already normalized, keep it
    if (err instanceof AirtableHttpError) {
      throw err;
    }

    // Normalize fetch/network errors (TypeError in many runtimes)
    const msg = typeof err?.message === "string" ? err.message : "Network request failed";
    throw new AirtableNetworkError({ url, message: msg, details: err });
  } finally {
    clearTimeout(timeout);
  }
}
