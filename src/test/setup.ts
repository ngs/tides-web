import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Google Maps Geocoder class
class MockGeocoder {
  geocode(
    request: unknown,
    callback: (results: unknown[], status: string) => void,
  ) {
    // Simulate successful geocoding
    callback(
      [
        {
          address_components: [
            { long_name: "Tokyo", types: ["locality"] },
            { long_name: "Tokyo", types: ["administrative_area_level_1"] },
            { long_name: "Japan", types: ["country"] },
          ],
        },
      ],
      "OK",
    );
  }
}

// Mock Google Maps
global.google = {
  maps: {
    importLibrary: vi.fn((library: string) => {
      if (library === "geocoding") {
        return Promise.resolve({
          Geocoder: MockGeocoder,
        });
      }
      return Promise.resolve({});
    }),
    Map: vi.fn(),
    Marker: vi.fn(),
    LatLng: vi.fn(),
    LatLngBounds: vi.fn(),
  },
} as typeof globalThis.google;
