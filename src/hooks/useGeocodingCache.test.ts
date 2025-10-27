import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGeocodingCache } from "./useGeocodingCache";

describe("useGeocodingCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cache interface with get, set, and clear methods", () => {
    const { result } = renderHook(() => useGeocodingCache());

    expect(result.current).toHaveProperty("get");
    expect(result.current).toHaveProperty("set");
    expect(result.current).toHaveProperty("clear");
    expect(typeof result.current.get).toBe("function");
    expect(typeof result.current.set).toBe("function");
    expect(typeof result.current.clear).toBe("function");
  });

  it("should return null for non-existent cache entry", () => {
    const { result } = renderHook(() => useGeocodingCache());

    const cached = result.current.get(35.6, 139.8);
    expect(cached).toBeNull();
  });

  it("should store and retrieve location names", () => {
    const { result } = renderHook(() => useGeocodingCache());

    result.current.set(35.6, 139.8, "Tokyo, Japan");

    const cached = result.current.get(35.6, 139.8);
    expect(cached).toBe("Tokyo, Japan");
  });

  it("should use coordinate precision for cache key", () => {
    const { result } = renderHook(() => useGeocodingCache());

    // Set with specific coordinates
    result.current.set(35.6895, 139.6917, "Shinjuku, Tokyo");

    // Get with slightly different coordinates (within precision)
    const cached1 = result.current.get(35.68951, 139.69171);
    expect(cached1).toBe("Shinjuku, Tokyo");

    // Get with same precision (4 decimal places)
    const cached2 = result.current.get(35.6895, 139.6917);
    expect(cached2).toBe("Shinjuku, Tokyo");
  });

  it("should return null for expired cache entries", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGeocodingCache());

    result.current.set(35.6, 139.8, "Tokyo, Japan");

    // Advance time by 31 minutes (cache TTL is 30 minutes)
    vi.advanceTimersByTime(31 * 60 * 1000);

    const cached = result.current.get(35.6, 139.8);
    expect(cached).toBeNull();

    vi.useRealTimers();
  });

  it("should return cached value within TTL", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGeocodingCache());

    result.current.set(35.6, 139.8, "Tokyo, Japan");

    // Advance time by 29 minutes (within 30 minute TTL)
    vi.advanceTimersByTime(29 * 60 * 1000);

    const cached = result.current.get(35.6, 139.8);
    expect(cached).toBe("Tokyo, Japan");

    vi.useRealTimers();
  });

  it("should implement LRU eviction when cache is full", () => {
    const { result } = renderHook(() => useGeocodingCache());

    // Fill cache to max size (100 entries)
    for (let i = 0; i < 100; i++) {
      result.current.set(i, i, `Location ${i}`);
    }

    // Verify first entry exists
    expect(result.current.get(0, 0)).toBe("Location 0");

    // Add one more entry, should evict the oldest (first) entry
    result.current.set(100, 100, "Location 100");

    // First entry should be evicted
    expect(result.current.get(0, 0)).toBeNull();

    // New entry should exist
    expect(result.current.get(100, 100)).toBe("Location 100");

    // Second entry should still exist
    expect(result.current.get(1, 1)).toBe("Location 1");
  });

  it("should update existing cache entry", () => {
    const { result } = renderHook(() => useGeocodingCache());

    result.current.set(35.6, 139.8, "Tokyo");
    expect(result.current.get(35.6, 139.8)).toBe("Tokyo");

    result.current.set(35.6, 139.8, "Tokyo, Japan");
    expect(result.current.get(35.6, 139.8)).toBe("Tokyo, Japan");
  });

  it("should clear all cache entries", () => {
    const { result } = renderHook(() => useGeocodingCache());

    result.current.set(35.6, 139.8, "Tokyo");
    result.current.set(40.7, -74.0, "New York");
    result.current.set(51.5, -0.1, "London");

    expect(result.current.get(35.6, 139.8)).toBe("Tokyo");
    expect(result.current.get(40.7, -74.0)).toBe("New York");
    expect(result.current.get(51.5, -0.1)).toBe("London");

    result.current.clear();

    expect(result.current.get(35.6, 139.8)).toBeNull();
    expect(result.current.get(40.7, -74.0)).toBeNull();
    expect(result.current.get(51.5, -0.1)).toBeNull();
  });

  it("should maintain separate caches for different hook instances", () => {
    const { result: result1 } = renderHook(() => useGeocodingCache());
    const { result: result2 } = renderHook(() => useGeocodingCache());

    result1.current.set(35.6, 139.8, "Tokyo from cache 1");
    result2.current.set(35.6, 139.8, "Tokyo from cache 2");

    // Each hook instance should have its own cache
    expect(result1.current.get(35.6, 139.8)).toBe("Tokyo from cache 1");
    expect(result2.current.get(35.6, 139.8)).toBe("Tokyo from cache 2");
  });

  it("should handle negative coordinates", () => {
    const { result } = renderHook(() => useGeocodingCache());

    result.current.set(-33.8688, 151.2093, "Sydney, Australia");
    result.current.set(40.7128, -74.006, "New York, USA");

    expect(result.current.get(-33.8688, 151.2093)).toBe("Sydney, Australia");
    expect(result.current.get(40.7128, -74.006)).toBe("New York, USA");
  });

  it("should handle edge case coordinates", () => {
    const { result } = renderHook(() => useGeocodingCache());

    // Test with 0,0 coordinates
    result.current.set(0, 0, "Null Island");
    expect(result.current.get(0, 0)).toBe("Null Island");

    // Test with extreme coordinates
    result.current.set(90, 180, "North Pole");
    expect(result.current.get(90, 180)).toBe("North Pole");

    result.current.set(-90, -180, "South Pole");
    expect(result.current.get(-90, -180)).toBe("South Pole");
  });
});
