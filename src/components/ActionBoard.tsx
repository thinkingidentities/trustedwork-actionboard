import React, { useRef, useCallback, useMemo } from "react";
import {
  DockviewReact,
  DockviewReadyEvent,
  DockviewApi,
  IDockviewPanelProps,
} from "dockview";
import "dockview/dist/styles/dockview.css";

// Panel components
import { AgentsPanel } from "./panels/AgentsPanel";
import { CorpusCallosumPanel } from "./panels/CorpusCallosumPanel";
import { FederationPanel } from "./panels/FederationPanel";
import { HippocampPanel } from "./panels/HippocampPanel";

// Hooks
import { useLayoutPersistence } from "../hooks/useLayoutPersistence";
import { useFederationStatus } from "../hooks/useFederationStatus";

// --- CONSTANTS ---

const LAYOUT = {
  SIDEBAR_WIDTH: 280,
  PROPERTIES_WIDTH: 300,
  TERMINAL_HEIGHT: 180,
  HEADER_HEIGHT: 40,
  FOOTER_HEIGHT: 24,
} as const;


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
    height: "100%",
    minHeight: 0, // Important for flexbox children
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
    id: "hippocamp",
    component: "hippocamp",
    title: "🧠 Hippocamp",
    direction: "within", // Tab alongside agents panel
  },
  {
    id: "federation",
    component: "federation",
    title: "⚡ Federation",
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


// --- MAIN COMPONENT ---

export default function ActionBoard() {
  const apiRef = useRef<DockviewApi | null>(null);
  const layoutRestoredRef = useRef(false);

  // Layout persistence hook
  const { loadLayout, setupAutoSave } = useLayoutPersistence();

  // Federation status for the status bar
  const { status: federationStatus } = useFederationStatus({ pollInterval: 15000 });

  const components = useMemo(
    () => ({
      workspace: (props: IDockviewPanelProps<WorkspaceParams>) => (
        <PanelErrorBoundary panelId={props.api.id}>
          <WorkspaceComponent {...props} />
        </PanelErrorBoundary>
      ),
      agents: () => (
        <PanelErrorBoundary panelId="agents">
          <AgentsPanel />
        </PanelErrorBoundary>
      ),
      corpusCallosum: () => (
        <PanelErrorBoundary panelId="corpus-callosum">
          <CorpusCallosumPanel />
        </PanelErrorBoundary>
      ),
      federation: () => (
        <PanelErrorBoundary panelId="federation">
          <FederationPanel />
        </PanelErrorBoundary>
      ),
      hippocamp: () => (
        <PanelErrorBoundary panelId="hippocamp">
          <HippocampPanel />
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

      // Try to restore saved layout first
      const savedLayout = loadLayout();
      if (savedLayout) {
        try {
          event.api.fromJSON(savedLayout);
          layoutRestoredRef.current = true;
        } catch (error) {
          console.warn("Failed to restore layout, using defaults:", error);
          createDefaultLayout(event.api);
        }
      } else {
        createDefaultLayout(event.api);
      }

      // Set up auto-save for layout changes
      setupAutoSave(event.api);
    },
    [createDefaultLayout, loadLayout, setupAutoSave]
  );

  // Note: We don't dispose apiRef on unmount because React StrictMode
  // double-mounts components in development, causing "resource already disposed" errors.
  // Dockview handles its own cleanup internally.

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
          className="dockview-theme-dark actionboard-dockview"
          onReady={onReady}
          components={components}
          watermarkComponent={WatermarkComponent}
        />
      </div>

      {/* FOOTER */}
      <StatusBar
        federationStatus={federationStatus.health}
        activeLobes={federationStatus.activeLobes}
      />
    </div>
  );
}
