# L5R Tactical RPG - Client

React-based browser client for the L5R Tactical RPG.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management (coming soon)
- **PixiJS** - Graphics rendering (coming soon)

## Setup

```bash
cd client
pnpm install
```

## Environment Variables

Create a `.env.local` file in the client directory:

```env
VITE_API_URL=http://localhost:8787
```

## Development

Run the development server:

```bash
pnpm dev
```

This starts Vite on `http://localhost:5173` by default.

### API Configuration

The client automatically connects to the API server using `VITE_API_URL` environment variable. By default (if not set), it connects to `http://localhost:8787`.

## Building

Build for production:

```bash
pnpm build
```

Output is in the `dist/` directory.

## Testing API Communication

1. Start the server in another terminal:
   ```bash
   cd ../server && pnpm dev
   ```

2. Start the client dev server:
   ```bash
   pnpm dev
   ```

3. The app will automatically fetch the API ping endpoint on load and display the connection status in the UI.

## Project Structure

```
client/
├── src/
│   ├── App.tsx           # Main app component with API status display
│   ├── main.tsx          # React entry point
│   ├── index.css         # Global styles + Tailwind
│   ├── App.css          # Component styles
│   └── utils/
│       ├── api.ts        # API client utilities
│       └── hooks.ts      # React hooks for API calls
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── package.json          # Dependencies
```

## Features Implemented

- ✅ React + TypeScript setup with Vite
- ✅ Tailwind CSS styling
- ✅ API client for server communication
- ✅ React hook for fetching API data
- ✅ Loading and error state handling
- ✅ Server status display in UI

## Next Steps

- Add Zustand for state management
- Integrate PixiJS for hex grid rendering
- Build game UI components
- Add authentication integration
