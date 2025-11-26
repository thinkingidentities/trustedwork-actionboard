// Hippocamp Panel - Memory search and browsing interface

import React, { useState, useCallback, useEffect } from "react";
import { useHippocamp } from "../../hooks/useHippocamp";
import type { HippocampMemory, HippocampCategory } from "../../types/mcp";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    background: "#1a1a2e",
    color: "#e0e0e0",
  },
  searchBar: {
    padding: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  searchInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    background: "rgba(0,0,0,0.3)",
    color: "#e0e0e0",
    fontSize: "13px",
    outline: "none",
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: "12px",
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    opacity: 0.7,
  },
  resultItem: {
    padding: "10px 12px",
    marginBottom: 6,
    borderRadius: 6,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  resultTitle: {
    fontWeight: 500,
    fontSize: "13px",
    marginBottom: 4,
    color: "#7dd3fc",
  },
  resultSnippet: {
    fontSize: "12px",
    opacity: 0.7,
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
  },
  resultMeta: {
    fontSize: "10px",
    opacity: 0.5,
    marginTop: 6,
    display: "flex",
    gap: 8,
  },
  categoryChip: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 12,
    background: "rgba(125, 211, 252, 0.15)",
    color: "#7dd3fc",
    fontSize: "11px",
    marginRight: 6,
    marginBottom: 6,
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "32px 16px",
    opacity: 0.5,
    fontSize: "13px",
  },
  statusBar: {
    padding: "8px 12px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    fontSize: "11px",
    opacity: 0.6,
    display: "flex",
    justifyContent: "space-between",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  tab: {
    padding: "8px 16px",
    fontSize: "12px",
    background: "transparent",
    border: "none",
    color: "#a0a0c0",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  tabActive: {
    color: "#7dd3fc",
    borderBottomColor: "#7dd3fc",
  },
  memoryDetail: {
    padding: "16px",
  },
  backButton: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 4,
    padding: "4px 8px",
    color: "#a0a0c0",
    cursor: "pointer",
    fontSize: "11px",
    marginBottom: 12,
  },
  memoryContent: {
    fontSize: "13px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
  },
};

type ViewMode = "search" | "categories" | "detail";

interface MemoryItemProps {
  memory: HippocampMemory;
  onClick: () => void;
}

const MemoryItem = React.memo(({ memory, onClick }: MemoryItemProps) => (
  <div
    style={styles.resultItem}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onClick()}
  >
    <div style={styles.resultTitle}>
      {memory.title || `Memory ${memory.id.slice(0, 8)}...`}
    </div>
    <div style={styles.resultSnippet}>
      {memory.content.slice(0, 150)}
      {memory.content.length > 150 ? "..." : ""}
    </div>
    <div style={styles.resultMeta}>
      {memory.category && <span>📁 {memory.category}</span>}
      {memory.timestamp && (
        <span>🕐 {memory.timestamp.toLocaleDateString()}</span>
      )}
      {memory.score !== undefined && (
        <span>⚡ {(memory.score * 100).toFixed(0)}%</span>
      )}
    </div>
  </div>
));
MemoryItem.displayName = "MemoryItem";

interface CategoryChipProps {
  category: HippocampCategory;
  onClick: () => void;
}

const CategoryChip = React.memo(({ category, onClick }: CategoryChipProps) => (
  <span
    style={styles.categoryChip}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onClick()}
  >
    {category.name} ({category.count})
  </span>
));
CategoryChip.displayName = "CategoryChip";

export const HippocampPanel = React.memo(() => {
  const [viewMode, setViewMode] = useState<ViewMode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    searchResults,
    isSearching,
    search,
    clearSearch,
    categories,
    isCategoriesLoading,
    loadCategories,
    categoryMemories,
    isBrowsing,
    browseCategory,
    selectedMemory,
    isMemoryLoading,
    loadMemory,
    clearSelection,
    isConnected,
    checkConnection,
  } = useHippocamp();

  // Check connection on mount
  useEffect(() => {
    checkConnection();
    loadCategories();
  }, [checkConnection, loadCategories]);

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search(searchQuery);
      setViewMode("search");
    }
  }, [searchQuery, search]);

  // Handle category click
  const handleCategoryClick = useCallback((category: string) => {
    setSelectedCategory(category);
    browseCategory(category);
    setViewMode("search");
  }, [browseCategory]);

  // Handle memory click
  const handleMemoryClick = useCallback((id: string) => {
    loadMemory(id);
    setViewMode("detail");
  }, [loadMemory]);

  // Handle back from detail
  const handleBack = useCallback(() => {
    clearSelection();
    setViewMode("search");
  }, [clearSelection]);

  // Handle clear search
  const handleClear = useCallback(() => {
    setSearchQuery("");
    clearSearch();
    setSelectedCategory(null);
  }, [clearSearch]);

  // Render memory detail view
  if (viewMode === "detail" && selectedMemory) {
    return (
      <div style={styles.container}>
        <div style={styles.memoryDetail}>
          <button style={styles.backButton} onClick={handleBack}>
            ← Back to results
          </button>
          <div style={styles.resultTitle}>
            {selectedMemory.title || `Memory ${selectedMemory.id}`}
          </div>
          {selectedMemory.category && (
            <div style={{ marginBottom: 12 }}>
              <span style={styles.categoryChip}>{selectedMemory.category}</span>
            </div>
          )}
          <div style={styles.memoryContent}>{selectedMemory.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Search bar */}
      <div style={styles.searchBar}>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search memories... (Enter to search)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(viewMode === "search" ? styles.tabActive : {}),
          }}
          onClick={() => setViewMode("search")}
        >
          🔍 Search
        </button>
        <button
          style={{
            ...styles.tab,
            ...(viewMode === "categories" ? styles.tabActive : {}),
          }}
          onClick={() => setViewMode("categories")}
        >
          📁 Categories
        </button>
        {searchQuery && (
          <button
            style={{ ...styles.tab, marginLeft: "auto", opacity: 0.6 }}
            onClick={handleClear}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {viewMode === "categories" ? (
          // Categories view
          <>
            <div style={styles.sectionTitle}>
              Memory Categories ({categories.length})
            </div>
            {isCategoriesLoading ? (
              <div style={styles.emptyState}>Loading categories...</div>
            ) : categories.length === 0 ? (
              <div style={styles.emptyState}>
                {isConnected
                  ? "No categories found"
                  : "Connect to Hippocamp to browse memories"}
              </div>
            ) : (
              <div>
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat.name}
                    category={cat}
                    onClick={() => handleCategoryClick(cat.name)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          // Search/Results view
          <>
            {selectedCategory && (
              <div style={{ marginBottom: 12 }}>
                <span style={styles.sectionTitle}>Category: </span>
                <span style={styles.categoryChip}>{selectedCategory}</span>
              </div>
            )}

            {isSearching || isBrowsing ? (
              <div style={styles.emptyState}>Searching...</div>
            ) : searchResults && searchResults.memories.length > 0 ? (
              <>
                <div style={styles.sectionTitle}>
                  Results ({searchResults.total})
                </div>
                {searchResults.memories.map((memory) => (
                  <MemoryItem
                    key={memory.id}
                    memory={memory}
                    onClick={() => handleMemoryClick(memory.id)}
                  />
                ))}
              </>
            ) : selectedCategory && categoryMemories.length > 0 ? (
              <>
                <div style={styles.sectionTitle}>
                  Memories ({categoryMemories.length})
                </div>
                {categoryMemories.map((memory) => (
                  <MemoryItem
                    key={memory.id}
                    memory={memory}
                    onClick={() => handleMemoryClick(memory.id)}
                  />
                ))}
              </>
            ) : searchQuery ? (
              <div style={styles.emptyState}>
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div style={styles.emptyState}>
                <div style={{ marginBottom: 8 }}>🧠</div>
                <div>Search across 560+ conversation memories</div>
                <div style={{ fontSize: "11px", marginTop: 8, opacity: 0.6 }}>
                  Try searching for topics, keywords, or browse categories
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status bar */}
      <div style={styles.statusBar}>
        <span>
          {isConnected ? "● Connected to Hippocamp" : "○ Disconnected"}
        </span>
        {isMemoryLoading && <span>Loading...</span>}
      </div>
    </div>
  );
});

HippocampPanel.displayName = "HippocampPanel";
