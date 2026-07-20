import React from 'react';
import { View, useColorScheme } from 'react-native';
import { Tabs } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { COLORS, DARK_COLORS } from '@/constants/AppColors';
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";

export default function TabLayout() {
  useSubscriptionGuard();

  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? DARK_COLORS : COLORS;

  const tabs = [
    { name: 'today', route: '/(tabs)/(today)' as const, icon: 'home' as const, label: 'Today' },
    { name: 'cycle', route: '/(tabs)/(cycle)' as const, icon: 'calendar-today' as const, label: 'Cycle' },
    { name: 'history', route: '/(tabs)/(history)' as const, icon: 'history' as const, label: 'History' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <Tabs
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      >
        <Tabs.Screen name="(today)" />
        <Tabs.Screen name="(cycle)" />
        <Tabs.Screen name="(history)" />
      </Tabs>
      <FloatingTabBar tabs={tabs} containerWidth={260} />
    </View>
  );
}
