# Tides Web Application

## Project Overview

A Single Page Application (SPA) that displays tide predictions on an interactive map. Users can drag the map to select a location, and tide graphs are displayed in an overlay (bottom on mobile, right sidebar on desktop).

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Maps**: Google Maps SDK
- **Charting**: Recharts
- **Date Handling**: date-fns
- **Styling**: CSS (responsive design)
- **Code Quality**: ESLint + Prettier
- **Deployment**: GitHub Pages
- **CI/CD**: GitHub Actions

## Features

### Core Functionality

1. **Interactive Map**: Google Maps integration with drag functionality
2. **Tide Graph Display**:
   - Shows tide predictions from https://api.tides.ngs.io/
   - Mobile: Bottom overlay
   - Desktop: Right sidebar
3. **URL State Management**: Map position (lat, lon, zoom) saved in query parameters
4. **Debounced Updates**: Graph updates after map drag settles (debounce delay)

### API Integration

Base URL: `https://api.tides.ngs.io/`

Endpoints:

- `GET /v1/tides/predictions?lat={lat}&lon={lon}&start={start}&end={end}&interval=30m&source=fes`
- `GET /v1/constituents`
- `GET /healthz`

## Project Structure

````
tides-web/
├── src/
│   ├── components/
│   │   ├── Map.tsx              # Google Maps component
│   │   ├── TideGraph.tsx        # Recharts tide graph
│   │   └── TideOverlay.tsx      # Responsive overlay container
│   ├── hooks/
│   │   ├── useDebounce.ts       # Debounce hook
│   │   └── useUrlState.ts       # URL query parameter state management
│   ├── services/
│   │   └── tidesApi.ts          # API client for Tides API
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── App.tsx                  # Main application component
│   ├── App.css                  # Main styles
│   └── main.tsx                 # Entry point
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions for deployment
├── public/                      # Static assets
├── .eslintrc.cjs               # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── vite.config.ts              # Vite configuration (GitHub Pages setup)
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Lint
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
````

## Environment Variables

Create a `.env` file:

```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
VITE_TIDES_API_URL=https://api.tides.ngs.io
```

## Deployment

The app is deployed to GitHub Pages via GitHub Actions on push to `main` branch.

## TODO List

- [x] Initialize React + TypeScript project with Vite
- [x] Set up ESLint and Prettier
- [ ] Install and configure Google Maps SDK
- [ ] Create map component with drag handling
- [ ] Create tide graph overlay component
- [ ] Implement API client for Tides API
- [ ] Set up responsive layout (mobile bottom, desktop sidebar)
- [ ] Implement URL query parameter state management
- [ ] Configure GitHub Pages deployment
- [ ] Set up CI/CD with GitHub Actions
- [ ] Create .gitignore and initial commit

## Notes

- Map state (lat, lon, zoom) persists in URL query parameters for sharing
- Tide graph updates are debounced to avoid excessive API calls during map dragging
- Default location: Tokyo Bay area (35.6, 139.8)
