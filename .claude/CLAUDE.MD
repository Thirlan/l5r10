# L5R Tactical RPG – Development Roadmap

A browser-based **multiplayer tactical RPG** based on **Legend of the Five Rings 4th Edition**.

The game is a **turn-based hex grid tactical combat system** focused entirely on the battlefield layer.

# Technology Stack

## Infrastructure

Provider:

- Cloudflare

Services used:

- Cloudflare Workers
- Cloudflare Durable Objects
- Cloudflare D1
- Cloudflare R2

Responsibilities:

Workers

- API
- authentication integration
- battle state validation

Durable Objects

- multiplayer battle state
- WebSocket connections
- turn resolution

D1

- users
- characters
- campaigns
- battle records

R2

- maps
- tile assets
- tokens
- portraits

---

## Frontend

Framework:

- React
- TypeScript

Rendering Engine:

- PixiJS

UI:

- Tailwind CSS

State Management:

- Zustand

Hex Grid Math:

- Honeycomb


## Folder structure
/docs: contains a plain old html page hosted on https://thirlan.github/io/l5r10. This is entirely separate from the tactical game.