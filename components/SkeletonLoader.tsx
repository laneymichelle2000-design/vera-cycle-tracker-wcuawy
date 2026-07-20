import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle, StyleProp } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, DARK_COLORS } from '@/constants/AppColors';

interface SkeletonLineProps {
  width: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonLine({ width, height = 14, style }: SkeletonLineProps) {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? DARK_COLORS : COLORS;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View style={[{ width, height, borderRadius: height / 2, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: C.surfaceSecondary,
          opacity,
        }}
      />
    </View>
  );
}

export function MedicineCardSkeleton() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? DARK_COLORS : COLORS;

  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <SkeletonLine width={40} height={40} style={{ borderRadius: 20 }} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonLine width="60%" height={16} />
        <SkeletonLine width="40%" height={12} />
      </View>

      <SkeletonLine width={64} height={32} style={{ borderRadius: 16 }} />
    </View>
  );
}
