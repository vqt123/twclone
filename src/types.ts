// Enums for type safety
// Removed Commodity enum - replaced with simple trading system

export enum ShipType {
  SCOUT = 'scout',
  TRADER = 'trader',
  FREIGHTER = 'freighter'
}

export enum TradingPostType {
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

// Removed TradeType and TradeAction - simplified to single trade action

// Base interfaces
export interface TradingPostInfo {
  name: string;
  baseProfit: number;
  description: string;
}

export interface ShipInfo {
  name: string;
  cargoCapacity: number; // Base cargo capacity
  energyEfficiency: number;
  tradeMultiplier: number; // New: affects trade profits
  price: number;
  maxCargoUpgrades: number; // Maximum number of cargo hold upgrades
}

export interface ShipUpgrade {
  id: string;
  name: string;
  description: string;
  tradeMultiplierBonus: number; // Additional multiplier bonus
  price: number;
  requiredShip: ShipType;
}

// Removed PortInfo - replaced with TradingPostInfo

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
  ship: ShipType;
  shipUpgrades: string[]; // Array of upgrade IDs the player owns
  cargoUpgrades: number; // Number of cargo hold upgrades purchased
  energy: number;
  lastEnergyUpdate: number;
}

export interface TradingPost {
  type: TradingPostType;
  name: string;
  baseProfit: number;
  tradeEfficiency: number; // 0-1, decreases with each trade
  lastRegenTime: number; // timestamp for regeneration
  description: string;
}

export interface Sector {
  id: number;
  name: string;
  x: number;
  y: number;
  connections: number[];
  players: string[];
  tradingPost: TradingPost | null;
}

export interface GameState {
  sectors: { [key: number]: Sector };
  players: { [key: string]: Player };
  tradingPosts: { [key in TradingPostType]: TradingPostInfo };
  shipTypes: { [key in ShipType]: ShipInfo };
  shipUpgrades: { [key: string]: ShipUpgrade };
}

// Socket event interfaces
export interface PlayerJoinedData {
  playerId: string;
  player: Player;
  sectors: { [key: number]: Sector };
  tradingPosts: { [key in TradingPostType]: TradingPostInfo };
  shipTypes: { [key in ShipType]: ShipInfo };
  shipUpgrades: { [key: string]: ShipUpgrade };
}

export interface PlayerUpdateData {
  type: PlayerUpdateType;
  player: Player;
  sectors: { [key: number]: Sector };
}

export interface TradeResultData {
  profit: number;
  newEfficiency: number;
  player: Player;
  tradingPostName: string;
}

export interface PlayerTradedData {
  playerName: string;
  profit: number;
  tradingPostName: string;
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

export interface BuyUpgradeData {
  upgradeId: string;
}

export interface BuyUpgradeResultData {
  success: boolean;
  upgrade: ShipUpgrade;
  player: Player;
  message?: string;
}

export interface BuyCargoUpgradeResultData {
  success: boolean;
  cost: number;
  newCargoCapacity: number;
  player: Player;
  message?: string;
}