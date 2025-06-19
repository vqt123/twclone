// Enums for type safety
export enum Commodity {
  ORE = 'ore',
  FOOD = 'food',
  EQUIPMENT = 'equipment'
}

export enum ShipType {
  SCOUT = 'scout',
  TRADER = 'trader',
  FREIGHTER = 'freighter'
}

export enum PortType {
  MINING = 'mining',
  AGRICULTURAL = 'agricultural',
  INDUSTRIAL = 'industrial',
  COMMERCIAL = 'commercial',
  STARPORT = 'starport'
}

export enum Action {
  MOVE = 'move',
  TRADE = 'trade'
}

export enum PlayerUpdateType {
  JOINED = 'joined',
  LEFT = 'left',
  MOVED = 'moved'
}

export enum TradeType {
  BUY = 'buy',
  SELL = 'sell'
}

export enum TradeAction {
  BOUGHT = 'bought',
  SOLD = 'sold'
}

// Base interfaces
export interface CommodityInfo {
  name: string;
  basePrice: number;
}

export interface ShipInfo {
  name: string;
  cargoCapacity: number;
  energyEfficiency: number;
  price: number;
}

export interface PortInfo {
  buys: Commodity[];
  sells: Commodity[];
  name: string;
}

export interface EnergyConfig {
  maxEnergy: number;
  regenRate: number;
  regenInterval: number;
  costs: {
    [Action.MOVE]: number;
    [Action.TRADE]: number;
  };
}

// Game state interfaces
export interface Player {
  id: string;
  socketId: string;
  name: string;
  currentSector: number;
  credits: number;
  inventory: {
    [Commodity.ORE]: number;
    [Commodity.FOOD]: number;
    [Commodity.EQUIPMENT]: number;
  };
  ship: ShipType;
  cargoCapacity: number;
  cargoUsed: number;
  energy: number;
  lastEnergyUpdate: number;
}

export interface Port {
  type: PortType;
  name: string;
  buys: Commodity[];
  sells: Commodity[];
  prices: {
    [key in Commodity]: {
      buy: number | null;
      sell: number | null;
    };
  };
}

export interface Sector {
  id: number;
  name: string;
  x: number;
  y: number;
  connections: number[];
  players: string[];
  port: Port | null;
}

export interface GameState {
  sectors: { [key: number]: Sector };
  players: { [key: string]: Player };
  commodities: { [key in Commodity]: CommodityInfo };
  shipTypes: { [key in ShipType]: ShipInfo };
}

// Socket event interfaces
export interface PlayerJoinedData {
  playerId: string;
  player: Player;
  sectors: { [key: number]: Sector };
  commodities: { [key in Commodity]: CommodityInfo };
  shipTypes: { [key in ShipType]: ShipInfo };
}

export interface PlayerUpdateData {
  type: PlayerUpdateType;
  player: Player;
  sectors: { [key: number]: Sector };
}

export interface TradeData {
  commodity: Commodity;
  quantity?: number;
}

export interface TradeResultData {
  type: TradeType;
  commodity: Commodity;
  quantity: number;
  price: number;
  totalCost?: number;
  totalEarned?: number;
  player: Player;
}

export interface PlayerTradedData {
  playerName: string;
  type: TradeAction;
  commodity: Commodity;
  quantity: number;
}

export interface ShipUpgradeData {
  shipType: ShipType;
}

export interface ShipUpgradeResultData {
  success: boolean;
  newShip: ShipType;
  player: Player;
  message?: string;
}