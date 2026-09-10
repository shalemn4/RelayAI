import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { TopNavBar } from '../../components/navigation/TopNavBar';
import { COLORS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      {/* 1. Functional Omni-Style Top Navigation Bar (Image 1) */}
      <TopNavBar />

      {/* 2. Main Content Screens with Image 2 Bottom Tab Bar Completely Removed */}
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            tabBarStyle: { display: 'none' }, // Completely remove Image 2 bottom tab bar
            headerShown: false, // Clean screens without redundant default headers
          }}
        >
          <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
          <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />
          <Tabs.Screen name="leads" options={{ title: 'Leads' }} />
          <Tabs.Screen name="calls" options={{ title: 'Voice AI' }} />
          <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
          <Tabs.Screen name="agents" options={{ title: 'AI Agents' }} />
          <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
});
