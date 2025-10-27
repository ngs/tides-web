# Tides Web

An interactive web application for viewing tide predictions on a map. Drag the map to any coastal location and see detailed tide graphs with sunrise/sunset information.

![Tides Web Screenshot](https://via.placeholder.com/800x400?text=Tides+Web+Application)

## Features

- **Interactive Map**: Google Maps integration with smooth drag and zoom
- **Real-time Tide Predictions**: Fetches tide data from the Tides API based on your selected location
- **Responsive Design**:
  - Mobile: Tide graph in bottom overlay
  - Desktop: Tide graph in right sidebar
- **Sunrise/Sunset Markers**: Visual indicators for astronomical events on the tide graph
- **URL State Management**: Share locations via URL (lat, lon, zoom parameters)
- **Debounced Updates**: Optimized API calls during map interaction

## Tech Stack

- **React 19** with TypeScript
- **Vite** - Fast build tool
- **Google Maps JavaScript API** - Interactive mapping
- **Recharts** - Tide graph visualization
- **Material-UI (MUI)** - UI components
- **date-fns** - Date formatting and manipulation
- **SunCalc** - Sunrise/sunset calculations
- **ESLint + Prettier** - Code quality and formatting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Maps API key ([Get one here](https://developers.google.com/maps/documentation/javascript/get-api-key))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ngs/tides-web.git
   cd tides-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   VITE_TIDES_API_URL=https://api.tides.ngs.io
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format-check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
tides-web/
├── src/
│   ├── components/
│   │   ├── Map.tsx              # Google Maps component
│   │   ├── TideGraph.tsx        # Recharts tide graph with sunrise/sunset
│   │   └── TideOverlay.tsx      # Responsive overlay container
│   ├── hooks/
│   │   ├── useDebounce.ts       # Debounce hook for map interactions
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
│       └── deploy.yml           # GitHub Actions CI/CD
├── public/                      # Static assets
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## API Integration

This application uses the [Tides API](https://api.tides.ngs.io/) to fetch tide predictions:

- **Endpoint**: `GET /v1/tides/predictions`
- **Parameters**:
  - `lat` - Latitude
  - `lon` - Longitude
  - `start` - Start date (ISO 8601)
  - `end` - End date (ISO 8601)
  - `interval` - Data interval (30m)
  - `source` - Prediction model (fes)

## Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the `master` branch via GitHub Actions.

### Manual Deployment

```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

## Configuration

### Vite Configuration

The `vite.config.ts` is configured for GitHub Pages deployment with the base path set to the repository name.

### Environment Variables

- `VITE_GOOGLE_MAPS_API_KEY` - Your Google Maps API key (required)
- `VITE_TIDES_API_URL` - Tides API base URL (default: https://api.tides.ngs.io)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

**Atsushi Nagase**

## Acknowledgments

- [Tides API](https://api.tides.ngs.io/) for providing tide prediction data
- [Google Maps Platform](https://developers.google.com/maps) for mapping services
- [Recharts](https://recharts.org/) for charting library
