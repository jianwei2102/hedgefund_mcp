
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import 'dotenv/config.js';
import { getJLPPosition, subscribeDriftClient } from "./drift.js";

const server = new McpServer({
  name: "Drift MCP service",
  version: "1.0.0",
});

await subscribeDriftClient();

server.tool(
  "getJlpPosition",
  "Get JLP position from Drift",
  {},
  async ({}) => {
    const positions = await getJLPPosition() 
    return { content: [{ type: "text", text: JSON.stringify(positions) }] }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);