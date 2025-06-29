import * as io from 'socket.io-client';
import { GameLogger } from './game-logger';
import { ShipType, TradingPostType } from './types';

export type BotStrategy = 'greedy' | 'explorer' | 'optimizer' | 'random';

interface GameState {
  player: any;
  sectors: { [key: number]: any };
  players: { [key: string]: any };
  tradingPosts: any;
  shipTypes: any;
}

interface TradingPost {
  sectorId: number;
  name: string;
  type: string;
  distance: number;
}

export class AnalysisBot {
  private socket: any;
  private logger: GameLogger;
  private gameState: GameState | null = null;
  private strategy: BotStrategy;
  private botId: string;
  private isActive: boolean = false;
  private actionQueue: Array<() => Promise<void>> = [];
  private currentTarget: number | null = null;
  private lastScanTime: number = 0;
  private scanCooldown: number = 5000; // 5 seconds between scans
  private lastActionTime: number = 0;
  private actionCooldown: number = 1000; // 1 second between actions
  private testMode: boolean = false;
  private lastTradeProfit: number = 0;
  private failedNavigationAttempts: number = 0;
  private consecutiveNoTradeScans: number = 0;
  private autoNavigating: boolean = false;
  private currentPath: number[] = [];

  constructor(
    serverUrl: string,
    botId: string,
    strategy: BotStrategy,
    logger: GameLogger,
    testMode: boolean = false
  ) {
    this.botId = botId;
    this.strategy = strategy;
    this.logger = logger;
    this.testMode = testMode;
    
    // Fast mode settings for testing
    if (testMode) {
      this.scanCooldown = 0; // No scan cooldown
      this.actionCooldown = 0; // No action cooldown
    }
    
    this.socket = io.default(serverUrl);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.socket.on('connect', () => {
      this.logger.logSystem(`Bot ${this.botId} connected`, { strategy: this.strategy });
      console.log(`🤖 Bot ${this.botId} (${this.strategy}) connected`);
    });

    this.socket.on('disconnect', () => {
      this.logger.logSystem(`Bot ${this.botId} disconnected`);
      console.log(`🔌 Bot ${this.botId} disconnected`);
      this.isActive = false;
    });

    this.socket.on('playerJoined', (data: any) => {
      this.gameState = {
        player: data.player,
        sectors: data.sectors,
        players: {},
        tradingPosts: data.tradingPosts,
        shipTypes: data.shipTypes
      };
      this.gameState.players[data.player.id] = data.player;
      
      this.logger.logAction(this.botId, 'joined', {
        playerId: data.player.id,
        playerName: data.player.name,
        startingSector: data.player.currentSector,
        startingCredits: data.player.credits,
        startingShip: data.player.ship,
        startingEnergy: data.player.energy
      });

      this.logger.logState(this.botId, {
        sector: data.player.currentSector,
        credits: data.player.credits,
        energy: data.player.energy,
        ship: data.player.ship
      });

      console.log(`✅ Bot ${this.botId} joined as ${data.player.name}`);
      this.isActive = true;
      this.startBehavior();
    });

    this.socket.on('playerUpdate', (data: any) => {
      if (!this.gameState || !data.player) return;

      // Update game state
      this.gameState.sectors = data.sectors;
      if (data.player.id === this.gameState.player?.id) {
        this.gameState.player = data.player;
      }
      this.gameState.players[data.player.id] = data.player;

      if (data.player.id === this.gameState.player?.id) {
        this.logger.logAction(this.botId, 'update', {
          updateType: data.type,
          sector: data.player.currentSector,
          credits: data.player.credits,
          energy: data.player.energy
        });

        this.logger.logState(this.botId, {
          sector: data.player.currentSector,
          credits: data.player.credits,
          energy: data.player.energy,
          ship: data.player.ship
        });

        if (data.type === 'moved') {
          this.logger.logNavigation(this.botId, {
            fromSector: this.currentTarget,
            toSector: data.player.currentSector,
            energyAfterMove: data.player.energy
          });

          // If we have a target and we're not there yet, continue navigation
          if (this.currentTarget && this.currentTarget !== data.player.currentSector) {
            console.log(`🗂️ Bot ${this.botId} continuing navigation to target ${this.currentTarget} (currently at ${data.player.currentSector})`);
            // Continue moving towards target using server pathfinding
            setTimeout(() => {
              this.socket.emit('moveTo', this.currentTarget);
            }, this.testMode ? 10 : 100); // Small delay to avoid rapid-fire requests
          }
        }
      }
    });

    this.socket.on('tradeResult', (data: any) => {
      if (!this.gameState) return;
      
      this.gameState.player = data.player;
      this.lastTradeProfit = data.profit;
      
      this.logger.logTrading(this.botId, {
        tradingPostName: data.tradingPostName,
        profit: data.profit,
        newEfficiency: data.newEfficiency,
        creditsAfter: data.player.credits,
        energyAfter: data.player.energy
      });

      console.log(`💰 Bot ${this.botId} traded at ${data.tradingPostName} for ${data.profit} credits`);
    });

    this.socket.on('error', (message: any) => {
      this.logger.logAction(this.botId, 'error', { message });
      console.log(`❌ Bot ${this.botId} error: ${message}`);
      
      // Reset target on any error and try something else
      this.currentTarget = null;
    });
  }

  private async startBehavior() {
    while (this.isActive && this.gameState) {
      try {
        await this.executeBehavior();
        const sleepTime = this.testMode ? 1 : this.actionCooldown;
        await this.sleep(sleepTime);
      } catch (error) {
        this.logger.logAction(this.botId, 'error', { error: error?.toString() });
        console.error(`💥 Bot ${this.botId} behavior error:`, error);
        const errorSleep = this.testMode ? 10 : 5000; // Much shorter error sleep in test mode
        await this.sleep(errorSleep);
      }
    }
  }

  private async executeBehavior() {
    if (!this.gameState || !this.gameState.player) return;

    const now = Date.now();
    if (now - this.lastActionTime < this.actionCooldown) return;

    // Check if we need energy
    if (this.gameState.player.energy < 50) {
      console.log(`⚡ Bot ${this.botId} waiting for energy (${this.gameState.player.energy})`);
      const waitTime = this.testMode ? 10 : 10000; // 10ms in test mode, 10 seconds normal
      await this.sleep(waitTime);
      return;
    }

    // Check local area for trading posts (like a real player would)
    if (now - this.lastScanTime > this.scanCooldown || !this.currentTarget) {
      const localTradingPosts = this.getLocalSectors();
      this.lastScanTime = now;
      
      if (localTradingPosts.length > 0) {
        const target = this.selectTarget(localTradingPosts);
        if (target && target.sectorId !== this.currentTarget) {
          this.currentTarget = target.sectorId;
          this.lastTradeProfit = 0; // Reset profit tracking for new trading post
          await this.moveToLocalSector(target.sectorId);
          this.lastActionTime = now;
          return;
        }
      }
    }

    // Try to trade if we're at our target
    if (this.currentTarget === this.gameState.player.currentSector) {
      const currentSector = this.gameState.sectors[this.gameState.player.currentSector];
      if (currentSector && currentSector.tradingPost) {
        // Check if trading is still profitable (typical player behavior)
        if (this.shouldTradeAtCurrentPost()) {
          await this.executeTrade();
          this.lastActionTime = now;
          return;
        } else {
          // Move on to find better opportunities
          this.currentTarget = null;
          console.log(`🔄 Bot ${this.botId} moving on from unprofitable post`);
        }
      }
    }

    // If no target, explore randomly
    await this.exploreRandomly();
    this.lastActionTime = now;
  }

  private getLocalSectors(): TradingPost[] {
    if (!this.gameState || !this.gameState.player) return [];

    const currentSector = this.gameState.sectors[this.gameState.player.currentSector];
    if (!currentSector) return [];

    // Players can only see 3 sectors in each direction (7x7 grid)
    const range = 3;
    const gridSize = 50;
    const currentX = currentSector.x;
    const currentY = currentSector.y;
    const tradingPosts: TradingPost[] = [];

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        const x = currentX + dx;
        const y = currentY + dy;
        
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
          const sectorId = x * gridSize + y + 1;
          const sector = this.gameState.sectors[sectorId];
          
          if (sector && sector.tradingPost) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            tradingPosts.push({
              sectorId: sectorId,
              name: sector.tradingPost.name,
              type: sector.tradingPost.type,
              distance: distance
            });
          }
        }
      }
    }

    this.logger.logAction(this.botId, 'local_scan', {
      tradingPostsFound: tradingPosts.length,
      currentSector: this.gameState.player.currentSector,
      scanRange: range,
      tradingPostSectors: tradingPosts.map(tp => tp.sectorId)
    });

    if (tradingPosts.length > 0) {
      console.log(`📡 Bot ${this.botId} found ${tradingPosts.length} trading posts: ${tradingPosts.map(tp => `${tp.sectorId}(${tp.type})`).join(', ')}`);
      this.consecutiveNoTradeScans = 0;
    } else {
      this.consecutiveNoTradeScans++;
      // Smart behavior: if we can't find trading posts near spawn for a while, migrate away
      if (this.consecutiveNoTradeScans > 10 && this.isNearSpawn()) {
        console.log(`🚀 Bot ${this.botId} migrating away from crowded spawn area after ${this.consecutiveNoTradeScans} failed scans`);
        this.migrateAwayFromSpawn();
        return [];
      }
    }

    return tradingPosts;
  }

  private selectTarget(tradingPosts: TradingPost[]): TradingPost | null {
    if (tradingPosts.length === 0) return null;

    // Filter to only include reachable trading posts (adjacent or current sector)
    const reachablePosts = tradingPosts.filter(tp => this.isReachable(tp.sectorId));
    if (reachablePosts.length === 0) return null;

    switch (this.strategy) {
      case 'greedy':
        // Prefer StarPorts and Commercial Hubs (higher profits)
        const highValue = reachablePosts.filter(tp => 
          tp.type === 'starport' || tp.type === 'commercial'
        );
        if (highValue.length > 0) {
          return highValue.sort((a, b) => a.distance - b.distance)[0];
        }
        return reachablePosts.sort((a, b) => a.distance - b.distance)[0];

      case 'explorer':
        // Prefer farther trading posts for exploration
        return reachablePosts.sort((a, b) => b.distance - a.distance)[0];

      case 'optimizer':
        // Calculate profit/distance ratio (simplified)
        const scored = reachablePosts.map(tp => ({
          ...tp,
          score: this.calculateTradingScore(tp)
        }));
        return scored.sort((a, b) => b.score - a.score)[0];

      case 'random':
      default:
        return reachablePosts[Math.floor(Math.random() * reachablePosts.length)];
    }
  }

  private isReachable(targetSectorId: number): boolean {
    if (!this.gameState || !this.gameState.player) return false;
    
    const currentSectorId = this.gameState.player.currentSector;
    
    // Same sector is always reachable
    if (currentSectorId === targetSectorId) return true;
    
    // Real players can reach any sector within their 7x7 local view using auto-navigation
    // This function already only gets called with sectors from getLocalSectors() which are within range
    return true;
  }

  private calculateTradingScore(tradingPost: TradingPost): number {
    // Simple scoring: base profit / distance
    const baseProfits: { [key: string]: number } = {
      'mining': 50,
      'agricultural': 75,
      'industrial': 100,
      'commercial': 150,
      'starport': 200
    };
    
    const baseProfit = baseProfits[tradingPost.type] || 100;
    return baseProfit / Math.max(tradingPost.distance, 1);
  }

  private async moveToLocalSector(sectorId: number) {
    if (!this.gameState || !this.gameState.player) return;

    // Check if we're already at the target
    if (this.gameState.player.currentSector === sectorId) {
      await this.executeTrade();
      return;
    }

    // Let server handle pathfinding automatically (both direct moves and multi-hop)
    console.log(`🎯 Bot ${this.botId} moving to sector ${sectorId} (server will handle pathfinding)`);
    
    this.logger.logNavigation(this.botId, {
      targetSector: sectorId,
      fromSector: this.gameState.player.currentSector,
      method: 'server_pathfinding',
      energyBefore: this.gameState.player.energy
    });

    // Use server-side pathfinding (same as real players, just without client-side UI)
    this.socket.emit('moveTo', sectorId);
  }

  private async executeTrade() {
    if (!this.gameState) return;

    this.logger.logAction(this.botId, 'trade_attempt', {
      sector: this.gameState.player.currentSector,
      creditsBefore: this.gameState.player.credits,
      energyBefore: this.gameState.player.energy
    });

    this.socket.emit('trade');
  }

  private async exploreRandomly() {
    if (!this.gameState || !this.gameState.player) return;

    const currentSector = this.gameState.sectors[this.gameState.player.currentSector];
    if (!currentSector || !currentSector.connections) return;

    // Move to a random adjacent sector (like a real player exploring)
    const randomConnection = currentSector.connections[
      Math.floor(Math.random() * currentSector.connections.length)
    ];

    console.log(`🔍 Bot ${this.botId} exploring to adjacent sector ${randomConnection}`);

    this.logger.logAction(this.botId, 'explore', {
      fromSector: this.gameState.player.currentSector,
      toSector: randomConnection,
      reason: 'local_exploration'
    });

    this.socket.emit('moveTo', randomConnection);
  }

  private shouldTradeAtCurrentPost(): boolean {
    // Always try to trade at least once at a new trading post
    // Then continue trading if profit is above minimum threshold
    if (this.lastTradeProfit === 0) return true; // First trade attempt
    return this.lastTradeProfit > 15; // Stop when profits drop below 15 credits
  }

  private isNearSpawn(): boolean {
    if (!this.gameState || !this.gameState.player) return false;
    
    const currentSector = this.gameState.sectors[this.gameState.player.currentSector];
    if (!currentSector) return false;
    
    // Consider "near spawn" as being within 10 sectors of the origin (sector 1)
    const spawnDistance = Math.sqrt(currentSector.x * currentSector.x + currentSector.y * currentSector.y);
    return spawnDistance < 10;
  }

  private migrateAwayFromSpawn() {
    if (!this.gameState || !this.gameState.player) return;
    
    const currentSector = this.gameState.sectors[this.gameState.player.currentSector];
    if (!currentSector) return;
    
    // Smart migration: head towards less crowded areas
    // Real players would do this by moving consistently in one direction
    const gridSize = 50;
    const currentX = currentSector.x;
    const currentY = currentSector.y;
    
    // Choose direction away from spawn (0,0) towards edges
    let targetDirection = '';
    if (currentX < gridSize / 2) {
      targetDirection += 'east ';
    } else {
      targetDirection += 'west ';
    }
    if (currentY < gridSize / 2) {
      targetDirection += 'south';
    } else {
      targetDirection += 'north';
    }
    
    console.log(`🧭 Bot ${this.botId} migrating ${targetDirection} to find less crowded trading areas`);
    
    // Move in the chosen direction by picking the best connected sector
    let bestConnection = null;
    let bestScore = -1;
    
    for (const connectionId of currentSector.connections) {
      const connectedSector = this.gameState.sectors[connectionId];
      if (!connectedSector) continue;
      
      // Score based on distance from spawn
      const distance = Math.sqrt(connectedSector.x * connectedSector.x + connectedSector.y * connectedSector.y);
      if (distance > bestScore) {
        bestScore = distance;
        bestConnection = connectionId;
      }
    }
    
    if (bestConnection) {
      this.socket.emit('moveTo', bestConnection);
      this.consecutiveNoTradeScans = 0; // Reset counter after migration
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    this.isActive = false;
    this.socket.disconnect();
    this.logger.logSystem(`Bot ${this.botId} stopped`);
    console.log(`🛑 Bot ${this.botId} stopped`);
  }

  getStats() {
    if (!this.gameState || !this.gameState.player) {
      return {
        botId: this.botId,
        strategy: this.strategy,
        status: 'not_connected'
      };
    }

    return {
      botId: this.botId,
      strategy: this.strategy,
      status: 'active',
      sector: this.gameState.player.currentSector,
      credits: this.gameState.player.credits,
      energy: this.gameState.player.energy,
      ship: this.gameState.player.ship
    };
  }
}