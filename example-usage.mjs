// This is a simple example of how to test the MCP OpenAPI Schema server
// using the official MCP SDK client
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let failures = 0;

// Run every tool against the given schema and report failures
async function runSuite(schemaPath, label) {
  console.log(`\n========== SUITE: ${label} (${schemaPath}) ==========`);

  const transport = new StdioClientTransport({
    command: "node",
    args: [resolve(__dirname, "index.mjs"), resolve(__dirname, schemaPath)],
  });

  const client = new Client({
    name: "openapi-schema-client",
    version: "1.0.0",
  });

  console.log("Connecting to MCP server...");
  await client.connect(transport);
  console.log("Connected to MCP server successfully!");

  const calls = [
    ["LISTING ENDPOINTS", "list-endpoints", {}],
    ["GET ENDPOINT DETAILS", "get-endpoint", { path: "/pets", method: "get" }],
    ["GET REQUEST BODY SCHEMA", "get-request-body", { path: "/pets", method: "post" }],
    ["LIST COMPONENTS", "list-components", {}],
    ["GET COMPONENT SCHEMA", "get-component", { type: "schemas", name: "Pet" }],
    ["SEARCH SCHEMA", "search-schema", { pattern: "pet" }],
    ["GET PATH PARAMETERS", "get-path-parameters", { path: "/pets/{petId}", method: "get" }],
    [
      "GET RESPONSE SCHEMA",
      "get-response-schema",
      { path: "/pets/{petId}", method: "get", statusCode: "200" },
    ],
    ["LIST SECURITY SCHEMES", "list-security-schemes", {}],
    [
      "GET EXAMPLES",
      "get-examples",
      { type: "response", path: "/pets/{petId}", method: "get", statusCode: "200" },
    ],
  ];

  try {
    for (const [title, name, args] of calls) {
      console.log(`\n--- ${title} ---`);
      const result = await client.callTool({ name, arguments: args });
      console.log(result.content[0].text);
      if (result.isError) {
        failures++;
        console.error(`FAILED: ${name} returned an error`);
      }
    }
  } catch (error) {
    failures++;
    console.error("Error during testing:", error);
  } finally {
    await client.close();
    console.log(`\nSuite "${label}" completed, disconnected from server.`);
  }
}

// Single-file spec (regression) and split multi-file spec with a circular
// Pet <-> Category reference (task 001)
await runSuite("./sample-petstore.yaml", "single-file spec");
await runSuite("./sample-petstore-split/openapi.yaml", "split spec with $refs");

if (failures > 0) {
  console.error(`\n${failures} tool call(s) failed.`);
  process.exit(1);
}
console.log("\nAll tool calls succeeded in both suites.");
