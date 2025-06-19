import { Player, Action } from './types';
import { energyConfig, shipTypes } from './game-config';

export function updatePlayerEnergy(player: Player): void {
  const now = Date.now();
  const timeDiff = now - player.lastEnergyUpdate;
  const energyToAdd = Math.floor(timeDiff / energyConfig.regenInterval);
  
  if (energyToAdd > 0) {
    player.energy = Math.min(energyConfig.maxEnergy, player.energy + energyToAdd);
    player.lastEnergyUpdate = now;
  }
}

export function consumeEnergy(player: Player, action: Action): boolean {
  updatePlayerEnergy(player);
  const ship = shipTypes[player.ship];
  const energyCost = Math.ceil(energyConfig.costs[action] * ship.energyEfficiency);
  
  if (player.energy < energyCost) {
    return false;
  }
  
  player.energy -= energyCost;
  return true;
}