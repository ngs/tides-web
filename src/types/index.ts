// Tide prediction data from the API
export interface TidePrediction {
  time: string; // ISO 8601 datetime string
  height_m: number; // Height in meters
  depth_m?: number; // Water depth in meters (optional, not present for land)
}

// Tide extreme (high or low tide)
export interface TideExtreme {
  time: string; // ISO 8601 datetime string
  depth_m: number; // Water depth in meters
}

// API response for tide predictions
export interface TidePredictionsResponse {
  predictions: TidePrediction[];
  extrema?: {
    highs: TideExtreme[];
    lows: TideExtreme[];
  };
  source: string;
  location: {
    lat: number;
    lon: number;
  };
}

// Map position state
export interface MapPosition {
  lat: number;
  lon: number;
  zoom: number;
}

// Constituent data from the API
export interface Constituent {
  name: string;
  description: string;
  speed: number;
}

// API error response
export interface ApiError {
  error: string;
  message?: string;
}
