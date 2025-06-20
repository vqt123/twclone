import { v4 as uuidv4 } from 'uuid';
import { Player, ShipType } from './types';
import { energyConfig } from './game-config';

export function createPlayer(socketId: string): Player {
  const playerId = uuidv4();
  
  return {
    id: playerId,
    socketId: socketId,
    name: `Player${Math.floor(Math.random() * 1000)}`,
    currentSector: 1,
    credits: 1000,
    ship: ShipType.SCOUT,
    shipUpgrades: [],
    cargoUpgrades: 0,
    energy: energyConfig.maxEnergy,
    lastEnergyUpdate: Date.now()
  };
}