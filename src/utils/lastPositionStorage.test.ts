import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveLastPosition,
  loadLastPosition,
  clearLastPosition,
} from "./lastPositionStorage";
import type { MapPosition } from "../types";

describe("lastPositionStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("saveLastPosition", () => {
    it("should save position and location name to localStorage", () => {
      const position: MapPosition = { lat: 35.6, lon: 139.8, zoom: 10 };
      const locationName = "Tokyo, Japan";

      saveLastPosition(position, locationName);

      const stored = localStorage.getItem("tides-last-position");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.position).toEqual(position);
      expect(parsed.locationName).toBe(locationName);
      expect(parsed.timestamp).toBeTypeOf("number");
    });

    it("should overwrite existing data", () => {
      const position1: MapPosition = { lat: 35.6, lon: 139.8, zoom: 10 };
      const position2: MapPosition = { lat: 40.7, lon: -74.0, zoom: 12 };

      saveLastPosition(position1, "Tokyo");
      saveLastPosition(position2, "New York");

      const stored = localStorage.getItem("tides-last-position");
      const parsed = JSON.parse(stored!);

      expect(parsed.position).toEqual(position2);
      expect(parsed.locationName).toBe("New York");
    });

    it("should handle localStorage errors gracefully", () => {
      const position: MapPosition = { lat: 35.6, lon: 139.8, zoom: 10 };
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("localStorage is full");
      });

      // Should not throw
      expect(() => saveLastPosition(position, "Tokyo")).not.toThrow();
    });
  });

  describe("loadLastPosition", () => {
    it("should load saved position and location name", () => {
      const position: MapPosition = { lat: 35.6, lon: 139.8, zoom: 10 };
      const locationName = "Tokyo, Japan";

      saveLastPosition(position, locationName);
      const loaded = loadLastPosition();

      expect(loaded).toBeTruthy();
      expect(loaded!.position).toEqual(position);
      expect(loaded!.locationName).toBe(locationName);
      expect(loaded!.timestamp).toBeTypeOf("number");
    });

    it("should return null if no data is stored", () => {
      const loaded = loadLastPosition();
      expect(loaded).toBeNull();
    });

    it("should return null if data is expired", () => {
      const position: MapPosition = { lat: 35.6, lon: 139.8, zoom: 10 };
      const locationName = "Tokyo, Japan";

      // Save with timestamp 31 days ago
      const expiredTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;
      const expiredData = {
        position,
        locationName,
        timestamp: expiredTimestamp,
      };
      localStorage.setItem("tides-last-position", JSON.stringify(expiredData));

      const loaded = loadLastPosition();
      expect(loaded).toBeNull();

      // Should also remove expired data
      expect(localStorage.getItem("tides-last-position")).toBeNull();
    });

    it("should return data if within TTL", () => {
      const position: MapPosition = { lat: 35.6, lon: 139.8, zoom: 10 };
      const locationName = "Tokyo, Japan";

      // Save with timestamp 29 days ago (within 30 days TTL)
      const validTimestamp = Date.now() - 29 * 24 * 60 * 60 * 1000;
      const validData = {
        position,
        locationName,
        timestamp: validTimestamp,
      };
      localStorage.setItem("tides-last-position", JSON.stringify(validData));

      const loaded = loadLastPosition();
      expect(loaded).toBeTruthy();
      expect(loaded!.position).toEqual(position);
    });

    it("should return null for invalid data structure", () => {
      // Missing position
      localStorage.setItem(
        "tides-last-position",
        JSON.stringify({
          locationName: "Tokyo",
          timestamp: Date.now(),
        }),
      );
      expect(loadLastPosition()).toBeNull();

      // Invalid position type
      localStorage.setItem(
        "tides-last-position",
        JSON.stringify({
          position: "invalid",
          locationName: "Tokyo",
          timestamp: Date.now(),
        }),
      );
      expect(loadLastPosition()).toBeNull();

      // Missing lat/lon
      localStorage.setItem(
        "tides-last-position",
        JSON.stringify({
          position: { zoom: 10 },
          locationName: "Tokyo",
          timestamp: Date.now(),
        }),
      );
      expect(loadLastPosition()).toBeNull();
    });

    it("should handle JSON parse errors", () => {
      localStorage.setItem("tides-last-position", "invalid json");

      const loaded = loadLastPosition();
      expect(loaded).toBeNull();
    });

    it("should handle localStorage errors gracefully", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("localStorage error");
      });

      // Should not throw
      const loaded = loadLastPosition();
      expect(loaded).toBeNull();
    });
  });

  describe("clearLastPosition", () => {
    it("should remove data from localStorage", () => {
      const position: MapPosition = { lat: 35.6, lon: 139.8, zoom: 10 };
      saveLastPosition(position, "Tokyo");

      expect(localStorage.getItem("tides-last-position")).toBeTruthy();

      clearLastPosition();

      expect(localStorage.getItem("tides-last-position")).toBeNull();
    });

    it("should handle errors gracefully", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("localStorage error");
      });

      // Should not throw
      expect(() => clearLastPosition()).not.toThrow();
    });
  });
});
