// src/core/mappers/leadMapper.ts
function leadToFields(model) {
  const out = {};
  if (typeof model.name === "string") out.Name = model.name;
  if (typeof model.email === "string") out.Email = model.email;
  if (typeof model.phone === "string") out.Phone = model.phone;
  return out;
}
function leadFromRecord(record) {
  return {
    id: record.id,
    createdTime: record.createdTime,
    name: String(record.fields.Name ?? ""),
    email: typeof record.fields.Email === "string" ? record.fields.Email : void 0,
    phone: typeof record.fields.Phone === "string" ? record.fields.Phone : void 0
  };
}

export {
  leadToFields,
  leadFromRecord
};
//# sourceMappingURL=chunk-IMLSMXJQ.js.map