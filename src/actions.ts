// src/actions.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getJLPPositions } from "./jlp"
import { getDriftHedgePositions, placeDriftHedge } from "./drift"
import { calculateDelta } from "./hedge"

export function registerActions(server: McpServer) {
  // 1. Get JLP positions
  server.tool(
    "get-jlp-positions",
    { walletAddress: z.string() },
    async ({ walletAddress }) => {
      const positions = await getJLPPositions(walletAddress)
      return { content: [{ type: "text", text: JSON.stringify(positions) }] }
    }
  )

  // 2. Get current Drift hedge positions
  server.tool(
    "get-hedged-positions",
    {},
    async () => {
      const positions = await getDriftHedgePositions()
      return { content: [{ type: "text", text: JSON.stringify(positions) }] }
    }
  )

  // 3. Get delta and suggested adjustments
  server.tool(
    "get-delta-and-adjustments",
    { walletAddress: z.string() },
    async ({ walletAddress }) => {
      const jlp = await getJLPPositions(walletAddress)
      const hedges = await getDriftHedgePositions()
      const report = calculateDelta(jlp, hedges)
      return { content: [{ type: "text", text: JSON.stringify(report) }] }
    }
  )

  // 4. Make adjustments on Drift
  server.tool(
    "make-adjustments",
    {
      adjustments: z.array(
        z.object({
          token: z.enum(["SOL", "ETH", "WBTC"]),
          amount: z.number()
        })
      )
    },
    async ({ adjustments }) => {
      const results: { token: string, amount: number, tx: string }[] = []
      for (const adj of adjustments) {
        if (Math.abs(adj.amount) < 1e-6) continue
        const tx = await placeDriftHedge(adj.token, adj.amount)
        results.push({ token: adj.token, amount: adj.amount, tx })
      }
      return { content: [{ type: "text", text: JSON.stringify(results) }] }
    }
  )
}
