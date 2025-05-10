import { subscribeDriftClient } from "./drift.js";
import {
  placePerpMarketOrder,
  placeSpotMarketOrder,
  swapAllToJLP as swapToJLP,
} from "./order.js";
import { getAccountPortfolio, getJLPPosition } from "./portfolio.js";

export async function initializeDrift() {
  try {
    const driftClient = await subscribeDriftClient();
    console.log("Drift client initialized successfully");
    return driftClient;
  } catch (error) {
    console.error("Failed to initialize Drift client:", error);
    throw error;
  }
}

export async function placePerpOrder() {
  try {
    const order = await placePerpMarketOrder(0, "short", 0.02);
    console.log("Order placed successfully:", order);
    // return order;
  } catch (error) {
    console.error("Failed to initialize Drift client:", error);
    throw error;
  }
}

export async function JLPPosition() {
  try {
    const position = await getJLPPosition();
    console.log("JLP position retrieved successfully:", position);
  } catch (error) {
    console.error("Failed to initialize Drift client:", error);
    throw error;
  }
}

export async function accountPortfolio() {
  try {
    const portfolio = await getAccountPortfolio();
    console.log("Account portfolio retrieved successfully:", portfolio);
  } catch (error) {
    console.error("Failed to initialize Drift client:", error);
    throw error;
  }
}

export async function swapAllToJLP() {
  try {
    await swapToJLP();
    console.log("Swapped all to JLP successfully");
  } catch (error) {
    console.error("Failed to swap to JLP:", error);
    throw error;
  }
}

// Call the function
placePerpOrder().catch(console.error);

// You can add more functions here later
