import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine, DoseLog, CycleEntry, HealthNote } from '@/types/models';

export const STORAGE_KEYS = {
  MEDICINES: '@vera_medicines',
  DOSE_LOGS: '@vera_dose_logs',
  CYCLE_ENTRIES: '@vera_cycle_entries',
  HEALTH_NOTES: '@vera_health_notes',
  SEEDED: '@vera_seeded',
};

export async function getMedicines(): Promise<Medicine[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.MEDICINES);
    return raw ? (JSON.parse(raw) as Medicine[]) : [];
  } catch {
    return [];
  }
}

export async function saveMedicines(medicines: Medicine[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
}

export async function getDoseLogs(): Promise<DoseLog[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DOSE_LOGS);
    return raw ? (JSON.parse(raw) as DoseLog[]) : [];
  } catch {
    return [];
  }
}

export async function saveDoseLogs(logs: DoseLog[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.DOSE_LOGS, JSON.stringify(logs));
}

export async function getCycleEntries(): Promise<CycleEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CYCLE_ENTRIES);
    return raw ? (JSON.parse(raw) as CycleEntry[]) : [];
  } catch {
    return [];
  }
}

export async function saveCycleEntries(entries: CycleEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_ENTRIES, JSON.stringify(entries));
}

export async function getHealthNotes(): Promise<HealthNote[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_NOTES);
    return raw ? (JSON.parse(raw) as HealthNote[]) : [];
  } catch {
    return [];
  }
}

export async function saveHealthNotes(notes: HealthNote[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_NOTES, JSON.stringify(notes));
}

export async function deleteAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}
