import type { MapPosition } from "../types";

const STORAGE_KEY = "tides-last-position";
const STORAGE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface LastPositionData {
  position: MapPosition;
  locationName: string;
  timestamp: number;
}

/**
 * Save last viewed position and location name to localStorage
 */
export function saveLastPosition(
  position: MapPosition,
  locationName: string,
): void {
  try {
    const data: LastPositionData = {
      position,
      locationName,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Silent fail if localStorage is not available (e.g., in private mode)
    console.warn("Failed to save last position to localStorage:", error);
  }
}

/**
 * Load last viewed position and location name from localStorage
 * Returns null if not found or expired
 */
export function loadLastPosition(): LastPositionData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: LastPositionData = JSON.parse(stored);

    // Check if data is expired
    if (Date.now() - data.timestamp > STORAGE_TTL) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Validate data structure
    if (
      !data.position ||
      typeof data.position.lat !== "number" ||
      typeof data.position.lon !== "number" ||
      typeof data.position.zoom !== "number" ||
      typeof data.locationName !== "string"
    ) {
      return null;
    }

    return data;
  } catch (error) {
    console.warn("Failed to load last position from localStorage:", error);
    return null;
  }
}

/**
 * Clear last position from localStorage
 */
export function clearLastPosition(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear last position from localStorage:", error);
  }
}
