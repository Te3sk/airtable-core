import type {
  AirtableFields,
  AirtableListParams,
  AirtableRecord,
} from "../../core/types/airtable";
import type { AirtableClient } from "../client/createClient";
import { listAllRecords, type AirtableListAllOptions } from "../client/pagination";

export type TableMapper<TFields extends AirtableFields, TModel> = {
  /**
   * Convert a domain model into Airtable fields (for create/update).
   * Keep this pure (no network).
   */
  toFields: (model: Partial<TModel>) => Partial<TFields>;

  /**
   * Convert an Airtable record into a domain model.
   * Should validate / normalize where appropriate.
   */
  fromRecord: (record: AirtableRecord<TFields>) => TModel;
};

export type TableRepo<TFields extends AirtableFields, TModel> = {
  listPage: (params?: AirtableListParams) => Promise<{ records: TModel[]; offset?: string }>;
  listAll: (params?: Omit<AirtableListParams, "offset">, options?: AirtableListAllOptions) => Promise<TModel[]>;
  get: (recordId: string) => Promise<TModel>;
  create: (model: Partial<TModel>) => Promise<TModel>;
  update: (recordId: string, patch: Partial<TModel>) => Promise<TModel>;
  delete: (recordId: string) => Promise<{ id: string; deleted: boolean }>;
};

export function createTableRepo<TFields extends AirtableFields, TModel>(args: {
  client: AirtableClient;
  tableName: string;
  mapper: TableMapper<TFields, TModel>;
}): TableRepo<TFields, TModel> {
  const { client, tableName, mapper } = args;

  return {
    async listPage(params?: AirtableListParams) {
      const page = await client.listRecords<TFields>(tableName, params);
      return {
        records: page.records.map(mapper.fromRecord),
        offset: page.offset,
      };
    },

    async listAll(params?: Omit<AirtableListParams, "offset">, options?: AirtableListAllOptions) {
      const records = await listAllRecords<TFields>({
        client,
        tableName,
        params,
        options,
      });
      return records.map(mapper.fromRecord);
    },

    async get(recordId: string) {
      const record = await client.getRecord<TFields>(tableName, recordId);
      return mapper.fromRecord(record);
    },

    async create(model: Partial<TModel>) {
      const fields = mapper.toFields(model);
      const record = await client.createRecord<TFields>(tableName, fields);
      return mapper.fromRecord(record);
    },

    async update(recordId: string, patch: Partial<TModel>) {
      const fields = mapper.toFields(patch);
      const record = await client.updateRecord<TFields>(tableName, recordId, fields);
      return mapper.fromRecord(record);
    },

    async delete(recordId: string) {
      return client.deleteRecord(tableName, recordId);
    },
  };
}
