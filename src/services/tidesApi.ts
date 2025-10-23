import type { TidePredictionsResponse, Constituent } from '../types';

const API_BASE_URL = import.meta.env.VITE_TIDES_API_URL || 'https://api.tides.ngs.io';

export class TidesApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'TidesApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Fetch tide predictions for a specific location and time range
 */
export async function fetchTidePredictions(
  lat: number,
  lon: number,
  start: Date,
  end: Date,
  interval: string = '30m',
  source: string = 'fes',
): Promise<TidePredictionsResponse> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    start: start.toISOString(),
    end: end.toISOString(),
    interval,
    source,
  });

  const url = `${API_BASE_URL}/v1/tides/predictions?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new TidesApiError(
        `Failed to fetch tide predictions: ${errorText}`,
        response.status,
      );
    }

    const data = await response.json();
    return data as TidePredictionsResponse;
  } catch (error) {
    if (error instanceof TidesApiError) {
      throw error;
    }
    throw new TidesApiError(
      `Network error while fetching tide predictions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Fetch available tidal constituents
 */
export async function fetchConstituents(): Promise<Constituent[]> {
  const url = `${API_BASE_URL}/v1/constituents`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new TidesApiError(
        `Failed to fetch constituents: ${errorText}`,
        response.status,
      );
    }

    const data = await response.json();
    return data as Constituent[];
  } catch (error) {
    if (error instanceof TidesApiError) {
      throw error;
    }
    throw new TidesApiError(
      `Network error while fetching constituents: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Check API health status
 */
export async function checkHealth(): Promise<boolean> {
  const url = `${API_BASE_URL}/healthz`;

  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}
