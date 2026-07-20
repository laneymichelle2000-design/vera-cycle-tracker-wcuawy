import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(today)">
        <Icon sf="pill.fill" sfSelected="pill.fill" />
        <Label>Today</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(cycle)">
        <Icon sf="calendar.circle.fill" sfSelected="calendar.circle.fill" />
        <Label>Cycle</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(history)">
        <Icon sf="clock.fill" sfSelected="clock.fill" />
        <Label>History</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
