import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  Commodity,
  ShipType,
  PortType,
  Action,
  PlayerUpdateType,
  TradeType,
  TradeAction,
  CommodityInfo,
  ShipInfo,
  PortInfo,
  EnergyConfig,
  Player,
  Port,
  Sector,
  GameState,
  PlayerJoinedData,
  PlayerUpdateData,
  TradeData,
  TradeResultData,
  PlayerTradedData
} from './types';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const commodities: { [key in Commodity]: CommodityInfo } = {
  [Commodity.ORE]: { name: 'Ore', basePrice: 50 },
  [Commodity.FOOD]: { name: 'Food', basePrice: 30 },
  [Commodity.EQUIPMENT]: { name: 'Equipment', basePrice: 100 }
};

const shipTypes: { [key in ShipType]: ShipInfo } = {
  [ShipType.SCOUT]: { 
    name: 'Scout Ship', 
    cargoCapacity: 10, 
    energyEfficiency: 0.8,
    price: 0 
  },
  [ShipType.TRADER]: { 
    name: 'Trader Vessel', 
    cargoCapacity: 30, 
    energyEfficiency: 1.0,
    price: 5000 
  },
  [ShipType.FREIGHTER]: { 
    name: 'Heavy Freighter', 
    cargoCapacity: 50, 
    energyEfficiency: 1.5,
    price: 15000 
  }
};

const energyConfig: EnergyConfig = {
  maxEnergy: 2400,
  regenRate: 100,
  regenInterval: 36000,
  costs: {
    [Action.MOVE]: 10,
    [Action.TRADE]: 5
  }
};

const portTypes: { [key in PortType]: PortInfo } = {
  [PortType.MINING]: { buys: [Commodity.ORE], sells: [Commodity.EQUIPMENT], name: 'Mining Station' },
  [PortType.AGRICULTURAL]: { buys: [Commodity.FOOD], sells: [Commodity.ORE], name: 'Agricultural Port' },
  [PortType.INDUSTRIAL]: { buys: [Commodity.EQUIPMENT], sells: [Commodity.FOOD], name: 'Industrial Complex' },
  [PortType.COMMERCIAL]: { buys: [Commodity.ORE, Commodity.FOOD], sells: [Commodity.EQUIPMENT], name: 'Commercial Hub' },
  [PortType.STARPORT]: { buys: [Commodity.ORE, Commodity.FOOD, Commodity.EQUIPMENT], sells: [Commodity.ORE, Commodity.FOOD, Commodity.EQUIPMENT], name: 'StarPort' }
};

const gameState: GameState = {
  sectors: {},
  players: {},
  commodities: commodities,
  shipTypes: shipTypes
};

function generateSectors(): { [key: number]: Sector } {
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

function generatePorts(sectors: { [key: number]: Sector }): void {
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
    
    Object.values(Commodity).forEach(commodity => {
      const basePrice = commodities[commodity].basePrice;
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

function updatePlayerEnergy(player: Player): void {
  const now = Date.now();
  const timeDiff = now - player.lastEnergyUpdate;
  const energyToAdd = Math.floor(timeDiff / energyConfig.regenInterval);
  
  if (energyToAdd > 0) {
    player.energy = Math.min(energyConfig.maxEnergy, player.energy + energyToAdd);
    player.lastEnergyUpdate = now;
  }
}

function consumeEnergy(player: Player, action: Action): boolean {
  updatePlayerEnergy(player);
  const ship = shipTypes[player.ship];
  const energyCost = Math.ceil(energyConfig.costs[action] * ship.energyEfficiency);
  
  if (player.energy < energyCost) {
    return false;
  }
  
  player.energy -= energyCost;
  return true;
}

gameState.sectors = generateSectors();
generatePorts(gameState.sectors);

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  const playerId = uuidv4();
  const player: Player = {
    id: playerId,
    socketId: socket.id,
    name: `Player${Math.floor(Math.random() * 1000)}`,
    currentSector: 1,
    credits: 1000,
    inventory: {
      [Commodity.ORE]: 0,
      [Commodity.FOOD]: 0,
      [Commodity.EQUIPMENT]: 0
    },
    ship: ShipType.SCOUT,
    cargoCapacity: shipTypes[ShipType.SCOUT].cargoCapacity,
    cargoUsed: 0,
    energy: energyConfig.maxEnergy,
    lastEnergyUpdate: Date.now()
  };
  
  gameState.players[playerId] = player;
  gameState.sectors[1].players.push(playerId);
  
  const joinData: PlayerJoinedData = {
    playerId: playerId,
    player: player,
    sectors: gameState.sectors,
    commodities: gameState.commodities,
    shipTypes: gameState.shipTypes
  };
  
  socket.emit('playerJoined', joinData);
  
  const updateData: PlayerUpdateData = {
    type: PlayerUpdateType.JOINED,
    player: player,
    sectors: gameState.sectors
  };
  
  socket.broadcast.emit('playerUpdate', updateData);
  
  socket.on('moveTo', (targetSectorId: number) => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
    if (!player) return;
    
    updatePlayerEnergy(player);
    
    const currentSector = gameState.sectors[player.currentSector];
    const targetSector = gameState.sectors[targetSectorId];
    
    if (!targetSector || !currentSector.connections.includes(targetSectorId)) {
      socket.emit('error', 'Invalid move');
      return;
    }
    
    if (!consumeEnergy(player, Action.MOVE)) {
      socket.emit('error', 'Not enough energy to move');
      return;
    }
    
    currentSector.players = currentSector.players.filter(id => id !== player.id);
    player.currentSector = targetSectorId;
    targetSector.players.push(player.id);
    
    const moveUpdateData: PlayerUpdateData = {
      type: PlayerUpdateType.MOVED,
      player: player,
      sectors: gameState.sectors
    };
    
    io.emit('playerUpdate', moveUpdateData);
  });

  socket.on('buyItem', (data: TradeData) => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
    if (!player) return;
    
    updatePlayerEnergy(player);
    if (!consumeEnergy(player, Action.TRADE)) {
      socket.emit('error', 'Not enough energy to trade');
      return;
    }
    
    const currentSector = gameState.sectors[player.currentSector];
    const port = currentSector.port;
    
    if (!port || !port.sells.includes(data.commodity)) {
      socket.emit('error', `This port doesn't sell ${data.commodity}`);
      return;
    }
    
    const price = port.prices[data.commodity].sell!;
    const quantity = data.quantity || 1;
    const totalCost = price * quantity;
    
    if (player.credits < totalCost) {
      socket.emit('error', 'Not enough credits');
      return;
    }
    
    if (player.cargoUsed + quantity > player.cargoCapacity) {
      socket.emit('error', 'Not enough cargo space');
      return;
    }
    
    player.credits -= totalCost;
    player.inventory[data.commodity] += quantity;
    player.cargoUsed += quantity;
    
    const tradeResult: TradeResultData = {
      type: TradeType.BUY,
      commodity: data.commodity,
      quantity: quantity,
      price: price,
      totalCost: totalCost,
      player: player
    };
    
    socket.emit('tradeResult', tradeResult);
    
    const tradeNotification: PlayerTradedData = {
      playerName: player.name,
      type: TradeAction.BOUGHT,
      commodity: data.commodity,
      quantity: quantity
    };
    
    socket.to(currentSector.id.toString()).emit('playerTraded', tradeNotification);
  });

  socket.on('sellItem', (data: TradeData) => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
    if (!player) return;
    
    updatePlayerEnergy(player);
    if (!consumeEnergy(player, Action.TRADE)) {
      socket.emit('error', 'Not enough energy to trade');
      return;
    }
    
    const currentSector = gameState.sectors[player.currentSector];
    const port = currentSector.port;
    
    if (!port || !port.buys.includes(data.commodity)) {
      socket.emit('error', `This port doesn't buy ${data.commodity}`);
      return;
    }
    
    const quantity = data.quantity || 1;
    if (player.inventory[data.commodity] < quantity) {
      socket.emit('error', `Not enough ${data.commodity} to sell`);
      return;
    }
    
    const price = port.prices[data.commodity].buy!;
    const totalEarned = price * quantity;
    
    player.credits += totalEarned;
    player.inventory[data.commodity] -= quantity;
    player.cargoUsed -= quantity;
    
    const tradeResult: TradeResultData = {
      type: TradeType.SELL,
      commodity: data.commodity,
      quantity: quantity,
      price: price,
      totalEarned: totalEarned,
      player: player
    };
    
    socket.emit('tradeResult', tradeResult);
    
    const tradeNotification: PlayerTradedData = {
      playerName: player.name,
      type: TradeAction.SOLD,
      commodity: data.commodity,
      quantity: quantity
    };
    
    socket.to(currentSector.id.toString()).emit('playerTraded', tradeNotification);
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
    if (player) {
      const sector = gameState.sectors[player.currentSector];
      if (sector) {
        sector.players = sector.players.filter(id => id !== player.id);
      }
      
      delete gameState.players[player.id];
      
      const leaveUpdateData: PlayerUpdateData = {
        type: PlayerUpdateType.LEFT,
        player: player,
        sectors: gameState.sectors
      };
      
      socket.broadcast.emit('playerUpdate', leaveUpdateData);
    }
  });
});

server.listen(PORT, () => {
  console.log(`TradeWars server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to play`);
});