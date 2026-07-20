import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine, DoseLog, CycleEntry, HealthNote } from '@/types/models';
import {
  STORAGE_KEYS,
  saveMedicines,
  saveDoseLogs,
  saveCycleEntries,
  saveHealthNotes,
} from '@/utils/storage';
import { today, subtractDays } from '@/utils/dateHelpers';

export async function seedIfNeeded(): Promise<void> {
  try {
    const seeded = await AsyncStorage.getItem(STORAGE_KEYS.SEEDED);
    if (seeded) return;

    const todayStr = today();

    const medicines: Medicine[] = [
      {
        id: 'med_1',
        name: 'Yasmin',
        type: 'pill',
        color: '#D4607A',
        dosage: '1 tablet',
        times: ['08:00'],
        notes: 'Take with food',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const doseLogs: DoseLog[] = [
      {
        id: 'log_1',
        medicineId: 'med_1',
        scheduledTime: `${subtractDays(todayStr, 1)}T08:00:00.000Z`,
        takenAt: `${subtractDays(todayStr, 1)}T08:05:00.000Z`,
        status: 'taken',
        date: subtractDays(todayStr, 1),
      },
      {
        id: 'log_2',
        medicineId: 'med_1',
        scheduledTime: `${subtractDays(todayStr, 2)}T08:00:00.000Z`,
        takenAt: `${subtractDays(todayStr, 2)}T08:12:00.000Z`,
        status: 'taken',
        date: subtractDays(todayStr, 2),
      },
    ];

    const cycleEntries: CycleEntry[] = [
      {
        id: 'cycle_1',
        date: todayStr,
        flow: 'light',
        symptoms: ['cramps'],
        mood: 'good',
        notes: '',
      },
      {
        id: 'cycle_2',
        date: subtractDays(todayStr, 1),
        flow: 'medium',
        symptoms: ['cramps', 'bloating'],
        mood: 'okay',
        notes: '',
      },
      {
        id: 'cycle_3',
        date: subtractDays(todayStr, 2),
        flow: 'heavy',
        symptoms: ['cramps', 'headache', 'mood'],
        mood: 'bad',
        notes: '',
      },
    ];

    const healthNotes: HealthNote[] = [
      {
        id: 'note_1',
        date: todayStr,
        content: 'Feeling a bit tired today but overall okay. Drank plenty of water.',
        tags: ['energy', 'sleep'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'note_2',
        date: subtractDays(todayStr, 1),
        content: 'Mild cramps in the morning, went for a short walk which helped.',
        tags: ['pain', 'exercise'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'note_3',
        date: subtractDays(todayStr, 2),
        content: 'Mood was low. Had some chocolate and watched a movie. Feeling better by evening.',
        tags: ['mood', 'diet'],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    await saveMedicines(medicines);
    await saveDoseLogs(doseLogs);
    await saveCycleEntries(cycleEntries);
    await saveHealthNotes(healthNotes);
    await AsyncStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  } catch (e) {
    console.error('[seedData] Failed to seed:', e);
  }
}
