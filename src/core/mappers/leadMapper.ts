import type { AirtableRecord } from "../types/airtable";
import type { Lead } from "../domain/lead";

/**
 * Airtable fields shape for the "Leads" table.
 * Keep field names exactly as they are in Airtable.
 */
export type LeadFields = {
  Name: string;
  Email?: string;
  Phone?: string;
};

export function leadToFields(model: Partial<Lead>): Partial<LeadFields> {
  // Minimal mapping, no validation yet (we can add Zod later)
  const out: Partial<LeadFields> = {};

  if (typeof model.name === "string") out.Name = model.name;
  if (typeof model.email === "string") out.Email = model.email;
  if (typeof model.phone === "string") out.Phone = model.phone;

  return out;
}

export function leadFromRecord(record: AirtableRecord<LeadFields>): Lead {
  return {
    id: record.id,
    createdTime: record.createdTime,
    name: String(record.fields.Name ?? ""),
    email: typeof record.fields.Email === "string" ? record.fields.Email : undefined,
    phone: typeof record.fields.Phone === "string" ? record.fields.Phone : undefined,
  };
}
