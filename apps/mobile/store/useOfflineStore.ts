import { create } from 'zustand';
import { api } from '../services/api';
import { QueryClient } from '@tanstack/react-query';

export interface QueuedMessage {
  tempId: string;
  conversationId: number;
  content: string;
  createdAt: string;
  status: 'waiting_to_send' | 'sending' | 'failed';
  errorMessage?: string;
}

interface OfflineState {
  isOnline: boolean;
  queuedMessages: QueuedMessage[];
  setIsOnline: (online: boolean) => void;
  enqueueMessage: (conversationId: number, content: string) => QueuedMessage;
  retryMessage: (tempId: string, queryClient: QueryClient) => Promise<void>;
  flushQueue: (queryClient: QueryClient) => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  queuedMessages: [],

  setIsOnline: (online: boolean) => {
    set({ isOnline: online });
  },

  enqueueMessage: (conversationId: number, content: string) => {
    const item: QueuedMessage = {
      tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      conversationId,
      content,
      createdAt: new Date().toISOString(),
      status: 'waiting_to_send',
    };

    set((state) => ({
      queuedMessages: [...state.queuedMessages, item],
    }));

    return item;
  },

  retryMessage: async (tempId: string, queryClient: QueryClient) => {
    const { queuedMessages } = get();
    const item = queuedMessages.find((m) => m.tempId === tempId);
    if (!item) return;

    // Set sending state
    set((state) => ({
      queuedMessages: state.queuedMessages.map((m) =>
        m.tempId === tempId ? { ...m, status: 'sending', errorMessage: undefined } : m
      ),
    }));

    try {
      await api.post(`/conversations/${item.conversationId}/messages`, {
        content: item.content,
      });

      // Remove from queue on success
      set((state) => ({
        queuedMessages: state.queuedMessages.filter((m) => m.tempId !== tempId),
      }));

      // Revalidate cache
      queryClient.invalidateQueries({ queryKey: ['conversation', item.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err: any) {
      set((state) => ({
        queuedMessages: state.queuedMessages.map((m) =>
          m.tempId === tempId
            ? { ...m, status: 'failed', errorMessage: err.message || 'Retry failed' }
            : m
        ),
      }));
    }
  },

  flushQueue: async (queryClient: QueryClient) => {
    const { queuedMessages, isOnline } = get();
    if (!isOnline || queuedMessages.length === 0) return;

    for (const item of queuedMessages) {
      if (item.status === 'sending') continue;
      await get().retryMessage(item.tempId, queryClient);
    }
  },
}));
