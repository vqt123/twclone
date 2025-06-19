import { Sector, TradingPost, TradingPostType } from './types';
import { tradingPosts, tradeConfig } from './game-config';

export function generateSectors(): { [key: number]: Sector } {
  const sectors: { [key: number]: Sector } = {};
  const gridSize = 5;
  const gridHeight = 4;
  
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const sectorId = x * gridHeight + y + 1;
      const connections: number[] = [];
      
      if (x > 0) connections.push((x - 1) * gridHeight + y + 1);
      if (x < gridSize - 1) connections.push((x + 1) * gridHeight + y + 1);
      if (y > 0) connections.push(x * gridHeight + (y - 1) + 1);
      if (y < gridHeight - 1) connections.push(x * gridHeight + (y + 1) + 1);
      
      sectors[sectorId] = {
        id: sectorId,
        name: `Sector ${sectorId}`,
        x: x,
        y: y,
        connections: connections,
        players: [],
        tradingPost: null
      };
    }
  }
  
  return sectors;
}

export function generateTradingPosts(sectors: { [key: number]: Sector }): void {
  const tradingPostTypes = Object.keys(tradingPosts) as TradingPostType[];
  const sectorIds = Object.keys(sectors).map(Number);
  
  const tradingPostSectors: number[] = [];
  while (tradingPostSectors.length < 5) {
    const randomSectorId = sectorIds[Math.floor(Math.random() * sectorIds.length)];
    if (!tradingPostSectors.includes(randomSectorId)) {
      tradingPostSectors.push(randomSectorId);
    }
  }
  
  tradingPostSectors.forEach((sectorId, index) => {
    const postType = tradingPostTypes[index % tradingPostTypes.length];
    const postInfo = tradingPosts[postType];
    
    const tradingPost: TradingPost = {
      type: postType,
      name: postInfo.name,
      baseProfit: postInfo.baseProfit,
      tradeEfficiency: 1.0, // Start at 100% efficiency
      lastRegenTime: Date.now(),
      description: postInfo.description
    };
    
    sectors[sectorId].tradingPost = tradingPost;
    sectors[sectorId].name = `${sectors[sectorId].name} - ${tradingPost.name}`;
  });
}

export function updateTradingPostEfficiency(tradingPost: TradingPost): void {
  const now = Date.now();
  const timeSinceLastRegen = now - tradingPost.lastRegenTime;
  const regenTimeMs = tradeConfig.regenTimeHours * 60 * 60 * 1000; // 24 hours in ms
  
  // Calculate how much efficiency should have regenerated
  const regenProgress = Math.min(timeSinceLastRegen / regenTimeMs, 1.0);
  const currentEfficiency = Math.min(1.0, tradingPost.tradeEfficiency + regenProgress);
  
  tradingPost.tradeEfficiency = Math.max(tradeConfig.minEfficiency, currentEfficiency);
  tradingPost.lastRegenTime = now;
}

export function executeTrade(tradingPost: TradingPost): number {
  // Update efficiency based on time passed
  updateTradingPostEfficiency(tradingPost);
  
  // Calculate profit based on current efficiency
  const profit = Math.round(tradingPost.baseProfit * tradingPost.tradeEfficiency);
  
  // Apply diminishing returns for next trade
  tradingPost.tradeEfficiency = Math.max(
    tradeConfig.minEfficiency, 
    tradingPost.tradeEfficiency * tradeConfig.efficiencyDecay
  );
  
  return profit;
}