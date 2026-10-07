// SHARED code — imported by the page AND the remote module: the whole
// point of @privaty/query's engine-free core is that this file is safe
// in the client bundle.
import {
  defineQuery,
  equality,
  field,
  nullable,
  ordering,
  scalar,
  str,
  text,
} from "@privaty/query";
import * as v from "valibot";

export const productQuery = defineQuery({
  name: field({ kind: "string", schema: v.string(), ops: str }),
  price: field({
    kind: "number",
    schema: v.number(),
    ops: [...scalar, ...ordering, ...nullable],
  }),
  category: field({
    kind: "string",
    schema: v.picklist(["cheese", "wine", "bread"]),
    ops: scalar,
  }),
  hidden: field({
    kind: "boolean",
    schema: v.boolean(),
    ops: equality,
    sortable: false,
  }),
  // The joined-sort story: no product COLUMN holds this value — the
  // supplier column displays a name joined from another record and
  // declares `sortField="supplierName"`, and the server's converter
  // binds this field to the joined accessor.
  supplierName: field({
    kind: "string",
    schema: v.string(),
    ops: [...equality, ...text],
  }),
});
