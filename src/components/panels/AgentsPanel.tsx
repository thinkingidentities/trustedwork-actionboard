// Agents Panel - Shows federation lobes, MCP servers, and their status

import React from "react";
import { useFederationStatus } from "../../hooks/useFederationStatus";
import { useMCPStatus } from "../../hooks/useMCPStatus";
import type { Agent } from "../../types/federation";
import type { MCPServer, MCPServerStatus } from "../../types/mcp";

const styles = {
  container: {
    padding: "12px",
    height: "100%",
    background: "#16213e",
    color: "#e0e0e0",
    overflow: "auto",
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: 12,
    fontSize: "13px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    opacity: 0.7,
  },
  agentItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    marginBottom: 6,
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  glyph: {
    fontSize: "20px",
    marginRight: 10,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontWeight: 600,
    fontSize: "14px",
  },
  agentMeta: {
    fontSize: "11px",
    opacity: 0.6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  divider: {
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    margin: "16px 0",
  },
  mcpItem: {
    display: "flex",
    alignItems: "center",
    padding: "8px 10px",
    marginBottom: 4,
    borderRadius: 6,
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    fontSize: "12px",
  },
  mcpIcon: {
    marginRight: 8,
    fontSize: "14px",
  },
  mcpInfo: {
    flex: 1,
    minWidth: 0,
  },
  mcpName: {
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  mcpEndpoint: {
    fontSize: "10px",
    opacity: 0.5,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  mcpStatusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    marginLeft: 8,
  },
  mcpStats: {
    fontSize: "11px",
    opacity: 0.6,
    marginTop: 8,
    padding: "6px 8px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: 4,
  },
  refreshButton: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 4,
    padding: "4px 8px",
    color: "#a0a0c0",
    cursor: "pointer",
    fontSize: "11px",
    marginLeft: "auto",
  },
};

function getStatusColor(status: Agent["status"]): string {
  switch (status) {
    case "active":
      return "#00ff88";
    case "idle":
      return "#fbbf24";
    case "offline":
      return "#6b7280";
    default:
      return "#6b7280";
  }
}

function getStatusBackground(status: Agent["status"]): string {
  switch (status) {
    case "active":
      return "rgba(0, 255, 136, 0.1)";
    case "idle":
      return "rgba(251, 191, 36, 0.1)";
    case "offline":
      return "rgba(255, 255, 255, 0.05)";
    default:
      return "rgba(255, 255, 255, 0.05)";
  }
}

function getStatusBorder(status: Agent["status"]): string {
  switch (status) {
    case "active":
      return "1px solid rgba(0, 255, 136, 0.3)";
    case "idle":
      return "1px solid rgba(251, 191, 36, 0.3)";
    case "offline":
      return "1px solid rgba(255, 255, 255, 0.1)";
    default:
      return "1px solid rgba(255, 255, 255, 0.1)";
  }
}

interface AgentItemProps {
  agent: Agent;
}

const AgentItem = React.memo(({ agent }: AgentItemProps) => (
  <div
    style={{
      ...styles.agentItem,
      background: getStatusBackground(agent.status),
      border: getStatusBorder(agent.status),
    }}
    role="button"
    aria-label={`Agent: ${agent.name} (${agent.status})`}
    tabIndex={0}
  >
    <span style={styles.glyph}>{agent.glyph}</span>
    <div style={styles.agentInfo}>
      <div style={styles.agentName}>{agent.name}</div>
      <div style={styles.agentMeta}>
        {agent.substrate} • {agent.status}
      </div>
    </div>
    <div
      style={{
        ...styles.statusDot,
        background: getStatusColor(agent.status),
      }}
    />
  </div>
));
AgentItem.displayName = "AgentItem";

// MCP Server status helpers
function getMCPStatusColor(status: MCPServerStatus): string {
  switch (status) {
    case "connected":
      return "#00ff88";
    case "connecting":
      return "#fbbf24";
    case "disconnected":
      return "#6b7280";
    case "error":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function getMCPIcon(id: string): string {
  const icons: Record<string, string> = {
    "hippocamp-console": "🧠",
    "fireworks-ws": "✨",
    "neo4j-ep1": "🔷",
    "neo4j-nessie": "🔶",
    "matrix-synapse": "💬",
  };
  return icons[id] || "⚡";
}

interface MCPServerItemProps {
  server: MCPServer;
  onCheck?: () => void;
}

const MCPServerItem = React.memo(({ server, onCheck }: MCPServerItemProps) => (
  <div
    style={styles.mcpItem}
    role="button"
    tabIndex={0}
    onClick={onCheck}
    title={server.description}
  >
    <span style={styles.mcpIcon}>{getMCPIcon(server.id)}</span>
    <div style={styles.mcpInfo}>
      <div style={styles.mcpName}>{server.name}</div>
      <div style={styles.mcpEndpoint}>{server.endpoint}</div>
    </div>
    <div
      style={{
        ...styles.mcpStatusDot,
        background: getMCPStatusColor(server.status),
      }}
      title={server.status}
    />
  </div>
));
MCPServerItem.displayName = "MCPServerItem";

export const AgentsPanel = React.memo(() => {
  const { agents, isLoading: agentsLoading, refresh: refreshAgents } = useFederationStatus({
    pollInterval: 10000,
  });

  const { servers, isLoading: mcpLoading, stats, refresh: refreshMCP, checkServer } = useMCPStatus({
    pollInterval: 30000,
  });

  const isLoading = agentsLoading || mcpLoading;

  const handleRefresh = () => {
    refreshAgents();
    refreshMCP();
  };

  return (
    <div style={styles.container} role="navigation" aria-label="Agent List">
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={styles.sectionTitle}>Federation Lobes</div>
        <button
          style={styles.refreshButton}
          onClick={handleRefresh}
          disabled={isLoading}
          title="Refresh all status"
        >
          {isLoading ? "..." : "↻"}
        </button>
      </div>

      {agents.map((agent) => (
        <AgentItem key={agent.id} agent={agent} />
      ))}

      <hr style={styles.divider} />

      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={styles.sectionTitle}>MCP Servers</div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "10px",
            opacity: 0.6,
            color: stats.healthy ? "#00ff88" : "#fbbf24",
          }}
        >
          {stats.connected}/{stats.total}
        </span>
      </div>

      {servers.map((server) => (
        <MCPServerItem
          key={server.id}
          server={server}
          onCheck={() => checkServer(server.id)}
        />
      ))}

      {stats.connected > 0 && (
        <div style={styles.mcpStats}>
          {stats.healthy ? "✓ Services healthy" : "⚠ Some services offline"}
        </div>
      )}
    </div>
  );
});

AgentsPanel.displayName = "AgentsPanel";
