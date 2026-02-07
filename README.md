# Medium to eBook Converter

Convert Medium articles to beautifully formatted PDF and ePub files.

## Prerequisites

- Node.js 18+
- npm 9+

Or alternatively:
- Docker Desktop

## Installation

```bash
npm install
```

## Usage

Follow these steps to convert Medium articles to an eBook:

1. **Start the application**

   Using npm:
   ```bash
   npm run dev
   ```

   Or using Docker:
   ```bash
   docker compose up
   ```

2. **Open the web interface**

   Navigate to http://localhost:5173 in your browser.

3. **Paste Medium URLs**

   Enter one or more Medium article URLs in the textarea (one URL per line).

4. **Click Preview**

   Click the "Preview" button to fetch article metadata. You'll see a list of articles with their titles, authors, and reading times.

5. **Select articles**

   Use the checkboxes to select which articles to include in your eBook. Use "Select All" or "Deselect All" for bulk selection.

6. **Configure your eBook**

   - Enter a title for your eBook
   - Choose the output format (PDF or ePub)

7. **Generate and download**

   Click "Generate" to create your eBook. The file will automatically download when ready.

## Docker

Run the application using Docker Compose for a consistent development environment.

### Quick Start

```bash
# Start both server and client
docker compose up

# Stop the containers
docker compose down
```

### Prerequisites

- Docker Desktop installed and running

### Features

- **Hot-reload**: Code changes are automatically reflected without rebuilding containers
- **Volume mounts**: Source code is mounted into containers for live development
- **Isolated environment**: No need to install Node.js locally

### Ports

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

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

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api` | GET | API info |
| `/api/preview` | POST | Get article metadata for URLs |
| `/api/convert` | POST | Convert articles to PDF/ePub |
| `/api/scrape` | POST | Scrape a single article |
| `/api/generate-pdf` | POST | Generate PDF from articles |
| `/api/generate-epub` | POST | Generate ePub from articles |

### Preview Articles

Get metadata for Medium articles without generating an eBook.

```bash
curl -X POST http://localhost:3001/api/preview \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://medium.com/@author/article-slug"]}'
```

**Response:**
```json
{
  "articles": [
    {
      "url": "https://medium.com/@author/article-slug",
      "title": "Article Title",
      "author": "Author Name",
      "publishedDate": "2024-01-15",
      "readingTime": "5 min read"
    }
  ]
}
```

### Convert to eBook

Convert Medium articles to PDF or ePub format.

```bash
curl -X POST http://localhost:3001/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://medium.com/@author/article-1", "https://medium.com/@author/article-2"],
    "format": "pdf",
    "options": {
      "title": "My eBook"
    }
  }' \
  --output my-ebook.pdf
```

**Request Body:**
```json
{
  "urls": ["string"],
  "format": "pdf" | "epub",
  "options": {
    "title": "string"
  }
}
```

## Environment Variables

Copy `.env.example` to `.env` to customize settings:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `3001` | Backend API server port |
| `CLIENT_PORT` | `5173` | Frontend dev server port |
| `VITE_API_URL` | `http://localhost:3001` | API URL for frontend (auto-set in Docker) |
