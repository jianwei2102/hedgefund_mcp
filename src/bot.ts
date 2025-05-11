import { JLPHedgeBot } from "./jlp-bot.js";

// Bot status enum
export enum BotStatus {
  RUNNING = "RUNNING",
  STOPPED = "STOPPED",
  ERROR = "ERROR",
}

// Bot type enum
export enum BotType {
  JLP_HEDGE = "JLP_HEDGE",
  TRUMP_HEDGE = "TRUMP_HEDGE",
}

export enum ActivityLog {}

export interface Bot {
  id: string;
  type: BotType;
  status: BotStatus;
  intervalHours: number;
  activityLog?: ActivityLog[];
  lastRunTime?: Date;
  error?: string;
  minRebalanceThreshold?: number;
}

export interface createBotOpts {
  type: BotType;
  intervalHours: number;
  minRebalanceThreshold: number;
}

// Bot manager class to handle all bot operations
export class BotManager {
  private bots: Map<string, Bot>;

  constructor() {
    this.bots = new Map();
  }

  // Create a new bot
  async createBot(opts: createBotOpts): Promise<Bot> {
    console.log("Creating bot with options:", opts);
    const id = `bot_${Date.now()}`;

    // Check if a bot of the same type already exists
    for (const bot of this.bots.values()) {
      if (bot.type === opts.type) {
        console.error(
          `Bot of type ${opts.type} already exists with ID: ${bot.id}`
        );
        throw new Error(
          `A bot of type ${opts.type} already exists with ID: ${bot.id}. Bot has already been initialized.`
        );
      }
    }

    const bot: Bot = {
      ...opts,
      id,
      status: BotStatus.RUNNING,
    };

    console.log("Bot created successfully:", bot);
    this.bots.set(id, bot);
    this.monitorBots();

    return bot;
  }

  // List all bots
  listBots(): Bot[] {
    return Array.from(this.bots.values());
  }

  // Monitor bots and execute their actions if the interval has passed
  async monitorBots(): Promise<void> {
    console.log("Starting bot loop...");
    setInterval(async () => {
      const bots = this.listBots();
      const now = new Date();

      for (const bot of bots) {
        console.log(`Checking bot ${bot.id}...`);
        if (
          bot.lastRunTime === undefined ||
          now.getTime() - bot.lastRunTime.getTime() >=
            bot.intervalHours * 60 * 60 * 1000
        ) {
          try {
            console.log(`Executing bot ${bot.id}...`);
            let botInstance;
            if (bot.type === BotType.JLP_HEDGE) {
              botInstance = new JLPHedgeBot(bot);
            } else {
              throw new Error(`Unknown bot type: ${bot.type}`);
            }
            await botInstance.execute();
            bot.lastRunTime = new Date();
          } catch (error) {
            console.error(`Error executing bot ${bot.id}:`, error);
          }
        }
      }
    }, 60 * 1000); // Run every 1 minute
  }
}

// Create a singleton instance
export const botManager = new BotManager();
