import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchTidePredictions,
  fetchConstituents,
  checkHealth,
  TidesApiError,
} from "./tidesApi";

describe("tidesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("TidesApiError", () => {
    it("should create error with message and status code", () => {
      const error = new TidesApiError("Test error", 404);

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe("TidesApiError");
    });

    it("should create error without status code", () => {
      const error = new TidesApiError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBeUndefined();
    });
  });

  describe("fetchTidePredictions", () => {
    it("should fetch tide predictions successfully", async () => {
      const mockResponse = {
        predictions: [
          { time: "2025-01-01T00:00:00Z", height: 1.5 },
          { time: "2025-01-01T01:00:00Z", height: 1.8 },
        ],
        extrema: {
          highs: [{ time: "2025-01-01T06:00:00Z", height: 2.1 }],
          lows: [{ time: "2025-01-01T12:00:00Z", height: 0.5 }],
        },
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const start = new Date("2025-01-01T00:00:00Z");
      const end = new Date("2025-01-02T00:00:00Z");

      const result = await fetchTidePredictions(35.6, 139.8, start, end);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/tides/predictions"),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("lat=35.6"),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("lon=139.8"),
      );
    });

    it("should use custom interval and source parameters", async () => {
      const mockResponse = {
        predictions: [],
        extrema: { highs: [], lows: [] },
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const start = new Date("2025-01-01T00:00:00Z");
      const end = new Date("2025-01-02T00:00:00Z");

      await fetchTidePredictions(35.6, 139.8, start, end, "30m", "tpxo");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("interval=30m"),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("source=tpxo"),
      );
    });

    it("should throw TidesApiError on HTTP error", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Not found",
      });

      const start = new Date("2025-01-01T00:00:00Z");
      const end = new Date("2025-01-02T00:00:00Z");

      await expect(
        fetchTidePredictions(35.6, 139.8, start, end),
      ).rejects.toThrow(TidesApiError);

      await expect(
        fetchTidePredictions(35.6, 139.8, start, end),
      ).rejects.toThrow("Failed to fetch tide predictions");
    });

    it("should include status code in error", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal server error",
      });

      const start = new Date("2025-01-01T00:00:00Z");
      const end = new Date("2025-01-02T00:00:00Z");

      try {
        await fetchTidePredictions(35.6, 139.8, start, end);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TidesApiError);
        expect((error as TidesApiError).statusCode).toBe(500);
      }
    });

    it("should handle network errors", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network failure"),
      );

      const start = new Date("2025-01-01T00:00:00Z");
      const end = new Date("2025-01-02T00:00:00Z");

      await expect(
        fetchTidePredictions(35.6, 139.8, start, end),
      ).rejects.toThrow(TidesApiError);

      await expect(
        fetchTidePredictions(35.6, 139.8, start, end),
      ).rejects.toThrow("Network error while fetching tide predictions");
    });

    it("should format dates as ISO strings", async () => {
      const mockResponse = {
        predictions: [],
        extrema: { highs: [], lows: [] },
      };

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const start = new Date("2025-01-01T00:00:00.000Z");
      const end = new Date("2025-01-02T00:00:00.000Z");

      await fetchTidePredictions(35.6, 139.8, start, end);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("start=2025-01-01T00%3A00%3A00.000Z"),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("end=2025-01-02T00%3A00%3A00.000Z"),
      );
    });
  });

  describe("fetchConstituents", () => {
    it("should fetch constituents successfully", async () => {
      const mockConstituents = [
        { name: "M2", description: "Principal lunar semidiurnal" },
        { name: "S2", description: "Principal solar semidiurnal" },
      ];

      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => mockConstituents,
      });

      const result = await fetchConstituents();

      expect(result).toEqual(mockConstituents);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/constituents"),
      );
    });

    it("should throw TidesApiError on HTTP error", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => "Service unavailable",
      });

      await expect(fetchConstituents()).rejects.toThrow(TidesApiError);
      await expect(fetchConstituents()).rejects.toThrow(
        "Failed to fetch constituents",
      );
    });

    it("should handle network errors", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Connection timeout"),
      );

      await expect(fetchConstituents()).rejects.toThrow(TidesApiError);
      await expect(fetchConstituents()).rejects.toThrow(
        "Network error while fetching constituents",
      );
    });
  });

  describe("checkHealth", () => {
    it("should return true when API is healthy", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
      });

      const result = await checkHealth();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/healthz"),
      );
    });

    it("should return false when API returns error", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await checkHealth();

      expect(result).toBe(false);
    });

    it("should return false on network error", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Network error"),
      );

      const result = await checkHealth();

      expect(result).toBe(false);
    });

    it("should not throw errors", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Catastrophic failure"),
      );

      await expect(checkHealth()).resolves.toBe(false);
    });
  });
});
