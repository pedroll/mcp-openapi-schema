# Tech Stack

- Node.js ESM (`"type": "module"`, `.mjs` files), plain JavaScript — no TypeScript, no build step.
- Package manager: npm (package-lock.json present).
- Dependencies (all runtime, no devDependencies):
  - `@modelcontextprotocol/sdk` ^1.7.0 — `McpServer` + `StdioServerTransport`.
  - `@apidevtools/swagger-parser` ^10.1.1 — loads/dereferences the OpenAPI spec.
  - `js-yaml` ^4.1.0 — YAML output of tool results.
  - `zod` ^3.24.2 — MCP tool input schemas.
- Published as npm package `mcp-openapi-schema` v0.0.1, MIT, bin entry `index.mjs`.