const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const commodities = {
  ore: { name: 'Ore', basePrice: 50 },
  food: { name: 'Food', basePrice: 30 },
  equipment: { name: 'Equipment', basePrice: 100 }
};

const portTypes = {
  mining: { buys: ['ore'], sells: ['equipment'], name: 'Mining Station' },
  agricultural: { buys: ['food'], sells: ['ore'], name: 'Agricultural Port' },
  industrial: { buys: ['equipment'], sells: ['food'], name: 'Industrial Complex' },
  commercial: { buys: ['ore', 'food'], sells: ['equipment'], name: 'Commercial Hub' },
  starport: { buys: ['ore', 'food', 'equipment'], sells: ['ore', 'food', 'equipment'], name: 'StarPort' }
};

const gameState = {
  sectors: {},
  players: {},
  commodities: commodities
};

function generateSectors() {
  const sectors = {};
  const gridSize = 5; // 5x4 = 20 sectors
  const gridHeight = 4;
  
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridHeight; y++) {
      const sectorId = x * gridHeight + y + 1;
      const connections = [];
      
      // Connect to adjacent sectors
      if (x > 0) connections.push((x - 1) * gridHeight + y + 1); // Left
      if (x < gridSize - 1) connections.push((x + 1) * gridHeight + y + 1); // Right
      if (y > 0) connections.push(x * gridHeight + (y - 1) + 1); // Up
      if (y < gridHeight - 1) connections.push(x * gridHeight + (y + 1) + 1); // Down
      
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

function generatePorts(sectors) {
  const portTypeKeys = Object.keys(portTypes);
  const sectorIds = Object.keys(sectors);
  
  // Add 5 ports to random sectors
  const portSectors = [];
  while (portSectors.length < 5) {
    const randomSectorId = sectorIds[Math.floor(Math.random() * sectorIds.length)];
    if (!portSectors.includes(randomSectorId)) {
      portSectors.push(randomSectorId);
    }
  }
  
  portSectors.forEach((sectorId, index) => {
    const portType = portTypeKeys[index % portTypeKeys.length];
    const port = {
      type: portType,
      name: portTypes[portType].name,
      buys: portTypes[portType].buys,
      sells: portTypes[portType].sells,
      prices: {}
    };
    
    // Generate buy/sell prices with variation
    Object.keys(commodities).forEach(commodity => {
      const basePrice = commodities[commodity].basePrice;
      const variation = 0.2; // ±20% price variation
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

gameState.sectors = generateSectors();
generatePorts(gameState.sectors);

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  const playerId = uuidv4();
  const player = {
    id: playerId,
    socketId: socket.id,
    name: `Player${Math.floor(Math.random() * 1000)}`,
    currentSector: 1,
    credits: 1000,
    inventory: {
      ore: 0,
      food: 0,
      equipment: 0
    },
    cargoCapacity: 20,
    cargoUsed: 0
  };
  
  gameState.players[playerId] = player;
  gameState.sectors[1].players.push(playerId);
  
  socket.emit('playerJoined', { 
    playerId: playerId,
    player: player,
    sectors: gameState.sectors,
    commodities: gameState.commodities
  });
  
  socket.broadcast.emit('playerUpdate', {
    type: 'joined',
    player: player,
    sectors: gameState.sectors
  });
  
  socket.on('moveTo', (targetSectorId) => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
    if (!player) return;
    
    const currentSector = gameState.sectors[player.currentSector];
    const targetSector = gameState.sectors[targetSectorId];
    
    if (!targetSector || !currentSector.connections.includes(targetSectorId)) {
      socket.emit('error', 'Invalid move');
      return;
    }
    
    // Remove player from current sector
    currentSector.players = currentSector.players.filter(id => id !== player.id);
    
    // Add player to target sector
    player.currentSector = targetSectorId;
    targetSector.players.push(player.id);
    
    // Notify all players
    io.emit('playerUpdate', {
      type: 'moved',
      player: player,
      sectors: gameState.sectors
    });
  });

  socket.on('buyItem', (data) => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
    if (!player) return;
    
    const currentSector = gameState.sectors[player.currentSector];
    const port = currentSector.port;
    
    if (!port || !port.sells.includes(data.commodity)) {
      socket.emit('error', `This port doesn't sell ${data.commodity}`);
      return;
    }
    
    const price = port.prices[data.commodity].sell;
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
    
    // Execute trade
    player.credits -= totalCost;
    player.inventory[data.commodity] += quantity;
    player.cargoUsed += quantity;
    
    socket.emit('tradeResult', {
      type: 'buy',
      commodity: data.commodity,
      quantity: quantity,
      price: price,
      totalCost: totalCost,
      player: player
    });
    
    // Notify other players in sector
    socket.to(currentSector.id).emit('playerTraded', {
      playerName: player.name,
      type: 'bought',
      commodity: data.commodity,
      quantity: quantity
    });
  });

  socket.on('sellItem', (data) => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
    if (!player) return;
    
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
    
    const price = port.prices[data.commodity].buy;
    const totalEarned = price * quantity;
    
    // Execute trade
    player.credits += totalEarned;
    player.inventory[data.commodity] -= quantity;
    player.cargoUsed -= quantity;
    
    socket.emit('tradeResult', {
      type: 'sell',
      commodity: data.commodity,
      quantity: quantity,
      price: price,
      totalEarned: totalEarned,
      player: player
    });
    
    // Notify other players in sector
    socket.to(currentSector.id).emit('playerTraded', {
      playerName: player.name,
      type: 'sold',
      commodity: data.commodity,
      quantity: quantity
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
    if (player) {
      // Remove player from sector
      const sector = gameState.sectors[player.currentSector];
      if (sector) {
        sector.players = sector.players.filter(id => id !== player.id);
      }
      
      delete gameState.players[player.id];
      
      socket.broadcast.emit('playerUpdate', {
        type: 'left',
        player: player,
        sectors: gameState.sectors
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`TradeWars server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to play`);
});