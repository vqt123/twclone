# TradeWars 2002 Research Documentation

## Overview
TradeWars 2002 is a multiplayer space trading and combat game that was the most popular BBS game upon release. Named 10th best PC game of all time by PC World Magazine in 2009.

## Core Game Concept
- Space trading game with capitalist formula: buy low, sell high
- Add ship-to-ship combat for strategic depth
- Players can be "good" or "evil" traders with different advancement paths
- Multiplayer competition to become most powerful trader in universe

## Ship Types & Combat Specifications

### Federation Ships
| Ship Type | Max Fighters | Max Shields | Combat Odds | Max Attack Fighters | Trading Efficiency |
|-----------|-------------|-------------|-------------|-------------------|-------------------|
| Merchant Cruiser | 2,500 | 400 | 1.0:1 | 750 | High |
| Scout Marauder | - | - | - | - | - |
| Missile Frigate | - | - | - | - | Can use Photon Missiles |
| BattleShip | 10,000 | 750 | 1.6:1 | 3,000 | - |
| Corporate FlagShip | 20,000 | 1,500 | 1.2:1 | 6,000 | - |
| Colonial Transport | - | - | - | - | - |
| CargoTran | - | - | - | - | - |
| Merchant Freighter | - | - | - | - | TE of 100 (highest) |
| Imperial StarShip | 50,000 | 2,000 | 1.5:1 | - | Safety Rating: 78,000 |
| Havoc GunStar | - | - | - | - | - |
| StarMaster | - | - | - | - | - |
| Constellation | - | - | - | - | - |
| T'Khasi Orion | - | - | - | - | - |
| Tholian Sentinel | - | - | - | - | - |
| Taurean Mule | - | - | - | - | - |
| Interdictor Cruiser | - | - | - | - | - |

### Ferrengi Ships (Capturable)
| Ship Type | Trade-in Value |
|-----------|---------------|
| Assault Trader | 52,155 credits |
| Battle Cruiser | 111,645 credits |
| Dreadnought | 214,290 credits |

*Note: Ferrengi ships can be acquired by attacking and capturing them*

## Combat System Mechanics

### Safety Rating Calculation
- Formula: (Total Fighters + Shields) × Ship's Combat Odds
- Represents number of fighters needed to destroy a fully loaded ship
- Assumes attacking ship has 1:1 combat odds
- Imperial StarShip has highest safety rating at 78,000

### Combat Resolution
- Turn-based combat system (not real-time due to BBS limitations)
- Success determined by which side has superior firepower/defenses
- Combat involves using fighters as offensive units and shields as defense
- Players can be forced into escape pods if ship is destroyed

### Special Weapons
- **Photon Missiles**: Only usable by Missile Frigates and Imperial StarShips
- Excellent against ships once shields are destroyed
- Can disable planetary defenses (Level 2 and 3 Citadels)
- Shields provide excellent protection from missile impact

### Ship Capture
- Attack with minimal fighters necessary to force enemy into escape pod
- Allows capturing enemy ship while preserving most of its value
- Strategic alternative to complete destruction

## Trading System

### Commodity Types
Three primary commodities:
1. **Fuel Ore** - Basic energy resource
2. **Organics** - Food and biological materials  
3. **Equipment** - Technology and manufactured goods

### Port Types & Specialization
- Ports either buy or sell each commodity at different prices
- Buying ports usually pay more than selling ports charge
- Price arbitrage is the basic income method for traders
- **Sol, Rylos, Alpha Centauri**: Class 0 ports selling fighters, shields, cargo holds

### Trading Mechanics
- Primary income source for most players
- Players exploit price differences between ports for profit
- Dynamic pricing with approximately ±20% variation

## Planet Building System

### Planet Creation
- Use **Genesis Torpedoes** to create planets in unoccupied sectors
- Reference to Star Trek II: The Wrath of Khan
- Players can colonize planets by transporting colonists from Terra (Sector 1)

### Planet Classes
- **7 different planet classes** with varying production capabilities
- Each class specializes in different resource production:
  - Some focus on fuel ore production
  - Others specialize in organics
  - Equipment manufacturing planets
  - Research and development facilities

### Planetary Defenses
- **6 Citadel Levels** providing escalating defensive capabilities:
  - Level 1: Basic defenses
  - Level 2: Combat Control Computers
  - Level 3: Quasar Cannons  
  - Level 4-6: Advanced defensive systems
- **Space Mines**: Additional defensive option
- **Planetary Citadel**: Can be built up over weeks to become "near-impregnable"

### Colonist Management
- Transport colonists from Terra to new planets
- Colonists work and generate products based on planet class
- Population growth increases production over time

## Corporation System

### Corporate Structure
- Players can form corporations to share resources
- Shared assets include planets, ships, and other resources
- Allows coordinated strategy and resource pooling
- Corporate roles and hierarchies for organization

### Corporate Benefits
- Resource sharing among members
- Coordinated attacks and defense
- Territorial control and expansion
- Strategic alliances for larger operations

## Alignment System

### Good vs Evil Paths
- **Good Traders**: Focus on legal trading and reputation
- **Evil Traders**: Can engage in piracy and illegal activities
- Alignment affects available actions and gameplay options

### Evil Player Actions
- **Port Robbing**: Approximately 1 in 50 steal attempts result in being "busted"
- **Piracy**: Attack other players for resources
- **Illegal Trading**: Access to black market opportunities

## Movement & Turn System

### Turn-Based Movement
- Each ship has a turn/warp ratio (e.g., Merchant Cruiser: 3 turns per warp)
- Players start with limited turns per day
- Movement between sectors consumes turns based on ship efficiency
- Example: Moving from Sector 1 to 2 takes 3 turns with Merchant Cruiser

### Energy vs Turn System
- Original used daily turn limits rather than energy regeneration
- Turn efficiency varied by ship type
- Strategic resource management crucial for optimal play

## Universe Structure

### Sector Design
- Mathematical description: "directed graph where sectors are vertices and warps are edges"
- Complex navigation and partitioning challenges
- Strategic importance of sector control and warp route management

### Notable Locations
- **Terra (Sector 1)**: Source of colonists for new planets
- **StarDock**: Where players can purchase new ship types
- **Class 0 Ports**: Sol, Rylos, Alpha Centauri for equipment purchases

## Visual & Technical Features

### ANSI Graphics
- Animated ANSI graphics for major game events
- Ship destruction animations
- Planet destruction sequences
- Player death animations
- Enhanced visual experience over 2400 baud modems

### BBS Technology
- Originally designed for Bulletin Board Systems
- Turn-based mechanics due to technological limitations
- Persistent multiplayer world across dial-up connections
- Text-based interface with ASCII art enhancements

## Strategic Elements

### Economic Warfare
- Price manipulation through coordinated trading
- Resource monopolies and supply chain control
- Corporate economic dominance strategies

### Military Strategy
- Territory control through planetary colonization
- Defensive positioning with citadels and mines
- Coordinated attacks through corporations
- Ship capture vs destruction decisions

### Progression Paths
- Trading efficiency and economic growth
- Military expansion and territorial control
- Corporate leadership and alliance building
- Technology advancement and ship progression

## Research Sources
- GameBanshee BBS TradeWars Guide
- Break Into Chat BBS Wiki
- ClassicTW Museum Documentation
- Original player testimonials and guides
- Historical BBS gaming archives

*This research forms the foundation for our TradeWars Clone implementation, ensuring authentic recreation of classic mechanics while enabling modern enhancements.*