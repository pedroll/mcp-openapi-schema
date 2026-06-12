# Suggested Commands

- `npm install` — install deps.
- `npm start` — run server with default `./openapi.yaml` (will fail if absent; pass a spec instead).
- `node index.mjs <path-to-spec.yaml|json>` — run server against a specific spec, e.g. `node index.mjs sample-petstore.yaml`.
- `node index.mjs --help` — usage.
- `npm test` — runs `example-usage.mjs` (MCP client smoke test against `sample-petstore.yaml`). This is the only verification mechanism; no unit-test framework, lint, or typecheck exists.

Darwin/macOS: standard BSD userland (`sed -i ''`, no GNU flags); nothing project-specific differs.