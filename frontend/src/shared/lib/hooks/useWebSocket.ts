import { useEffect, useCallback } from 'react';

type WebSocketMessage = {
  type: string;
  data: unknown;
};

interface UseWebSocketOptions {
  onMessage?: (data: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const connect = useCallback(() => {
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(url);

        ws.onopen = () => {
          reconnectAttempts = 0;
          onConnect?.();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            onMessage?.(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          onDisconnect?.();
          
          // Attempt to reconnect if within retry limits
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            reconnectTimer = setTimeout(() => {
              connectWebSocket();
            }, reconnectInterval);
          }
        };

        ws.onerror = (error) => {
          onError?.(error);
        };
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        onError?.(error as Event);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return { connect };
}

// Specialized hook for real-time position updates
export function usePositionUpdates(positionId?: number) {
  const wsUrl = positionId 
    ? `${import.meta.env.VITE_WS_BASE_URL}/ws/positions/${positionId}`
    : `${import.meta.env.VITE_WS_BASE_URL}/ws/positions`;

  return useWebSocket(wsUrl, {
    onMessage: (message) => {
      // Handle position-specific updates
      console.log('Position update:', message);
    },
    onConnect: () => {
      console.log('Connected to position updates');
    },
    onDisconnect: () => {
      console.log('Disconnected from position updates');
    },
  });
}

// Hook for market data WebSocket connection
export function useMarketDataUpdates(symbols: string[] = []) {
  const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/ws/market`;

  return useWebSocket(wsUrl, {
    onMessage: (message) => {
      // Handle market data updates
      console.log('Market data update:', message);
    },
    onConnect: () => {
      // Subscribe to specific symbols
      console.log('Connected to market data');
    },
  });
}
