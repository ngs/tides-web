import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useUrlState } from "./useUrlState";

describe("useUrlState", () => {
  beforeEach(() => {
    // Reset window.location and history
    window.history.pushState({}, "", "/");
    vi.clearAllMocks();
  });

  it("should initialize with default value when URL has no params", () => {
    const options = {
      defaultValue: { count: 0 },
      serialize: (val: { count: number }) => ({ count: val.count.toString() }),
      deserialize: (params: URLSearchParams) => {
        const count = params.get("count");
        return count ? { count: parseInt(count) } : { count: 0 };
      },
    };

    const { result } = renderHook(() => useUrlState(options));

    expect(result.current[0]).toEqual({ count: 0 });
  });

  it("should initialize with value from URL params", () => {
    window.history.pushState({}, "", "/?count=42");

    const options = {
      defaultValue: { count: 0 },
      serialize: (val: { count: number }) => ({ count: val.count.toString() }),
      deserialize: (params: URLSearchParams) => {
        const count = params.get("count");
        return count ? { count: parseInt(count) } : { count: 0 };
      },
    };

    const { result } = renderHook(() => useUrlState(options));

    expect(result.current[0]).toEqual({ count: 42 });
  });

  it("should update URL when state changes", async () => {
    const options = {
      defaultValue: { count: 0 },
      serialize: (val: { count: number }) => ({ count: val.count.toString() }),
      deserialize: (params: URLSearchParams) => {
        const count = params.get("count");
        return count ? { count: parseInt(count) } : { count: 0 };
      },
    };

    const { result } = renderHook(() => useUrlState(options));

    act(() => {
      result.current[1]({ count: 10 });
    });

    await waitFor(() => {
      expect(window.location.search).toBe("?count=10");
    });
  });

  it("should not push state on first render", () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    const options = {
      defaultValue: { count: 0 },
      serialize: (val: { count: number }) => ({ count: val.count.toString() }),
      deserialize: (params: URLSearchParams) => {
        const count = params.get("count");
        return count ? { count: parseInt(count) } : { count: 0 };
      },
    };

    renderHook(() => useUrlState(options));

    // Should not call pushState on first render
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it("should handle browser back/forward navigation", async () => {
    const options = {
      defaultValue: { count: 0 },
      serialize: (val: { count: number }) => ({ count: val.count.toString() }),
      deserialize: (params: URLSearchParams) => {
        const count = params.get("count");
        return count ? { count: parseInt(count) } : { count: 0 };
      },
    };

    const { result } = renderHook(() => useUrlState(options));

    // Update state multiple times
    act(() => {
      result.current[1]({ count: 1 });
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual({ count: 1 });
    });

    act(() => {
      result.current[1]({ count: 2 });
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual({ count: 2 });
    });

    // Simulate browser back button
    window.history.pushState({}, "", "/?count=1");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual({ count: 1 });
    });
  });

  it("should handle deserialize errors gracefully", () => {
    window.history.pushState({}, "", "/?count=invalid");

    const options = {
      defaultValue: { count: 0 },
      serialize: (val: { count: number }) => ({ count: val.count.toString() }),
      deserialize: (params: URLSearchParams) => {
        const count = params.get("count");
        if (!count || isNaN(parseInt(count))) {
          throw new Error("Invalid count");
        }
        return { count: parseInt(count) };
      },
    };

    const { result } = renderHook(() => useUrlState(options));

    // Should fall back to default value on error
    expect(result.current[0]).toEqual({ count: 0 });
  });

  it("should handle complex state objects", async () => {
    const options = {
      defaultValue: { lat: 35.6, lon: 139.8, zoom: 10 },
      serialize: (val: { lat: number; lon: number; zoom: number }) => ({
        lat: val.lat.toFixed(6),
        lon: val.lon.toFixed(6),
        zoom: val.zoom.toString(),
      }),
      deserialize: (params: URLSearchParams) => {
        const lat = params.get("lat");
        const lon = params.get("lon");
        const zoom = params.get("zoom");

        if (!lat || !lon) {
          return { lat: 35.6, lon: 139.8, zoom: 10 };
        }

        return {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          zoom: zoom ? parseInt(zoom) : 10,
        };
      },
    };

    const { result } = renderHook(() => useUrlState(options));

    act(() => {
      result.current[1]({ lat: 40.7128, lon: -74.006, zoom: 12 });
    });

    await waitFor(() => {
      expect(result.current[0]).toEqual({
        lat: 40.7128,
        lon: -74.006,
        zoom: 12,
      });
      expect(window.location.search).toContain("lat=40.712800");
      expect(window.location.search).toContain("lon=-74.006000");
      expect(window.location.search).toContain("zoom=12");
    });
  });

  it("should remove empty parameters from URL", async () => {
    const options = {
      defaultValue: { name: "", age: 0 },
      serialize: (val: { name: string; age: number }) => ({
        name: val.name || "",
        age: val.age ? val.age.toString() : "",
      }),
      deserialize: (params: URLSearchParams) => ({
        name: params.get("name") || "",
        age: params.get("age") ? parseInt(params.get("age")!) : 0,
      }),
    };

    const { result } = renderHook(() => useUrlState(options));

    // Set values with empty name
    act(() => {
      result.current[1]({ name: "", age: 25 });
    });

    await waitFor(() => {
      // Only age parameter should be in URL (empty name is removed)
      expect(window.location.search).toBe("?age=25");
    });
  });

  it("should cleanup popstate listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const options = {
      defaultValue: { count: 0 },
      serialize: (val: { count: number }) => ({ count: val.count.toString() }),
      deserialize: (params: URLSearchParams) => {
        const count = params.get("count");
        return count ? { count: parseInt(count) } : { count: 0 };
      },
    };

    const { unmount } = renderHook(() => useUrlState(options));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "popstate",
      expect.any(Function),
    );
  });
});
