import { describe, it, expect } from "vitest";
import { buildBaseUrl, buildListQuery, buildRecordPath, buildTablePath } from "../../../src/server/client/endpoints";

describe("endpoints", () => {
  it("buildBaseUrl trims trailing slashes and encodes baseId", () => {
    expect(buildBaseUrl("https://api.airtable.com/v0/", "app123")).toBe("https://api.airtable.com/v0/app123");
  });

  it("buildTablePath encodes table name", () => {
    expect(buildTablePath("My Table")).toBe("/My%20Table");
  });

  it("buildRecordPath encodes record id", () => {
    expect(buildRecordPath("My Table", "rec/123")).toBe("/My%20Table/rec%2F123");
  });

  it("buildListQuery returns empty string when no params", () => {
    expect(buildListQuery()).toBe("");
  });

  it("buildListQuery serializes basic params", () => {
    const qs = buildListQuery({
      view: "Grid view",
      filterByFormula: "{Status}='Open'",
      maxRecords: 10,
      pageSize: 50,
      offset: "itr123"
    });

    expect(qs).toContain("view=Grid+view");
    expect(qs).toContain("filterByFormula=%7BStatus%7D%3D%27Open%27");
    expect(qs).toContain("maxRecords=10");
    expect(qs).toContain("pageSize=50");
    expect(qs).toContain("offset=itr123");
    expect(qs.startsWith("?")).toBe(true);
  });

  it("buildListQuery serializes sort params", () => {
    const qs = buildListQuery({
      sort: [
        { field: "Name", direction: "asc" },
        { field: "Created", direction: "desc" }
      ]
    });

    expect(qs).toContain("sort%5B0%5D%5Bfield%5D=Name");
    expect(qs).toContain("sort%5B0%5D%5Bdirection%5D=asc");
    expect(qs).toContain("sort%5B1%5D%5Bfield%5D=Created");
    expect(qs).toContain("sort%5B1%5D%5Bdirection%5D=desc");
  });
});
