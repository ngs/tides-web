import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import App from "./App";

// Mock Google Maps
vi.mock("@googlemaps/js-api-loader", () => ({
  setOptions: vi.fn(),
  importLibrary: vi.fn(() => Promise.resolve({})),
}));

// Mock the tides API to avoid network calls
vi.mock("./services/tidesApi", () => ({
  fetchTidePredictions: vi.fn(() =>
    Promise.resolve({
      predictions: [
        { time: "2025-01-01T00:00:00Z", height_m: 1.5, depth_m: 10.5 },
        { time: "2025-01-01T01:00:00Z", height_m: 1.8, depth_m: 10.8 },
      ],
      extrema: {
        highs: [{ time: "2025-01-01T06:00:00Z", depth_m: 12.0 }],
        lows: [{ time: "2025-01-01T12:00:00Z", depth_m: 8.0 }],
      },
      source: "fes",
      location: { lat: 35.6, lon: 139.8 },
    }),
  ),
  fetchConstituents: vi.fn(() => Promise.resolve([])),
  checkHealth: vi.fn(() => Promise.resolve(true)),
}));

// Mock the Map component to avoid Google Maps initialization
vi.mock("./components/Map", () => ({
  Map: () => <div data-testid="map-mock">Map Component</div>,
}));

// Mock the TideGraph component
vi.mock("./components/TideGraph", () => ({
  TideGraph: () => <div data-testid="tide-graph-mock">Tide Graph</div>,
}));

// Mock the TideOverlay component
vi.mock("./components/TideOverlay", () => ({
  TideOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tide-overlay-mock">{children}</div>
  ),
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should render without crashing", async () => {
    const { container } = render(<App />);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  it("should render Map component", async () => {
    const { getByTestId } = render(<App />);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(getByTestId("map-mock")).toBeInTheDocument();
    });
  });

  it("should render TideGraph component", async () => {
    const { getByTestId } = render(<App />);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(getByTestId("tide-graph-mock")).toBeInTheDocument();
    });
  });

  it("should render TideOverlay component", async () => {
    const { getByTestId } = render(<App />);

    // Wait for async operations to complete
    await waitFor(() => {
      expect(getByTestId("tide-overlay-mock")).toBeInTheDocument();
    });
  });
});
