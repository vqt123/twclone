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
  BuyCargoUpgradeResultData,
  ShipType,
  TradingPostType,
  Player
} from './types';
import { tradingPosts, shipTypes, cargoUpgradeConfig } from './game-config';
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
  shipTypes: shipTypes,
  shipUpgrades: {} // Empty for now
};

generateTradingPosts(gameState.sectors);

// Pathfinding function for multi-hop navigation
function findPath(sectors: { [key: number]: any }, startSectorId: number, targetSectorId: number): number[] | null {
  if (startSectorId === targetSectorId) return [startSectorId];
  
  const queue = [{sectorId: startSectorId, path: [startSectorId]}];
  const visited = new Set<number>();
  
  while (queue.length > 0) {
    const {sectorId, path} = queue.shift()!;
    
    if (visited.has(sectorId)) continue;
    visited.add(sectorId);
    
    const sector = sectors[sectorId];
    if (!sector) continue;
    
    for (const connectedSectorId of sector.connections) {
      if (connectedSectorId === targetSectorId) {
        return [...path, connectedSectorId];
      }
      
      if (!visited.has(connectedSectorId)) {
        queue.push({
          sectorId: connectedSectorId, 
          path: [...path, connectedSectorId]
        });
      }
    }
  }
  
  return null; // No path found
}

// Cargo upgrade utility functions
function calculateCargoUpgradeCost(currentUpgrades: number): number {
  return Math.round(cargoUpgradeConfig.baseCost * Math.pow(cargoUpgradeConfig.costMultiplier, currentUpgrades));
}

function calculatePlayerCargoCapacity(player: Player): number {
  const baseCapacity = shipTypes[player.ship].cargoCapacity;
  const upgradeCapacity = player.cargoUpgrades * cargoUpgradeConfig.capacityIncrease;
  return baseCapacity + upgradeCapacity;
}

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
    shipTypes: gameState.shipTypes,
    shipUpgrades: gameState.shipUpgrades
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
    
    if (!targetSector) {
      socket.emit('error', 'Invalid sector');
      return;
    }
    
    // Direct connection - single hop
    if (currentSector.connections.includes(targetSectorId)) {
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
      return;
    }
    
    // No direct connection - try pathfinding for auto-navigation
    const path = findPath(gameState.sectors, player.currentSector, targetSectorId);
    if (!path || path.length <= 1) {
      socket.emit('error', 'No route found to target sector');
      return;
    }
    
    // Move to next sector in path (excluding current sector)
    const nextSectorId = path[1];
    if (!currentSector.connections.includes(nextSectorId)) {
      socket.emit('error', 'Invalid pathfinding result');
      return;
    }
    
    if (!consumeEnergy(player, Action.MOVE)) {
      socket.emit('error', 'Not enough energy to move');
      return;
    }
    
    const nextSector = gameState.sectors[nextSectorId];
    currentSector.players = currentSector.players.filter(id => id !== player.id);
    player.currentSector = nextSectorId;
    nextSector.players.push(player.id);
    
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
    
    // Apply ship multiplier and cargo capacity bonus
    const shipInfo = gameState.shipTypes[player.ship];
    const cargoCapacity = calculatePlayerCargoCapacity(player);
    const cargoMultiplier = 1 + (cargoCapacity - shipInfo.cargoCapacity) * 0.02; // 2% per extra cargo unit
    const finalProfit = Math.round(baseProfit * shipInfo.tradeMultiplier * cargoMultiplier);
    
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

  socket.on('buyCargoUpgrade', () => {
    const player = Object.values(gameState.players).find(p => p.socketId === socket.id)!;
    const currentSector = gameState.sectors[player.currentSector];
    
    // Check if player is at a StarPort or Commercial Hub
    if (!currentSector.tradingPost || 
        (currentSector.tradingPost.type !== TradingPostType.STARPORT && 
         currentSector.tradingPost.type !== TradingPostType.COMMERCIAL)) {
      socket.emit('error', 'Cargo upgrades only available at StarPorts and Commercial Hubs');
      return;
    }
    
    const shipInfo = shipTypes[player.ship];
    
    // Check if player has reached max upgrades for their ship
    if (player.cargoUpgrades >= shipInfo.maxCargoUpgrades) {
      socket.emit('error', `Maximum cargo upgrades reached for ${shipInfo.name} (${shipInfo.maxCargoUpgrades})`);
      return;
    }
    
    const upgradeCost = calculateCargoUpgradeCost(player.cargoUpgrades);
    
    // Check if player can afford the upgrade
    if (player.credits < upgradeCost) {
      socket.emit('error', `Insufficient credits for cargo upgrade (${upgradeCost} required)`);
      return;
    }
    
    // Perform the upgrade
    player.credits -= upgradeCost;
    player.cargoUpgrades += 1;
    const newCargoCapacity = calculatePlayerCargoCapacity(player);
    
    socket.emit('cargoUpgradeResult', {
      success: true,
      cost: upgradeCost,
      newCargoCapacity: newCargoCapacity,
      player: player,
      message: `Cargo hold upgraded! New capacity: ${newCargoCapacity}`
    } as BuyCargoUpgradeResultData);
    
    console.log(`Player ${player.name} bought cargo upgrade ${player.cargoUpgrades} for ${upgradeCost} credits`);
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