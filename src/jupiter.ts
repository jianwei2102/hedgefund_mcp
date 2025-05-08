import { Token } from "./types.js";

export async function getTokenPrices(): Promise<{ [key in Token]: number }> {
  // Fetch prices from the API
  const response = await fetch("https://worker.jup.ag/doves-oracle/btcusd,ethusd,solusd,usdcusd,usdtusd");
  const priceData = await response.json();

  const solData = priceData.find((feed: any) => feed.feedId === "SOLUSD");
  const ethData = priceData.find((feed: any) => feed.feedId === "ETHUSD");
  const btcData = priceData.find((feed: any) => feed.feedId === "BTCUSD");

  // Extract prices for SOL, ETH, and BTC
  const solPrice = solData.price / Math.pow(10, Math.abs(solData.expo));
  const ethPrice = ethData.price / Math.pow(10, Math.abs(ethData.expo));
  const btcPrice = btcData.price / Math.pow(10, Math.abs(btcData.expo));

  console.log({ solPrice, ethPrice, btcPrice });
  return {
    SOL: solPrice,
    ETH: ethPrice,
    BTC: btcPrice,
  };
}