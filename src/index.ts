import "dotenv/config.js";

import { subscribeDriftClient } from "./drift.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { calculateIdealDeltaNeutralHedge } from "./hedge.js";
import {
  getAccountPortfolio,
  getPerpsPositions,
  getJLPPosition,
} from "./portfolio.js";
import { z } from "zod";
import { botManager, BotType } from "./bot.js";
import { sendTelegramMessage } from "./telegram.js";

const server = new McpServer({
  name: "Drift MCP service",
  version: "1.0.0",
});

await subscribeDriftClient();

server.tool("listBots", "List all bots", {}, async ({}) => {
  const bots = botManager.listBots();
  return {
    content: [
      {
        type: "text",
        text: `List of bots: ${JSON.stringify(bots)}`,
      },
    ],
  };
});

server.tool(
  "createNewBot",
  "Create a new Hedging bot to extract token position, calculated ideal perp position and hedge it",
  {
    type: z.enum(["JLP", "TRUMP"]).describe("Type of bot to create"),
    intervalHours: z
      .number()
      .min(1)
      .max(24)
      .default(1)
      .describe("Interval in hours between bot executions"),
    minRebalanceThreshold: z
      .number()
      .min(0)
      .max(1)
      .default(0.05)
      .describe("Minimum rebalance threshold"),
  },
  async ({ type, intervalHours, minRebalanceThreshold }) => {
    const bot = await botManager.createBot({
      type: type === "JLP" ? BotType.JLP_HEDGE : BotType.TRUMP_HEDGE,
      intervalHours,
      minRebalanceThreshold,
    });
    return {
      content: [
        {
          type: "text",
          text: `Created new bot with ID: ${bot.id}`,
        },
      ],
    };
  }
);

server.tool(
  "getAccountPortfolio",
  "Get account portfolio from Drift",
  {},
  async ({}) => {
    const positions = await getAccountPortfolio();
    return { content: [{ type: "text", text: JSON.stringify(positions) }] };
  }
);

server.tool("getJlpPosition", "Get JLP position from Drift", {}, async ({}) => {
  const positions = await getJLPPosition();
  return { content: [{ type: "text", text: JSON.stringify(positions) }] };
});

server.tool(
  "getPerpsPositions",
  "Get Perpetual positions from Drift",
  {},
  async ({}) => {
    const hedgePositions = await getPerpsPositions();
    return {
      content: [{ type: "text", text: JSON.stringify(hedgePositions) }],
    };
  }
);

server.tool(
  "calculateIdealDeltaNeutralHedge",
  "Get ideal delta neutral hedge positions. JLP position is made up of 47% SOL, 8% ETH, 13% BTC. In order for \
  the JLP position to be delta neutral, we need to hedge the JLP position with the same amount of SOL, ETH and BTC. ",
  {},
  async ({}) => {
    const jlpPosition = await getJLPPosition();
    const hedgePositions = await calculateIdealDeltaNeutralHedge(jlpPosition);
    return {
      content: [{ type: "text", text: JSON.stringify(hedgePositions) }],
    };
  }
);

server.tool("sendTGMessage", "Send a message to Telegram", {}, async ({}) => {
  const messages = [
    "🚀 New trading opportunity spotted!",
    "📈 Market is looking bullish today!",
    "💎 Diamond hands holding strong!",
    "🔥 Hot trading action incoming!",
    "⚡ Quick market update: Things are heating up!",
  ];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  await sendTelegramMessage(randomMessage);
  return {
    content: [
      {
        type: "text",
        text: `Sent message to Telegram: ${randomMessage}`,
      },
    ],
  };
});

const transport = new StdioServerTransport();
botManager.monitorBots();
server.connect(transport);
