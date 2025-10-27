import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("should debounce value changes", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      },
    );

    expect(result.current).toBe("initial");

    // Update value
    rerender({ value: "updated", delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe("initial");

    // Advance timers and flush promises
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should update to new value
    expect(result.current).toBe("updated");
  });

  it("should cancel previous timeout on rapid value changes", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      },
    );

    // Update value multiple times without waiting for debounce
    rerender({ value: "first", delay: 500 });
    vi.advanceTimersByTime(200);

    rerender({ value: "second", delay: 500 });
    vi.advanceTimersByTime(200);

    rerender({ value: "third", delay: 500 });

    // Should still be initial value (no timeout has completed)
    expect(result.current).toBe("initial");

    // Advance enough time for the last timeout to complete
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should update to the last value only
    expect(result.current).toBe("third");
  });

  it("should work with different data types", async () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 0 } },
    );

    numberRerender({ value: 42 });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(numberResult.current).toBe(42);

    // Test with object
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: { lat: 0, lon: 0 } } },
    );

    objectRerender({ value: { lat: 35.6, lon: 139.8 } });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(objectResult.current).toEqual({ lat: 35.6, lon: 139.8 });

    // Test with array
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: [] } },
    );

    arrayRerender({ value: [1, 2, 3] });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(arrayResult.current).toEqual([1, 2, 3]);
  });

  it("should update delay dynamically", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      },
    );

    // Change value with 500ms delay
    rerender({ value: "first", delay: 500 });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe("first");

    // Change value with 1000ms delay
    rerender({ value: "second", delay: 1000 });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("first");

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe("second");
  });

  it("should handle zero delay", async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 0 },
      },
    );

    rerender({ value: "updated", delay: 0 });
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe("updated");
  });

  it("should cleanup timeout on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    const { unmount } = renderHook(() => useDebounce("value", 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
