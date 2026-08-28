# Draft: upstream SvelteKit issue — `query().current` cache entries aren't pinned

> Draft for a sveltejs/kit issue. Verified against 3.0.0-next.23 and still
> present in next.25 (paths below from the installed next.25 source).

**Title:** Remote functions: query cache entries read via `.current` are not
pinned and can be GC-evicted, so single-flight refreshes are silently lost

## Description

Reading a query purely reactively — e.g.
`const rows = $derived(getRows().current ?? [])` — creates a transient
`QueryProxy` per read. The proxy keeps its cache entry alive via ref-counting
tied to the proxy's own GC lifetime (`cache.ref` in
`src/runtime/client/remote-functions/query/proxy.js`), and pinning to the
surrounding effect only happens on the await path: the `then`/`catch`/
`finally` getters call `pin_in_effect`, but the `current`/`error`/`loading`/
`ready` getters do not.

The comment on `pin_in_effect` (`client/remote-functions/shared.svelte.js`)
describes exactly the hazard: a transiently-referenced proxy "would be
eligible for GC as soon as the awaited value has been read, after which the
FinalizationRegistry would evict the cache entry — even though the consuming
effect is still alive and may rely on the entry being refreshed (e.g. via
`refreshAll()` or a server-initiated single-flight refresh)." That protection
just never got wired to `.current`.

## Consequence

After GC evicts the entry, a server-initiated single-flight refresh (a form/
command handler calling `getRows().refresh()`) finds no live resource in
`query_map`; `remote_request`'s refresh application falls into the
`query_responses` dead-letter stash, which only a _future_ `Query`
constructor reads. The UI keeps rendering the last derived value until a full
page reload. Timing depends on GC, so it reproduces intermittently.

## Repro sketch

1. A page renders `{$derived(getItems().current ?? [])}` (never awaits the
   query).
2. A remote `form` handler mutates and calls `void getItems().refresh()`.
3. Submit the form repeatedly / trigger GC (e.g. DevTools "Collect
   garbage") between render and submit.
4. The list stops updating; the network tab shows the refreshed data
   arriving in the submit response.

## Suggested fix

Call `pin_in_effect(query_map, cache, id, payload)` from the reactive getters
(`current`, `error`, `loading`, `ready`) in `query/proxy.js` — mirroring the
`then` getter — so a query read inside a live effect keeps its cache entry
for that effect's lifetime. (Same applies to `query-live/proxy.js`.)

## Workarounds we use meanwhile

- Await the query (`{#each await getItems() as item}`), which pins; or
- hold the proxy for the component's lifetime
  (`const items = getItems();` then read `items.current`).
