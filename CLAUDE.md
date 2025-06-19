# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TradeWars Clone is a real-time multiplayer space trading game inspired by the classic TradeWars 2002. Built with TypeScript, Express.js, and Socket.io, it features real-time trading, sector-based navigation, energy management, and ship progression.

## Development Commands

**Build & Run:**
- `npm run build` - Compile TypeScript to JavaScript in `dist/`
- `npm start` - Run production server from compiled JavaScript
- `npm run dev` - Development mode with TypeScript hot reload using ts-node

**Note:** Railway deployment automatically runs `npm run build` via the postinstall hook.

## Architecture Overview

### Core Game Systems

**Type System (`src/types.ts`):**
All game entities use strongly-typed enums instead of magic strings:
- `Commodity` (ORE, FOOD, EQUIPMENT)
- `ShipType` (SCOUT, TRADER, FREIGHTER) 
- `PortType` (MINING, AGRICULTURAL, INDUSTRIAL, COMMERCIAL, STARPORT)
- `Action` (MOVE, TRADE) for energy consumption
- Socket event interfaces for type-safe client-server communication

**Game State Architecture:**
- **Sectors**: 20 interconnected sectors in a 5x4 grid, each with connections to adjacent sectors
- **Ports**: Randomly distributed across 5 sectors, each specializing in buying/selling specific commodities
- **Players**: Persistent state including inventory, energy, ship type, and current location
- **Energy System**: Regenerating resource (100/hour, max 2400) consumed by movement and trading

### Server Architecture (`src/server.ts`)

**Core Functions:**
- `generateSectors()`: Creates the universe grid with sector connections
- `generatePorts()`: Distributes specialized trading ports with dynamic pricing (±20% variation)
- `updatePlayerEnergy()`: Handles energy regeneration (1 energy per 36 seconds)
- `consumeEnergy()`: Validates and deducts energy costs based on ship efficiency

**Socket Events:**
- `playerJoined`: Initialize new player with starting ship and energy
- `moveTo`: Handle sector navigation with energy consumption validation
- `buyItem`/`sellItem`: Execute trades with port compatibility and inventory checks
- `playerUpdate`: Broadcast real-time state changes to all clients

### Client Architecture (`public/index.html`)

**Game State Management:**
- Maintains local `gameState` object synchronized with server
- Real-time UI updates for energy, inventory, credits, and player position
- Visual energy bar with color coding (green/orange/red based on remaining energy)

**UI Components:**
- Sector map grid showing all 20 sectors with player counts and port information
- Trading interface that appears when in sectors with ports
- Player status panel with ship info, energy gauge, and inventory display

### Energy & Ship System

**Ship Types with Different Characteristics:**
- Scout Ship: 80% energy efficiency, 10 cargo capacity (starter ship)
- Trader Vessel: 100% energy efficiency, 30 cargo capacity  
- Heavy Freighter: 150% energy efficiency, 50 cargo capacity

**Energy Costs:**
- Movement: 10 base energy × ship efficiency
- Trading: 5 base energy × ship efficiency
- Regeneration: 100 energy per hour (continuous background process)

### Trading System

**Port Specialization:**
- Mining Stations: Buy ore, sell equipment
- Agricultural Ports: Buy food, sell ore  
- Industrial Complexes: Buy equipment, sell food
- Commercial Hubs: Buy ore/food, sell equipment
- StarPorts: Universal trading (buy/sell all commodities)

**Dynamic Pricing:**
Base prices (Ore: 50, Food: 30, Equipment: 100) with ±20% random variation per port.

## Coding Standards

**File Size Limit:**
- Keep all files under 250 lines of code
- Files over 300 lines should be refactored to separate concerns
- Split large files by logical boundaries (game logic, networking, data structures)

**Error Handling Philosophy:**
- Avoid defensive null checks everywhere
- Let code fail fast rather than masking issues with null guards
- Only handle exceptions for scenarios truly outside our control (network failures, user input)
- Fix root causes rather than patching symptoms with defensive code

## CRITICAL: Multiplayer Systems Analysis (MANDATORY)

**Before implementing ANY multiplayer mechanic, you MUST complete this analysis:**

### 1. Resource Contention Analysis
- **Question**: "What happens when 10+ players compete for this shared resource?"
- **Requirement**: Model worst-case depletion scenarios
- **Example**: If trading posts take 24 hours to regenerate and efficiency is shared, most players will log in to find everything depleted by earlier players

### 2. Asynchronous Play Patterns
- **Question**: "Map player experiences across different login times"
- **Requirement**: Verify that Player #10 logging in at hour 23 still has engaging gameplay
- **Red Flag**: If only players who log in at specific times get good experiences

### 3. Long-term Equilibrium State
- **Question**: "What does the game look like after 100+ player sessions?"
- **Requirement**: Confirm the game remains engaging when all players know optimal strategies
- **Red Flag**: If all players converge on identical optimal strategies with no meaningful choices

### 4. Multiplayer Systems Validation Checklist
Before implementing ANY shared system:
- [ ] Modeled resource depletion under realistic player load
- [ ] Verified different play schedules don't create unfair advantages  
- [ ] Confirmed "late arriving" players still have meaningful gameplay
- [ ] Tested that optimal strategies remain fun when everyone discovers them
- [ ] Ensured shared resources regenerate appropriately for player count

**FAILURE TO COMPLETE THIS ANALYSIS WILL RESULT IN FUNDAMENTAL DESIGN FLAWS REQUIRING MAJOR REWORK**

## Key Implementation Details

When modifying game mechanics, ensure energy costs are validated before actions and that all string literals use the appropriate enums from `types.ts`. The frontend automatically updates energy display every 10 seconds and synchronizes with server state changes.

Port generation occurs once at server startup. New features should follow the existing pattern of type-safe enums and comprehensive interfaces for client-server communication.

When adding new features, consider file size limits and split concerns into separate modules when approaching the 250-line threshold.