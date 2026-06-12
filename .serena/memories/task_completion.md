# Task Completion Checklist

No linter, formatter, or type checker is configured. When a coding task is done:

1. `node index.mjs sample-petstore.yaml` — confirm the server starts without errors (Ctrl-C after the startup message on stderr).
2. `npm test` — run the `example-usage.mjs` client smoke test; all tool calls must succeed.
3. If tools were added/renamed/changed: update the tool list in `README.md` and, when relevant, extend `example-usage.mjs` to exercise the new tool.