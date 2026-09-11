import { Platform } from 'react-native';
import { QueryClient } from '@tanstack/react-query';

type EventHandler = (payload: any) => void;

class RealtimeManager {
  private socket: WebSocket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private topicSubscribers: Map<string, Set<EventHandler>> = new Map();
  private globalSubscribers: Set<EventHandler> = new Set();
  private queryClient: QueryClient | null = null;

  public setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  private getWebSocketUrl(): string | null {
    // 1. Explicit environment variable configured in Vercel or .env
    if (process.env.EXPO_PUBLIC_WS_URL) {
      return process.env.EXPO_PUBLIC_WS_URL;
    }

    // 2. Android emulator loopback
    if (Platform.OS === 'android') {
      return 'ws://10.0.2.2:8000/ws';
    }

    // 3. Web environment
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname || 'localhost';
      if (host === 'localhost' || host === '127.0.0.1') {
        return `ws://${host}:8000/ws`;
      }
      // On HTTPS domain, use secure wss: to prevent Mixed Content errors
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws`;
    }

    return 'ws://localhost:8000/ws';
  }

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (this.isConnecting) return;

    this.isConnecting = true;
    try {
      const url = this.getWebSocketUrl();
      if (!url) {
        this.isConnecting = false;
        return;
      }
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();

        // Re-subscribe all active topics upon reconnect
        for (const topic of this.topicSubscribers.keys()) {
          this.send({ action: 'subscribe', topic });
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, topic, payload } = data;

          // Notify topic subscribers
          if (topic && this.topicSubscribers.has(topic)) {
            this.topicSubscribers.get(topic)?.forEach(handler => handler(payload));
          }

          // Notify global subscribers
          this.globalSubscribers.forEach(handler => handler(data));

          // Automated TanStack Query cache reconciliation
          if (this.queryClient) {
            if (type === 'message.created') {
              // Invalidate conversation detail and list
              this.queryClient.invalidateQueries({ queryKey: ['conversation'] });
              this.queryClient.invalidateQueries({ queryKey: ['conversations'] });
            } else if (type === 'conversation.updated') {
              this.queryClient.invalidateQueries({ queryKey: ['conversations'] });
            } else if (type === 'call.transcript.updated' || type === 'call.status.changed') {
              this.queryClient.invalidateQueries({ queryKey: ['calls'] });
            }
          }
        } catch (e) {
          // ignore non-json messages
        }
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.cleanupHeartbeat();
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnecting = false;
      };
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 20000);
    this.reconnectAttempts++;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.cleanupHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ action: 'ping' });
      }
    }, 25000);
  }

  private cleanupHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  public send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  public subscribe(topic: string, handler: EventHandler) {
    if (!this.topicSubscribers.has(topic)) {
      this.topicSubscribers.set(topic, new Set());
      this.send({ action: 'subscribe', topic });
    }
    this.topicSubscribers.get(topic)!.add(handler);

    return () => this.unsubscribe(topic, handler);
  }

  public unsubscribe(topic: string, handler: EventHandler) {
    if (this.topicSubscribers.has(topic)) {
      const set = this.topicSubscribers.get(topic)!;
      set.delete(handler);
      if (set.size === 0) {
        this.topicSubscribers.delete(topic);
        this.send({ action: 'unsubscribe', topic });
      }
    }
  }

  public subscribeGlobal(handler: EventHandler) {
    this.globalSubscribers.add(handler);
    return () => this.globalSubscribers.delete(handler);
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.cleanupHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const realtimeManager = new RealtimeManager();
