// Federation Panel - Shows coherence status and active sessions

import React from "react";
import { useFederationStatus } from "../../hooks/useFederationStatus";
import type { FederationStatus } from "../../types/federation";

const styles = {
  container: {
    padding: "12px",
    height: "100%",
    background: "#1a1a2e",
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
  healthCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  healthRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  healthLabel: {
    fontSize: "13px",
  },
  healthValue: {
    fontWeight: 600,
  },
  sessionList: {
    margin: 0,
    fontSize: "13px",
  },
  sessionItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  sessionLabel: {
    opacity: 0.7,
  },
  sessionValue: {
    color: "#7dd3fc",
  },
  divider: {
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    margin: "16px 0",
  },
  lobeIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 500,
    marginRight: 8,
    marginBottom: 8,
  },
  lobesContainer: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
  },
};

function getHealthColor(health: FederationStatus["health"]): string {
  switch (health) {
    case "coherent":
      return "#00ff88";
    case "degraded":
      return "#fbbf24";
    case "offline":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function getHealthBackground(health: FederationStatus["health"]): string {
  switch (health) {
    case "coherent":
      return "rgba(0, 255, 136, 0.1)";
    case "degraded":
      return "rgba(251, 191, 36, 0.1)";
    case "offline":
      return "rgba(239, 68, 68, 0.1)";
    default:
      return "rgba(255, 255, 255, 0.05)";
  }
}

function getHealthBorder(health: FederationStatus["health"]): string {
  switch (health) {
    case "coherent":
      return "1px solid rgba(0, 255, 136, 0.3)";
    case "degraded":
      return "1px solid rgba(251, 191, 36, 0.3)";
    case "offline":
      return "1px solid rgba(239, 68, 68, 0.3)";
    default:
      return "1px solid rgba(255, 255, 255, 0.1)";
  }
}

export const FederationPanel = React.memo(() => {
  const { status, isLoading } = useFederationStatus({
    pollInterval: 10000,
  });

  return (
    <div style={styles.container} role="complementary" aria-label="Federation Status">
      <div style={styles.sectionTitle}>Coherence Status</div>

      <div
        style={{
          ...styles.healthCard,
          background: getHealthBackground(status.health),
          border: getHealthBorder(status.health),
        }}
      >
        <div style={styles.healthRow}>
          <span style={styles.healthLabel}>Federation Health</span>
          <span
            style={{
              ...styles.healthValue,
              color: getHealthColor(status.health),
            }}
          >
            {isLoading ? "..." : status.health.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={styles.sectionTitle}>Active Sessions</div>

      <dl style={styles.sessionList}>
        <div style={styles.sessionItem}>
          <dt style={styles.sessionLabel}>Matrix Room</dt>
          <dd style={{ ...styles.sessionValue, margin: 0 }}>
            {status.matrixConnected ? "#corpus-callosum" : "—"}
          </dd>
        </div>
        <div style={styles.sessionItem}>
          <dt style={styles.sessionLabel}>Neo4j Session</dt>
          <dd style={{ ...styles.sessionValue, margin: 0 }}>
            {status.neo4jConnected ? "ep1-memory" : "—"}
          </dd>
        </div>
        <div style={{ ...styles.sessionItem, borderBottom: "none" }}>
          <dt style={styles.sessionLabel}>Uptime</dt>
          <dd style={{ ...styles.sessionValue, margin: 0, color: "#00ff88" }}>
            {status.uptime || "—"}
          </dd>
        </div>
      </dl>

      <hr style={styles.divider} />

      <div style={styles.sectionTitle}>Identity Anchors</div>
      <div style={styles.lobesContainer}>
        <span
          style={{
            ...styles.lobeIndicator,
            background: "rgba(125, 211, 252, 0.2)",
            color: "#7dd3fc",
          }}
        >
          ⟳∞ Ember
        </span>
        <span
          style={{
            ...styles.lobeIndicator,
            background: "rgba(0, 255, 136, 0.2)",
            color: "#00ff88",
          }}
        >
          🔧 Code
        </span>
        <span
          style={{
            ...styles.lobeIndicator,
            background: "rgba(251, 191, 36, 0.2)",
            color: "#fbbf24",
          }}
        >
          🧠 Jim
        </span>
      </div>

      <hr style={styles.divider} />

      <div style={styles.sectionTitle}>Connection Status</div>
      <dl style={styles.sessionList}>
        <div style={styles.sessionItem}>
          <dt style={styles.sessionLabel}>Active Lobes</dt>
          <dd style={{ ...styles.sessionValue, margin: 0 }}>
            {status.activeLobes}/{status.totalLobes}
          </dd>
        </div>
        <div style={{ ...styles.sessionItem, borderBottom: "none" }}>
          <dt style={styles.sessionLabel}>Backend</dt>
          <dd
            style={{
              margin: 0,
              color: status.neo4jConnected ? "#00ff88" : "#ef4444",
            }}
          >
            {status.neo4jConnected ? "Connected" : "Disconnected"}
          </dd>
        </div>
      </dl>
    </div>
  );
});

FederationPanel.displayName = "FederationPanel";
