import { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  useMediaQuery,
} from "@mui/material";
import { addDays } from "date-fns";
import { Map } from "./components/Map";
import { TideGraph } from "./components/TideGraph";
import { TideOverlay } from "./components/TideOverlay";
import { useDebounce } from "./hooks/useDebounce";
import { useUrlState } from "./hooks/useUrlState";
import { useGeocodingCache } from "./hooks/useGeocodingCache";
import { fetchTidePredictions } from "./services/tidesApi";
import { loadLastPosition, saveLastPosition } from "./utils/lastPositionStorage";
import type { MapPosition, TidePrediction, TideExtreme } from "./types";

// Default map position (Tokyo Bay area)
const DEFAULT_POSITION: MapPosition = {
  lat: 35.6,
  lon: 139.8,
  zoom: 10,
};

const LOADING_LOCATION_NAME = "Loading...";

// Serialization/deserialization for URL state
const mapPositionUrlOptions = {
  defaultValue: DEFAULT_POSITION,
  serialize: (pos: MapPosition) => ({
    lat: pos.lat.toFixed(6),
    lon: pos.lon.toFixed(6),
    zoom: pos.zoom.toString(),
  }),
  deserialize: (params: URLSearchParams) => {
    const lat = params.get("lat");
    const lon = params.get("lon");
    const zoom = params.get("zoom");

    // If URL has position parameters, use them
    if (lat && lon) {
      return {
        lat: parseFloat(lat) || DEFAULT_POSITION.lat,
        lon: parseFloat(lon) || DEFAULT_POSITION.lon,
        zoom: zoom ? parseInt(zoom, 10) : DEFAULT_POSITION.zoom,
      };
    }

    // Otherwise, try to load from localStorage
    const lastPosition = loadLastPosition();
    if (lastPosition) {
      return lastPosition.position;
    }

    // Finally, fall back to default
    return DEFAULT_POSITION;
  },
};

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = createTheme({
    palette: {
      mode: prefersDarkMode ? "dark" : "light",
    },
  });

  // Prevent overscroll bounce effect on mobile Safari
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventDefaultScroll = (e: TouchEvent) => {
      // Only prevent default on document body level scrolling
      const target = e.target as HTMLElement;
      if (target === document.body || target === document.documentElement) {
        e.preventDefault();
      }
    };

    // Prevent pinch zoom
    document.addEventListener("touchmove", preventDefault, { passive: false });

    // Prevent overscroll at document level
    document.addEventListener("touchstart", preventDefaultScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", preventDefault);
      document.removeEventListener("touchstart", preventDefaultScroll);
    };
  }, []);

  const [mapPosition, setMapPosition] = useUrlState(mapPositionUrlOptions);
  const debouncedPosition = useDebounce(mapPosition, 500);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loadPosition, setLoadPosition] = useState(mapPosition);

  const [predictions, setPredictions] = useState<TidePrediction[]>([]);
  const [highs, setHighs] = useState<TideExtreme[]>([]);
  const [lows, setLows] = useState<TideExtreme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>(() => {
    // Try to load location name from localStorage if no URL params
    const params = new URLSearchParams(window.location.search);
    if (!params.has("lat") && !params.has("lon")) {
      const lastPosition = loadLastPosition();
      if (lastPosition) {
        return lastPosition.locationName;
      }
    }
    return LOADING_LOCATION_NAME;
  });
  const [panelSize, setPanelSize] = useState<number>(400); // Default desktop width or mobile height vh

  const geocodingCache = useGeocodingCache();

  const handlePositionChange = (position: MapPosition, immediate?: boolean) => {
    setMapPosition(position);
    if (immediate) {
      setLocationName(LOADING_LOCATION_NAME);
      setLoadPosition(position);
    }
  };

  // Fetch location name from reverse geocoding
  useEffect(() => {
    let isCancelled = false;

    const fetchLocationName = async () => {
      try {
        // Check cache first
        const cached = geocodingCache.get(
          debouncedPosition.lat,
          debouncedPosition.lon,
        );
        if (cached) {
          setLocationName(cached);
          document.title = `${cached} - Tides`;
          return;
        }

        // Load Google Maps Geocoding library
        const { Geocoder } = (await google.maps.importLibrary(
          "geocoding",
        )) as google.maps.GeocodingLibrary;

        const geocoder = new Geocoder();
        const latlng = {
          lat: debouncedPosition.lat,
          lng: debouncedPosition.lon,
        };

        geocoder.geocode({ location: latlng }, (results, status) => {
          if (isCancelled) {
            return;
          }
          if (status === "OK" && results && results.length > 0) {
            // Find the most detailed result
            // Prioritize results that have locality or sublocality in address_components
            const detailedResult =
              results.find((r) => {
                // Check if address_components contain locality or sublocality
                const hasLocalityInfo = r.address_components.some((c) =>
                  c.types.some((t) =>
                    [
                      "locality",
                      "sublocality",
                      "sublocality_level_1",
                      "sublocality_level_2",
                    ].includes(t),
                  ),
                );
                return hasLocalityInfo;
              }) || results[0];

            const components = detailedResult.address_components;

            const locality = components.find((c) =>
              c.types.includes("locality"),
            )?.long_name;

            // Look for sublocality_level_2 only (exclude level_3)
            const sublocality = components.find((c) =>
              c.types.includes("sublocality_level_2"),
            )?.long_name;

            const admin = components.find((c) =>
              c.types.includes("administrative_area_level_1"),
            )?.long_name;

            const country = components.find((c) =>
              c.types.includes("country"),
            )?.long_name;

            // Format as "Sublocality, Locality" or just "Locality"
            let name: string;
            if (sublocality && locality) {
              name = `${sublocality}, ${locality}`;
            } else {
              name = locality || admin || country || "Unknown Location";
            }

            // Cache the result
            geocodingCache.set(
              debouncedPosition.lat,
              debouncedPosition.lon,
              name,
            );

            setLocationName(name);
            document.title = `${name} - Tides`;
          } else {
            console.error("Geocoder failed:", status);
            setLocationName("Unknown Location");
            document.title = "Tides";
          }
        });
      } catch (err) {
        console.error("Error fetching location name:", err);
        setLocationName("Unknown Location");
        document.title = "Tides";
      }
    };

    fetchLocationName();

    return () => {
      isCancelled = true;
    };
  }, [debouncedPosition.lat, debouncedPosition.lon, geocodingCache]);

  // Save last position and location name to localStorage
  useEffect(() => {
    // Don't save if location name is still loading
    if (locationName === LOADING_LOCATION_NAME) {
      return;
    }

    saveLastPosition(debouncedPosition, locationName);
  }, [debouncedPosition, locationName]);

  // Fetch tide predictions when load position or selected date changes
  useEffect(() => {
    const fetchData = async () => {
      console.log(
        "Fetching tide predictions for:",
        loadPosition,
        "date:",
        selectedDate,
      );
      setLoading(true);
      setError(null);

      try {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = addDays(start, 1);

        const response = await fetchTidePredictions(
          loadPosition.lat,
          loadPosition.lon,
          start,
          end,
          "30m",
          "fes",
        );

        console.info(response);
        console.log("Received predictions:", response.predictions.length);
        console.log("Received highs:", response.extrema?.highs?.length ?? 0);
        console.log("Received lows:", response.extrema?.lows?.length ?? 0);
        setPredictions(response.predictions);
        setHighs(response.extrema?.highs || []);
        setLows(response.extrema?.lows || []);
      } catch (err) {
        console.error("Error fetching tide predictions:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch tide predictions",
        );
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadPosition, selectedDate]);

  // Update load position when debounced position changes (for map drag)
  useEffect(() => {
    setLoadPosition(debouncedPosition);
  }, [debouncedPosition]);

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          overscrollBehavior: "none",
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        {/* Map container */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            // On desktop, use flex to fill remaining space
            // On mobile, set explicit height to make room for bottom drawer
            // Subtract border radius (16px) from mobile map height to show rounded corners
            ...(isMobile
              ? {
                  height: `calc(100% - ${panelSize}vh + 16px)`,
                  flexShrink: 0,
                }
              : {
                  flex: 1,
                  width: `calc(100vw - ${panelSize}px)`,
                  height: "100vh",
                }),
          }}
        >
          <Map position={mapPosition} onPositionChange={handlePositionChange} />
        </Box>

        {/* Tide graph overlay */}
        <TideOverlay onSizeChange={setPanelSize}>
          <TideGraph
            predictions={predictions}
            highs={highs}
            lows={lows}
            loading={loading}
            error={error}
            panelSize={panelSize}
            onDateChange={setSelectedDate}
            position={debouncedPosition}
            locationName={locationName}
          />
        </TideOverlay>
      </Box>
    </ThemeProvider>
  );
}

export default App;
