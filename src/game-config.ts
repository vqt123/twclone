import { TradingPostType, ShipType, Action, TradingPostInfo, ShipInfo, EnergyConfig } from './types';

export const tradingPosts: { [key in TradingPostType]: TradingPostInfo } = {
  [TradingPostType.MINING]: { 
    name: 'Mining Station', 
    baseProfit: 115, // Increased from 75 (+53% for travel cost compensation)
    description: 'Industrial data on mining operations and asteroid surveys'
  },
  [TradingPostType.AGRICULTURAL]: { 
    name: 'Agricultural Port', 
    baseProfit: 90, // Increased from 60 (+50% for travel cost compensation)
    description: 'Agricultural market trends and crop yield forecasts'
  },
  [TradingPostType.INDUSTRIAL]: { 
    name: 'Industrial Complex', 
    baseProfit: 130, // Increased from 85 (+53% for travel cost compensation)
    description: 'Manufacturing schedules and supply chain intelligence'
  },
  [TradingPostType.COMMERCIAL]: { 
    name: 'Commercial Hub', 
    baseProfit: 135, // Increased from 90 (+50% for travel cost compensation)
    description: 'Trade route analysis and merchant fleet movements'
  },
  [TradingPostType.STARPORT]: { 
    name: 'StarPort', 
    baseProfit: 150, // Increased from 100 (+50% for travel cost compensation)
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
  regenRate: 200, // Increased from 100 (2x faster regeneration)
  regenInterval: 36000,
  costs: {
    [Action.MOVE]: 8, // Reduced from 10 (20% reduction for better exploration)
    [Action.TRADE]: 5
  }
};

// Trading configuration
export const tradeConfig = {
  efficiencyDecay: 0.85, // Each trade reduces efficiency to 85% of previous (slower decay)
  regenTimeHours: 24, // Time to fully regenerate from 0% to 100%
  minEfficiency: 0.05, // Minimum efficiency (5%)
};