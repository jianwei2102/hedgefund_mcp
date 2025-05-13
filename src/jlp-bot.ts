import { Bot, BotType, ActivityLog, BotStatus } from "./bot.js";
import { getDriftClient } from "./drift.js";
import { calculateIdealDeltaNeutralHedge } from "./hedge.js";
import { Position, HedgePositions, SpotBalance, PerpBalance } from "./types.js";
import { DriftPerpsMarketIndexes } from "./constants.js";
import { getAccountPortfolio } from "./portfolio.js";
import { sendTelegramMessage } from "./telegram.js";
import { placePerpMarketOrder } from "./order.js";

// JLP Bot implementation
export class JLPHedgeBot implements Bot {
  id: string;
  type: BotType;
  status: BotStatus;
  intervalHours: number;
  lastRunTime?: Date;
  error?: string;
  activityLog: ActivityLog[];
  minRebalanceThreshold: number;
  private lastKnownBalance: number | null = null;

  constructor(bot: Bot) {
    this.id = bot.id;
    this.type = bot.type;
    this.status = bot.status;
    this.intervalHours = bot.intervalHours;
    this.activityLog = [];
    this.minRebalanceThreshold = bot.minRebalanceThreshold || 0.1; // Default to 0.1%
  }

  // Execute the hedging strategy
  async execute(): Promise<void> {
    try {
      // Announce bot check
      sendTelegramMessage(
        `🔍 Checking bot <b>${this.id}</b> of type <b>${this.type}</b>...`
      );
      // 1. Get current positions
      const currentPositions = await getAccountPortfolio();
      console.log("Current positions:", currentPositions);
      // 2. Find JLP position from spot balances
      const jlpPosition = currentPositions.spotBalances.find(
        (position: SpotBalance) => position.symbol === "JLP"
      );
      if (!jlpPosition) {
        console.log("No JLP position found");
        sendTelegramMessage("❌ No JLP position found in spot balances");
        return;
      }
      // 3. Calculate ideal positions based on JLP value
      const idealPositions = await calculateIdealDeltaNeutralHedge({
        amount: jlpPosition.balance,
        usdValue: jlpPosition.usdValue,
      });
      console.log("Ideal positions:", idealPositions);
      // 4. Get current perp positions
      const currentPerpPositions = currentPositions.perpBalances.reduce(
        (
          acc: Record<string, { amount: number; usdValue: number }>,
          pos: PerpBalance
        ) => {
          const symbol = pos.symbol.replace("-PERP", "");
          acc[symbol] = {
            amount: pos.baseAssetAmount,
            usdValue: pos.usdValue,
          };
          return acc;
        },
        {} as Record<string, { amount: number; usdValue: number }>
      );
      console.log("Current perp positions:", currentPerpPositions);
      // 5. Apply minimum position requirements and calculate required adjustments
      const MIN_POSITIONS = {
        SOL: 0.01,
        BTC: 0.0001,
        ETH: 0.001,
      };
      const requiredAdjustments: Record<string, number> = {};
      let needsRebalancing = false;
      for (const token of ["SOL", "ETH", "BTC"] as const) {
        const idealAmount = idealPositions[token].amount;
        const currentAmount = currentPerpPositions[token]?.amount || 0;
        // Calculate required position with minimum requirements
        let requiredAmount = idealAmount;
        if (Math.abs(idealAmount) < MIN_POSITIONS[token]) {
          requiredAmount =
            idealAmount > 0 ? MIN_POSITIONS[token] : -MIN_POSITIONS[token];
        } else {
          // Round down to nearest minimum position
          const direction = Math.sign(idealAmount);
          requiredAmount =
            direction *
            Math.floor(Math.abs(idealAmount) / MIN_POSITIONS[token]) *
            MIN_POSITIONS[token];
        }
        const adjustment = requiredAmount - currentAmount;
        requiredAdjustments[token] = adjustment;
        // Check if rebalancing is needed based on threshold
        const percentageDiff =
          (Math.abs(adjustment) / Math.abs(requiredAmount)) * 100;
        if (percentageDiff <= this.minRebalanceThreshold) {
          sendTelegramMessage(
            `- <b>${token}</b>: <b>${percentageDiff.toFixed(
              2
            )}%</b> (no adjustment needed)`
          );
        } else {
          sendTelegramMessage(
            `- <b>${token}</b>: <b>${percentageDiff.toFixed(
              2
            )}%</b> (hedging required)`
          );
          needsRebalancing = true;
        }
      }
      if (needsRebalancing) {
        console.log(
          "Rebalancing needed. Required adjustments:",
          requiredAdjustments
        );
        sendTelegramMessage(
          `🔄 Rebalancing needed for positions: ${JSON.stringify(
            requiredAdjustments
          )}`
        );
        await this.rebalancePositions(
          currentPerpPositions,
          requiredAdjustments
        );
      } else {
        console.log("No rebalancing needed");
        sendTelegramMessage(
          "✅ Positions are within threshold, no rebalancing needed"
        );
      }
    } catch (error) {
      console.error("Error executing JLP hedge bot:", error);
      this.status = BotStatus.ERROR;
      this.error = error instanceof Error ? error.message : String(error);
      sendTelegramMessage(`❌ Error executing JLP hedge bot: ${this.error}`);
      throw error;
    }
  }

  // Execute rebalancing trades
  private async rebalancePositions(
    currentPositions: Record<string, { amount: number; usdValue: number }>,
    requiredAdjustments: Record<string, number>
  ): Promise<void> {
    try {
      for (const [token, adjustment] of Object.entries(requiredAdjustments)) {
        if (Math.abs(adjustment) < 0.000001) continue; // Skip tiny adjustments
        const marketIndex =
          DriftPerpsMarketIndexes[
            token as keyof typeof DriftPerpsMarketIndexes
          ];
        if (marketIndex === undefined) {
          console.error(`No market index found for ${token}`);
          continue;
        }
        // For delta-neutral hedge: positive adjustment means we need to short more (increase hedge)
        // negative adjustment means reduce short (or go long)
        const direction = adjustment > 0 ? "short" : "long";
        const size = Math.abs(adjustment);
        console.log(`Placing ${direction} order for ${token}: ${size}`);
        sendTelegramMessage(
          `📊 Placing ${direction} order for ${token}: ${size}`
        );
        const orderResult = await placePerpMarketOrder(
          marketIndex,
          direction,
          size
        );
        if (orderResult.error) {
          console.error(`Error placing order for ${token}:`, orderResult.error);
          sendTelegramMessage(
            `❌ Error placing order for ${token}: ${orderResult.error}`
          );
          continue;
        }
        console.log(`Order placed successfully for ${token}:`, orderResult);
        // Compose detailed summary message
        const now = new Date();
        const message = `\n📊 <b>Hedge Trade Summary — ${token}</b>\n\n🕒 <b>Time:</b> ${now.toLocaleString()}\n<b>Details:</b>\n• <b>Symbol:</b> ${token}\n• <b>Order Type:</b> ${
          orderResult.orderType ?? "N/A"
        }\n• <b>Direction:</b> ${
          orderResult.direction ?? "N/A"
        }\n• <b>Base Asset Amount:</b> ${
          orderResult.baseAssetAmount ?? size
        }\n\n🧮 <b>Units (with precision):</b> ${
          orderResult.baseAssetAmount ?? "N/A"
        }\n🔗 <a href=\"https://solscan.io/tx/${
          orderResult.txId ?? ""
        }\">View Transaction on Solscan</a>\n\n✅ <b>Short Position Placed Successfully</b>\n`;
        sendTelegramMessage(message);
      }
      sendTelegramMessage("✅ Rebalancing orders completed");
    } catch (error) {
      console.error("Error during rebalancing:", error);
      sendTelegramMessage(
        `❌ Error during rebalancing: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }
}
