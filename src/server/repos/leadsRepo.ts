import type { AirtableClient } from "../client/createClient";
import { createTableRepo } from "./createTableRepo";
import type { Lead } from "../../core/domain/lead";
import { leadFromRecord, leadToFields, type LeadFields } from "../../core/mappers/leadMapper";

export function createLeadsRepo(args: {
  client: AirtableClient;
  tableName?: string;
}) {
  return createTableRepo<LeadFields, Lead>({
    client: args.client,
    tableName: args.tableName ?? "Leads",
    mapper: {
      toFields: leadToFields,
      fromRecord: leadFromRecord,
    },
  });
}
