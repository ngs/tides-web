import { useRef, useCallback, useMemo } from "react";

interface GeocodeCache {
  locationName: string;
  timestamp: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100;
const COORDINATE_PRECISION = 4; // ~11m precision

export function useGeocodingCache() {
  const cacheRef = useRef<Map<string, GeocodeCache>>(new Map());

  const getCacheKey = useCallback((lat: number, lon: number): string => {
    return `${lat.toFixed(COORDINATE_PRECISION)},${lon.toFixed(COORDINATE_PRECISION)}`;
  }, []);

  const get = useCallback(
    (lat: number, lon: number): string | null => {
      const key = getCacheKey(lat, lon);
      const cached = cacheRef.current.get(key);

      if (!cached) return null;

      // Check if cache is expired
      if (Date.now() - cached.timestamp > CACHE_TTL) {
        cacheRef.current.delete(key);
        return null;
      }

      return cached.locationName;
    },
    [getCacheKey],
  );

  const set = useCallback(
    (lat: number, lon: number, locationName: string): void => {
      const key = getCacheKey(lat, lon);

      // Implement simple LRU: if cache is full, remove oldest entry
      if (cacheRef.current.size >= MAX_CACHE_SIZE) {
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey) {
          cacheRef.current.delete(firstKey);
        }
      }

      cacheRef.current.set(key, {
        locationName,
        timestamp: Date.now(),
      });
    },
    [getCacheKey],
  );

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return useMemo(() => ({ get, set, clear }), [get, set, clear]);
}
