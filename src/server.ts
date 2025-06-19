import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import {
  Action,
  PlayerUpdateType,
  GameState,
  PlayerJoinedData,
  PlayerUpdateData,
  TradeResultData,
  PlayerTradedData,
  ShipUpgradeData,
  ShipUpgradeResultData,
  ShipType,
  TradingPostType
} from './types';
import { tradingPosts, shipTypes } from './game-config';
import { generateSectors, generateTradingPosts, executeTrade } from './universe-generator';
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
  tradingPosts: tradingPosts,
  shipTypes: shipTypes
};

generateTradingPosts(gameState.sectors);

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  const player = createPlayer(socket.id);
  gameState.players[player.id] = player;
  gameState.sectors[1].players.push(player.id);
  
  const joinData: PlayerJoinedData = {
    playerId: player.id,
    player: player,
    sectors: gameState.sectors,
    tradingPosts: gameState.tradingPosts,
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

  socket.on('trade', () => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id)!;
    const currentSector = gameState.sectors[player.currentSector];
    const tradingPost = currentSector.tradingPost;
    
    if (!tradingPost) {
      socket.emit('error', 'No trading post in this sector');
      return;
    }
    
    if (!consumeEnergy(player, Action.TRADE)) {
      socket.emit('error', 'Not enough energy to trade');
      return;
    }
    
    // Execute trade and get profit
    const baseProfit = executeTrade(tradingPost);
    
    // Apply ship multiplier
    const shipInfo = gameState.shipTypes[player.ship];
    const finalProfit = Math.round(baseProfit * shipInfo.tradeMultiplier);
    
    player.credits += finalProfit;
    
    socket.emit('tradeResult', {
      profit: finalProfit,
      newEfficiency: tradingPost.tradeEfficiency,
      player: player,
      tradingPostName: tradingPost.name
    } as TradeResultData);
    
    socket.to(currentSector.id.toString()).emit('playerTraded', {
      playerName: player.name,
      profit: finalProfit,
      tradingPostName: tradingPost.name
    } as PlayerTradedData);
  });

  socket.on('upgradeShip', (data: ShipUpgradeData) => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id)!;
    const currentSector = gameState.sectors[player.currentSector];
    
    // Check if player is at a StarPort
    if (!currentSector.tradingPost || currentSector.tradingPost.type !== TradingPostType.STARPORT) {
      socket.emit('error', 'Ship upgrades only available at StarPorts');
      return;
    }
    
    // Check if ship type is valid
    if (!gameState.shipTypes[data.shipType]) {
      socket.emit('error', 'Invalid ship type');
      return;
    }
    
    const newShipInfo = gameState.shipTypes[data.shipType];
    
    // Check if player already has this ship
    if (player.ship === data.shipType) {
      socket.emit('error', 'You already have this ship');
      return;
    }
    
    // Check if player can afford the ship
    if (player.credits < newShipInfo.price) {
      socket.emit('error', 'Insufficient credits for ship upgrade');
      return;
    }
    
    // Perform the upgrade
    player.credits -= newShipInfo.price;
    player.ship = data.shipType;
    
    socket.emit('shipUpgradeResult', {
      success: true,
      newShip: data.shipType,
      player: player,
      message: `Successfully upgraded to ${newShipInfo.name}!`
    } as ShipUpgradeResultData);
    
    // Broadcast to other players in sector
    socket.to(currentSector.id.toString()).emit('playerUpdate', {
      type: PlayerUpdateType.MOVED,
      player: player,
      sectors: gameState.sectors
    } as PlayerUpdateData);
    
    console.log(`Player ${player.name} upgraded to ${newShipInfo.name}`);
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