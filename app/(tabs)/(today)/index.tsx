import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  useColorScheme,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Check, Pill, SkipForward } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, DARK_COLORS } from '@/constants/AppColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { MedicineCardSkeleton } from '@/components/SkeletonLoader';
import { getMedicines, getDoseLogs, saveDoseLogs, getCycleEntries, saveCycleEntries } from '@/utils/storage';
import { today, formatDateLong, formatTime, getGreeting } from '@/utils/dateHelpers';
import { Medicine, DoseLog, CycleEntry } from '@/types/models';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FLOW_OPTIONS: { key: CycleEntry['flow']; label: string; color: string }[] = [
  { key: 'none', label: 'None', color: '#E0D0D0' },
  { key: 'spotting', label: 'Spotting', color: '#F0B8C0' },
  { key: 'light', label: 'Light', color: '#E8849A' },
  { key: 'medium', label: 'Medium', color: '#D4607A' },
  { key: 'heavy', label: 'Heavy', color: '#A03050' },
];

const SYMPTOM_OPTIONS = [
  { key: 'cramps', label: 'Cramps' },
  { key: 'headache', label: 'Headache' },
  { key: 'bloating', label: 'Bloating' },
  { key: 'mood', label: 'Mood swings' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'tender', label: 'Tender' },
];

const MOOD_OPTIONS: { key: NonNullable<CycleEntry['mood']>; emoji: string; label: string }[] = [
  { key: 'great', emoji: '😊', label: 'Great' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'bad', emoji: '😔', label: 'Bad' },
];

interface MedicineWithLog {
  medicine: Medicine;
  log: DoseLog | null;
}

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? DARK_COLORS : COLORS;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [medicinesWithLogs, setMedicinesWithLogs] = useState<MedicineWithLog[]>([]);
  const [cycleEntry, setCycleEntry] = useState<CycleEntry | null>(null);

  const todayStr = today();
  const greeting = getGreeting();
  const dateLabel = formatDateLong(todayStr);

  const loadData = useCallback(async () => {
    console.log('[Today] Loading data for', todayStr);
    try {
      const [medicines, logs, cycleEntries] = await Promise.all([
        getMedicines(),
        getDoseLogs(),
        getCycleEntries(),
      ]);

      const activeMeds = medicines.filter((m) => m.active);
      const todayLogs = logs.filter((l) => l.date === todayStr);

      const pairs: MedicineWithLog[] = activeMeds.map((med) => {
        const log = todayLogs.find((l) => l.medicineId === med.id) || null;
        return { medicine: med, log };
      });

      setMedicinesWithLogs(pairs);

      const entry = cycleEntries.find((e) => e.date === todayStr) || null;
      setCycleEntry(entry);
    } catch (e) {
      console.error('[Today] Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleMarkTaken = async (med: Medicine, existingLog: DoseLog | null) => {
    console.log('[Today] Mark taken pressed for medicine:', med.name, 'id:', med.id);
    if (existingLog?.status === 'taken') return;

    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const now = new Date().toISOString();
    const logId = existingLog?.id || `log_${Date.now()}_${med.id}`;

    const newLog: DoseLog = {
      id: logId,
      medicineId: med.id,
      scheduledTime: `${todayStr}T${med.times[0] || '08:00'}:00.000Z`,
      takenAt: now,
      status: 'taken',
      date: todayStr,
    };

    console.log('[Today] Saving dose log:', newLog);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setMedicinesWithLogs((prev) =>
      prev.map((item) =>
        item.medicine.id === med.id ? { ...item, log: newLog } : item
      )
    );

    try {
      const allLogs = await getDoseLogs();
      const filtered = allLogs.filter((l) => !(l.date === todayStr && l.medicineId === med.id));
      await saveDoseLogs([...filtered, newLog]);
      console.log('[Today] Dose log saved successfully');
    } catch (e) {
      console.error('[Today] Failed to save dose log:', e);
    }
  };

  const handleSkip = async (med: Medicine) => {
    console.log('[Today] Skip pressed for medicine:', med.name);
    const logId = `log_${Date.now()}_${med.id}`;
    const newLog: DoseLog = {
      id: logId,
      medicineId: med.id,
      scheduledTime: `${todayStr}T${med.times[0] || '08:00'}:00.000Z`,
      takenAt: null,
      status: 'skipped',
      date: todayStr,
    };

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMedicinesWithLogs((prev) =>
      prev.map((item) =>
        item.medicine.id === med.id ? { ...item, log: newLog } : item
      )
    );

    try {
      const allLogs = await getDoseLogs();
      const filtered = allLogs.filter((l) => !(l.date === todayStr && l.medicineId === med.id));
      await saveDoseLogs([...filtered, newLog]);
    } catch (e) {
      console.error('[Today] Failed to save skip log:', e);
    }
  };

  const handleFlowChange = async (flow: CycleEntry['flow']) => {
    console.log('[Today] Flow changed to:', flow);
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }

    const updated: CycleEntry = cycleEntry
      ? { ...cycleEntry, flow }
      : {
          id: `cycle_${Date.now()}`,
          date: todayStr,
          flow,
          symptoms: [],
          mood: null,
          notes: '',
        };

    setCycleEntry(updated);

    try {
      const all = await getCycleEntries();
      const filtered = all.filter((e) => e.date !== todayStr);
      await saveCycleEntries([...filtered, updated]);
    } catch (e) {
      console.error('[Today] Failed to save cycle entry:', e);
    }
  };

  const handleSymptomToggle = async (symptom: string) => {
    console.log('[Today] Symptom toggled:', symptom);
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }

    const current = cycleEntry?.symptoms || [];
    const newSymptoms = current.includes(symptom)
      ? current.filter((s) => s !== symptom)
      : [...current, symptom];

    const updated: CycleEntry = cycleEntry
      ? { ...cycleEntry, symptoms: newSymptoms }
      : {
          id: `cycle_${Date.now()}`,
          date: todayStr,
          flow: 'none',
          symptoms: newSymptoms,
          mood: null,
          notes: '',
        };

    setCycleEntry(updated);

    try {
      const all = await getCycleEntries();
      const filtered = all.filter((e) => e.date !== todayStr);
      await saveCycleEntries([...filtered, updated]);
    } catch (e) {
      console.error('[Today] Failed to save symptoms:', e);
    }
  };

  const handleMoodChange = async (mood: NonNullable<CycleEntry['mood']>) => {
    console.log('[Today] Mood changed to:', mood);
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }

    const updated: CycleEntry = cycleEntry
      ? { ...cycleEntry, mood }
      : {
          id: `cycle_${Date.now()}`,
          date: todayStr,
          flow: 'none',
          symptoms: [],
          mood,
          notes: '',
        };

    setCycleEntry(updated);

    try {
      const all = await getCycleEntries();
      const filtered = all.filter((e) => e.date !== todayStr);
      await saveCycleEntries([...filtered, updated]);
    } catch (e) {
      console.error('[Today] Failed to save mood:', e);
    }
  };

  const handleAddMedicine = () => {
    console.log('[Today] Add medicine button pressed');
    router.push('/medicine/add');
  };

  const handleEditMedicine = (med: Medicine) => {
    console.log('[Today] Edit medicine pressed for:', med.name);
    router.push({ pathname: '/medicine/add', params: { id: med.id } });
  };

  const takenCount = medicinesWithLogs.filter((m) => m.log?.status === 'taken').length;
  const totalCount = medicinesWithLogs.length;
  const progressText = totalCount > 0 ? `${takenCount}/${totalCount} taken` : '';

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Card */}
        <AnimatedListItem index={0}>
          <View
            style={{
              backgroundColor: C.primary,
              borderRadius: 20,
              padding: 20,
              marginTop: 8,
              boxShadow: '0 4px 16px rgba(212,96,122,0.25)',
            }}
          >
            <Text style={{ fontFamily: 'Nunito-ExtraBold', fontSize: 22, color: '#FFFFFF', marginBottom: 4 }}>
              {greeting}
            </Text>
            <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20 }}>
              Consistency is the key to your health journey. ✨
            </Text>
            <Text style={{ fontFamily: 'Nunito-Medium', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
              {dateLabel}
            </Text>
          </View>
        </AnimatedListItem>

        {/* Medicines Section */}
        <AnimatedListItem index={1}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 18, color: C.text }}>
                  Medicines
                </Text>
                {progressText ? (
                  <Text style={{ fontFamily: 'Nunito-Medium', fontSize: 13, color: C.textSecondary, marginTop: 2 }}>
                    {progressText}
                  </Text>
                ) : null}
              </View>
              <AnimatedPressable
                onPress={handleAddMedicine}
                style={{
                  backgroundColor: C.primaryMuted,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Plus size={16} color={C.primary} />
                <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 13, color: C.primary }}>Add</Text>
              </AnimatedPressable>
            </View>

            {loading ? (
              <>
                <MedicineCardSkeleton />
                <MedicineCardSkeleton />
              </>
            ) : medicinesWithLogs.length === 0 ? (
              <View
                style={{
                  backgroundColor: C.surface,
                  borderRadius: 16,
                  padding: 32,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: C.border,
                  borderStyle: 'dashed',
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    backgroundColor: C.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Pill size={28} color={C.primary} />
                </View>
                <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 16, color: C.text, marginBottom: 6 }}>
                  No medicines yet
                </Text>
                <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 }}>
                  Add your first medicine to start tracking your daily doses
                </Text>
                <AnimatedPressable
                  onPress={handleAddMedicine}
                  style={{
                    backgroundColor: C.primary,
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 15, color: '#FFFFFF' }}>
                    Add your first medicine
                  </Text>
                </AnimatedPressable>
              </View>
            ) : (
              medicinesWithLogs.map((item, idx) => (
                <MedicineCard
                  key={item.medicine.id}
                  item={item}
                  index={idx}
                  C={C}
                  onTaken={() => handleMarkTaken(item.medicine, item.log)}
                  onSkip={() => handleSkip(item.medicine)}
                  onEdit={() => handleEditMedicine(item.medicine)}
                />
              ))
            )}
          </View>
        </AnimatedListItem>

        {/* Cycle Section */}
        <AnimatedListItem index={2}>
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: C.border,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 18, color: C.text, marginBottom: 16 }}>
              Today's Cycle
            </Text>

            {/* Flow selector */}
            <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 13, color: C.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Flow
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {FLOW_OPTIONS.map((opt) => {
                const isSelected = cycleEntry?.flow === opt.key;
                return (
                  <AnimatedPressable
                    key={opt.key}
                    onPress={() => handleFlowChange(opt.key)}
                    style={{ flex: 1, alignItems: 'center', gap: 6 }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: opt.color,
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: C.primary,
                        opacity: isSelected ? 1 : 0.6,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: isSelected ? 'Nunito-Bold' : 'Nunito-Regular',
                        fontSize: 10,
                        color: isSelected ? C.primary : C.textTertiary,
                        textAlign: 'center',
                      }}
                    >
                      {opt.label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            {/* Symptoms */}
            <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 13, color: C.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Symptoms
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {SYMPTOM_OPTIONS.map((s) => {
                const isActive = cycleEntry?.symptoms?.includes(s.key) || false;
                return (
                  <AnimatedPressable
                    key={s.key}
                    onPress={() => handleSymptomToggle(s.key)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isActive ? C.primaryMuted : C.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: isActive ? C.primary : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: isActive ? 'Nunito-SemiBold' : 'Nunito-Regular',
                        fontSize: 13,
                        color: isActive ? C.primary : C.textSecondary,
                      }}
                    >
                      {s.label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            {/* Mood */}
            <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 13, color: C.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Mood
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MOOD_OPTIONS.map((m) => {
                const isSelected = cycleEntry?.mood === m.key;
                return (
                  <AnimatedPressable
                    key={m.key}
                    onPress={() => handleMoodChange(m.key)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: isSelected ? C.primaryMuted : C.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: isSelected ? C.primary : 'transparent',
                      gap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                    <Text
                      style={{
                        fontFamily: isSelected ? 'Nunito-SemiBold' : 'Nunito-Regular',
                        fontSize: 11,
                        color: isSelected ? C.primary : C.textSecondary,
                      }}
                    >
                      {m.label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        </AnimatedListItem>
      </ScrollView>

      {/* FAB */}
      <AnimatedPressable
        onPress={handleAddMedicine}
        style={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: C.primary,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(212,96,122,0.4)',
        }}
      >
        <Plus size={24} color="#FFFFFF" />
      </AnimatedPressable>
    </View>
  );
}

interface MedicineCardProps {
  item: MedicineWithLog;
  index: number;
  C: typeof COLORS;
  onTaken: () => void;
  onSkip: () => void;
  onEdit: () => void;
}

function MedicineCard({ item, index, C, onTaken, onSkip, onEdit }: MedicineCardProps) {
  const { medicine, log } = item;
  const isTaken = log?.status === 'taken';
  const isSkipped = log?.status === 'skipped';
  const checkScale = useRef(new Animated.Value(isTaken ? 1 : 0)).current;

  useEffect(() => {
    if (isTaken) {
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 12,
      }).start();
    } else {
      Animated.timing(checkScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isTaken, checkScale]);

  const timeLabel = medicine.times.length > 0 ? formatTime(medicine.times[0]) : '';
  const takenTimeLabel = log?.takenAt ? `Taken at ${formatTime(log.takenAt.substring(11, 16))}` : '';

  const handleLongPress = () => {
    console.log('[MedicineCard] Long press on:', medicine.name);
    Alert.alert(medicine.name, 'What would you like to do?', [
      { text: 'Skip today', onPress: onSkip },
      { text: 'Edit medicine', onPress: onEdit },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <AnimatedListItem index={index}>
      <AnimatedPressable
        onPress={isTaken ? undefined : onTaken}
        onLongPress={handleLongPress}
        style={{
          backgroundColor: C.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: isTaken ? C.success + '40' : C.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Pill dot */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: medicine.color + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: medicine.color,
            }}
          />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 16, color: C.text }} numberOfLines={1}>
            {medicine.name}
          </Text>
          <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 13, color: C.textSecondary, marginTop: 2 }}>
            {medicine.dosage}
            {timeLabel ? ` · ${timeLabel}` : ''}
          </Text>
          {isTaken && takenTimeLabel ? (
            <Text style={{ fontFamily: 'Nunito-Medium', fontSize: 12, color: C.success, marginTop: 2 }}>
              {takenTimeLabel}
            </Text>
          ) : null}
          {isSkipped ? (
            <Text style={{ fontFamily: 'Nunito-Medium', fontSize: 12, color: C.textTertiary, marginTop: 2 }}>
              Skipped today
            </Text>
          ) : null}
        </View>

        {/* Action button */}
        {isTaken ? (
          <Animated.View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: C.successMuted,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: checkScale }],
            }}
          >
            <Check size={20} color={C.success} />
          </Animated.View>
        ) : isSkipped ? (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: C.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SkipForward size={18} color={C.textTertiary} />
          </View>
        ) : (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: C.primaryMuted,
              borderWidth: 1,
              borderColor: C.primary + '30',
            }}
          >
            <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 13, color: C.primary }}>
              Take
            </Text>
          </View>
        )}
      </AnimatedPressable>
    </AnimatedListItem>
  );
}
