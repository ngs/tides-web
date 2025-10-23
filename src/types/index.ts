// Tide prediction data from the API
export interface TidePrediction {
  time: string; // ISO 8601 datetime string
  height_m: number; // Height in meters
}

// API response for tide predictions
export interface TidePredictionsResponse {
  predictions: TidePrediction[];
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
