import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Pill, CalendarDays, ClipboardList, Bell } from "lucide-react-native";
import { COLORS, DARK_COLORS } from "@/constants/AppColors";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { NotificationBell } from "@/components/NotificationBell";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === "dark" ? DARK_COLORS : COLORS;
  const router = useRouter();

  const features = [
    {
      icon: <Pill size={28} color={C.primary} />,
      title: "Medicine Tracker",
      description: "Log your daily pills and birth control on time, every time.",
      route: "/(tabs)/(today)" as const,
    },
    {
      icon: <CalendarDays size={28} color={C.primary} />,
      title: "Cycle Calendar",
      description: "Track your flow, symptoms, and mood across your cycle.",
      route: "/(tabs)/(cycle)" as const,
    },
    {
      icon: <ClipboardList size={28} color={C.primary} />,
      title: "Health History",
      description: "Review your full dose and cycle history in one place.",
      route: "/(tabs)/(history)" as const,
    },
    {
      icon: <Bell size={28} color={C.primary} />,
      title: "Smart Reminders",
      description: "Get daily notifications so you never miss a dose.",
      route: "/(tabs)/(today)" as const,
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: C.text }]}>Home</Text>
        <NotificationBell variant="compact" size={26} />
      </View>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: C.primaryMuted }]}>
        <Text style={[styles.heroEmoji]}>🌸</Text>
        <Text style={[styles.heroTitle, { color: C.primary }]}>Vera Cycle</Text>
        <Text style={[styles.heroSubtitle, { color: C.textSecondary }]}>
          Your personal medicine & cycle companion
        </Text>
      </View>

      {/* Feature cards */}
      <Text style={[styles.sectionTitle, { color: C.text }]}>
        Everything you need
      </Text>

      {features.map((f, i) => (
        <AnimatedPressable
          key={i}
          onPress={() => router.push(f.route)}
          style={[
            styles.card,
            { backgroundColor: C.surface, borderColor: C.border },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: C.primaryMuted }]}>
            {f.icon}
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: C.text }]}>{f.title}</Text>
            <Text style={[styles.cardDesc, { color: C.textSecondary }]}>
              {f.description}
            </Text>
          </View>
        </AnimatedPressable>
      ))}

      <Text style={[styles.footer, { color: C.textTertiary }]}>
        Vera Cycle — made for you 💕
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  hero: {
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 12,
  },
});
