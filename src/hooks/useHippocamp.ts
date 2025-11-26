// React hook for Hippocamp memory search

import { useState, useCallback, useRef } from "react";
import { hippocampService } from "../services/hippocampService";
import type { HippocampMemory, HippocampCategory, HippocampSearchResult } from "../types/mcp";

interface UseHippocampReturn {
  // Search
  searchResults: HippocampSearchResult | null;
  isSearching: boolean;
  search: (query: string, options?: { limit?: number; category?: string }) => Promise<void>;
  clearSearch: () => void;

  // Categories
  categories: HippocampCategory[];
  isCategoriesLoading: boolean;
  loadCategories: () => Promise<void>;

  // Browse by category
  categoryMemories: HippocampMemory[];
  isBrowsing: boolean;
  browseCategory: (category: string, limit?: number) => Promise<void>;

  // Single memory
  selectedMemory: HippocampMemory | null;
  isMemoryLoading: boolean;
  loadMemory: (id: string) => Promise<void>;
  clearSelection: () => void;

  // Connection status
  isConnected: boolean;
  checkConnection: () => Promise<boolean>;
}

export function useHippocamp(): UseHippocampReturn {
  // Search state
  const [searchResults, setSearchResults] = useState<HippocampSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<HippocampCategory[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  // Browse state
  const [categoryMemories, setCategoryMemories] = useState<HippocampMemory[]>([]);
  const [isBrowsing, setIsBrowsing] = useState(false);

  // Selected memory state
  const [selectedMemory, setSelectedMemory] = useState<HippocampMemory | null>(null);
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);

  // Abort controller for canceling searches
  const abortControllerRef = useRef<AbortController | null>(null);

  // Search memories
  const search = useCallback(async (
    query: string,
    options: { limit?: number; category?: string } = {}
  ) => {
    // Cancel any pending search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await hippocampService.searchMemories(query, options);
      setSearchResults(results);
      setIsConnected(true);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults({ memories: [], total: 0, query });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchResults(null);
  }, []);

  // Load categories
  const loadCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const cats = await hippocampService.getCategories();
      setCategories(cats);
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  // Browse by category
  const browseCategory = useCallback(async (category: string, limit: number = 50) => {
    setIsBrowsing(true);
    try {
      const memories = await hippocampService.getByCategory(category, limit);
      setCategoryMemories(memories);
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to browse category:", error);
      setCategoryMemories([]);
    } finally {
      setIsBrowsing(false);
    }
  }, []);

  // Load a single memory
  const loadMemory = useCallback(async (id: string) => {
    setIsMemoryLoading(true);
    try {
      const memory = await hippocampService.getConversation(id);
      setSelectedMemory(memory);
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to load memory:", error);
      setSelectedMemory(null);
    } finally {
      setIsMemoryLoading(false);
    }
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedMemory(null);
  }, []);

  // Check connection
  const checkConnection = useCallback(async () => {
    const connected = await hippocampService.checkHealth();
    setIsConnected(connected);
    return connected;
  }, []);

  return {
    // Search
    searchResults,
    isSearching,
    search,
    clearSearch,

    // Categories
    categories,
    isCategoriesLoading,
    loadCategories,

    // Browse
    categoryMemories,
    isBrowsing,
    browseCategory,

    // Memory
    selectedMemory,
    isMemoryLoading,
    loadMemory,
    clearSelection,

    // Connection
    isConnected,
    checkConnection,
  };
}
