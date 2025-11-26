// Hippocamp Service - Connects to the Hippocamp Console REST API
// Provides memory search and category browsing

import type {
  HippocampMemory,
  HippocampCategory,
  HippocampSearchResult,
  CCStats,
} from "../types/mcp";

const DEFAULT_API_URL = "http://localhost:3001";

export class HippocampService {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the Hippocamp console server is running
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Search memories across all categories
   */
  async searchMemories(
    query: string,
    options: { limit?: number; category?: string } = {}
  ): Promise<HippocampSearchResult> {
    const { limit = 20, category } = options;

    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });

      if (category) {
        params.append("category", category);
      }

      const response = await fetch(`${this.baseUrl}/api/search?${params}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      // Map response to our types
      const memories: HippocampMemory[] = (data.results || data || []).map(
        (item: Record<string, unknown>) => ({
          id: item.id as string || item._id as string || String(Math.random()),
          title: item.title as string,
          content: item.content as string || item.text as string || "",
          category: item.category as string,
          timestamp: item.timestamp ? new Date(item.timestamp as string) : undefined,
          tags: item.tags as string[],
          score: item.score as number,
        })
      );

      return {
        memories,
        total: data.total || memories.length,
        query,
      };
    } catch (error) {
      console.error("Hippocamp search failed:", error);
      return { memories: [], total: 0, query };
    }
  }

  /**
   * Get all available memory categories
   */
  async getCategories(): Promise<HippocampCategory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/categories`);

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      if (Array.isArray(data)) {
        return data.map((cat: Record<string, unknown>) => ({
          name: cat.name as string || cat.category as string || "Unknown",
          count: cat.count as number || 0,
          children: cat.children as HippocampCategory[],
        }));
      }

      // If it's an object with categories property
      if (data.categories) {
        return data.categories;
      }

      return [];
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return [];
    }
  }

  /**
   * Get memories by category
   */
  async getByCategory(
    category: string,
    limit: number = 50
  ): Promise<HippocampMemory[]> {
    try {
      const params = new URLSearchParams({
        category,
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/api/memories?${params}`);

      if (!response.ok) {
        // Try alternative endpoint
        const altResponse = await fetch(
          `${this.baseUrl}/api/search?category=${category}&limit=${limit}`
        );
        if (!altResponse.ok) {
          throw new Error(`Failed to fetch by category: ${response.status}`);
        }
        const altData = await altResponse.json();
        return altData.results || altData || [];
      }

      const data = await response.json();
      return data.memories || data.results || data || [];
    } catch (error) {
      console.error("Failed to fetch by category:", error);
      return [];
    }
  }

  /**
   * Get a specific conversation/memory by ID
   */
  async getConversation(id: string): Promise<HippocampMemory | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id || id,
        title: data.title,
        content: data.content || data.text || "",
        category: data.category,
        timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
        tags: data.tags,
      };
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
      return null;
    }
  }

  /**
   * Get Corpus Callosum statistics
   */
  async getCCStats(): Promise<CCStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/corpus-callosum/stats`);

      if (!response.ok) {
        throw new Error(`Failed to fetch CC stats: ${response.status}`);
      }

      const data = await response.json();
      return {
        totalMessages: data.totalMessages || data.total || 0,
        unreadCount: data.unreadCount || data.unread || 0,
        activeChannels: data.activeChannels || data.channels || ["general"],
        activeSessions: data.activeSessions || data.sessions || 0,
      };
    } catch (error) {
      console.error("Failed to fetch CC stats:", error);
      return null;
    }
  }

  /**
   * Get available Corpus Callosum channels
   */
  async getCCChannels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/corpus-callosum/channels`);

      if (!response.ok) {
        return ["general"]; // Default channel
      }

      const data = await response.json();
      return data.channels || data || ["general"];
    } catch {
      return ["general"];
    }
  }
}

// Singleton instance
export const hippocampService = new HippocampService();
