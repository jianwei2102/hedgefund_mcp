import { Bot, BotType, ActivityLog, BotStatus } from "./bot.js";
import { getDriftClient } from "./drift.js";
import {
  getHedgePerpsPositions,
  calculateIdealDeltaNeutralHedge,
} from "./hedge.js";
import { Position, HedgePositions } from "./types.js";
import { DriftPerpsMarketIndexes } from "./constants.js";

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

  // Check if JLP balance has changed
  private async checkBalanceChange(): Promise<boolean> {
    const driftClient = await getDriftClient();
    const jlpPosition = driftClient
      .getUser()
      .getSpotPosition(DriftPerpsMarketIndexes.SOL);

    if (!jlpPosition) {
      return false;
    }

    // Convert to number and check if there's a significant change
    const currentBalance = jlpPosition.scaledBalance.toNumber() / 1e9;

    if (this.lastKnownBalance === null) {
      this.lastKnownBalance = currentBalance;
      return true;
    }

    const change = Math.abs(currentBalance - this.lastKnownBalance);
    const percentageChange = (change / this.lastKnownBalance) * 100;

    if (percentageChange > this.minRebalanceThreshold) {
      this.lastKnownBalance = currentBalance;
      return true;
    }

    return false;
  }

  // Execute the hedging strategy
  async execute(): Promise<void> {
    try {
      // 1. Check if JLP balance has changed
      const hasBalanceChange = await this.checkBalanceChange();
      if (!hasBalanceChange) {
        console.log("No significant balance change detected");
        return;
      }

      // 2. Get current positions
      const currentPositions = await getHedgePerpsPositions();

      // 3. Get JLP position
      const driftClient = await getDriftClient();
      const jlpPosition = driftClient
        .getUser()
        .getSpotPosition(DriftPerpsMarketIndexes.SOL);

      if (!jlpPosition) {
        throw new Error("No JLP position found");
      }

      // 4. Calculate ideal positions
      const jlpPositionInfo: Position = {
        amount: jlpPosition.scaledBalance.toNumber() / 1e9,
        usdValue: 0, // TODO: Calculate USD value
      };

      const idealPositions = await calculateIdealDeltaNeutralHedge(
        jlpPositionInfo
      );

      // 5. Check if rebalancing is needed
      const needsRebalancing = this.checkRebalancingNeeded(
        currentPositions,
        idealPositions
      );

      if (needsRebalancing) {
        await this.rebalancePositions(currentPositions, idealPositions);
      }
    } catch (error) {
      console.error("Error executing JLP hedge bot:", error);
      throw error;
    }
  }

  // Check if positions need rebalancing
  private checkRebalancingNeeded(
    current: HedgePositions,
    ideal: HedgePositions
  ): boolean {
    const threshold = this.minRebalanceThreshold;

    // Check each position
    for (const token of ["SOL", "ETH", "BTC"] as const) {
      const currentValue = current[token].usdValue;
      const idealValue = ideal[token].usdValue;

      const difference = Math.abs(currentValue - idealValue);
      const percentageDiff = (difference / idealValue) * 100;

      if (percentageDiff > threshold) {
        return true;
      }
    }

    return false;
  }

  // Execute rebalancing trades
  private async rebalancePositions(
    current: HedgePositions,
    ideal: HedgePositions
  ): Promise<void> {
    // TODO: Implement rebalancing logic using Drift SDK
    // 1. Calculate required trades
    // 2. Check slippage
    // 3. Execute trades
    console.log("Rebalancing positions...");
  }
}
