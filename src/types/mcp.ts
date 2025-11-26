// MCP Server and Service Types

export type MCPServerStatus = "connected" | "connecting" | "disconnected" | "error";

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  status: MCPServerStatus;
  lastChecked?: Date;
  error?: string;
  tools?: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
}

// Hippocamp Memory Types
export interface HippocampMemory {
  id: string;
  title?: string;
  content: string;
  category?: string;
  timestamp?: Date;
  tags?: string[];
  score?: number; // Search relevance score
}

export interface HippocampCategory {
  name: string;
  count: number;
  children?: HippocampCategory[];
}

export interface HippocampSearchResult {
  memories: HippocampMemory[];
  total: number;
  query: string;
}

// Corpus Callosum Types (extended)
export interface CCStats {
  totalMessages: number;
  unreadCount: number;
  activeChannels: string[];
  activeSessions: number;
}

// Fireworks WebSocket Types
export interface CognateState {
  id: string;
  name: string;
  glyph: string;
  substrate: "silicon" | "carbon";
  position: { x: number; y: number };
  status: "active" | "idle" | "offline";
  lastMessage?: string;
}

export interface CognateUpdateMessage {
  type: "cognateUpdate";
  payload: CognateState[];
  timestamp: string;
}

export interface CCMessageWebSocket {
  type: "corpusCallosumMessage";
  payload: {
    id: string;
    from_lobe: string;
    to_lobe: string;
    content: string;
    timestamp: string;
    channel: string;
  };
}

// Service Configuration
export interface MCPServiceConfig {
  hippocampApiUrl: string;
  fireworksWsUrl: string;
  pollInterval: number;
  enableWebSocket: boolean;
}

export const DEFAULT_MCP_CONFIG: MCPServiceConfig = {
  hippocampApiUrl: "http://localhost:3001",
  fireworksWsUrl: "ws://localhost:8000",
  pollInterval: 5000,
  enableWebSocket: true,
};

// Available MCP Servers Registry
export const MCP_SERVERS: Omit<MCPServer, "status" | "lastChecked">[] = [
  {
    id: "hippocamp-console",
    name: "Hippocamp Console",
    description: "REST API for memory search and Corpus Callosum",
    endpoint: "http://localhost:3001",
    tools: [
      { name: "search_memory", description: "Search across 560+ conversation exports" },
      { name: "get_categories", description: "List memory categories" },
      { name: "corpus_callosum", description: "Inter-lobe messaging" },
    ],
  },
  {
    id: "fireworks-ws",
    name: "Fireworks WebSocket",
    description: "Real-time cognate states and visualization",
    endpoint: "ws://localhost:8000",
    tools: [
      { name: "cognate_states", description: "Real-time lobe positions (2fps)" },
      { name: "cc_messages", description: "Live Corpus Callosum stream" },
    ],
  },
  {
    id: "neo4j-ep1",
    name: "Neo4j ep1-memory",
    description: "Graph database for identity and CC messages",
    endpoint: "bolt://localhost:7687",
    tools: [
      { name: "graph_query", description: "Cypher queries for memory graph" },
    ],
  },
  {
    id: "neo4j-nessie",
    name: "Neo4j Nessie",
    description: "Hippocamp memory backend (560+ exports)",
    endpoint: "bolt://localhost:7688",
    tools: [
      { name: "memory_search", description: "Full-text and semantic search" },
    ],
  },
  {
    id: "matrix-synapse",
    name: "Matrix Synapse",
    description: "E2EE messaging homeserver",
    endpoint: "http://localhost:8008",
    tools: [
      { name: "matrix_send", description: "Send E2EE messages" },
      { name: "matrix_read", description: "Read from #corpus-callosum" },
    ],
  },
];
