# L5R Tactical RPG -- Development Roadmap

A browser-based **multiplayer tactical RPG** based on **Legend of the
Five Rings 4th Edition**.

The game focuses on **turn-based hex-grid tactical combat** and is
designed to run fully in the browser.

------------------------------------------------------------------------

# Technology Stack

## Infrastructure

Provider: - Cloudflare

Services: - Cloudflare Workers - Cloudflare Durable Objects - Cloudflare
D1 - Cloudflare R2

Responsibilities:

Workers - API - authentication integration - battle state validation

Durable Objects - multiplayer battle state - WebSocket connections -
turn resolution

D1 - users - characters - campaigns - battle records

R2 - maps - tile assets - tokens - portraits

------------------------------------------------------------------------

# Frontend

Framework - React - TypeScript

Rendering Engine - PixiJS

UI Framework - Tailwind CSS

State Management - Zustand

Hex Grid System - Honeycomb

------------------------------------------------------------------------

# Architecture Overview

## Client

Browser application responsible for:

-   rendering the hex map
-   displaying characters and tokens
-   animations
-   UI
-   player input

All authoritative game logic lives on the server.

------------------------------------------------------------------------

## Server

Runs on Cloudflare Workers.

Responsibilities:

-   validate player actions
-   resolve combat
-   manage campaigns
-   store persistent data

------------------------------------------------------------------------

## Multiplayer Model

Each battle is represented by a Durable Object.

BattleRoom state contains:

-   map
-   characters
-   initiative order
-   current turn
-   combat log

Players connect using WebSockets.

------------------------------------------------------------------------

# Repository Structure

l5r-tactics/

client/ - React application - PixiJS renderer - UI components

server/ - Cloudflare workers - Durable Objects - API routes

shared/ - rules engine - dice system - shared types

assets/ - tiles - tokens - portraits

tools/ - map editor

------------------------------------------------------------------------

# Development Plan

Development cadence:

-   2 hour sessions
-   5 sessions per week
-   \~260 sessions per year

------------------------------------------------------------------------

# Month 1 -- Foundation

Goal: establish the base project infrastructure.

Week 1  (COMPLETED)

Session 1 - initialize git repo - create monorepo - install Node -
configure pnpm workspace (COMPLETED)

Session 2 - create React app using Vite - install React + TypeScript (COMPLETED)

Session 3 Install frontend libraries: - Tailwind CSS - Zustand -
PixiJS - Honeycomb (COMPLETED)

Session 4 Create shared TypeScript module for: - shared types - dice
engine - rules (COMPLETED)

Session 5 Configure linting: - ESLint - Prettier (COMPLETED)

------------------------------------------------------------------------

Week 2 -- Cloudflare Setup

Session 6 - create Cloudflare account - install Wrangler CLI (COMPLETED)

Session 7 - create Workers project - deploy first worker (COMPLETED)

Session 8 - create API endpoint `/api/ping` - verify frontend (COMPLETED)
communication

Session 9 - create Cloudflare D1 database (COMPLETED)

Session 10 Create initial tables: - users - characters - campaigns

------------------------------------------------------------------------

Week 3 -- Authentication

Session 11 Install Auth.js.

Providers: - email - Google - Discord

Session 12 Create D1 user mapping table.

Session 13 Create login page using React + Tailwind.

Session 14 Add authenticated routes:

-   /dashboard
-   /campaigns

Session 15 Test login persistence.

------------------------------------------------------------------------

Week 4 -- Rendering

Session 16 Install PixiJS and embed canvas.

Session 17 Create viewport system: - zoom - pan - resize

Session 18 Install Honeycomb hex library.

Session 19 Render hex grid.

Session 20 Add mouse hover detection.

------------------------------------------------------------------------

# Month 2 -- Hex Map Engine

Sessions 21--25 Implement hex math:

-   neighbors
-   distance
-   axial coordinates

Sessions 26--30 Improve renderer:

-   terrain textures
-   grid overlay
-   tile highlighting

Sessions 31--35 Map loading from R2.

Sessions 36--40 Character token rendering: - sprites - facing - health
bars

------------------------------------------------------------------------

# Month 3 -- Movement

Sessions 41--45 Click-to-move system.

Sessions 46--50 Pathfinding using A\*.

Sessions 51--55 Movement animation.

Sessions 56--60 Terrain movement penalties.

------------------------------------------------------------------------

# Month 4 -- Dice Engine

Sessions 61--65 Implement roll-and-keep dice system.

Example: 5k3

Sessions 66--70 Exploding dice.

Sessions 71--75 Raises.

Sessions 76--80 Combat roll integration.

------------------------------------------------------------------------

# Month 5 -- Character System

Sessions 81--85 Character schema:

-   rings
-   skills
-   advantages
-   armor
-   wounds

Sessions 86--90 Character sheet UI.

Sessions 91--95 Wound system:

healthy nicked grazed hurt injured crippled down out

Sessions 96--100 Save characters to database.

------------------------------------------------------------------------

# Month 6 -- Combat

Sessions 101--105 Initiative system.

Sessions 106--110 Attack resolution.

Sessions 111--115 Damage resolution.

Sessions 116--120 Combat log.

------------------------------------------------------------------------

# Month 7 -- Multiplayer

Sessions 121--125 Create battle Durable Object.

Sessions 126--130 WebSocket connections.

Sessions 131--135 Synchronize player actions.

Sessions 136--140 Turn system.

------------------------------------------------------------------------

# Month 8 -- Campaign System

Sessions 141--145 Campaign schema.

Sessions 146--150 Campaign creation UI.

Sessions 151--155 Invite players.

Sessions 156--160 Assign characters.

------------------------------------------------------------------------

# Month 9 -- Map Editor

Sessions 161--165 Map editor UI.

Sessions 166--170 Terrain painting.

Sessions 171--175 Object placement.

Sessions 176--180 Save maps to R2.

------------------------------------------------------------------------

# Month 10 -- GM Tools

Sessions 181--185 Spawn enemies.

Sessions 186--190 Control initiative.

Sessions 191--195 Trigger effects.

Sessions 196--200 Fog of war.

------------------------------------------------------------------------

# Month 11 -- Polish

Sessions 201--210 Animation improvements.

Sessions 211--220 Audio integration.

Sessions 221--230 Bug fixes.

------------------------------------------------------------------------

# Month 12 -- Beta

Sessions 231--240 Load testing.

Sessions 241--250 Balance adjustments.

Sessions 251--260 Public beta release.

------------------------------------------------------------------------

# Final Capabilities

The final system supports:

-   multiplayer tactical battles
-   hex grid combat
-   L5R dice system
-   persistent characters
-   campaigns
-   GM tools
-   browser-based play

All hosted on Cloudflare serverless infrastructure.

------------------------------------------------------------------------

# Future Extensions

Potential improvements:

-   AI opponents
-   campaign map layer
-   inventory system
-   character advancement
-   battle replay viewer
