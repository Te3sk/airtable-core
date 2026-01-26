import { createAirtableClient } from "@scope/airtable/server";

const client = createAirtableClient({
  token: process.env.AIRTABLE_TOKEN,
  baseId: process.env.AIRTABLE_BASE_ID
});

const res = await client.listRecords("Clienti", { maxRecords: 3 });
console.log(res.records.map(r => r.id));
