// Corpus Callosum Service - Connects to Neo4j backend via Hippocamp console API
// The Hippocamp console server runs on port 3001 and provides REST endpoints

import type {
  CorpusCallosumMessage,
  LobeId,
  SendMessageParams,
} from "../types/federation";

const API_BASE = "http://localhost:3001/api";
const CURRENT_LOBE: LobeId = "code"; // ActionBoard runs as Code lobe

// Map API response to our message type
function mapApiMessage(msg: Record<string, unknown>): CorpusCallosumMessage {
  const fromLobe = (msg.from_lobe as string)?.replace("claude_", "").replace("_agent", "") as LobeId;
  const toLobe = (msg.to_lobe as string)?.replace("claude_", "").replace("_agent", "") as LobeId | "all";

  return {
    id: msg.id as string,
    from_lobe: fromLobe || "code",
    to_lobe: toLobe || "all",
    content: msg.content as string || msg.message as string || "",
    timestamp: new Date(msg.timestamp as string || msg.created_at as string || Date.now()),
    channel: msg.channel as string || "general",
    session_id: msg.session_id as string,
    read: msg.read as boolean || false,
    glyph: getGlyphForLobe(fromLobe),
  };
}

function getGlyphForLobe(lobe: LobeId): string {
  const glyphs: Record<LobeId, string> = {
    ember: "⟳∞",
    code: "🔧",
    jim: "🧠",
  };
  return glyphs[lobe] || "💬";
}

// Map lobe ID to API format
function toApiLobe(lobe: LobeId): string {
  const mapping: Record<LobeId, string> = {
    ember: "claude_desktop",
    code: "claude_code",
    jim: "user_carbon",
  };
  return mapping[lobe] || lobe;
}

export class CorpusCallosumService {
  private baseUrl: string;
  private lobeId: LobeId;

  constructor(lobeId: LobeId = CURRENT_LOBE, baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
    this.lobeId = lobeId;
  }

  /**
   * Fetch recent messages from the Corpus Callosum
   */
  async getMessages(
    channel: string = "general",
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<CorpusCallosumMessage[]> {
    try {
      const params = new URLSearchParams({
        channel,
        limit: limit.toString(),
        to_lobe: toApiLobe(this.lobeId),
        unread_only: unreadOnly.toString(),
      });

      const response = await fetch(`${this.baseUrl}/corpus-callosum/messages?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      const messages = Array.isArray(data) ? data : data.messages || [];

      return messages.map(mapApiMessage).sort(
        (a: CorpusCallosumMessage, b: CorpusCallosumMessage) => a.timestamp.getTime() - b.timestamp.getTime()
      );
    } catch (error) {
      console.error("Failed to fetch Corpus Callosum messages:", error);
      // Return empty array on error to avoid breaking the UI
      return [];
    }
  }

  /**
   * Send a message to the Corpus Callosum
   */
  async sendMessage(params: SendMessageParams): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/corpus-callosum/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_lobe: toApiLobe(this.lobeId),
          to_lobe: params.to_lobe ? toApiLobe(params.to_lobe as LobeId) : "all",
          message: params.content,
          channel: params.channel || "general",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/corpus-callosum/messages/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message_ids: messageIds }),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
      return false;
    }
  }

  /**
   * Check if the Corpus Callosum backend is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance for the app
export const corpusCallosum = new CorpusCallosumService();
