// MCP Status Service - Monitors connectivity to all MCP backend services

import type { MCPServer, MCPServerStatus, MCP_SERVERS } from "../types/mcp";

interface HealthCheckResult {
  id: string;
  status: MCPServerStatus;
  latency?: number;
  error?: string;
}

// Health check endpoints for each service type
const HEALTH_CHECKS: Record<string, (endpoint: string) => Promise<HealthCheckResult>> = {
  // HTTP REST APIs
  "hippocamp-console": async (endpoint) => {
    const start = Date.now();
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return {
        id: "hippocamp-console",
        status: response.ok ? "connected" : "error",
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        id: "hippocamp-console",
        status: "disconnected",
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  // WebSocket servers
  "fireworks-ws": async (endpoint) => {
    // Convert ws:// to http:// for health check
    const httpEndpoint = endpoint.replace("ws://", "http://").replace("wss://", "https://");
    const start = Date.now();
    try {
      const response = await fetch(`${httpEndpoint}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return {
        id: "fireworks-ws",
        status: response.ok ? "connected" : "error",
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        id: "fireworks-ws",
        status: "disconnected",
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  // Matrix Synapse
  "matrix-synapse": async (endpoint) => {
    const start = Date.now();
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return {
        id: "matrix-synapse",
        status: response.ok ? "connected" : "error",
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        id: "matrix-synapse",
        status: "disconnected",
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },

  // Neo4j instances (can't directly check from browser due to Bolt protocol)
  // We check via the Hippocamp API which uses these databases
  "neo4j-ep1": async () => {
    // Check via Hippocamp's corpus-callosum endpoint which uses ep1-memory
    try {
      const response = await fetch("http://localhost:3001/api/corpus-callosum/stats", {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return {
        id: "neo4j-ep1",
        status: response.ok ? "connected" : "error",
      };
    } catch {
      return {
        id: "neo4j-ep1",
        status: "disconnected",
        error: "Cannot reach via Hippocamp API",
      };
    }
  },

  "neo4j-nessie": async () => {
    // Check via Hippocamp's search endpoint which uses nessie_neo4j
    try {
      const response = await fetch("http://localhost:3001/api/categories", {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return {
        id: "neo4j-nessie",
        status: response.ok ? "connected" : "error",
      };
    } catch {
      return {
        id: "neo4j-nessie",
        status: "disconnected",
        error: "Cannot reach via Hippocamp API",
      };
    }
  },
};

export class MCPStatusService {
  private servers: Map<string, MCPServer> = new Map();
  private listeners: Set<(servers: MCPServer[]) => void> = new Set();

  constructor(serverConfigs: typeof MCP_SERVERS) {
    // Initialize servers with disconnected status
    serverConfigs.forEach((config) => {
      this.servers.set(config.id, {
        ...config,
        status: "disconnected",
      });
    });
  }

  /**
   * Subscribe to server status updates
   */
  subscribe(listener: (servers: MCPServer[]) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getServers());
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  /**
   * Get all servers with their current status
   */
  getServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get a specific server by ID
   */
  getServer(id: string): MCPServer | undefined {
    return this.servers.get(id);
  }

  /**
   * Check health of a specific server
   */
  async checkServer(id: string): Promise<MCPServer | undefined> {
    const server = this.servers.get(id);
    if (!server) return undefined;

    const healthCheck = HEALTH_CHECKS[id];
    if (!healthCheck) {
      // No health check available, mark as unknown
      return server;
    }

    // Update to connecting status
    this.updateServer(id, { status: "connecting" });

    const result = await healthCheck(server.endpoint);

    this.updateServer(id, {
      status: result.status,
      lastChecked: new Date(),
      error: result.error,
    });

    return this.servers.get(id);
  }

  /**
   * Check health of all servers
   */
  async checkAllServers(): Promise<MCPServer[]> {
    const checks = Array.from(this.servers.keys()).map((id) =>
      this.checkServer(id)
    );

    await Promise.all(checks);
    return this.getServers();
  }

  /**
   * Update a server's status
   */
  private updateServer(id: string, updates: Partial<MCPServer>): void {
    const server = this.servers.get(id);
    if (server) {
      this.servers.set(id, { ...server, ...updates });
      this.notifyListeners();
    }
  }

  /**
   * Notify all listeners of status changes
   */
  private notifyListeners(): void {
    const servers = this.getServers();
    this.listeners.forEach((listener) => listener(servers));
  }

  /**
   * Get summary statistics
   */
  getStats(): { connected: number; total: number; healthy: boolean } {
    const servers = this.getServers();
    const connected = servers.filter((s) => s.status === "connected").length;
    return {
      connected,
      total: servers.length,
      healthy: connected >= 2, // At least Hippocamp + one other
    };
  }
}

// Import the server configs
import { MCP_SERVERS as serverConfigs } from "../types/mcp";

// Singleton instance
export const mcpStatusService = new MCPStatusService(serverConfigs);
