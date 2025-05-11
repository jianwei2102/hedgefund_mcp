import { depositJLPToken, subscribeDriftClient } from "./drift.js";
import { getHedgePerpsPositions } from "./hedge.js";
import {
  placePerpMarketOrder,
  placeSpotMarketOrder,
  swapTokenToJLP,
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
    const order = await placePerpMarketOrder(0, "short", 0.01);
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
    await swapTokenToJLP();
    console.log("Swapped all to JLP successfully");
  } catch (error) {
    console.error("Failed to swap to JLP:", error);
    throw error;
  }
}

export async function depositJLP() {
  try {
    await depositJLPToken();
    console.log("Deposited JLP token successfully");
  } catch (error) {
    console.error("Failed to deposit JLP token:", error);
    throw error;
  }
}

export async function getHedgePositions() {
  try {
    const hedgePositions = await getHedgePerpsPositions();
    console.log("Hedge positions retrieved successfully:", hedgePositions);
  } catch (error) {
    console.error("Failed to get hedge positions:", error);
    throw error;
  }
}
// Call the function
getHedgePositions().catch(console.error);
// accountPortfolio().catch(console.error);
// placePerpOrder().catch(console.error);

// You can add more functions here later
