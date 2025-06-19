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
  cargoCapacity: number; // Keep for future use, but now affects trade multiplier
  energyEfficiency: number;
  tradeMultiplier: number; // New: affects trade profits
  price: number;
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
}

// Socket event interfaces
export interface PlayerJoinedData {
  playerId: string;
  player: Player;
  sectors: { [key: number]: Sector };
  tradingPosts: { [key in TradingPostType]: TradingPostInfo };
  shipTypes: { [key in ShipType]: ShipInfo };
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