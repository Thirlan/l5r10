# L5R Tactical RPG - Server

Cloudflare Workers API server for the L5R Tactical RPG.

## Setup

```bash
cd server
pnpm install
```

## Development

Run the local development server:

```bash
pnpm dev
```

This starts `wrangler dev` on `http://localhost:8787` by default.

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
