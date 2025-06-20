import { AnalysisBot, BotStrategy } from './analysis-bot';
import { GameLogger } from './game-logger';

interface AnalysisConfig {
  serverUrl: string;
  duration: number; // in milliseconds
  botCount: number;
  strategies: BotStrategy[];
  logInterval: number; // status update interval in milliseconds
  testMode?: boolean; // fast mode for testing
}

class AnalysisRunner {
  private config: AnalysisConfig;
  private bots: AnalysisBot[] = [];
  private logger: GameLogger;
  private startTime: number = 0;
  private statusInterval: NodeJS.Timeout | null = null;

  constructor(config: AnalysisConfig) {
    this.config = config;
    const sessionId = `analysis-${Date.now()}`;
    this.logger = new GameLogger(
      sessionId, 
      config.strategies.join(','), 
      config.botCount
    );
  }

  async start() {
    console.log('🚀 Starting TradeWars Analysis Session');
    console.log(`📊 Configuration:`, {
      duration: `${this.config.duration / 1000}s`,
      botCount: this.config.botCount,
      strategies: this.config.strategies,
      serverUrl: this.config.serverUrl
    });

    this.startTime = Date.now();
    this.logger.logSystem('Analysis session started', {
      config: this.config,
      startTime: this.startTime
    });

    // Create bots with different strategies
    for (let i = 0; i < this.config.botCount; i++) {
      const strategy = this.config.strategies[i % this.config.strategies.length];
      const botId = `bot-${strategy}-${i + 1}`;
      
      const bot = new AnalysisBot(
        this.config.serverUrl,
        botId,
        strategy,
        this.logger,
        this.config.testMode || false
      );
      
      this.bots.push(bot);
      console.log(`🤖 Created ${botId} with strategy: ${strategy}`);
      
      // Stagger bot connections to avoid overwhelming server
      const staggerTime = this.config.testMode ? 10 : 1000;
      await this.sleep(staggerTime);
    }

    // Start status reporting
    this.startStatusReporting();

    // Run for specified duration
    await this.sleep(this.config.duration);

    // Stop analysis
    await this.stop();
  }

  private startStatusReporting() {
    this.statusInterval = setInterval(() => {
      this.reportStatus();
    }, this.config.logInterval);
  }

  private reportStatus() {
    const elapsed = Date.now() - this.startTime;
    const remaining = this.config.duration - elapsed;
    
    console.log(`\n⏱️  Time: ${Math.round(elapsed / 1000)}s elapsed, ${Math.round(remaining / 1000)}s remaining`);
    console.log(`📈 Events logged: ${this.logger.getEventCount()}`);
    
    const botStats = this.bots.map(bot => bot.getStats());
    const activeCount = botStats.filter(stats => stats.status === 'active').length;
    
    console.log(`🤖 Bots: ${activeCount}/${this.bots.length} active`);
    
    // Show sample bot stats
    botStats.slice(0, 3).forEach(stats => {
      if (stats.status === 'active') {
        console.log(`   ${stats.botId}: Sector ${stats.sector}, ${stats.credits} credits, ${stats.energy} energy`);
      }
    });

    this.logger.logSystem('Status report', {
      elapsed,
      remaining,
      eventCount: this.logger.getEventCount(),
      activeBots: activeCount,
      botStats: botStats
    });
  }

  private async stop() {
    console.log('\n🛑 Stopping analysis session...');
    
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }

    // Stop all bots
    const stopPromises = this.bots.map(bot => bot.stop());
    await Promise.all(stopPromises);

    // Save session data
    this.logger.logSystem('Analysis session ended', {
      endTime: Date.now(),
      totalDuration: Date.now() - this.startTime,
      finalEventCount: this.logger.getEventCount()
    });

    const logFile = await this.logger.saveSession();
    
    console.log('\n✅ Analysis session complete!');
    console.log(`📊 Total events: ${this.logger.getEventCount()}`);
    console.log(`💾 Data saved to: ${logFile}`);
    
    return logFile;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Parse command line arguments
function parseArgs(): AnalysisConfig {
  const args = process.argv.slice(2);
  const config: AnalysisConfig = {
    serverUrl: 'http://localhost:3000',
    duration: 300000, // 5 minutes default
    botCount: 3,
    strategies: ['greedy', 'explorer', 'random'],
    logInterval: 30000, // 30 seconds
    testMode: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--duration':
        config.duration = parseInt(args[++i]) * 1000; // Convert seconds to ms
        break;
      case '--bots':
        config.botCount = parseInt(args[++i]);
        break;
      case '--server':
        config.serverUrl = args[++i];
        break;
      case '--strategies':
        config.strategies = args[++i].split(',') as BotStrategy[];
        break;
      case '--test-mode':
        config.testMode = true;
        break;
      case '--help':
        console.log(`
TradeWars Analysis Runner

Usage: npm run analyze [options]

Options:
  --duration <seconds>    Analysis duration (default: 300)
  --bots <count>         Number of bots (default: 3)
  --server <url>         Server URL (default: http://localhost:3000)
  --strategies <list>    Comma-separated strategies (default: greedy,explorer,random)
  --test-mode            Enable fast test mode (100x time acceleration)
  --help                 Show this help

Available strategies: greedy, explorer, optimizer, random

Examples:
  npm run analyze --duration 600 --bots 5
  npm run analyze --strategies greedy,optimizer --duration 120
        `);
        process.exit(0);
    }
  }

  return config;
}

// Main execution
async function main() {
  try {
    const config = parseArgs();
    const runner = new AnalysisRunner(config);
    await runner.start();
    process.exit(0);
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (require.main === module) {
  main();
}