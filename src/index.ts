import 'dotenv/config.js';

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { subscribeDriftClient } from "./drift.js";
import { calculateIdealDeltaNeutralHedge, getHedgePerpsPositions, getJLPPosition } from './hedge.js';

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

server.tool(
  "getHedgePositions",
  "Get hedge positions from Drift",
  {},
  async ({}) => {
    const hedgePositions = await getHedgePerpsPositions() 
    return { content: [{ type: "text", text: JSON.stringify(hedgePositions) }] }
  },
);

server.tool(
  "calculateIdealDeltaNeutralHedge",
  "Get ideal delta neutral hedge positions. JLP position is made up of 47% SOL, 8% ETH, 13% BTC. In order for \
  the JLP position to be delta neutral, we need to hedge the JLP position with the same amount of SOL, ETH and BTC. ",
  {},
  async ({}) => {
    const jlpPosition = await getJLPPosition() 
    const hedgePositions = await calculateIdealDeltaNeutralHedge(jlpPosition) 
    return { content: [{ type: "text", text: JSON.stringify(hedgePositions) }] }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);