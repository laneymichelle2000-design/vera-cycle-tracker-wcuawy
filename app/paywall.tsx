/**
 * Paywall Screen — Vera Cycle
 *
 * On-brand rose pink paywall with Nunito fonts.
 * Shows subscription options and handles purchases.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PurchasesPackage } from "react-native-purchases";

import { useSubscription } from "@/contexts/SubscriptionContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const FEATURES = [
  {
    icon: "💊",
    title: "Unlimited Medicines",
    description: "Track as many medicines & supplements as you need",
  },
  {
    icon: "📊",
    title: "Cycle Analytics",
    description: "Detailed insights and trends for your cycle history",
  },
  {
    icon: "📤",
    title: "Export History",
    description: "Export your health data as PDF or CSV anytime",
  },
  {
    icon: "🔔",
    title: "Smart Reminders",
    description: "Advanced reminder scheduling with custom intervals",
  },
];

export default function PaywallScreen() {
  const router = useRouter();

  const {
    packages,
    loading,
    isSubscribed,
    isWeb,
    purchasePackage,
    restorePurchases,
    mockWebPurchase,
    mockNativePurchase,
  } = useSubscription();

  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(packages[0] || null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [webMockState, setWebMockState] = useState<"idle" | "processing">("idle");
  const [webMockDialogState, setWebMockDialogState] = useState<"hidden" | "selecting" | "failed">("hidden");

  React.useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      setSelectedPackage(packages[0]);
    }
  }, [packages, selectedPackage]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    console.log('[Paywall] Subscribe button pressed, package:', selectedPackage.identifier);
    try {
      setPurchasing(true);
      const success = await purchasePackage(selectedPackage);
      console.log('[Paywall] Purchase result:', success);
      if (success) {
        Alert.alert("Welcome to Vera Pro! 🌸", "Your subscription is now active.", [
          { text: "Let's go!", onPress: () => router.replace("/(tabs)/(today)") },
        ]);
      }
    } catch (error: any) {
      console.error('[Paywall] Purchase failed:', error);
      Alert.alert("Purchase Failed", error.message || "Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    console.log('[Paywall] Restore purchases pressed');
    try {
      setRestoring(true);
      const restored = await restorePurchases();
      console.log('[Paywall] Restore result:', restored);
      if (restored) {
        Alert.alert("Restored! 🌸", "Your subscription has been restored.", [
          { text: "Continue", onPress: () => router.replace("/(tabs)/(today)") },
        ]);
      } else {
        Alert.alert("No Purchases Found", "We couldn't find any previous purchases.");
      }
    } catch (error: any) {
      console.error('[Paywall] Restore failed:', error);
      Alert.alert("Restore Failed", error.message || "Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const handleClose = () => {
    console.log('[Paywall] Close/continue pressed');
    router.replace("/(tabs)/(today)");
  };

  const handleWebMockPurchase = async () => {
    if (!selectedPackage) return;
    console.log('[Paywall] Web mock purchase initiated');
    setWebMockState("processing");
    await new Promise((resolve) => setTimeout(resolve, 400));
    setWebMockState("idle");
    setWebMockDialogState("selecting");
  };

  // Already subscribed
  if (isSubscribed) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#D4607A", "#C04868", "#A83058"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        >
          <View style={[styles.floatingOrb, styles.orb1]} />
          <View style={[styles.floatingOrb, styles.orb2]} />

          <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.subscribedContent}>
              <View style={styles.celebrationContainer}>
                <View style={styles.celebrationGlow} />
                <Text style={styles.celebrationIcon}>🌸</Text>
              </View>

              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>VERA PRO</Text>
              </View>

              <Text style={styles.subscribedTitle}>You're All Set!</Text>
              <Text style={styles.subscribedSubtitle}>
                Welcome to your premium health journey
              </Text>

              <View style={styles.featuresCard}>
                <Text style={styles.featuresCardLabel}>Unlocked Features</Text>
                {FEATURES.slice(0, 3).map((feature, index) => (
                  <View key={index} style={styles.featureCheckRow}>
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                    <Text style={styles.featureCheckText}>{feature.title}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.exploreButton} onPress={handleClose}>
                <Text style={styles.exploreButtonText}>Start Exploring</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#D4607A", "#C04868", "#A83058"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        >
          <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
            <View style={styles.centeredContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading plans…</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#D4607A", "#C04868", "#A83058"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      >
        {/* Decorative orbs */}
        <View style={[styles.floatingOrb, styles.orb1]} />
        <View style={[styles.floatingOrb, styles.orb2]} />
        <View style={[styles.floatingOrb, styles.orb3]} />

        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>✦ VERA PRO ✦</Text>
              </View>
              <Text style={styles.title}>Unlock Your Full{"\n"}Health Journey</Text>
              <Text style={styles.subtitle}>
                Everything you need to track, understand, and care for your body
              </Text>
            </View>

            {/* Features */}
            <View style={styles.featuresCard}>
              <Text style={styles.featuresCardLabel}>What You'll Get</Text>
              {FEATURES.map((feature, index) => {
                const iconBg = [
                  "rgba(255,200,210,0.25)",
                  "rgba(255,180,200,0.25)",
                  "rgba(255,160,190,0.25)",
                  "rgba(255,140,180,0.25)",
                ];
                const bg = iconBg[index % iconBg.length];
                return (
                  <View key={index} style={styles.featureRow}>
                    <View style={[styles.featureIconBox, { backgroundColor: bg }]}>
                      <Text style={styles.featureIconText}>{feature.icon}</Text>
                    </View>
                    <View style={styles.featureTextBox}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Package Selection */}
            {packages.length > 0 && (
              <View style={styles.packagesContainer}>
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.identifier === pkg.identifier;
                  return (
                    <TouchableOpacity
                      key={pkg.identifier}
                      style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                      onPress={() => {
                        console.log('[Paywall] Package selected:', pkg.identifier);
                        setSelectedPackage(pkg);
                      }}
                    >
                      {isSelected && <View style={styles.selectedBar} />}
                      <View style={styles.packageHeader}>
                        <Text style={styles.packageTitle}>{pkg.product.title}</Text>
                        {isSelected && (
                          <View style={styles.checkmarkCircle}>
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                        )}
                      </View>
                      {pkg.product.priceString ? (
                        <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                      ) : null}
                      {pkg.product.description ? (
                        <Text style={styles.packageDescription}>{pkg.product.description}</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* No packages (Expo Go) */}
            {!isWeb && packages.length === 0 && !loading && (
              <View style={styles.noPackagesContainer}>
                <Text style={styles.noPackagesText}>
                  Purchases are not available in standard Expo Go.
                </Text>
                <Text style={[styles.noPackagesText, { marginTop: 8, opacity: 0.7 }]}>
                  Use a development build to test purchases.
                </Text>
                {__DEV__ && (
                  <TouchableOpacity
                    style={styles.devMockButton}
                    onPress={async () => {
                      console.log('[Paywall] Dev: simulate purchase');
                      await mockNativePurchase();
                      router.replace("/(tabs)/(today)");
                    }}
                  >
                    <Text style={styles.devMockButtonText}>Dev: Simulate Purchase</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {isWeb ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (!selectedPackage || webMockState === "processing") && styles.buttonDisabled,
                  ]}
                  onPress={handleWebMockPurchase}
                  disabled={!selectedPackage || webMockState === "processing"}
                >
                  {webMockState === "processing" ? (
                    <ActivityIndicator color="#D4607A" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {selectedPackage
                        ? selectedPackage.product.priceString
                          ? `Subscribe for ${selectedPackage.product.priceString}`
                          : "Subscribe"
                        : "Select a plan"}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleRestore} disabled={restoring}>
                  {restoring ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.legalText}>Preview mode — purchases available in the mobile app</Text>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (!selectedPackage || purchasing) && styles.buttonDisabled,
                  ]}
                  onPress={handlePurchase}
                  disabled={!selectedPackage || purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#D4607A" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {selectedPackage
                        ? selectedPackage.product.priceString
                          ? `Subscribe for ${selectedPackage.product.priceString}`
                          : "Subscribe"
                        : "Select a plan"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleRestore} disabled={restoring}>
                  {restoring ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.legalText}>
                  Payment will be charged to your{" "}
                  {Platform.OS === "ios" ? "Apple ID" : "Google Play"} account.
                  Subscription automatically renews unless canceled at least 24 hours
                  before the end of the current period.
                </Text>
              </>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Web mock dialog */}
      {isWeb && webMockDialogState !== "hidden" && (
        <View style={styles.webDialogOverlay}>
          <View style={styles.webDialogBox}>
            {webMockDialogState === "selecting" && (
              <>
                <Text style={styles.webDialogTitle}>Test Purchase</Text>
                <Text style={styles.webDialogBody}>
                  {`⚠️ This is a test purchase for development only.\n\nPackage: ${selectedPackage?.identifier}\nPrice: ${selectedPackage?.product.priceString || "N/A"}`}
                </Text>
                <View style={styles.webDialogDivider} />
                <TouchableOpacity style={styles.webDialogButton} onPress={() => setWebMockDialogState("failed")}>
                  <Text style={[styles.webDialogButtonText, { color: "#FF3B30" }]}>Test Failed Purchase</Text>
                </TouchableOpacity>
                <View style={styles.webDialogDivider} />
                <TouchableOpacity
                  style={styles.webDialogButton}
                  onPress={() => {
                    setWebMockDialogState("hidden");
                    mockWebPurchase();
                    router.replace("/(tabs)/(today)");
                  }}
                >
                  <Text style={[styles.webDialogButtonText, { color: "#D4607A" }]}>Test Valid Purchase</Text>
                </TouchableOpacity>
                <View style={styles.webDialogDivider} />
                <TouchableOpacity style={styles.webDialogButton} onPress={() => setWebMockDialogState("hidden")}>
                  <Text style={[styles.webDialogButtonText, { color: "#D4607A" }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {webMockDialogState === "failed" && (
              <>
                <Text style={styles.webDialogTitle}>Purchase Failed</Text>
                <Text style={styles.webDialogBody}>Test purchase failure: no real transaction occurred</Text>
                <View style={styles.webDialogDivider} />
                <TouchableOpacity style={styles.webDialogButton} onPress={() => setWebMockDialogState("hidden")}>
                  <Text style={[styles.webDialogButtonText, { color: "#D4607A" }]}>OK</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontFamily: "Nunito-Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
  },
  floatingOrb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  orb1: { width: 220, height: 220, top: -60, right: -60 },
  orb2: { width: 160, height: 160, bottom: 80, left: -50 },
  orb3: { width: 100, height: 100, top: SCREEN_HEIGHT * 0.35, right: 10 },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Nunito-Bold",
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 48, paddingBottom: 16 },

  // Header
  header: { alignItems: "center", marginBottom: 28 },
  premiumBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  premiumBadgeText: {
    fontFamily: "Nunito-ExtraBold",
    fontSize: 11,
    color: "#fff",
    letterSpacing: 2,
  },
  title: {
    fontFamily: "Nunito-ExtraBold",
    fontSize: 30,
    color: "#fff",
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: "Nunito-Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 22,
  },

  // Features card
  featuresCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  featuresCardLabel: {
    fontFamily: "Nunito-Bold",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 16,
    textAlign: "center",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  featureIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  featureIconText: { fontSize: 20 },
  featureTextBox: { flex: 1 },
  featureTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 15,
    color: "#fff",
  },
  featureDescription: {
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
    lineHeight: 18,
  },

  // Packages
  packagesContainer: { gap: 10, marginBottom: 8 },
  packageCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  packageCardSelected: {
    borderColor: "#fff",
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  selectedBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#fff",
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packageTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 17,
    color: "#fff",
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    fontFamily: "Nunito-Bold",
    fontSize: 13,
    color: "#fff",
  },
  packagePrice: {
    fontFamily: "Nunito-ExtraBold",
    fontSize: 24,
    color: "#fff",
    marginTop: 6,
  },
  packageDescription: {
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },

  // No packages
  noPackagesContainer: { padding: 24, alignItems: "center" },
  noPackagesText: {
    fontFamily: "Nunito-Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  devMockButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    borderStyle: "dashed",
    alignItems: "center",
  },
  devMockButtonText: {
    fontFamily: "Nunito-Regular",
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textAlign: "center",
  },

  // Bottom actions
  bottomActions: {
    padding: 24,
    paddingBottom: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    fontFamily: "Nunito-ExtraBold",
    color: "#D4607A",
    fontSize: 17,
  },
  buttonDisabled: { opacity: 0.6 },
  secondaryButton: { paddingVertical: 10, alignItems: "center" },
  secondaryButtonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
  },
  legalText: {
    fontFamily: "Nunito-Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 16,
  },

  // Web dialog
  webDialogOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  webDialogBox: {
    backgroundColor: "#f2f2f7",
    borderRadius: 14,
    width: "85%",
    maxWidth: 400,
    overflow: "hidden",
  },
  webDialogTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 17,
    color: "#000",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
  webDialogBody: {
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    color: "#000",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
    lineHeight: 18,
  },
  webDialogDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.15)" },
  webDialogButton: { paddingVertical: 14, alignItems: "center" },
  webDialogButtonText: { fontFamily: "Nunito-SemiBold", fontSize: 17 },

  // Subscribed celebration
  subscribedContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  celebrationContainer: {
    position: "relative",
    marginBottom: 20,
  },
  celebrationGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.15)",
    top: -20,
    left: -20,
  },
  celebrationIcon: { fontSize: 80 },
  proBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  proBadgeText: {
    fontFamily: "Nunito-ExtraBold",
    fontSize: 11,
    color: "#fff",
    letterSpacing: 2,
  },
  subscribedTitle: {
    fontFamily: "Nunito-ExtraBold",
    fontSize: 32,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subscribedSubtitle: {
    fontFamily: "Nunito-Regular",
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 32,
  },
  featureCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkMark: {
    fontFamily: "Nunito-Bold",
    fontSize: 13,
    color: "#fff",
  },
  featureCheckText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  exploreButton: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 16,
  },
  exploreButtonText: {
    fontFamily: "Nunito-ExtraBold",
    color: "#fff",
    fontSize: 17,
  },
});
