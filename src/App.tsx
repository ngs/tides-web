import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, useMediaQuery } from '@mui/material';
import { addDays } from 'date-fns';
import { Map } from './components/Map';
import { TideGraph } from './components/TideGraph';
import { TideOverlay } from './components/TideOverlay';
import { useDebounce } from './hooks/useDebounce';
import { useUrlState } from './hooks/useUrlState';
import { fetchTidePredictions } from './services/tidesApi';
import type { MapPosition, TidePrediction } from './types';

// Default map position (Tokyo Bay area)
const DEFAULT_POSITION: MapPosition = {
  lat: 35.6,
  lon: 139.8,
  zoom: 10,
};

// Serialization/deserialization for URL state
const mapPositionUrlOptions = {
  defaultValue: DEFAULT_POSITION,
  serialize: (pos: MapPosition) => ({
    lat: pos.lat.toFixed(6),
    lon: pos.lon.toFixed(6),
    zoom: pos.zoom.toString(),
  }),
  deserialize: (params: URLSearchParams) => {
    const lat = params.get('lat');
    const lon = params.get('lon');
    const zoom = params.get('zoom');

    if (!lat || !lon) return DEFAULT_POSITION;

    return {
      lat: parseFloat(lat) || DEFAULT_POSITION.lat,
      lon: parseFloat(lon) || DEFAULT_POSITION.lon,
      zoom: zoom ? parseInt(zoom, 10) : DEFAULT_POSITION.zoom,
    };
  },
};

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
    },
  });

  const [mapPosition, setMapPosition] = useUrlState(mapPositionUrlOptions);
  const debouncedPosition = useDebounce(mapPosition, 500);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [predictions, setPredictions] = useState<TidePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tide predictions when debounced position or selected date changes
  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching tide predictions for:', debouncedPosition, 'date:', selectedDate);
      setLoading(true);
      setError(null);

      try {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = addDays(start, 1);

        const response = await fetchTidePredictions(
          debouncedPosition.lat,
          debouncedPosition.lon,
          start,
          end,
          '30m',
          'fes',
        );

        console.log('Received predictions:', response.predictions.length);
        setPredictions(response.predictions);
      } catch (err) {
        console.error('Error fetching tide predictions:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch tide predictions',
        );
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedPosition, selectedDate]);

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Map container */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            width: '100%',
            // On desktop, reduce width to make room for sidebar
            ...(isMobile
              ? { height: '60vh' }
              : { width: 'calc(100vw - 400px)', height: '100vh' }),
          }}
        >
          <Map position={mapPosition} onPositionChange={setMapPosition} />
        </Box>

        {/* Tide graph overlay */}
        <TideOverlay>
          <TideGraph
            predictions={predictions}
            loading={loading}
            error={error}
            onDateChange={setSelectedDate}
          />
        </TideOverlay>
      </Box>
    </ThemeProvider>
  );
}

export default App;
