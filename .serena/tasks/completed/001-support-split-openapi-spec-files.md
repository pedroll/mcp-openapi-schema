# Task: Support Split OpenAPI Spec Files with $ref Pointers

**Status**: ✅ Complete
**Priority**: 🔥 High
**Effort**: 1-2 days
**Started**: 2026-06-12
**Completed**: 2026-06-13

## Objective

Make the MCP server work reliably with OpenAPI specs split across multiple files via `$ref` pointers (e.g. `paths/pets.yaml`, `components/schemas/Pet.yaml`), so users can point it at a real-world multi-file spec instead of a single bundled file.

## Context

- Observed: split specs with external `$ref` pointers fail (reported 2026-06-12).
- Current loading (`index.mjs`, `loadSchema`): `SwaggerParser.validate(schemaPath, { validate: { schema: false } })`. `validate()` internally **fully dereferences** the document, which *should* resolve external file refs — so the failure is not "refs are never resolved" but something downstream. Suspects to confirm in step 1:
  1. **Circular refs**: full dereference turns self-referencing schemas (common in split specs, e.g. `Pet → Category → Pet`) into circular JS objects. `toYaml` (`index.mjs:69`) uses `yaml.dump(obj, { noRefs: true })`, which throws on circular structures → tool calls or startup crash.
  2. **OpenAPI 3.1**: swagger-parser ^10.1.1 rejects 3.1 documents at validation even with `validate: { schema: false }` (spec-rules validation still runs).
  3. **Lost component names**: full dereference inlines everything, so `get-component` / `list-components` lose the named-schema structure users expect, and output explodes in size (every endpoint repeats every schema).
- Constraint: all 10 tools navigate `openApiDoc` as a plain object (`openApiDoc.paths`, `openApiDoc.components.*`) and assume no `$ref` nodes remain.

## Approach

Switch from implicit full-dereference to **`SwaggerParser.bundle()`**: it inlines all *external files* into one document while keeping refs as *internal* `$ref` pointers (`#/components/...`). This solves circularity (no circular JS objects), keeps component names, and keeps output compact.

Trade-off: bundled docs can still contain internal `$ref` nodes wherever the source files used them, so tools need a small `resolveRef(doc, node)` helper (follow `#/...` JSON pointers, with a depth/seen guard) applied at the points where they read endpoint/component sub-objects. YAML output may legitimately contain `$ref: '#/components/schemas/X'` lines — that is fine for LLM consumption and should be documented.

Fallback decision point: if step-1 investigation shows the real blocker is only circularity, an alternative is keeping `dereference` and switching `toYaml` to `noRefs: false` (YAML anchors/aliases handle cycles) — smaller change but anchors are harder for LLMs to read and output stays bloated. Default to the bundle approach unless investigation contradicts it.

## Implementation Steps

- [x] **Investigate & reproduce**: create `sample-petstore-split/` fixture (root `openapi.yaml` + `paths/` + `components/schemas/` with one circular schema and at least one cross-file ref). Run server against it; record the exact error per suspect above. → **Done 2026-06-12, see Findings below.**
- [x] Change `loadSchema` to `SwaggerParser.bundle()` (validate pass kept for error reporting; validation failure of a parseable doc now warns on stderr and continues instead of `process.exit(1)`).
- [x] Add `resolveRef` helper (+ `resolvePointer` for `#/` JSON-pointer lookup, cycle-safe via seen-set) next to `toYaml`.
- [x] Apply `resolveRef` where tools read sub-objects: path items (all path-based tools), `get-request-body`, `get-response-schema`, `get-path-parameters` (per-param), `get-component`, `list-security-schemes`, `get-examples` (request body / response / component), `search-schema` (path items, params, components, security schemes).
- [x] Verify `toYaml` no longer receives circular structures; `noRefs: true` kept.
- [x] Extend `example-usage.mjs`: now runs the full 10-tool suite against BOTH `sample-petstore.yaml` and the split fixture, and exits 1 on any `isError` response (previously log-only).
- [x] Update `README.md`: split-spec features + note that responses keep internal `$ref` pointers (expand via `get-component`).
- [x] Update Serena memories (`mem:core` invariants).

## Files to Modify

- `index.mjs` — `loadSchema` (bundle instead of validate-dereference), new `resolveRef` helper, ref-aware reads in the tool handlers listed above.
- `example-usage.mjs` — exercise the split fixture.
- `sample-petstore-split/**` (new) — multi-file fixture with circular + cross-file refs.
- `README.md` — features/usage notes for split specs.

## Testing Plan

- [x] `node index.mjs sample-petstore.yaml` — single-file spec still works (no regression; covered by suite 1 of `npm test`).
- [x] `node index.mjs sample-petstore-split/openapi.yaml` — server starts, all 10 tools return valid YAML (suite 2 of `npm test`).
- [x] Circular-schema case: `get-component` on `Pet` (circular via `Category`) returns YAML with `$ref: '#/components/schemas/Category'` — no throw.
- [x] Launch from another cwd with the split spec — external refs resolve (verified from `/tmp`).
- [x] `npm test` passes: "All tool calls succeeded in both suites."

## Risks

- ~~swagger-parser 10.x may not handle OpenAPI 3.1~~ — resolved 2026-06-12: 3.1 validates and bundles fine with current config (see Findings).
- `search-schema` walks the whole doc; with internal refs preserved it must not infinitely recurse — reuse the cycle guard from `resolveRef`.

## Findings (investigation, 2026-06-12)

Reproduced with `sample-petstore-split/` (committed as the permanent fixture; `Pet ↔ Category` circular ref, cross-file refs from path files to schema files). Probes: replicated `loadSchema`+`toYaml` directly, then end-to-end via an MCP stdio client against the real server.

1. **Root cause confirmed = suspect 1 (circularity), nothing else.** `SwaggerParser.validate()` resolves external `$ref` files correctly — the split spec *loads fine* and the server *starts fine*. But full dereferencing turns the circular schema into circular JS objects, and `toYaml` (`yaml.dump` with `noRefs: true`, `index.mjs:69`) then throws `Maximum call stack size exceeded`.
2. **User-visible behavior**: `list-endpoints` works (it only dumps summaries); `get-component`, `get-endpoint`, `get-response-schema`, etc. return MCP `isError: true` with `Maximum call stack size exceeded`. This is why it looks like "split specs aren't supported."
3. **Suspect 2 (OpenAPI 3.1) ruled out**: swagger-parser 10.1.x validates and bundles a 3.1 version of the fixture without error (with `validate: { schema: false }` as currently configured). Not a blocker; drop from scope.
4. **Bundle approach validated**: `SwaggerParser.bundle()` on the fixture → no circular JS objects; schema refs become internal `$ref: '#/components/schemas/X'`; path-level external refs are fully inlined (path items are plain objects, so `list-endpoints`/`get-endpoint` path lookup needs no change); `toYaml` of the bundled `Pet` schema succeeds and stays readable.
5. **Fallback validated but inferior**: `dereference` + `noRefs: false` works (emits YAML anchors `&ref_0`/`*ref_0`) — readable by parsers but worse for LLMs and still bloats output. Keep as fallback only.

**Decision**: proceed with bundle + `resolveRef` as planned. Note: a single-file spec with *internal* circular refs (no split files at all) crashes the same way — the fix covers that case too.

## Notes

- Effort revised down for remaining work: ~0.5-1 day (investigation eliminated the 3.1 risk and confirmed path items are inlined by bundle).
- Implemented 2026-06-13. Behavior change worth noting in release notes: tool responses that previously inlined schemas (full dereference) now show internal `$ref` pointers — intentional, documented in README.
