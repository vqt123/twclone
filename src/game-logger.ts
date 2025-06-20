import * as fs from 'fs';
import * as path from 'path';

export interface LogEvent {
  timestamp: number;
  type: 'action' | 'state' | 'trading' | 'navigation' | 'system';
  botId: string;
  data: any;
}

export interface SessionMetadata {
  sessionId: string;
  startTime: number;
  endTime?: number;
  botStrategy: string;
  botCount: number;
  universeStats: {
    totalSectors: number;
    tradingPostCount: number;
    tradingPostDensity: number;
  };
}

export class GameLogger {
  private events: LogEvent[] = [];
  private sessionMetadata: SessionMetadata;
  private logFilePath: string;

  constructor(sessionId: string, botStrategy: string, botCount: number = 1) {
    this.sessionMetadata = {
      sessionId,
      startTime: Date.now(),
      botStrategy,
      botCount,
      universeStats: {
        totalSectors: 2500, // 50x50 grid
        tradingPostCount: 150, // Updated density
        tradingPostDensity: 0.06 // 6%
      }
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFilePath = path.join('analysis-logs', `session-${timestamp}-${sessionId}.json`);
  }

  logAction(botId: string, action: string, details: any) {
    this.events.push({
      timestamp: Date.now(),
      type: 'action',
      botId,
      data: {
        action,
        ...details
      }
    });
  }

  logState(botId: string, gameState: any) {
    this.events.push({
      timestamp: Date.now(),
      type: 'state',
      botId,
      data: gameState
    });
  }

  logTrading(botId: string, tradingData: any) {
    this.events.push({
      timestamp: Date.now(),
      type: 'trading',
      botId,
      data: tradingData
    });
  }

  logNavigation(botId: string, navigationData: any) {
    this.events.push({
      timestamp: Date.now(),
      type: 'navigation',
      botId,
      data: navigationData
    });
  }

  logSystem(message: string, data: any = {}) {
    this.events.push({
      timestamp: Date.now(),
      type: 'system',
      botId: 'system',
      data: {
        message,
        ...data
      }
    });
  }

  async saveSession() {
    this.sessionMetadata.endTime = Date.now();
    
    const sessionData = {
      metadata: this.sessionMetadata,
      events: this.events,
      summary: this.generateSummary()
    };

    try {
      await fs.promises.writeFile(
        this.logFilePath, 
        JSON.stringify(sessionData, null, 2)
      );
      console.log(`✅ Session data saved to: ${this.logFilePath}`);
      return this.logFilePath;
    } catch (error) {
      console.error('❌ Failed to save session data:', error);
      throw error;
    }
  }

  private generateSummary() {
    const duration = (this.sessionMetadata.endTime || Date.now()) - this.sessionMetadata.startTime;
    const actionEvents = this.events.filter(e => e.type === 'action');
    const tradingEvents = this.events.filter(e => e.type === 'trading');
    
    return {
      duration: duration,
      durationMinutes: Math.round(duration / 60000 * 100) / 100,
      totalEvents: this.events.length,
      actionCount: actionEvents.length,
      tradingCount: tradingEvents.length,
      eventsPerMinute: Math.round((this.events.length / (duration / 60000)) * 100) / 100
    };
  }

  getEventCount(): number {
    return this.events.length;
  }

  getSessionId(): string {
    return this.sessionMetadata.sessionId;
  }
}