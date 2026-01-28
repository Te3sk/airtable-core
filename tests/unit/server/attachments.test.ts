import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addAttachmentToRecord, type AirtableAttachment } from "../../../src/server/client/attachments";
import type { AirtableClient } from "../../../src/server/client/createClient";
import type { AirtableRecord } from "../../../src/core/types/airtable";
import { promises as fs } from "fs";

// Mock fs module
vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(),
    stat: vi.fn(),
  },
}));

describe("addAttachmentToRecord", () => {
  let mockClient: AirtableClient;
  let mockGetRecord: ReturnType<typeof vi.fn>;
  let mockUpdateRecord: ReturnType<typeof vi.fn>;
  let mockRequestMultipart: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock client methods
    mockGetRecord = vi.fn();
    mockUpdateRecord = vi.fn();
    mockRequestMultipart = vi.fn();

    mockClient = {
      baseId: "app123",
      apiUrl: "https://api.airtable.com/v0",
      getRecord: mockGetRecord,
      updateRecord: mockUpdateRecord,
      _requestMultipart: mockRequestMultipart,
    } as unknown as AirtableClient;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("with URL attachment", () => {
    it("should add attachment to record with empty attachment field", async () => {
      const currentRecord: AirtableRecord = {
        id: "rec123",
        fields: {},
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      const updatedRecord: AirtableRecord = {
        id: "rec123",
        fields: {
          Attachments: [
            {
              url: "https://example.com/file.pdf",
              filename: "file.pdf",
              type: "application/pdf",
            },
          ],
        },
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      mockGetRecord.mockResolvedValue(currentRecord);
      mockUpdateRecord.mockResolvedValue(updatedRecord);

      const result = await addAttachmentToRecord({
        client: mockClient,
        tableName: "Documents",
        recordId: "rec123",
        fieldName: "Attachments",
        url: "https://example.com/file.pdf",
        filename: "file.pdf",
        type: "application/pdf",
      });

      expect(mockGetRecord).toHaveBeenCalledWith("Documents", "rec123");
      expect(mockUpdateRecord).toHaveBeenCalledWith("Documents", "rec123", {
        Attachments: [
          {
            url: "https://example.com/file.pdf",
            filename: "file.pdf",
            type: "application/pdf",
          },
        ],
      });
      expect(result).toEqual(updatedRecord);
    });

    it("should append attachment to existing attachments", async () => {
      const existingAttachments: AirtableAttachment[] = [
        {
          url: "https://example.com/existing.pdf",
          filename: "existing.pdf",
          type: "application/pdf",
        },
      ];

      const currentRecord: AirtableRecord = {
        id: "rec123",
        fields: {
          Attachments: existingAttachments,
        },
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      const updatedRecord: AirtableRecord = {
        id: "rec123",
        fields: {
          Attachments: [
            ...existingAttachments,
            {
              url: "https://example.com/new.pdf",
              filename: "new.pdf",
              type: "application/pdf",
            },
          ],
        },
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      mockGetRecord.mockResolvedValue(currentRecord);
      mockUpdateRecord.mockResolvedValue(updatedRecord);

      const result = await addAttachmentToRecord({
        client: mockClient,
        tableName: "Documents",
        recordId: "rec123",
        fieldName: "Attachments",
        url: "https://example.com/new.pdf",
        filename: "new.pdf",
        type: "application/pdf",
      });

      expect(mockGetRecord).toHaveBeenCalledWith("Documents", "rec123");
      expect(mockUpdateRecord).toHaveBeenCalledWith("Documents", "rec123", {
        Attachments: [
          ...existingAttachments,
          {
            url: "https://example.com/new.pdf",
            filename: "new.pdf",
            type: "application/pdf",
          },
        ],
      });
      expect(result).toEqual(updatedRecord);
    });

    it("should work with attachment object parameter", async () => {
      const currentRecord: AirtableRecord = {
        id: "rec123",
        fields: {},
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      const updatedRecord: AirtableRecord = {
        id: "rec123",
        fields: {
          Attachments: [
            {
              url: "https://example.com/file.pdf",
              filename: "file.pdf",
              type: "application/pdf",
            },
          ],
        },
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      const attachment: AirtableAttachment = {
        url: "https://example.com/file.pdf",
        filename: "file.pdf",
        type: "application/pdf",
      };

      mockGetRecord.mockResolvedValue(currentRecord);
      mockUpdateRecord.mockResolvedValue(updatedRecord);

      const result = await addAttachmentToRecord({
        client: mockClient,
        tableName: "Documents",
        recordId: "rec123",
        fieldName: "Attachments",
        attachment,
      });

      expect(mockGetRecord).toHaveBeenCalledWith("Documents", "rec123");
      expect(mockUpdateRecord).toHaveBeenCalledWith("Documents", "rec123", {
        Attachments: [attachment],
      });
      expect(result).toEqual(updatedRecord);
    });

    it("should reject invalid URL format", async () => {
      await expect(
        addAttachmentToRecord({
          client: mockClient,
          tableName: "Documents",
          recordId: "rec123",
          fieldName: "Attachments",
          url: "not-a-url",
        }),
      ).rejects.toThrow("Invalid URL format. URL must start with 'http://' or 'https://'");
    });

    it("should accept http:// URLs", async () => {
      const currentRecord: AirtableRecord = {
        id: "rec123",
        fields: {},
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      const updatedRecord: AirtableRecord = {
        id: "rec123",
        fields: {
          Attachments: [
            {
              url: "http://example.com/file.pdf",
              filename: "file.pdf",
            },
          ],
        },
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      mockGetRecord.mockResolvedValue(currentRecord);
      mockUpdateRecord.mockResolvedValue(updatedRecord);

      await addAttachmentToRecord({
        client: mockClient,
        tableName: "Documents",
        recordId: "rec123",
        fieldName: "Attachments",
        url: "http://example.com/file.pdf",
        filename: "file.pdf",
      });

      expect(mockGetRecord).toHaveBeenCalled();
      expect(mockUpdateRecord).toHaveBeenCalled();
    });
  });

  describe("with filePath attachment", () => {
    it("should upload local file using multipart request", async () => {
      const filePath = "/path/to/file.pdf";
      const fileBuffer = Buffer.from("fake pdf content");
      const fileStats = { size: 1024 };

      const updatedRecord: AirtableRecord = {
        id: "rec123",
        fields: {
          Attachments: [
            {
              url: "https://dl.airtable.com/.attachments/file.pdf",
              filename: "file.pdf",
              type: "application/pdf",
            },
          ],
        },
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      vi.mocked(fs.stat).mockResolvedValue(fileStats as any);
      vi.mocked(fs.readFile).mockResolvedValue(fileBuffer);
      mockRequestMultipart.mockResolvedValue(updatedRecord);

      const result = await addAttachmentToRecord({
        client: mockClient,
        tableName: "Documents",
        recordId: "rec123",
        fieldName: "Attachments",
        filePath,
        filename: "file.pdf",
        type: "application/pdf",
      });

      expect(fs.stat).toHaveBeenCalledWith(filePath);
      expect(fs.readFile).toHaveBeenCalledWith(filePath);
      expect(mockRequestMultipart).toHaveBeenCalled();
      
      // Verify the upload URL is correct
      const uploadUrl = mockRequestMultipart.mock.calls[0][0];
      expect(uploadUrl).toContain("content.airtable.com");
      expect(uploadUrl).toContain("app123");
      expect(uploadUrl).toContain("rec123");
      expect(uploadUrl).toContain("Attachments");
      expect(uploadUrl).toContain("uploadAttachment");

      expect(result).toEqual(updatedRecord);
    });

    it("should extract filename from filePath if not provided", async () => {
      const filePath = "/path/to/document.pdf";
      const fileBuffer = Buffer.from("fake pdf content");
      const fileStats = { size: 1024 };

      const updatedRecord: AirtableRecord = {
        id: "rec123",
        fields: {
          Attachments: [
            {
              url: "https://dl.airtable.com/.attachments/document.pdf",
              filename: "document.pdf",
              type: "application/pdf",
            },
          ],
        },
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      vi.mocked(fs.stat).mockResolvedValue(fileStats as any);
      vi.mocked(fs.readFile).mockResolvedValue(fileBuffer);
      mockRequestMultipart.mockResolvedValue(updatedRecord);

      await addAttachmentToRecord({
        client: mockClient,
        tableName: "Documents",
        recordId: "rec123",
        fieldName: "Attachments",
        filePath,
        type: "application/pdf",
      });

      expect(fs.readFile).toHaveBeenCalledWith(filePath);
      expect(mockRequestMultipart).toHaveBeenCalled();
    });

    it("should infer MIME type from file extension", async () => {
      const filePath = "/path/to/image.png";
      const fileBuffer = Buffer.from("fake image content");
      const fileStats = { size: 2048 };

      const updatedRecord: AirtableRecord = {
        id: "rec123",
        fields: {
          Attachments: [
            {
              url: "https://dl.airtable.com/.attachments/image.png",
              filename: "image.png",
              type: "image/png",
            },
          ],
        },
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      vi.mocked(fs.stat).mockResolvedValue(fileStats as any);
      vi.mocked(fs.readFile).mockResolvedValue(fileBuffer);
      mockRequestMultipart.mockResolvedValue(updatedRecord);

      await addAttachmentToRecord({
        client: mockClient,
        tableName: "Documents",
        recordId: "rec123",
        fieldName: "Attachments",
        filePath,
      });

      expect(mockRequestMultipart).toHaveBeenCalled();
      const formData = mockRequestMultipart.mock.calls[0][1];
      expect(formData).toBeInstanceOf(FormData);
    });

    it("should reject file larger than 5MB", async () => {
      const filePath = "/path/to/large-file.pdf";
      const fileStats = { size: 6 * 1024 * 1024 }; // 6MB

      vi.mocked(fs.stat).mockResolvedValue(fileStats as any);

      await expect(
        addAttachmentToRecord({
          client: mockClient,
          tableName: "Documents",
          recordId: "rec123",
          fieldName: "Attachments",
          filePath,
        }),
      ).rejects.toThrow("exceeds maximum allowed size of 5242880 bytes (5MB)");
    });

    it("should handle file not found error from fs.stat", async () => {
      const filePath = "/path/to/nonexistent.pdf";
      const error = new Error("ENOENT: no such file or directory");
      (error as any).code = "ENOENT";

      vi.mocked(fs.stat).mockRejectedValue(error);

      await expect(
        addAttachmentToRecord({
          client: mockClient,
          tableName: "Documents",
          recordId: "rec123",
          fieldName: "Attachments",
          filePath,
        }),
      ).rejects.toThrow("ENOENT: no such file or directory");
    });

    it("should propagate file read error from fs.readFile", async () => {
      const filePath = "/path/to/nonexistent.pdf";
      const fileStats = { size: 1024 };
      const readError = new Error("ENOENT: no such file or directory");
      (readError as any).code = "ENOENT";

      vi.mocked(fs.stat).mockResolvedValue(fileStats as any);
      vi.mocked(fs.readFile).mockRejectedValue(readError);

      await expect(
        addAttachmentToRecord({
          client: mockClient,
          tableName: "Documents",
          recordId: "rec123",
          fieldName: "Attachments",
          filePath,
        }),
      ).rejects.toThrow("ENOENT: no such file or directory");
    });
  });

  describe("validation", () => {
    it("should reject when neither url nor filePath is provided", async () => {
      await expect(
        addAttachmentToRecord({
          client: mockClient,
          tableName: "Documents",
          recordId: "rec123",
          fieldName: "Attachments",
        }),
      ).rejects.toThrow("Either 'url' or 'filePath' must be provided");
    });

    it("should reject when attachment object has neither url nor filePath", async () => {
      await expect(
        addAttachmentToRecord({
          client: mockClient,
          tableName: "Documents",
          recordId: "rec123",
          fieldName: "Attachments",
          attachment: {
            filename: "file.pdf",
          },
        }),
      ).rejects.toThrow("Either 'url' or 'filePath' must be provided");
    });

    it("should prioritize filePath over url", async () => {
      const filePath = "/path/to/file.pdf";
      const fileBuffer = Buffer.from("fake pdf content");
      const fileStats = { size: 1024 };

      const updatedRecord: AirtableRecord = {
        id: "rec123",
        fields: {
          Attachments: [
            {
              url: "https://dl.airtable.com/.attachments/file.pdf",
              filename: "file.pdf",
            },
          ],
        },
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      vi.mocked(fs.stat).mockResolvedValue(fileStats as any);
      vi.mocked(fs.readFile).mockResolvedValue(fileBuffer);
      mockRequestMultipart.mockResolvedValue(updatedRecord);

      await addAttachmentToRecord({
        client: mockClient,
        tableName: "Documents",
        recordId: "rec123",
        fieldName: "Attachments",
        url: "https://example.com/file.pdf",
        filePath,
      });

      // Should use filePath (multipart upload), not url (GET + PATCH)
      expect(mockRequestMultipart).toHaveBeenCalled();
      expect(mockGetRecord).not.toHaveBeenCalled();
      expect(mockUpdateRecord).not.toHaveBeenCalled();
    });

    it("should support contentType as alias for type", async () => {
      const currentRecord: AirtableRecord = {
        id: "rec123",
        fields: {},
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      const updatedRecord: AirtableRecord = {
        id: "rec123",
        fields: {
          Attachments: [
            {
              url: "https://example.com/file.pdf",
              filename: "file.pdf",
              type: "application/pdf",
            },
          ],
        },
        createdTime: "2024-01-01T00:00:00.000Z",
      };

      mockGetRecord.mockResolvedValue(currentRecord);
      mockUpdateRecord.mockResolvedValue(updatedRecord);

      await addAttachmentToRecord({
        client: mockClient,
        tableName: "Documents",
        recordId: "rec123",
        fieldName: "Attachments",
        url: "https://example.com/file.pdf",
        filename: "file.pdf",
        contentType: "application/pdf",
      });

      expect(mockUpdateRecord).toHaveBeenCalledWith("Documents", "rec123", {
        Attachments: [
          {
            url: "https://example.com/file.pdf",
            filename: "file.pdf",
            type: "application/pdf",
          },
        ],
      });
    });
  });
});
