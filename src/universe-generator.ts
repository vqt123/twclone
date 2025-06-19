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
      const variation = 0.2;
      const buyPrice = Math.round(basePrice * (0.8 + Math.random() * variation));
      const sellPrice = Math.round(basePrice * (1.2 + Math.random() * variation));
      
      port.prices[commodity] = {
        buy: port.buys.includes(commodity) ? buyPrice : null,
        sell: port.sells.includes(commodity) ? sellPrice : null
      };
    });
    
    sectors[sectorId].port = port;
    sectors[sectorId].name = `${sectors[sectorId].name} - ${port.name}`;
  });
}