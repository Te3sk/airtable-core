import { describe, it, expect } from "vitest";
import { leadToFields, leadFromRecord, type LeadFields } from "../../../src/core/mappers/leadMapper";
import type { AirtableRecord } from "../../../src/core/types/airtable";

describe("Lead mapper", () => {
  it("leadToFields maps domain -> Airtable fields", () => {
    const fields = leadToFields({ name: "Guido", email: "g@x.com", phone: "123" });
    expect(fields).toEqual({ Name: "Guido", Email: "g@x.com", Phone: "123" });
  });

  it("leadToFields ignores non-string values", () => {
    const fields = leadToFields({ name: "Guido", email: 123 as any });
    expect(fields).toEqual({ Name: "Guido" });
  });

  it("leadFromRecord maps Airtable record -> domain", () => {
    const rec: AirtableRecord<LeadFields> = {
      id: "rec123",
      createdTime: "2020-01-01T00:00:00.000Z",
      fields: { Name: "Guido", Email: "g@x.com", Phone: "123" }
    };

    expect(leadFromRecord(rec)).toEqual({
      id: "rec123",
      createdTime: "2020-01-01T00:00:00.000Z",
      name: "Guido",
      email: "g@x.com",
      phone: "123"
    });
  });

  it("leadFromRecord handles missing optional fields", () => {
    const rec: AirtableRecord<LeadFields> = {
      id: "rec123",
      fields: { Name: "Guido" }
    };

    const lead = leadFromRecord(rec);
    expect(lead.name).toBe("Guido");
    expect(lead.email).toBeUndefined();
    expect(lead.phone).toBeUndefined();
  });
});
