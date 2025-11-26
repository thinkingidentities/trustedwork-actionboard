// React hook for MCP server status monitoring

import { useState, useEffect, useCallback, useRef } from "react";
import { mcpStatusService } from "../services/mcpStatusService";
import type { MCPServer } from "../types/mcp";

interface UseMCPStatusOptions {
  pollInterval?: number;
  autoRefresh?: boolean;
}

interface UseMCPStatusReturn {
  servers: MCPServer[];
  isLoading: boolean;
  stats: { connected: number; total: number; healthy: boolean };
  refresh: () => Promise<void>;
  checkServer: (id: string) => Promise<void>;
}

export function useMCPStatus(
  options: UseMCPStatusOptions = {}
): UseMCPStatusReturn {
  const { pollInterval = 30000, autoRefresh = true } = options;

  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Subscribe to status updates
  useEffect(() => {
    isMountedRef.current = true;

    const unsubscribe = mcpStatusService.subscribe((updatedServers) => {
      if (isMountedRef.current) {
        setServers(updatedServers);
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  // Refresh all server statuses
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await mcpStatusService.checkAllServers();
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Check a specific server
  const checkServer = useCallback(async (id: string) => {
    await mcpStatusService.checkServer(id);
  }, []);

  // Initial check and polling
  useEffect(() => {
    // Initial check
    refresh();

    // Set up polling if enabled
    if (autoRefresh && pollInterval > 0) {
      pollIntervalRef.current = setInterval(refresh, pollInterval);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [refresh, pollInterval, autoRefresh]);

  // Get stats
  const stats = mcpStatusService.getStats();

  return {
    servers,
    isLoading,
    stats,
    refresh,
    checkServer,
  };
}
