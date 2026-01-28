# CorrectNow

AI-powered proofreading for spelling and light grammar corrections across 50+ languages. No rewriting—just clean, accurate fixes.

## Tech Stack
- React + Vite
- Tailwind CSS + shadcn/ui
- Node.js + Express API
- Google Gemini API

## Local Development

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create a `.env` file in the project root:
```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-pro
PORT=8787
```

### 3) Run the app
In two terminals:
```bash
npm run dev
```
```bash
npm run dev:server
```

- Frontend: http://localhost:8080
- API health: http://localhost:8787/api/health
- Model list: http://localhost:8787/api/models

## Deployment (Render)

### Build Command
```
npm install && npm run build
```

### Start Command
```
npm run start
```

### Environment Variables
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (example: `gemini-2.5-pro`)
- `NODE_ENV=production`

## Notes
- The API key must never be exposed in the frontend.
- The Express server serves the built React app in production.
