import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medicine } from '@/types/models';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  console.log('[Notifications] Requesting notification permissions');
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') {
    console.log('[Notifications] Permissions already granted');
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  console.log('[Notifications] Permission request result:', status);
  return status === 'granted';
}

// Schedule daily repeating notifications for every time in medicine.times
// Notification IDs are deterministic: `${medicine.id}_${index}`
export async function scheduleMedicineNotifications(medicine: Medicine): Promise<void> {
  if (Platform.OS === 'web') return;
  console.log('[Notifications] Scheduling notifications for medicine:', medicine.name, 'id:', medicine.id, 'times:', medicine.times);
  // Cancel existing first
  await cancelMedicineNotifications(medicine.id);
  if (!medicine.active) {
    console.log('[Notifications] Medicine is inactive, skipping scheduling:', medicine.name);
    return;
  }

  for (let i = 0; i < medicine.times.length; i++) {
    const timeStr = medicine.times[i];
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    console.log('[Notifications] Scheduling daily notification for', medicine.name, 'at', timeStr, 'identifier:', `${medicine.id}_${i}`);
    await Notifications.scheduleNotificationAsync({
      identifier: `${medicine.id}_${i}`,
      content: {
        title: `Time to take ${medicine.name}`,
        body: medicine.dosage ? `${medicine.dosage} — tap to log your dose` : 'Tap to log your dose',
        data: { medicineId: medicine.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
  console.log('[Notifications] Scheduled', medicine.times.length, 'notification(s) for', medicine.name);
}

export async function cancelMedicineNotifications(medicineId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  console.log('[Notifications] Cancelling notifications for medicineId:', medicineId);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(n => n.identifier.startsWith(`${medicineId}_`));
  console.log('[Notifications] Found', toCancel.length, 'notification(s) to cancel for', medicineId);
  await Promise.all(toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function rescheduleAllMedicines(medicines: Medicine[]): Promise<void> {
  if (Platform.OS === 'web') return;
  console.log('[Notifications] Rescheduling all medicines, count:', medicines.length);
  for (const med of medicines) {
    if (med.active) {
      await scheduleMedicineNotifications(med);
    } else {
      await cancelMedicineNotifications(med.id);
    }
  }
  console.log('[Notifications] Finished rescheduling all medicines');
}

export async function getScheduledNotificationIds(): Promise<string[]> {
  if (Platform.OS === 'web') return [];
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled.map(n => n.identifier);
  console.log('[Notifications] Fetched scheduled notification IDs:', ids);
  return ids;
}

export async function cancelAllMedicineNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  console.log('[Notifications] Cancelling all scheduled notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}
