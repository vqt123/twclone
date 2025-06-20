import { Player, Action } from './types';
import { energyConfig, shipTypes } from './game-config';

// Global test mode acceleration
export const TIME_ACCELERATION = process.env.TEST_MODE === 'true' ? 100 : 1;

export function updatePlayerEnergy(player: Player): void {
  const now = Date.now();
  const timeDiff = now - player.lastEnergyUpdate;
  const acceleratedTimeDiff = timeDiff * TIME_ACCELERATION;
  const energyToAdd = Math.floor(acceleratedTimeDiff / energyConfig.regenInterval);
  
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