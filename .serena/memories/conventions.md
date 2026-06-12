# Conventions

- Plain modern JS (ESM, async/await, top-level await pattern in `.mjs`). No types, no JSDoc requirement.
- Tool registration style: `server.tool("kebab-case-name", description, { zodParamsObject }, async handler)` — one block per tool, sequential in `index.mjs`. New tools follow the same shape and kebab-case naming.
- Handlers return `{ content: [{ type: "text", text: toYaml(result) }] }`; errors return a YAML/text error message rather than throwing.
- Logging only via `console.error` (stdout is the MCP stdio channel).
- README.md "MCP Tools" section enumerates every tool — update it when tools change.