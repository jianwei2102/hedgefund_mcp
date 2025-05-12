import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Bot, BotType } from "./bot.js";

// Get the directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store in the same directory as the source file
const STORAGE_DIR = __dirname;
const BOTS_FILE = path.join(STORAGE_DIR, "bots.json");

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log("Initializing storage in directory:", STORAGE_DIR);

      // Check if bots file exists, if not create it
      try {
        await fs.access(BOTS_FILE);
        console.log("Bots file exists");
      } catch {
        // If file doesn't exist, create it with empty array
        console.log("Creating new bots file");
        await fs.writeFile(BOTS_FILE, JSON.stringify([]));
        console.log("Bots file created successfully");
      }
    } catch (error) {
      console.error("Failed to initialize storage:", error);
      console.error("Current working directory:", process.cwd());
      throw error;
    }
  }

  async saveBots(bots: Bot[]): Promise<void> {
    try {
      const serializedBots = bots.map((bot) => ({
        ...bot,
        lastRunTime: bot.lastRunTime?.toISOString(),
      }));
      await fs.writeFile(BOTS_FILE, JSON.stringify(serializedBots, null, 2));
    } catch (error) {
      console.error("Failed to save bots:", error);
      throw error;
    }
  }

  async loadBots(): Promise<Bot[]> {
    try {
      const data = await fs.readFile(BOTS_FILE, "utf-8");
      const bots = JSON.parse(data);
      return bots.map((bot: any) => ({
        ...bot,
        lastRunTime: bot.lastRunTime ? new Date(bot.lastRunTime) : undefined,
      }));
    } catch (error) {
      console.error("Failed to load bots:", error);
      return [];
    }
  }
}

export const storageService = StorageService.getInstance();
