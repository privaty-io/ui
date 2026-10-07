# @privaty/query

A validated filtering, sorting, and pagination system with a hard
client/server split: the **core is engine-free and client-safe** — it
defines fields, gates operators at compile time, and validates a plain
JSON wire format with valibot — while **converters** turn validated
input into execution at the edge (`@privaty/query/drizzle` ships
first; rolling your own is implementing against the wire format).

```bash
pnpm add @privaty/query valibot
```

> `valibot` is a **peerDependency**. `drizzle-orm` is an OPTIONAL peer —
> only the `./drizzle` entry touches it, so frontend bundles never see
> an engine. (This package lives in the ui repo for now but is
> standalone by design — it imports nothing from the ui family and will
> move to its own monorepo eventually.)

## Defining a query (shared code — safe on the client)

```ts
import * as v from "valibot";
import {
  defineQuery,
  field,
  nullable,
  ordering,
  scalar,
  str,
} from "@privaty/query";

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
    sortable: false,
  }),
});
```

- A field is a **kind** (gates which operators the type system admits —
  `contains` on a number field is a compile error), a **valibot schema**
  for one value (list operators wrap it), and the **ops it grants**
  (spread the capability sets: `equality`, `ordering`, `membership`,
  `text`, `pattern`, `nullable`, `scalar`, `str`).
- `str` deliberately excludes `like`/`ilike`: with the substring
  operators the user's text is a VALUE (converters escape wildcards);
  with the pattern operators it IS the pattern — grant those knowingly.
- The definition is also UI metadata: a filter builder can enumerate
  `fields`, their kinds, and their granted ops to render controls.

## The wire format

Plain JSON — no engine, no language in it. Sibling entries are an
implicit AND; `and` / `or` / `not` give full boolean algebra:

```jsonc
{
  "where": {
    "category": { "in": ["cheese", "wine"] },
    "or": [
      { "name": { "contains": "comté" } },
      {
        "and": [
          { "price": { "gte": 50 } },
          { "not": { "price": { "isNull": true } } },
        ],
      },
    ],
  },
  "orderBy": [{ "field": "price", "dir": "desc" }],
  "limit": 50,
  "offset": 0,
}
```

`def.schema` is the boundary: it rejects unknown fields, ungranted
operators, wrong value types, empty groups, and structurally caps
nesting depth, list sizes, and `limit` (`maxDepth` / `maxListLength` /
`maxLimit` options). Converters only ever see validated output.

## Executing it (server code)

```ts
import * as v from "valibot";
import { drizzleQuery } from "@privaty/query/drizzle";
import { productQuery } from "./product-query";
import { products } from "./schema";

const pq = drizzleQuery(productQuery, {
  name: products.name,
  price: products.price,
  category: products.category,
});

const input = v.parse(productQuery.schema, untrusted);
const rows = await db
  .select()
  .from(products)
  .where(pq.where(input))
  .orderBy(...pq.orderBy(input))
  .limit(input.limit ?? 50)
  .offset(input.offset ?? 0);
```

The converter binds field keys to columns at the edge — the definition
never knows a column exists. It is dialect-agnostic (grant `ilike` only
where the engine has it, i.e. postgres). Substring escaping note for
the sqlite family: postgres treats `\` as the LIKE escape by default;
sqlite needs an explicit `ESCAPE` clause for literal wildcards — if
your sqlite data contains literal `%`/`_` that users will search for,
handle that in a custom converter until the roadmap item lands.

## Roadmap

1. ~~Tables-v2 integration~~ — DONE: `@privaty/ui-tables` ships
   `FilterBar` (chips, presets, quick search) and server sorting via
   `Table`'s `query`/`queryValue`; `AnyQueryDef`/`AnyQueryInput` exist
   for such generic consumers.
2. **Wire-format specification**: the JSON format documented as a
   versioned spec file (the cross-language artifact — same philosophy
   as `@privaty/db` shipping raw SQL next to its TS schemas).
3. **Cross-language support** (explicit future goal, out of scope for
   now): the frontend defines and emits filters from Svelte while the
   backend validates and executes them in Go, Rust, or anything else —
   i.e. per-language validators/builders implementing the same spec.
   Nothing in the core may quietly preclude this: no JS-only values in
   the wire format (dates travel as ISO strings, never `Date`).
4. **Converter split**: `./drizzle` moves to its own package when the
   repo split happens; per-engine pattern/escape handling
   (sqlite `ESCAPE`) lands with it.
5. Candidate operators as needs appear: `between`, case-insensitive
   substring variants, array/JSON containment.

## Status

0.x — core + drizzle converter, 14 specs (validation, compile-time
gating, SQL generation incl. escaping). API may still move until the
tables-v2 integration has exercised it.
