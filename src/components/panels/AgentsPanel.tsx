// Agents Panel - Shows federation lobes and their status

import React from "react";
import { useFederationStatus } from "../../hooks/useFederationStatus";
import type { Agent } from "../../types/federation";

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
  mcpPlaceholder: {
    fontSize: "12px",
    opacity: 0.5,
    fontStyle: "italic",
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

export const AgentsPanel = React.memo(() => {
  const { agents, isLoading, refresh } = useFederationStatus({
    pollInterval: 10000,
  });

  return (
    <div style={styles.container} role="navigation" aria-label="Agent List">
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={styles.sectionTitle}>Federation Lobes</div>
        <button
          style={styles.refreshButton}
          onClick={() => refresh()}
          disabled={isLoading}
          title="Refresh status"
        >
          {isLoading ? "..." : "↻"}
        </button>
      </div>

      {agents.map((agent) => (
        <AgentItem key={agent.id} agent={agent} />
      ))}

      <hr style={styles.divider} />

      <div style={styles.sectionTitle}>MCP Servers</div>
      <div style={styles.mcpPlaceholder}>
        Connect MCP servers to extend capabilities...
      </div>
    </div>
  );
});

AgentsPanel.displayName = "AgentsPanel";
