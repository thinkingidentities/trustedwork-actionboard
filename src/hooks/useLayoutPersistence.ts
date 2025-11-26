// React hook for Dockview layout persistence
// Handles React StrictMode double-mounting gracefully

import { useCallback, useRef } from "react";
import type { DockviewApi, SerializedDockview } from "dockview";

const STORAGE_KEY = "trustedwork-actionboard-layout";
const DEBOUNCE_MS = 1000;

interface UseLayoutPersistenceReturn {
  saveLayout: (api: DockviewApi) => void;
  loadLayout: () => SerializedDockview | null;
  clearLayout: () => void;
  setupAutoSave: (api: DockviewApi) => () => void;
}

export function useLayoutPersistence(): UseLayoutPersistenceReturn {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disposableRef = useRef<{ dispose: () => void } | null>(null);

  // Save layout to localStorage (debounced)
  const saveLayout = useCallback((api: DockviewApi) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const layout = api.toJSON();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
        console.log("Layout saved");
      } catch (error) {
        console.error("Failed to save layout:", error);
      }
    }, DEBOUNCE_MS);
  }, []);

  // Load layout from localStorage
  const loadLayout = useCallback((): SerializedDockview | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const layout = JSON.parse(saved) as SerializedDockview;
        // Validate basic structure
        if (layout && layout.grid && layout.panels) {
          return layout;
        }
      }
    } catch (error) {
      console.error("Failed to load layout:", error);
    }
    return null;
  }, []);

  // Clear saved layout
  const clearLayout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Layout cleared");
  }, []);

  // Set up auto-save on layout changes
  const setupAutoSave = useCallback(
    (api: DockviewApi): (() => void) => {
      // Clean up any previous listener
      if (disposableRef.current) {
        disposableRef.current.dispose();
      }

      // Set up new listener
      const disposable = api.onDidLayoutChange(() => {
        saveLayout(api);
      });

      disposableRef.current = disposable;

      // Return cleanup function
      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        disposable.dispose();
        disposableRef.current = null;
      };
    },
    [saveLayout]
  );

  return {
    saveLayout,
    loadLayout,
    clearLayout,
    setupAutoSave,
  };
}
