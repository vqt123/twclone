import { Commodity, ShipType, PortType, Action, CommodityInfo, ShipInfo, PortInfo, EnergyConfig } from './types';

export const commodities: { [key in Commodity]: CommodityInfo } = {
  [Commodity.ORE]: { name: 'Ore', basePrice: 50 },
  [Commodity.FOOD]: { name: 'Food', basePrice: 30 },
  [Commodity.EQUIPMENT]: { name: 'Equipment', basePrice: 100 }
};

export const shipTypes: { [key in ShipType]: ShipInfo } = {
  [ShipType.SCOUT]: { 
    name: 'Scout Ship', 
    cargoCapacity: 10, 
    energyEfficiency: 0.8,
    price: 0 
  },
  [ShipType.TRADER]: { 
    name: 'Trader Vessel', 
    cargoCapacity: 30, 
    energyEfficiency: 1.0,
    price: 5000 
  },
  [ShipType.FREIGHTER]: { 
    name: 'Heavy Freighter', 
    cargoCapacity: 50, 
    energyEfficiency: 1.5,
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

export const portTypes: { [key in PortType]: PortInfo } = {
  [PortType.MINING]: { buys: [Commodity.ORE], sells: [Commodity.EQUIPMENT], name: 'Mining Station' },
  [PortType.AGRICULTURAL]: { buys: [Commodity.FOOD], sells: [Commodity.ORE], name: 'Agricultural Port' },
  [PortType.INDUSTRIAL]: { buys: [Commodity.EQUIPMENT], sells: [Commodity.FOOD], name: 'Industrial Complex' },
  [PortType.COMMERCIAL]: { buys: [Commodity.ORE, Commodity.FOOD], sells: [Commodity.EQUIPMENT], name: 'Commercial Hub' },
  [PortType.STARPORT]: { buys: [Commodity.ORE, Commodity.FOOD, Commodity.EQUIPMENT], sells: [Commodity.ORE, Commodity.FOOD, Commodity.EQUIPMENT], name: 'StarPort' }
};