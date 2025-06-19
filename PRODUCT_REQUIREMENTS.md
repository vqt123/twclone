# TradeWars Clone - Product Requirements Document

## Project Vision
Create a modern, real-time multiplayer space trading game inspired by the classic TradeWars 2002, featuring streamlined mechanics, persistent gameplay, and strategic depth through information trading, ship progression, and route optimization.

## Current Implementation Status
**Core Trading System**: ✅ **COMPLETED** (v1.0)
- Simplified "Information Brokerage" trading mechanics implemented
- Single "Execute Trade" action with diminishing returns (70% efficiency decay)
- 24-hour regeneration cycle for trading post efficiency
- Ship progression with trade multipliers (Scout 1x → Trader 1.5x → Freighter 2x)
- Real-time multiplayer with auto-navigation pathfinding

## Core Game Loop (Current)
1. **Navigate** to trading posts across 20 interconnected sectors
2. **Execute trades** at information brokers for credits (with diminishing returns)
3. **Manage energy** consumption for movement and trading actions  
4. **Upgrade ships** to increase trade multipliers and energy efficiency
5. **Optimize routes** between regenerating trading posts for maximum profit

---

## Development Priorities (Based on Playtesting Feedback)

### Phase 1: Core System Refinement (IMMEDIATE PRIORITY)

#### 1.1 Trading Post Density Expansion
- **Current State**: 5 trading posts across 20 sectors (25% coverage)
- **Target**: 8-10 trading posts (40-50% coverage)
- **Rationale**: Provides more route variety and reduces empty sector feeling
- **Implementation**: Modify `generateTradingPosts()` function to create additional posts

#### 1.2 Progression Goal System
- **Problem**: Players lack clear objectives beyond "get rich"
- **Solution**: Add milestone tracking and achievement system
- **Features**:
  - Credit milestones: 2,500 → 5,000 → 15,000 → 50,000
  - Ship upgrade notifications: "X credits needed for Trader Vessel"
  - Route efficiency tracking: trades per hour, profit margins
  - Progress bars for current ship upgrade goal

#### 1.3 Energy Economics Balance
- **Current Issue**: Energy depletes too quickly for extended play sessions
- **Solutions**:
  - Increase base regeneration rate (currently 100/hour)
  - Add energy-efficient route planning hints
  - Consider energy purchase options at StarPorts
  - Optimize energy costs for different ship types

#### 1.4 Visual Clarity Improvements
- **Problem**: Hard to identify trading post sectors at a glance
- **Solutions**:
  - Enhanced sector visual indicators for trading post types
  - Efficiency color coding (green >70%, yellow >30%, red <30%)
  - Sector map legend showing trading post locations
  - Route planning visual aids

### Phase 2: Enhanced Trading Experience (HIGH PRIORITY)

#### 2.1 Advanced Ship Types
- **Current**: 3 ships (Scout, Trader, Freighter)
- **Addition**: 2-3 specialized ships
  - **Courier Ship**: Ultra-fast, low energy movement costs
  - **Data Harvester**: Bonus trade multiplier, higher energy costs
  - **Mobile Base**: Portable trading post functionality

#### 2.2 Trading Route Intelligence
- **Features**:
  - Route efficiency calculator
  - Trading post regeneration timers
  - Optimal path suggestions based on current efficiency
  - Historical profit tracking per sector

### Phase 3: Competitive Features (MEDIUM PRIORITY)

#### 3.1 Player-vs-Player Elements
- **Leaderboards**: Credit rankings, trade efficiency scores, route mastery
- **Competitive Events**: Timed trading challenges, efficiency competitions
- **Player Interaction**: Message system, trade route sharing/blocking

#### 3.2 Advanced Information Trading
- **Market Intelligence Levels**: Basic → Advanced → Insider information
- **Information Decay**: Intel becomes less valuable over time
- **Exclusive Contracts**: Time-limited high-value information sources

### Phase 4: Combat System (LOWER PRIORITY)

#### 4.1 Ship Combat Mechanics
- **Simplified Combat**: Focus on economic warfare rather than military
- **Trade Route Disruption**: Temporarily block competitor access to posts
- **Information Warfare**: Steal or corrupt competitor route data
- **Economic Sabotage**: Reduce trading post efficiency for others

#### 4.2 Defensive Measures
- **Route Encryption**: Protect trading strategies from competitors
- **Information Security**: Prevent route data theft
- **Alliance Formation**: Cooperative information sharing agreements

### Phase 5: Universe Expansion (FUTURE)

#### 5.1 Dynamic Universe
- **Sector Events**: Random efficiency bonuses/penalties
- **Market Fluctuations**: Temporary trading post profit modifiers
- **New Trading Post Discovery**: Rare high-value information sources

#### 5.2 Advanced Progression
- **Corporation System**: Shared information networks
- **Territory Control**: Sector influence through trading dominance
- **Technology Trees**: Upgrades to ships, efficiency, information quality

---

## Explicitly Excluded Features

### New User Experience (Intentionally Deferred)
- **Rationale**: Focus on core mechanics refinement before onboarding
- **Current Status**: Core gameplay must be polished first
- **Future Consideration**: Will be addressed after Phase 1 completion
- **Includes**: Tutorials, help systems, guided experiences, tooltips

### Complex Resource Management
- **Removed**: Commodity inventory system (replaced with simple information trading)
- **Rationale**: Simplified mechanics proved more engaging in playtesting
- **Status**: Will not be reintroduced

---

## Technical Implementation Notes

### Current Architecture (v1.0)
- **Trading System**: Single trade action with efficiency tracking
- **Sector Generation**: 20-sector grid with BFS pathfinding
- **Ship Progression**: Type-based trade multipliers and energy efficiency
- **Real-time Multiplayer**: Socket.io for live updates and player tracking

### Key Configuration Values
```typescript
// Trading post efficiency system
tradeConfig = {
  efficiencyDecay: 0.7,        // 70% retention per trade
  regenTimeHours: 24,          // Full regeneration time
  minEfficiency: 0.05,         // 5% minimum efficiency floor
}

// Ship progression system  
shipTypes = {
  SCOUT: { tradeMultiplier: 1.0, energyEfficiency: 0.8 },
  TRADER: { tradeMultiplier: 1.5, energyEfficiency: 1.0 },
  FREIGHTER: { tradeMultiplier: 2.0, energyEfficiency: 1.5 }
}
```

### Phase 1 Technical Requirements
- **Trading Post Expansion**: Modify `generateTradingPosts()` to create 8-10 posts
- **Progression System**: Add milestone tracking to player state
- **Energy Balance**: Adjust regeneration rates in `energyConfig`
- **Visual Indicators**: Enhanced CSS for trading post identification

### Future Technical Considerations
- **Scalability**: Real-time efficiency updates for larger player counts
- **Data Persistence**: Player progression and achievement tracking
- **Performance**: Optimize pathfinding for expanded trading post network

---

## Success Metrics

### Phase 1 Metrics (Immediate Focus)
- **Trading Engagement**: Average trades per session, route diversity
- **Ship Progression**: Percentage of players upgrading from Scout ship
- **Session Duration**: Time spent per session (target: 15-30 minutes)
- **Trading Post Utilization**: Distribution of activity across all posts
- **Energy Balance**: Player frustration with energy limitations

### Long-term Metrics
- **Player Retention**: 7-day and 30-day active player percentage
- **Route Mastery**: Players developing efficient trading strategies  
- **Economic Balance**: Credit inflation/deflation monitoring
- **Multiplayer Engagement**: Concurrent player interactions
- **Performance**: Server response times for real-time updates

---

## Document History
- **v1.0** (2025-06-19): Initial comprehensive PRD with combat focus
- **v2.0** (2025-06-19): Restructured based on playtesting feedback
  - Prioritized trading system refinement over combat features
  - Added explicit exclusion of new user experience work
  - Focused roadmap on proven gameplay mechanics
  - Aligned priorities with actual player engagement data

This PRD now reflects the reality of successful simplified trading mechanics and provides a clear, achievable roadmap based on actual gameplay testing rather than theoretical features.