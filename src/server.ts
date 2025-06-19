import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
  Action,
  PlayerUpdateType,
  TradeType,
  TradeAction,
  GameState,
  PlayerJoinedData,
  PlayerUpdateData,
  TradeData,
  TradeResultData,
  PlayerTradedData
} from './types';
import { commodities, shipTypes } from './game-config';
import { generateSectors, generatePorts } from './universe-generator';
import { updatePlayerEnergy, consumeEnergy } from './energy-system';
import { createPlayer } from './player-factory';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const gameState: GameState = {
  sectors: generateSectors(),
  players: {},
  commodities: commodities,
  shipTypes: shipTypes
};

generatePorts(gameState.sectors);

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  const player = createPlayer(socket.id);
  gameState.players[player.id] = player;
  gameState.sectors[1].players.push(player.id);
  
  const joinData: PlayerJoinedData = {
    playerId: player.id,
    player: player,
    sectors: gameState.sectors,
    commodities: gameState.commodities,
    shipTypes: gameState.shipTypes
  };
  
  socket.emit('playerJoined', joinData);
  
  socket.broadcast.emit('playerUpdate', {
    type: PlayerUpdateType.JOINED,
    player: player,
    sectors: gameState.sectors
  } as PlayerUpdateData);
  
  socket.on('moveTo', (targetSectorId: number) => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id)!;
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
    
    io.emit('playerUpdate', {
      type: PlayerUpdateType.MOVED,
      player: player,
      sectors: gameState.sectors
    } as PlayerUpdateData);
  });

  socket.on('buyItem', (data: TradeData) => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id)!;
    const currentSector = gameState.sectors[player.currentSector];
    const port = currentSector.port!;
    
    if (!consumeEnergy(player, Action.TRADE)) {
      socket.emit('error', 'Not enough energy to trade');
      return;
    }
    
    if (!port.sells.includes(data.commodity)) {
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
    
    socket.emit('tradeResult', {
      type: TradeType.BUY,
      commodity: data.commodity,
      quantity: quantity,
      price: price,
      totalCost: totalCost,
      player: player
    } as TradeResultData);
    
    socket.to(currentSector.id.toString()).emit('playerTraded', {
      playerName: player.name,
      type: TradeAction.BOUGHT,
      commodity: data.commodity,
      quantity: quantity
    } as PlayerTradedData);
  });

  socket.on('sellItem', (data: TradeData) => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id)!;
    const currentSector = gameState.sectors[player.currentSector];
    const port = currentSector.port!;
    
    if (!consumeEnergy(player, Action.TRADE)) {
      socket.emit('error', 'Not enough energy to trade');
      return;
    }
    
    if (!port.buys.includes(data.commodity)) {
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
    
    socket.emit('tradeResult', {
      type: TradeType.SELL,
      commodity: data.commodity,
      quantity: quantity,
      price: price,
      totalEarned: totalEarned,
      player: player
    } as TradeResultData);
    
    socket.to(currentSector.id.toString()).emit('playerTraded', {
      playerName: player.name,
      type: TradeAction.SOLD,
      commodity: data.commodity,
      quantity: quantity
    } as PlayerTradedData);
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id)!;
    const sector = gameState.sectors[player.currentSector];
    
    sector.players = sector.players.filter(id => id !== player.id);
    delete gameState.players[player.id];
    
    socket.broadcast.emit('playerUpdate', {
      type: PlayerUpdateType.LEFT,
      player: player,
      sectors: gameState.sectors
    } as PlayerUpdateData);
  });
});

server.listen(PORT, () => {
  console.log(`TradeWars server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to play`);
});