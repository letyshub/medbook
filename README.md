# Medium to eBook Converter

Convert Medium articles to beautifully formatted PDF and ePub files.

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Development

Start both server and client:

```bash
npm run dev
```

Or start them separately:

```bash
# Start backend server (port 3001)
npm run dev:server

# Start frontend client (port 5173)
npm run dev:client
```

## Project Structure

```
medbook/
├── packages/
│   ├── server/          # Backend API (Hono)
│   │   └── src/
│   │       ├── routes/      # API routes
│   │       ├── scraper/     # Medium article scraping
│   │       ├── generators/  # PDF/ePub generation
│   │       └── utils/       # Utilities
│   └── client/          # Frontend (React + Vite + Tailwind)
│       └── src/
│           ├── components/  # React components
│           └── api/         # API client
├── package.json         # Workspace root
└── tsconfig.json        # Base TypeScript config
```

## Tech Stack

- **Backend**: Node.js, TypeScript, Hono
- **Frontend**: React, Vite, Tailwind CSS
- **Monorepo**: npm workspaces

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both server and client |
| `npm run dev:server` | Start backend only |
| `npm run dev:client` | Start frontend only |
| `npm run build` | Build all packages |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## API Endpoints

- `GET /api/health` - Health check
