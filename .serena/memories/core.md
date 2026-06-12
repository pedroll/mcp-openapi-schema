# Core

Single-file MCP (Model Context Protocol) server exposing OpenAPI schema info to LLMs over stdio.

## Source map
- `index.mjs` — entire server (executable, also the npm `bin`). CLI arg = schema path (JSON or YAML); defaults to `./openapi.yaml`; `--help` supported. Loads schema once at startup, registers 10 MCP tools, connects `StdioServerTransport`.
- `example-usage.mjs` — MCP client smoke-test (`npm test`): runs the full 10-tool suite against BOTH `sample-petstore.yaml` and `sample-petstore-split/openapi.yaml`, exits 1 on any `isError` response.
- `sample-petstore.yaml` — single-file fixture spec.
- `sample-petstore-split/` — multi-file fixture (root + `paths/` + `components/schemas/`) with a deliberate circular `Pet ↔ Category` ref; permanent regression fixture for split-spec support.
- `.serena/tasks/` — task docs (active/completed).
- No src/ dir, no test framework, no CI, no lint/format config.

## Invariants
- Repo is a fork of `hannesj/mcp-openapi-schema` (upstream remote: `originalForked`; our fork: `origin` = pedroll). Upstream appears unmaintained; changes are offered upstream as PRs. Fork notice in README is fork-only — never include it in upstream PR branches.
- Schema arg may be a local path OR an http(s) URL (`isUrl` helper; URLs skip `resolve()` and are fetched by SwaggerParser, incl. relative $refs). Incorporated from upstream PR #4 (@ppspps824).
- Schema loading (`loadSchema`): `SwaggerParser.bundle()` — NOT `validate()`/`dereference()`. Bundle keeps refs as internal `#/components/...` pointers; full dereference creates circular JS objects that crash `toYaml` (`yaml.dump` with `noRefs: true` → "Maximum call stack size exceeded"). A separate `validate()` pass only warns on stderr; it must not be the source of the returned doc.
- `resolveRef(node)` / `resolvePointer(pointer)` helpers (next to `toYaml`): cycle-safe internal `$ref` resolution. Every tool handler resolves nodes it reads (path items, request bodies, responses, params, components, security schemes) through `resolveRef` — new handlers must do the same.
- Tool responses are YAML text and may legitimately contain internal `$ref` pointers (documented in README; users expand via `get-component`).
- All tool responses via js-yaml `dump` with `noRefs: true` — never feed it circular structures.
- The 10 tools: list-endpoints, get-endpoint, get-request-body, get-response-schema, get-path-parameters, list-components, get-component, list-security-schemes, get-examples, search-schema. Keep `README.md` tool list in sync.
- stdio transport ⇒ never write logs to stdout; only stderr (`console.error`) is safe.

Stack details: `mem:tech_stack`. Commands: `mem:suggested_commands`. Code style: `mem:conventions`. Done-check: `mem:task_completion`.