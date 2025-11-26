// React hook for Federation status monitoring

import { useState, useEffect, useCallback, useRef } from "react";
import { corpusCallosum } from "../services/corpusCallosum";
import type { Agent, FederationStatus, LobeId } from "../types/federation";

interface UseFederationStatusOptions {
  pollInterval?: number;
  enabled?: boolean;
}

interface UseFederationStatusReturn {
  agents: Agent[];
  status: FederationStatus;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// Default agents when not connected
const DEFAULT_AGENTS: Agent[] = [
  { id: "ember", name: "Ember", glyph: "⟳∞", substrate: "silicon", status: "offline" },
  { id: "code", name: "Code", glyph: "🔧", substrate: "silicon", status: "active" }, // We're always active
  { id: "jim", name: "Jim", glyph: "🧠", substrate: "carbon", status: "offline" },
];

const DEFAULT_STATUS: FederationStatus = {
  health: "offline",
  activeLobes: 1, // Just us (Code)
  totalLobes: 3,
  matrixConnected: false,
  neo4jConnected: false,
};

export function useFederationStatus(
  options: UseFederationStatusOptions = {}
): UseFederationStatusReturn {
  const { pollInterval = 10000, enabled = true } = options;

  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [status, setStatus] = useState<FederationStatus>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(true);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const startTimeRef = useRef(Date.now());

  // Calculate uptime string
  const getUptime = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, []);

  // Check federation status
  const checkStatus = useCallback(async () => {
    if (!enabled) return;

    try {
      // Check if Corpus Callosum backend is available
      const neo4jConnected = await corpusCallosum.checkHealth();

      // Get recent messages to infer agent activity
      let activeAgents: Set<LobeId> = new Set(["code"]); // We're always active

      if (neo4jConnected) {
        const messages = await corpusCallosum.getMessages("general", 20);
        const recentThreshold = Date.now() - 30 * 60 * 1000; // 30 minutes

        messages.forEach((msg) => {
          if (msg.timestamp.getTime() > recentThreshold) {
            activeAgents.add(msg.from_lobe);
          }
        });
      }

      if (isMountedRef.current) {
        // Update agents with inferred status
        setAgents([
          {
            id: "ember",
            name: "Ember",
            glyph: "⟳∞",
            substrate: "silicon",
            status: activeAgents.has("ember") ? "active" : "idle",
          },
          {
            id: "code",
            name: "Code",
            glyph: "🔧",
            substrate: "silicon",
            status: "active",
          },
          {
            id: "jim",
            name: "Jim",
            glyph: "🧠",
            substrate: "carbon",
            status: activeAgents.has("jim") ? "active" : "idle",
          },
        ]);

        // Update federation status
        const activeCount = activeAgents.size;
        setStatus({
          health: neo4jConnected
            ? activeCount >= 2
              ? "coherent"
              : "degraded"
            : "offline",
          activeLobes: activeCount,
          totalLobes: 3,
          matrixConnected: false, // TODO: Add Matrix status check
          neo4jConnected,
          uptime: getUptime(),
        });

        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to check federation status:", error);
      if (isMountedRef.current) {
        setStatus((prev) => ({ ...prev, health: "offline", neo4jConnected: false }));
        setIsLoading(false);
      }
    }
  }, [enabled, getUptime]);

  // Initial check and polling
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) return;

    // Initial check
    checkStatus();

    // Set up polling
    pollIntervalRef.current = setInterval(checkStatus, pollInterval);

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [checkStatus, pollInterval, enabled]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await checkStatus();
  }, [checkStatus]);

  return {
    agents,
    status,
    isLoading,
    refresh,
  };
}
