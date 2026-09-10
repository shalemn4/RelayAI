import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ToastProvider, useToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/useAuthStore';
import { useOfflineStore } from '../store/useOfflineStore';
import { realtimeManager } from '../services/realtime';
import { analytics } from '../services/analytics';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../constants/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 2,
      refetchOnWindowFocus: Platform.OS === 'web',
    },
  },
});

// Link singletons to QueryClient
realtimeManager.setQueryClient(queryClient);
analytics.setQueryClient(queryClient);

const OfflineBanner: React.FC = () => {
  const { isOnline, setIsOnline, queuedMessages, flushQueue } = useOfflineStore();
  const { showToast } = useToast();

  useEffect(() => {
    // In web, monitor online/offline events
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsOnline(true);
        showToast('Network restored. Reconnecting and flushing queue...', 'success');
        realtimeManager.connect();
        flushQueue(queryClient);
      };
      const handleOffline = () => {
        setIsOnline(false);
        showToast('You are currently offline. Messages will be queued locally.', 'error');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  if (isOnline && queuedMessages.length === 0) return null;

  return (
    <View style={[styles.offlineBanner, !isOnline ? styles.offlineBg : styles.syncingBg]}>
      <Text style={styles.offlineBannerText}>
        {!isOnline
          ? `⚡ Offline Mode: ${queuedMessages.length} mutation(s) queued locally.`
          : `🔄 Online: Flushing ${queuedMessages.length} queued messages...`}
      </Text>
      {isOnline && queuedMessages.length > 0 ? (
        <TouchableOpacity
          onPress={() => flushQueue(queryClient)}
          style={styles.flushBtn}
        >
          <Text style={styles.flushText}>Sync Now</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default function RootLayout() {
  const initializeAuth = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initializeAuth();
    realtimeManager.connect();
    return () => {
      realtimeManager.disconnect();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StatusBar style="dark" />
          <OfflineBanner />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#FFFFFF',
              },
              headerTintColor: COLORS.text,
              headerTitleStyle: {
                fontWeight: TYPOGRAPHY.weight.bold,
                fontSize: TYPOGRAPHY.size.md,
              },
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: COLORS.background,
              },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="index"
              options={{ headerShown: false }}
            />
          </Stack>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  offlineBg: {
    backgroundColor: '#991B1B', // Dark red
  },
  syncingBg: {
    backgroundColor: '#1E40AF', // Blue
  },
  offlineBannerText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  flushBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  flushText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
});
