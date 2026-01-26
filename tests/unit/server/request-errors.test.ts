import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  airtableRequest,
  AirtableHttpError,
  AirtableAuthError,
  AirtableRateLimitError,
  AirtableNotFoundError,
  AirtableValidationError
} from "../../../src/server/client/request";

function mockFetchOnce(args: {
  ok: boolean;
  status: number;
  statusText: string;
  body: unknown;
  contentType?: string;
}) {
  (globalThis as any).fetch = vi.fn(async () => {
    const text = typeof args.body === "string" ? args.body : JSON.stringify(args.body);
    return {
      ok: args.ok,
      status: args.status,
      statusText: args.statusText,
      headers: {
        get: (k: string) => (k.toLowerCase() === "content-type" ? (args.contentType ?? "application/json") : null),
      },
      text: async () => text,
    };
  });
}

describe("airtableRequest error normalization", () => {
  const baseArgs = {
    url: "https://api.airtable.com/v0/app123/Table",
    method: "GET" as const,
    config: { token: "pat_test", timeoutMs: 1000 }
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("throws AirtableHttpError with normalized message from Airtable error payload", async () => {
    mockFetchOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      body: { error: { type: "INVALID_REQUEST_UNKNOWN", message: "Something went wrong" } }
    });

    await expect(airtableRequest({ ...baseArgs })).rejects.toMatchObject({
      name: "AirtableHttpError",
      status: 400
    });

    // Test again with a fresh mock to check message details
    mockFetchOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      body: { error: { type: "INVALID_REQUEST_UNKNOWN", message: "Something went wrong" } }
    });

    try {
      await airtableRequest({ ...baseArgs });
    } catch (e: any) {
      expect(e).toBeInstanceOf(AirtableHttpError);
      expect(e.message).toContain("INVALID_REQUEST_UNKNOWN");
      expect(e.message).toContain("Something went wrong");
      expect(e.url).toBe(baseArgs.url);
    }
  });

  it("maps 401/403 to AirtableAuthError", async () => {
    mockFetchOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      body: { error: { type: "AUTHENTICATION_REQUIRED", message: "Invalid token" } }
    });

    await expect(airtableRequest({ ...baseArgs })).rejects.toBeInstanceOf(AirtableAuthError);
  });

  it("maps 429 to AirtableRateLimitError", async () => {
    mockFetchOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      body: { error: { type: "TOO_MANY_REQUESTS", message: "Rate limit" } }
    });

    await expect(airtableRequest({ ...baseArgs })).rejects.toBeInstanceOf(AirtableRateLimitError);
  });

  it("maps 404 to AirtableNotFoundError", async () => {
    mockFetchOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      body: { error: { type: "NOT_FOUND", message: "Record not found" } }
    });

    await expect(airtableRequest({ ...baseArgs })).rejects.toBeInstanceOf(AirtableNotFoundError);
  });

  it("maps 422 to AirtableValidationError", async () => {
    mockFetchOnce({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      body: { error: { type: "INVALID_VALUE_FOR_COLUMN", message: "Invalid value" } }
    });

    await expect(airtableRequest({ ...baseArgs })).rejects.toBeInstanceOf(AirtableValidationError);
  });

  it("normalizes non-JSON error bodies too", async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      body: "server exploded",
      contentType: "text/plain"
    });

    await expect(airtableRequest({ ...baseArgs })).rejects.toBeInstanceOf(AirtableHttpError);
  });

  it("normalizes AbortError to AirtableHttpError 408", async () => {
    (globalThis as any).fetch = vi.fn(() => new Promise((_, reject) => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));

    await expect(airtableRequest({ ...baseArgs, config: { ...baseArgs.config, timeoutMs: 10 } })).rejects.toMatchObject({
      name: "AirtableHttpError",
      status: 408
    });
  });
});
