import { v4 as uuidv4 } from 'uuid';
import { Player, ShipType, Commodity } from './types';
import { shipTypes, energyConfig } from './game-config';

export function createPlayer(socketId: string): Player {
  const playerId = uuidv4();
  
  return {
    id: playerId,
    socketId: socketId,
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
}