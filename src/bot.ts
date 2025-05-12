import { JLPHedgeBot } from "./jlp-bot.js";
import { storageService } from "./storage.js";
import { sendTelegramMessage } from "./telegram.js";

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
  private botInstances: Map<string, any>;
  private isInitialized: boolean = false;
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.bots = new Map();
    this.botInstances = new Map();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await storageService.initialize();
    const savedBots = await storageService.loadBots();

    for (const bot of savedBots) {
      this.bots.set(bot.id, bot);
      if (bot.type === BotType.JLP_HEDGE) {
        this.botInstances.set(bot.id, new JLPHedgeBot(bot));
      }
    }
    console.log("Bots initialized:", this.bots);
    this.isInitialized = true;
  }

  private async saveBots(): Promise<void> {
    await storageService.saveBots(this.listBots());
  }

  // Create a new bot
  async createBot(opts: createBotOpts): Promise<Bot> {
    if (!this.isInitialized) {
      await this.initialize();
    }

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

    // Initialize the bot instance
    if (bot.type === BotType.JLP_HEDGE) {
      this.botInstances.set(bot.id, new JLPHedgeBot(bot));
    }

    console.log("Bot created successfully:", bot);
    this.bots.set(id, bot);
    await this.saveBots();

    // Restart monitoring to include the new bot
    this.restartMonitoring();
    return bot;
  }

  // List all bots
  listBots(): Bot[] {
    return Array.from(this.bots.values());
  }

  // Monitor bots and execute their actions if the interval has passed
  monitorBots(): void {
    if (!this.isInitialized) {
      this.initialize();
      console.log("BotManager initialized");
      sendTelegramMessage("🤖 BotManager initialized");
    }

    console.log("Starting bot monitoring loop...");
    this.monitorInterval = setInterval(async () => {
      const bots = this.listBots();
      const now = new Date();

      for (const bot of bots) {
        console.log(`Checking bot ${bot.id}...`);
        sendTelegramMessage(`🔍 Checking bot ${bot.id} of type ${bot.type}...`);
        if (
          bot.lastRunTime === undefined ||
          now.getTime() - bot.lastRunTime.getTime() >=
            bot.intervalHours * 60 * 60 * 1000
        ) {
          try {
            console.log(`Executing bot ${bot.id}...`);
            sendTelegramMessage(`⚙️ Executing bot ${bot.id}...`);
            const botInstance = this.botInstances.get(bot.id);
            if (!botInstance) {
              console.log(
                `No bot instance found for bot ${bot.id}, initiating new instance`
              );
              sendTelegramMessage(
                `🆕 No instance found for bot ${bot.id}. Creating a new instance.`
              );

              // Create as JLPHedgeBot instance for now TODO: Add other bot types
              const newInstance = new JLPHedgeBot(bot);
              this.botInstances.set(bot.id, newInstance);
              await newInstance.execute();
            } else {
              await botInstance.execute();
            }
            bot.lastRunTime = new Date();
            sendTelegramMessage(
              `✅ Bot ${
                bot.id
              } executed successfully at ${bot.lastRunTime.toISOString()}.`
            );
            await this.saveBots();
          } catch (error) {
            console.error(`Error executing bot ${bot.id}:`, error);
            bot.status = BotStatus.ERROR;
            bot.error = error instanceof Error ? error.message : String(error);
            sendTelegramMessage(
              `❌ Error executing bot ${bot.id}: ${bot.error}`
            );
            await this.saveBots();
          }
        }
      }
    }, 60 * 1000); // Check every minute
  }

  private restartMonitoring(): void {
    // Clear existing interval if any
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    // Start new monitoring
    this.monitorBots();
  }
}

// Create a singleton instance
export const botManager = new BotManager();
