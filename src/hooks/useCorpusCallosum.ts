// React hook for Corpus Callosum real-time messaging

import { useState, useEffect, useCallback, useRef } from "react";
import { corpusCallosum } from "../services/corpusCallosum";
import type { CorpusCallosumMessage, SendMessageParams } from "../types/federation";

interface UseCorpusCallosumOptions {
  channel?: string;
  pollInterval?: number;
  enabled?: boolean;
}

interface UseCorpusCallosumReturn {
  messages: CorpusCallosumMessage[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  sendMessage: (content: string, toLobe?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useCorpusCallosum(
  options: UseCorpusCallosumOptions = {}
): UseCorpusCallosumReturn {
  const { channel = "general", pollInterval = 5000, enabled = true } = options;

  const [messages, setMessages] = useState<CorpusCallosumMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!enabled) return;

    try {
      const newMessages = await corpusCallosum.getMessages(channel, 50);

      if (isMountedRef.current) {
        setMessages(newMessages);
        setIsConnected(true);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch messages");
        setIsConnected(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [channel, enabled]);

  // Check backend health on mount
  useEffect(() => {
    isMountedRef.current = true;

    const checkConnection = async () => {
      const healthy = await corpusCallosum.checkHealth();
      if (isMountedRef.current) {
        setIsConnected(healthy);
        if (!healthy) {
          setError("Corpus Callosum backend not available");
        }
      }
    };

    if (enabled) {
      checkConnection();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [enabled]);

  // Initial fetch and polling
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchMessages();

    // Set up polling
    pollIntervalRef.current = setInterval(fetchMessages, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchMessages, pollInterval, enabled]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, toLobe?: string): Promise<boolean> => {
      const params: SendMessageParams = {
        content,
        to_lobe: toLobe as any,
        channel,
      };

      const success = await corpusCallosum.sendMessage(params);

      if (success) {
        // Refresh messages after sending
        await fetchMessages();
      }

      return success;
    },
    [channel, fetchMessages]
  );

  // Manual refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    isConnected,
    error,
    sendMessage,
    refresh,
  };
}
