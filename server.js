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

const gameState = {
  sectors: {},
  players: {}
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
        players: []
      };
    }
  }
  
  return sectors;
}

gameState.sectors = generateSectors();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  const playerId = uuidv4();
  const player = {
    id: playerId,
    socketId: socket.id,
    name: `Player${Math.floor(Math.random() * 1000)}`,
    currentSector: 1,
    credits: 1000
  };
  
  gameState.players[playerId] = player;
  gameState.sectors[1].players.push(playerId);
  
  socket.emit('playerJoined', { 
    playerId: playerId,
    player: player,
    sectors: gameState.sectors 
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