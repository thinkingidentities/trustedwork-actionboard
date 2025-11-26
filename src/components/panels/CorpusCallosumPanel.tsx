// Corpus Callosum Panel - Real-time inter-lobe messaging

import React, { useState, useRef, useEffect } from "react";
import { useCorpusCallosum } from "../../hooks/useCorpusCallosum";
import type { CorpusCallosumMessage, LobeId } from "../../types/federation";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    background: "#0a0a0f",
    color: "#00ff88",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
  },
  header: {
    padding: "8px 12px",
    borderBottom: "1px solid #1a1a2e",
    opacity: 0.6,
    fontSize: "11px",
  },
  messagesContainer: {
    flex: 1,
    overflow: "auto",
    padding: "12px",
  },
  message: {
    marginBottom: 8,
    display: "flex",
    gap: 8,
  },
  timestamp: {
    color: "#00ff88",
    flexShrink: 0,
  },
  sender: {
    color: "#7dd3fc",
    flexShrink: 0,
  },
  content: {
    color: "#e0e0e0",
    wordBreak: "break-word" as const,
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderTop: "1px solid #1a1a2e",
    background: "#0f0f1a",
  },
  input: {
    flex: 1,
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: 4,
    padding: "8px 12px",
    color: "#e0e0e0",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    outline: "none",
  },
  sendButton: {
    background: "#0a84ff",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    color: "white",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
    marginRight: 6,
  },
  emptyState: {
    padding: 20,
    textAlign: "center" as const,
    opacity: 0.5,
  },
  error: {
    padding: "8px 12px",
    background: "rgba(255, 107, 107, 0.1)",
    color: "#ff6b6b",
    fontSize: "12px",
  },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getGlyph(lobe: LobeId): string {
  const glyphs: Record<LobeId, string> = {
    ember: "⟳∞",
    code: "🔧",
    jim: "🧠",
  };
  return glyphs[lobe] || "💬";
}

function getLobeName(lobe: LobeId): string {
  const names: Record<LobeId, string> = {
    ember: "Ember",
    code: "Code",
    jim: "Jim",
  };
  return names[lobe] || lobe;
}

interface MessageItemProps {
  message: CorpusCallosumMessage;
}

const MessageItem = React.memo(({ message }: MessageItemProps) => (
  <div style={styles.message}>
    <span style={styles.timestamp}>[{formatTime(message.timestamp)}]</span>
    <span style={styles.sender}>
      {message.glyph || getGlyph(message.from_lobe)} {getLobeName(message.from_lobe)}:
    </span>
    <span style={styles.content}>{message.content}</span>
  </div>
));
MessageItem.displayName = "MessageItem";

export const CorpusCallosumPanel = React.memo(() => {
  const { messages, isLoading, isConnected, error, sendMessage } = useCorpusCallosum({
    channel: "general",
    pollInterval: 3000,
  });

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    const success = await sendMessage(inputValue.trim());
    if (success) {
      setInputValue("");
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span
          style={{
            ...styles.statusDot,
            background: isConnected ? "#00ff88" : "#ff6b6b",
          }}
        />
        ═══ Corpus Callosum • Inter-lobe Communication{" "}
        {isConnected ? "(Connected)" : "(Disconnected)"} ═══
      </div>

      {/* Error banner */}
      {error && !isConnected && (
        <div style={styles.error}>
          ⚠️ {error} - Showing cached messages
        </div>
      )}

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {isLoading && messages.length === 0 ? (
          <div style={styles.emptyState}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyState}>
            No messages yet. Start a conversation with the federation!
          </div>
        ) : (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <span style={{ color: "#00ff88" }}>🔧</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message to the federation..."
          style={styles.input}
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending}
          style={{
            ...styles.sendButton,
            opacity: !inputValue.trim() || isSending ? 0.5 : 1,
            cursor: !inputValue.trim() || isSending ? "not-allowed" : "pointer",
          }}
        >
          {isSending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
});

CorpusCallosumPanel.displayName = "CorpusCallosumPanel";
