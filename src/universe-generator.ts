import { Sector, Port, PortType } from './types';
import { commodities, portTypes } from './game-config';

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
        port: null
      };
    }
  }
  
  return sectors;
}

export function generatePorts(sectors: { [key: number]: Sector }): void {
  const portTypeKeys = Object.keys(portTypes) as PortType[];
  const sectorIds = Object.keys(sectors).map(Number);
  
  const portSectors: number[] = [];
  while (portSectors.length < 5) {
    const randomSectorId = sectorIds[Math.floor(Math.random() * sectorIds.length)];
    if (!portSectors.includes(randomSectorId)) {
      portSectors.push(randomSectorId);
    }
  }
  
  portSectors.forEach((sectorId, index) => {
    const portType = portTypeKeys[index % portTypeKeys.length];
    const portInfo = portTypes[portType];
    
    const port: Port = {
      type: portType,
      name: portInfo.name,
      buys: portInfo.buys,
      sells: portInfo.sells,
      prices: {} as Port['prices']
    };
    
    Object.values(commodities).forEach((commodityInfo, commodityIndex) => {
      const commodity = Object.keys(commodities)[commodityIndex] as keyof typeof commodities;
      const basePrice = commodityInfo.basePrice;
      
      // NEW PROFITABLE PRICING SYSTEM
      // Ports that SELL (player buys): 70-90% of base price (cheaper)
      // Ports that BUY (player sells): 110-130% of base price (more expensive)
      // This ensures 20-60% profit margins!
      
      const sellVariation = 0.2; // 70-90% for selling to player
      const buyVariation = 0.2;  // 110-130% for buying from player
      
      const sellPrice = port.sells.includes(commodity) 
        ? Math.round(basePrice * (0.7 + Math.random() * sellVariation))  // 70-90%
        : null;
        
      const buyPrice = port.buys.includes(commodity)
        ? Math.round(basePrice * (1.1 + Math.random() * buyVariation))   // 110-130%
        : null;
      
      port.prices[commodity] = {
        buy: buyPrice,   // What port pays player (higher)
        sell: sellPrice  // What player pays port (lower)
      };
    });
    
    sectors[sectorId].port = port;
    sectors[sectorId].name = `${sectors[sectorId].name} - ${port.name}`;
  });
}