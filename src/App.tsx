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
import type { MapPosition, TidePrediction } from "./types";

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
    const lat = params.get("lat");
    const lon = params.get("lon");
    const zoom = params.get("zoom");

    if (!lat || !lon) return DEFAULT_POSITION;

    return {
      lat: parseFloat(lat) || DEFAULT_POSITION.lat,
      lon: parseFloat(lon) || DEFAULT_POSITION.lon,
      zoom: zoom ? parseInt(zoom, 10) : DEFAULT_POSITION.zoom,
    };
  },
};

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = createTheme({
    palette: {
      mode: prefersDarkMode ? "dark" : "light",
    },
  });

  const [mapPosition, setMapPosition] = useUrlState(mapPositionUrlOptions);
  const debouncedPosition = useDebounce(mapPosition, 500);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [predictions, setPredictions] = useState<TidePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("Loading...");
  const [panelSize, setPanelSize] = useState<number>(400); // Default desktop width or mobile height vh

  const geocodingCache = useGeocodingCache();

  // Fetch location name from reverse geocoding
  useEffect(() => {
    let isCancelled = false;

    const fetchLocationName = async () => {
      try {
        // Check cache first
        const cached = geocodingCache.get(
          debouncedPosition.lat,
          debouncedPosition.lon
        );
        if (cached) {
          setLocationName(cached);
          document.title = `${cached} - Tides`;
          return;
        }

        // Load Google Maps Geocoding library
        const { Geocoder } = (await google.maps.importLibrary(
          "geocoding"
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
            const detailedResult = results.find((r) => {
              // Check if address_components contain locality or sublocality
              const hasLocalityInfo = r.address_components.some((c) =>
                c.types.some((t) =>
                  ["locality", "sublocality", "sublocality_level_1", "sublocality_level_2"].includes(t)
                )
              );
              return hasLocalityInfo;
            }) || results[0];

            const components = detailedResult.address_components;

            const locality = components.find((c) =>
              c.types.includes("locality")
            )?.long_name;

            // Look for sublocality_level_2 only (exclude level_3)
            const sublocality = components.find((c) =>
              c.types.includes("sublocality_level_2")
            )?.long_name;

            const admin = components.find((c) =>
              c.types.includes("administrative_area_level_1")
            )?.long_name;

            const country = components.find((c) =>
              c.types.includes("country")
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
              name
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

  // Fetch tide predictions when debounced position or selected date changes
  useEffect(() => {
    const fetchData = async () => {
      console.log(
        "Fetching tide predictions for:",
        debouncedPosition,
        "date:",
        selectedDate
      );
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
          "30m",
          "fes"
        );

        console.log("Received predictions:", response.predictions.length);
        setPredictions(response.predictions);
      } catch (err) {
        console.error("Error fetching tide predictions:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch tide predictions"
        );
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedPosition, selectedDate]);

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
        }}
      >
        {/* Map container */}
        <Box
          sx={{
            flex: 1,
            position: "relative",
            width: "100%",
            // On desktop, reduce width to make room for sidebar
            // On mobile, reduce height to make room for bottom drawer
            ...(isMobile
              ? { height: `${100 - panelSize}vh` }
              : { width: `calc(100vw - ${panelSize}px)`, height: "100vh" }),
          }}
        >
          <Map position={mapPosition} onPositionChange={setMapPosition} />
        </Box>

        {/* Tide graph overlay */}
        <TideOverlay onSizeChange={setPanelSize}>
          <TideGraph
            predictions={predictions}
            loading={loading}
            error={error}
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
