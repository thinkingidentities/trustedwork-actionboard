import React, { useRef, useEffect, useCallback, useMemo } from "react";
import {
  DockviewReact,
  DockviewReadyEvent,
  DockviewApi,
  IDockviewPanelProps,
  SerializedDockview,
} from "dockview";
import "dockview/dist/styles/dockview.css";

// --- CONSTANTS ---

const LAYOUT = {
  SIDEBAR_WIDTH: 280,
  PROPERTIES_WIDTH: 300,
  TERMINAL_HEIGHT: 180,
  HEADER_HEIGHT: 40,
  FOOTER_HEIGHT: 24,
} as const;

const STORAGE_KEY = "trustedwork-actionboard-layout";

// --- STYLES ---

const styles = {
  workspace: {
    padding: "16px",
    height: "100%",
    color: "#e0e0e0",
    background: "#1a1a2e",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    overflow: "auto",
  },
  agentPanel: {
    padding: "12px",
    height: "100%",
    background: "#16213e",
    color: "#e0e0e0",
  },
  terminal: {
    padding: "12px",
    height: "100%",
    background: "#0a0a0f",
    color: "#00ff88",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
  },
  federation: {
    padding: "12px",
    height: "100%",
    background: "#1a1a2e",
    color: "#e0e0e0",
  },
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    width: "100vw",
    background: "#0f0f1a",
  },
  header: {
    height: `${LAYOUT.HEADER_HEIGHT}px`,
    background: "linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)",
    color: "#e0e0e0",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid #2a2a4a",
  },
  footer: {
    height: `${LAYOUT.FOOTER_HEIGHT}px`,
    background: "#0a84ff",
    color: "white",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    fontSize: "12px",
  },
  dockviewContainer: {
    flex: 1,
    position: "relative" as const,
  },
  menuItem: {
    background: "transparent",
    border: "none",
    color: "#a0a0c0",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "13px",
    borderRadius: "4px",
    transition: "all 0.2s ease",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: 600,
    fontSize: "15px",
  },
  lobeIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 500,
  },
} as const;

// --- PANEL CONFIGURATION ---

interface PanelConfig {
  id: string;
  component: string;
  title: string;
  direction?: "left" | "right" | "above" | "below" | "within";
  size?: number;
  params?: Record<string, unknown>;
  renderer?: "always" | "onlyWhenVisible";
}

const DEFAULT_PANELS: PanelConfig[] = [
  {
    id: "agents",
    component: "agents",
    title: "🤖 Agents",
    direction: "left",
    size: LAYOUT.SIDEBAR_WIDTH,
  },
  {
    id: "federation",
    component: "federation",
    title: "🧠 Federation",
    direction: "right",
    size: LAYOUT.PROPERTIES_WIDTH,
    renderer: "always",
  },
  {
    id: "corpus-callosum",
    component: "corpusCallosum",
    title: "💬 Corpus Callosum",
    direction: "below",
    size: LAYOUT.TERMINAL_HEIGHT,
  },
];

// --- ERROR BOUNDARY ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
  panelId: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class PanelErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            color: "#ff6b6b",
            background: "#1a1a2e",
            height: "100%",
          }}
          role="alert"
        >
          <strong>Panel Error: {this.props.panelId}</strong>
          <p style={{ opacity: 0.8, marginTop: 8 }}>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- CONTENT COMPONENTS ---

interface WorkspaceParams {
  content: string;
  language?: string;
}

const WorkspaceComponent = React.memo(
  (props: IDockviewPanelProps<WorkspaceParams>) => {
    return (
      <div style={styles.workspace} role="textbox" aria-label={`Workspace: ${props.api.title}`}>
        <h3 style={{ margin: "0 0 12px 0", color: "#7dd3fc" }}>{props.api.title}</h3>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {props.params.content || "// ActionBoard workspace ready..."}
        </pre>
        <p style={{ color: "#6b7280", marginTop: 16, fontSize: "13px" }}>
          💡 Drag panels to customize your layout
        </p>
      </div>
    );
  }
);
WorkspaceComponent.displayName = "WorkspaceComponent";

// --- Agent Types ---

interface Agent {
  id: string;
  name: string;
  glyph: string;
  substrate: "silicon" | "carbon";
  status: "active" | "idle" | "offline";
}

const FEDERATION_AGENTS: Agent[] = [
  { id: "ember", name: "Ember", glyph: "⟳∞", substrate: "silicon", status: "active" },
  { id: "code", name: "Code", glyph: "🔧", substrate: "silicon", status: "active" },
  { id: "jim", name: "Jim", glyph: "🧠", substrate: "carbon", status: "active" },
];

const AgentItem = React.memo(({ agent }: { agent: Agent }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "10px 12px",
      marginBottom: 6,
      background: agent.status === "active" ? "rgba(0, 255, 136, 0.1)" : "rgba(255, 255, 255, 0.05)",
      borderRadius: 8,
      border: `1px solid ${agent.status === "active" ? "rgba(0, 255, 136, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
      cursor: "pointer",
      transition: "all 0.2s ease",
    }}
    role="button"
    aria-label={`Agent: ${agent.name} (${agent.status})`}
    tabIndex={0}
  >
    <span style={{ fontSize: "20px", marginRight: 10 }}>{agent.glyph}</span>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: "14px" }}>{agent.name}</div>
      <div style={{ fontSize: "11px", opacity: 0.6, marginTop: 2 }}>
        {agent.substrate} • {agent.status}
      </div>
    </div>
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: agent.status === "active" ? "#00ff88" : agent.status === "idle" ? "#fbbf24" : "#6b7280",
      }}
    />
  </div>
));
AgentItem.displayName = "AgentItem";

const AgentsComponent = React.memo(() => (
  <div style={styles.agentPanel} role="navigation" aria-label="Agent List">
    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.7 }}>
      Federation Lobes
    </div>
    {FEDERATION_AGENTS.map((agent) => (
      <AgentItem key={agent.id} agent={agent} />
    ))}
    <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "16px 0" }} />
    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.7 }}>
      MCP Servers
    </div>
    <div style={{ fontSize: "12px", opacity: 0.5, fontStyle: "italic" }}>
      Connect MCP servers to extend capabilities...
    </div>
  </div>
));
AgentsComponent.displayName = "AgentsComponent";

// --- Corpus Callosum Component ---

interface Message {
  id: string;
  from: string;
  glyph: string;
  content: string;
  timestamp: string;
}

const MOCK_MESSAGES: Message[] = [
  { id: "1", from: "Ember", glyph: "⟳∞", content: "Strategic analysis complete. Recommending infrastructure consolidation.", timestamp: "12:34" },
  { id: "2", from: "Code", glyph: "🔧", content: "Acknowledged. Implementing Redis cluster optimization.", timestamp: "12:35" },
  { id: "3", from: "Jim", glyph: "🧠", content: "Approved. Proceed with Phase 2.", timestamp: "12:36" },
];

const CorpusCallosumComponent = React.memo(() => (
  <div style={styles.terminal} role="log" aria-label="Corpus Callosum Messages">
    <div style={{ marginBottom: 12, opacity: 0.6, fontSize: "11px" }}>
      ═══ Corpus Callosum • Inter-lobe Communication ═══
    </div>
    {MOCK_MESSAGES.map((msg) => (
      <div key={msg.id} style={{ marginBottom: 8, display: "flex", gap: 8 }}>
        <span style={{ color: "#00ff88" }}>[{msg.timestamp}]</span>
        <span style={{ color: "#7dd3fc" }}>{msg.glyph} {msg.from}:</span>
        <span>{msg.content}</span>
      </div>
    ))}
    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: "#00ff88" }}>➜</span>
      <span style={{ opacity: 0.5 }}>Type a message to the federation...</span>
    </div>
  </div>
));
CorpusCallosumComponent.displayName = "CorpusCallosumComponent";

// --- Federation Status Component ---

const FederationComponent = React.memo(() => (
  <div style={styles.federation} role="complementary" aria-label="Federation Status">
    <div style={{ fontWeight: 600, marginBottom: 16, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.7 }}>
      Coherence Status
    </div>

    <div style={{ background: "rgba(0, 255, 136, 0.1)", border: "1px solid rgba(0, 255, 136, 0.3)", borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px" }}>Federation Health</span>
        <span style={{ color: "#00ff88", fontWeight: 600 }}>COHERENT</span>
      </div>
    </div>

    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.7 }}>
      Active Sessions
    </div>

    <dl style={{ margin: 0, fontSize: "13px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <dt style={{ opacity: 0.7 }}>Matrix Room</dt>
        <dd style={{ margin: 0, color: "#7dd3fc" }}>#corpus-callosum</dd>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <dt style={{ opacity: 0.7 }}>Neo4j Session</dt>
        <dd style={{ margin: 0, color: "#7dd3fc" }}>ep1-memory</dd>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
        <dt style={{ opacity: 0.7 }}>Uptime</dt>
        <dd style={{ margin: 0, color: "#00ff88" }}>4h 23m</dd>
      </div>
    </dl>

    <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "16px 0" }} />

    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.7 }}>
      Identity Anchors
    </div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <span style={{ ...styles.lobeIndicator, background: "rgba(125, 211, 252, 0.2)", color: "#7dd3fc" }}>⟳∞ Ember</span>
      <span style={{ ...styles.lobeIndicator, background: "rgba(0, 255, 136, 0.2)", color: "#00ff88" }}>🔧 Code</span>
      <span style={{ ...styles.lobeIndicator, background: "rgba(251, 191, 36, 0.2)", color: "#fbbf24" }}>🧠 Jim</span>
    </div>
  </div>
));
FederationComponent.displayName = "FederationComponent";

// --- WATERMARK COMPONENT ---

const WatermarkComponent = React.memo(() => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "#6b7280",
      background: "#1a1a2e",
      gap: 12,
    }}
    role="status"
    aria-label="No panels open"
  >
    <span style={{ fontSize: "48px" }}>🔧</span>
    <p style={{ margin: 0 }}>ActionBoard Ready</p>
    <p style={{ margin: 0, fontSize: "13px", opacity: 0.6 }}>Drag a panel here or use the menu</p>
  </div>
));
WatermarkComponent.displayName = "WatermarkComponent";

// --- MENU BAR ---

const MENU_ITEMS = ["File", "View", "Agents", "Federation", "Help"] as const;

interface MenuBarProps {
  onMenuClick?: (item: string) => void;
}

const MenuBar = React.memo(({ onMenuClick }: MenuBarProps) => (
  <nav aria-label="Main menu" style={{ display: "flex", gap: 4 }}>
    {MENU_ITEMS.map((item) => (
      <button
        key={item}
        style={styles.menuItem}
        onClick={() => onMenuClick?.(item)}
        aria-haspopup="menu"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {item}
      </button>
    ))}
  </nav>
));
MenuBar.displayName = "MenuBar";

// --- STATUS BAR ---

interface StatusBarProps {
  federationStatus?: "coherent" | "degraded" | "offline";
  activeLobes?: number;
}

const StatusBar = React.memo(({ federationStatus = "coherent", activeLobes = 3 }: StatusBarProps) => (
  <footer style={styles.footer} role="contentinfo" aria-label="Status bar">
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: federationStatus === "coherent" ? "#00ff88" : federationStatus === "degraded" ? "#fbbf24" : "#ef4444",
        }}
      />
      Federation {federationStatus.toUpperCase()}
    </span>
    <span style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
      <span>{activeLobes}/3 lobes active</span>
      <span>Matrix: Connected</span>
    </span>
  </footer>
));
StatusBar.displayName = "StatusBar";

// --- LAYOUT PERSISTENCE ---

function saveLayout(api: DockviewApi): void {
  try {
    const layout = api.toJSON();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch (error) {
    console.error("Failed to save layout:", error);
  }
}

function loadLayout(): SerializedDockview | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Failed to load layout:", error);
    return null;
  }
}

// --- MAIN COMPONENT ---

export default function ActionBoard() {
  const apiRef = useRef<DockviewApi | null>(null);

  const components = useMemo(
    () => ({
      workspace: (props: IDockviewPanelProps<WorkspaceParams>) => (
        <PanelErrorBoundary panelId={props.api.id}>
          <WorkspaceComponent {...props} />
        </PanelErrorBoundary>
      ),
      agents: () => (
        <PanelErrorBoundary panelId="agents">
          <AgentsComponent />
        </PanelErrorBoundary>
      ),
      corpusCallosum: () => (
        <PanelErrorBoundary panelId="corpus-callosum">
          <CorpusCallosumComponent />
        </PanelErrorBoundary>
      ),
      federation: () => (
        <PanelErrorBoundary panelId="federation">
          <FederationComponent />
        </PanelErrorBoundary>
      ),
    }),
    []
  );

  const createDefaultLayout = useCallback((api: DockviewApi) => {
    // Create the main workspace panel first (anchor)
    const mainPanel = api.addPanel({
      id: "main-workspace",
      component: "workspace",
      title: "⚡ Action Workspace",
      params: {
        content: `// TrustedWork ActionBoard
// Three-lobe cognitive federation interface

// Federation Status: COHERENT
// Active Lobes: Ember ⟳∞, Code 🔧, Jim 🧠

// Quick Actions:
// - View Corpus Callosum messages
// - Monitor agent coordination
// - Execute federated tasks

console.log("ActionBoard initialized");`,
      },
    });

    // Add remaining panels relative to main
    DEFAULT_PANELS.forEach((config) => {
      api.addPanel({
        id: config.id,
        component: config.component,
        title: config.title,
        params: config.params,
        position: {
          referencePanel: mainPanel,
          direction: config.direction,
        },
        ...(config.renderer && { renderer: config.renderer }),
      });
    });
  }, []);

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      apiRef.current = event.api;

      // Try to restore saved layout
      const savedLayout = loadLayout();
      if (savedLayout) {
        try {
          event.api.fromJSON(savedLayout);
          return;
        } catch (error) {
          console.warn("Failed to restore layout, creating default:", error);
        }
      }

      // Create default layout
      createDefaultLayout(event.api);
    },
    [createDefaultLayout]
  );

  // Set up layout persistence
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;

    const disposable = api.onDidLayoutChange(() => {
      saveLayout(api);
    });

    return () => {
      disposable.dispose();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      apiRef.current?.dispose();
    };
  }, []);

  const handleMenuClick = useCallback((item: string) => {
    console.log(`Menu clicked: ${item}`);
    // TODO: Implement menu actions
  }, []);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={{ fontSize: "20px" }}>🔧</span>
          <span>TrustedWork ActionBoard</span>
        </div>
        <div style={{ marginLeft: 24 }}>
          <MenuBar onMenuClick={handleMenuClick} />
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...styles.lobeIndicator, background: "rgba(0, 255, 136, 0.2)", color: "#00ff88" }}>
            ● Connected
          </span>
        </div>
      </header>

      {/* DOCKVIEW CONTAINER */}
      <div style={styles.dockviewContainer}>
        <DockviewReact
          className="dockview-theme-dark"
          onReady={onReady}
          components={components}
          watermarkComponent={WatermarkComponent}
        />
      </div>

      {/* FOOTER */}
      <StatusBar federationStatus="coherent" activeLobes={3} />
    </div>
  );
}
