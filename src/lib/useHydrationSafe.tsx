/**
 * Hydration-Safe Utilities
 * 
 * Prevents hydration mismatches and iPhone Safari crashes by safely handling
 * client-side only APIs like localStorage and window.
 * 
 * @module useHydrationSafe
 */

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

// ============================================================================
// useMounted Hook
// ============================================================================

/**
 * Hook to detect if component is mounted on client-side
 * Returns false during SSR, true after client-side mount
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

// ============================================================================
// useLocalStorage Hook
// ============================================================================

/**
 * Safely use localStorage with SSR compatibility
 * Returns [value, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    syncTabs?: boolean;
  } = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { syncTabs = false } = options;

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!syncTabs || typeof window === "undefined") {
        return () => {};
      }

      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === key) {
          callback();
        }
      };

      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    },
    [key, syncTabs]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return JSON.stringify(initialValue);
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ?? JSON.stringify(initialValue);
    } catch {
      return JSON.stringify(initialValue);
    }
  }, [key, initialValue]);

  const getServerSnapshot = useCallback(() => {
    return JSON.stringify(initialValue);
  }, [initialValue]);

  const storedValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const [value, setValueState] = useState<T>(() => {
    try {
      return JSON.parse(storedValue) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const parsed = JSON.parse(storedValue) as T;
      setValueState(parsed);
    } catch {
      setValueState(initialValue);
    }
  }, [storedValue, initialValue]);

  const setValue = useCallback(
    (valueOrUpdater: T | ((prev: T) => T)) => {
      if (typeof window === "undefined") {
        console.warn(`[useLocalStorage] Cannot set value for key "${key}" during SSR`);
        return;
      }

      try {
        setValueState((prev) => {
          const nextValue =
            valueOrUpdater instanceof Function
              ? valueOrUpdater(prev)
              : valueOrUpdater;

          try {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          } catch (error) {
            console.warn(`[useLocalStorage] Error setting key "${key}":`, error);
          }

          return nextValue;
        });
      } catch (error) {
        console.warn(`[useLocalStorage] Error setting key "${key}":`, error);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    if (typeof window === "undefined") {
      console.warn(`[useLocalStorage] Cannot remove key "${key}" during SSR`);
      return;
    }

    try {
      window.localStorage.removeItem(key);
      setValueState(initialValue);
    } catch (error) {
      console.warn(`[useLocalStorage] Error removing key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [value, setValue, removeValue];
}

// ============================================================================
// useWindowSize Hook
// ============================================================================

/**
 * Safely get window size with SSR compatibility
 * Returns { width, height } object
 */
export function useWindowSize(
  options: {
    debounceMs?: number;
    initialWidth?: number;
    initialHeight?: number;
  } = {}
): { width: number; height: number } {
  const {
    debounceMs = 100,
    initialWidth = 1024,
    initialHeight = 768,
  } = options;

  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [debounceMs]);

  return size;
}

// ============================================================================
// useMediaQuery Hook
// ============================================================================

/**
 * Safely use CSS media queries with SSR compatibility
 * Returns boolean indicating if media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia(query);
    setMatches(media.matches);

    let timeoutId: NodeJS.Timeout;

    const listener = (event: MediaQueryListEvent) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setMatches(event.matches);
      }, 50);
    };

    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => {
        clearTimeout(timeoutId);
        media.removeEventListener("change", listener);
      };
    }
    
    media.addListener(listener);
    return () => {
      clearTimeout(timeoutId);
      media.removeListener(listener);
    };
  }, [query]);

  return matches;
}

// ============================================================================
// ClientOnly Component
// ============================================================================

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps): React.ReactNode {
  const mounted = useMounted();
  return mounted ? children : fallback;
}

// ============================================================================
// SafeLocalStorage Component
// ============================================================================

interface SafeLocalStorageProps<T> {
  storageKey: string;
  defaultValue: T;
  render: (value: T) => React.ReactNode;
}

export function SafeLocalStorage<T>({
  storageKey,
  defaultValue,
  render,
}: SafeLocalStorageProps<T>): React.ReactElement | null {
  const [value] = useLocalStorage(storageKey, defaultValue);
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  return <>{render(value)}</>;
}

// ============================================================================
// Export all utilities
// ============================================================================

export default {
  useMounted,
  useLocalStorage,
  useWindowSize,
  useMediaQuery,
  ClientOnly,
  SafeLocalStorage,
};
