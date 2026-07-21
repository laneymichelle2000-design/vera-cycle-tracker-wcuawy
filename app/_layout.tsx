import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, Redirect, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { SubscriptionProvider, useSubscription } from "@/contexts/SubscriptionContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { seedIfNeeded } from "@/utils/seedData";
import { requestNotificationPermissions, rescheduleAllMedicines } from "@/utils/notifications";
import { getMedicines } from "@/utils/storage";
import { isOnboardingComplete } from "@/utils/onboardingStorage";

const DevErrorBoundary = __DEV__
  ? ErrorBoundary
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};


function SubscriptionRedirect() {
  const { isSubscribed, loading } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const onOnboarding = pathname.startsWith("/onboarding");
    if (onOnboarding) return;

    let cancelled = false;
    isOnboardingComplete().then((done) => {
      if (cancelled) return;
      if (!done) return;
      const onPaywall = pathname === "/paywall";
      if (onPaywall) return;
      if (!isSubscribed) {
        router.replace("/paywall");
      }
    }).catch(() => {
      if (cancelled) return;
      const onPaywall = pathname === "/paywall";
      if (onPaywall) return;
      if (!isSubscribed) {
        router.replace("/paywall");
      }
    });
    return () => { cancelled = true; };
  }, [isSubscribed, loading, pathname]);

  return null;
}

export default function RootLayout() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    isOnboardingComplete().then((complete) => {
      setOnboardingComplete(complete);
    });
  }, [pathname]);

  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    "Nunito-Regular": require("../assets/fonts/Nunito-Regular.ttf"),
    "Nunito-Medium": require("../assets/fonts/Nunito-Medium.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito-SemiBold.ttf"),
    "Nunito-Bold": require("../assets/fonts/Nunito-Bold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      seedIfNeeded();
      SplashScreen.hideAsync();

      // Request notification permissions and resync all alarms on launch
      (async () => {
        console.log('[Layout] Requesting notification permissions on app launch');
        await requestNotificationPermissions();
        console.log('[Layout] Fetching medicines to resync notification alarms');
        const medicines = await getMedicines();
        console.log('[Layout] Rescheduling notifications for', medicines.length, 'medicines');
        await rescheduleAllMedicines(medicines);
      })();
    }
  }, [loaded]);

  useEffect(() => {
    // Navigate to today tab when a notification is tapped
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Layout] Notification tapped, identifier:', response.notification.request.identifier, 'data:', response.notification.request.content.data);
      router.push('/(tabs)/(today)');
    });
    return () => subscription.remove();
  }, [router]);

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: '#D4607A',
      background: '#FDF8F8',
      card: '#FFFFFF',
      text: '#1A0F0F',
      border: 'rgba(212,96,122,0.10)',
      notification: '#D44040',
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: '#E07090',
      background: '#1A0F0F',
      card: '#261515',
      text: '#F5EEED',
      border: 'rgba(224,112,144,0.12)',
      notification: '#E05050',
    },
  };

  if (!loaded || onboardingComplete === null) return null;

  return (
    <NotificationProvider>
      <SubscriptionProvider>
          <SubscriptionRedirect />
      <DevErrorBoundary>
      <StatusBar style="auto" animated />
      <ThemeProvider value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}>
        <SafeAreaProvider>
          <WidgetProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              {onboardingComplete === false && pathname !== "/auth" && pathname !== "/paywall" && pathname !== "/auth-popup" && pathname !== "/auth-callback" && <Redirect href="/onboarding" />}

              <Stack>
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />

                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="medicine/add"
                  options={{
                    presentation: 'formSheet',
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.85, 1.0],
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="note/add"
                  options={{
                    presentation: 'formSheet',
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.6, 1.0],
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="notification-preferences"
                  options={{
                    title: 'Notifications',
                    presentation: 'modal',
                    headerShown: true,
                  }}
                />
              </Stack>
              <SystemBars style={"auto"} />
            </GestureHandlerRootView>
          </WidgetProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </DevErrorBoundary>
    </SubscriptionProvider>
    </NotificationProvider>
  );
}
