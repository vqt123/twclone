import { TradingPostType, ShipType, Action, TradingPostInfo, ShipInfo, EnergyConfig } from './types';

export const tradingPosts: { [key in TradingPostType]: TradingPostInfo } = {
  [TradingPostType.MINING]: { 
    name: 'Mining Station', 
    baseProfit: 75,
    description: 'Industrial data on mining operations and asteroid surveys'
  },
  [TradingPostType.AGRICULTURAL]: { 
    name: 'Agricultural Port', 
    baseProfit: 60,
    description: 'Agricultural market trends and crop yield forecasts'
  },
  [TradingPostType.INDUSTRIAL]: { 
    name: 'Industrial Complex', 
    baseProfit: 85,
    description: 'Manufacturing schedules and supply chain intelligence'
  },
  [TradingPostType.COMMERCIAL]: { 
    name: 'Commercial Hub', 
    baseProfit: 90,
    description: 'Trade route analysis and merchant fleet movements'
  },
  [TradingPostType.STARPORT]: { 
    name: 'StarPort', 
    baseProfit: 100,
    description: 'Comprehensive sector intelligence and navigation data'
  }
};

export const shipTypes: { [key in ShipType]: ShipInfo } = {
  [ShipType.SCOUT]: { 
    name: 'Scout Ship', 
    cargoCapacity: 10, 
    energyEfficiency: 0.8,
    tradeMultiplier: 1.0, // Base trading efficiency
    price: 0 
  },
  [ShipType.TRADER]: { 
    name: 'Trader Vessel', 
    cargoCapacity: 30, 
    energyEfficiency: 1.0,
    tradeMultiplier: 1.5, // 50% more profit from trading
    price: 5000 
  },
  [ShipType.FREIGHTER]: { 
    name: 'Heavy Freighter', 
    cargoCapacity: 50, 
    energyEfficiency: 1.5,
    tradeMultiplier: 2.0, // 100% more profit from trading
    price: 15000 
  }
};

export const energyConfig: EnergyConfig = {
  maxEnergy: 2400,
  regenRate: 100,
  regenInterval: 36000,
  costs: {
    [Action.MOVE]: 10,
    [Action.TRADE]: 5
  }
};

// Trading configuration
export const tradeConfig = {
  efficiencyDecay: 0.7, // Each trade reduces efficiency to 70% of previous
  regenTimeHours: 24, // Time to fully regenerate from 0% to 100%
  minEfficiency: 0.05, // Minimum efficiency (5%)
};