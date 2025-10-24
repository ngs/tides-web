import { useCallback, useEffect, useState, useRef } from "react";

export interface UrlStateOptions<T> {
  defaultValue: T;
  serialize: (value: T) => Record<string, string>;
  deserialize: (params: URLSearchParams) => T;
}

/**
 * Custom hook to sync state with URL query parameters
 * @param options - Configuration options for serialization/deserialization
 * @returns [state, setState] tuple similar to useState
 */
export function useUrlState<T>({
  defaultValue,
  serialize,
  deserialize,
}: UrlStateOptions<T>): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;

    const params = new URLSearchParams(window.location.search);
    try {
      return deserialize(params);
    } catch {
      return defaultValue;
    }
  });

  const isFirstRenderRef = useRef(true);

  // Update URL when state changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip pushState on first render to avoid duplicate history entry
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const serialized = serialize(state);

    // Update or remove each parameter
    Object.entries(serialized).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    // Use pushState to add to browser history, allowing back/forward navigation
    window.history.pushState({}, "", newUrl);
  }, [state, serialize]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      try {
        setState(deserialize(params));
      } catch {
        setState(defaultValue);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [deserialize, defaultValue]);

  const updateState = useCallback((value: T) => {
    setState(value);
  }, []);

  return [state, updateState];
}
