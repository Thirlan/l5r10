# L5R Tactical RPG - Server

Cloudflare Workers API server for the L5R Tactical RPG.

## Setup

Prerequisites:
- Cloudflare account with Workers enabled
- Wrangler CLI (`npm install -g wrangler`)

Install dependencies:

```bash
cd server
pnpm install
```

## Database

This project uses **Cloudflare D1** (serverless SQL database) for persistent storage.

### Creating the Database

See [D1_SETUP.md](./D1_SETUP.md) for detailed instructions on:
- Creating D1 databases (development and production)
- Applying database migrations
- Using the database in API endpoints
- Troubleshooting

Quick start:
```bash
# Create development database
wrangler d1 create l5r-tactics-dev

# Copy the database ID from output and update wrangler.toml
# Then apply migrations:
wrangler d1 execute l5r-tactics-dev --file migrations/0001_init.sql
```

Database utilities are in `src/db.ts` with helper functions for users, campaigns, characters, and battles.

## Development

Run the local development server:

```bash
pnpm dev
```

This starts `wrangler dev` on `http://localhost:8787` by default.

With local database:
```bash
# First apply migrations locally
wrangler d1 execute l5r-tactics-dev --local --file migrations/0001_init.sql

# Then run with local database
wrangler dev --local
```

## API Endpoints

### `GET /api/ping`
Health check endpoint. Returns status and server timestamp.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-09T12:00:00.000Z",
  "message": "L5R Tactical RPG API is running"
}
```

### `GET /api/health`
Health check endpoint with version info.

**Response:**
```json
{
  "healthy": true,
  "version": "0.1.0",
  "timestamp": "2024-03-09T12:00:00.000Z"
}
```

## Deployment

### Prerequisites
- Cloudflare account
- Wrangler CLI installed and authenticated (`wrangler login`)

### Deploy to Cloudflare Workers

```bash
pnpm deploy
```

This deploys to production using the account configured in `wrangler.toml`.

### Environment Configuration

Update `wrangler.toml` to configure:
- Worker name
- Custom domains
- Environment-specific settings

Future deployments will add:
- D1 database bindings
- R2 storage bindings
- KV store bindings
- Authentication middleware

## Build

Compile TypeScript to JavaScript:

```bash
pnpm build
```

Output is in the `dist/` directory.

## Project Structure

```
server/
├── src/
│   └── index.ts          # Main worker handler
├── dist/                 # Compiled JavaScript (gitignored)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── wrangler.toml         # Cloudflare Workers config
└── README.md            # This file
```

## Technologies

- **Runtime:** Cloudflare Workers (V8 engine)
- **Language:** TypeScript
- **API:** Fetch API (standard web APIs)
- **Build:** Wrangler CLI
