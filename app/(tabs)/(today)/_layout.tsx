import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function TodayLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: Platform.OS === 'ios',
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' },
        headerBlurEffect: Platform.OS === 'ios' ? 'none' : undefined,
        headerLargeTitle: Platform.OS === 'ios',
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Today' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings', headerLargeTitle: false }} />
    </Stack>
  );
}
