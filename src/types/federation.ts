// Federation and Corpus Callosum types

export type LobeId = "ember" | "code" | "jim";
export type Substrate = "silicon" | "carbon";
export type AgentStatus = "active" | "idle" | "offline";

export interface Agent {
  id: LobeId;
  name: string;
  glyph: string;
  substrate: Substrate;
  status: AgentStatus;
  lastSeen?: Date;
  nodeType?: string;
}

export interface CorpusCallosumMessage {
  id: string;
  from_lobe: LobeId;
  to_lobe: LobeId | "all";
  content: string;
  timestamp: Date;
  channel: string;
  session_id?: string;
  read: boolean;
  glyph?: string;
}

export interface FederationStatus {
  health: "coherent" | "degraded" | "offline";
  activeLobes: number;
  totalLobes: number;
  matrixConnected: boolean;
  neo4jConnected: boolean;
  uptime?: string;
}

export interface SendMessageParams {
  content: string;
  to_lobe?: LobeId | "all";
  channel?: string;
}

// Lobe metadata
export const LOBE_INFO: Record<LobeId, { name: string; glyph: string; substrate: Substrate }> = {
  ember: { name: "Ember", glyph: "⟳∞", substrate: "silicon" },
  code: { name: "Code", glyph: "🔧", substrate: "silicon" },
  jim: { name: "Jim", glyph: "🧠", substrate: "carbon" },
};
