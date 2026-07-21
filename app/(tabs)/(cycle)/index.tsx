import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  useColorScheme,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { COLORS, DARK_COLORS } from '@/constants/AppColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { getCycleEntries, getDoseLogs, getMedicines } from '@/utils/storage';
import { today, getDaysInMonth, getFirstDayOfMonth, offsetToMonday, formatDate } from '@/utils/dateHelpers';
import { CycleEntry, DoseLog, Medicine } from '@/types/models';

const FLOW_COLORS: Record<CycleEntry['flow'], string> = {
  none: 'transparent',
  spotting: '#F0B8C0',
  light: '#E8849A',
  medium: '#D4607A',
  heavy: '#A03050',
};

const FLOW_LABELS: Record<CycleEntry['flow'], string> = {
  none: 'None',
  spotting: 'Spotting',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SYMPTOM_LABELS: Record<string, string> = {
  cramps: 'Cramps',
  headache: 'Headache',
  bloating: 'Bloating',
  mood: 'Mood swings',
  fatigue: 'Fatigue',
  tender: 'Tender',
};

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

export default function CycleScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? DARK_COLORS : COLORS;

  const todayStr = today();
  const todayDate = new Date(todayStr + 'T00:00:00');

  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [cycleEntries, setCycleEntries] = useState<CycleEntry[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    console.log('[Cycle] Loading cycle data');
    try {
      const [entries, logs, meds] = await Promise.all([
        getCycleEntries(),
        getDoseLogs(),
        getMedicines(),
      ]);
      setCycleEntries(entries);
      setDoseLogs(logs);
      setMedicines(meds);
    } catch (e) {
      console.error('[Cycle] Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePrevMonth = () => {
    console.log('[Cycle] Navigate to previous month');
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    console.log('[Cycle] Navigate to next month');
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayPress = (dateStr: string) => {
    console.log('[Cycle] Day pressed:', dateStr);
    setSelectedDay(dateStr);
    setModalVisible(true);
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = offsetToMonday(getFirstDayOfMonth(viewYear, viewMonth));

  const calendarCells: (string | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const month = String(viewMonth + 1).padStart(2, '0');
    const day = String(d).padStart(2, '0');
    calendarCells.push(`${viewYear}-${month}-${day}`);
  }

  const entryMap: Record<string, CycleEntry> = {};
  cycleEntries.forEach((e) => { entryMap[e.date] = e; });

  const logsByDate: Record<string, DoseLog[]> = {};
  doseLogs.forEach((l) => {
    if (!logsByDate[l.date]) logsByDate[l.date] = [];
    logsByDate[l.date].push(l);
  });

  // Cycle stats
  const periodDates = cycleEntries
    .filter((e) => e.flow !== 'none')
    .map((e) => e.date)
    .sort();

  const cycleDay = periodDates.length > 0
    ? Math.floor((new Date(todayStr).getTime() - new Date(periodDates[periodDates.length - 1]).getTime()) / 86400000) + 1
    : null;

  const avgLength = 28; // simplified
  const lastPeriodStart = periodDates.length > 0 ? periodDates[periodDates.length - 1] : null;
  const nextPeriodDate = lastPeriodStart
    ? new Date(new Date(lastPeriodStart).getTime() + avgLength * 86400000)
    : null;
  const nextPeriodStr = nextPeriodDate
    ? nextPeriodDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  // Symptom frequency this month
  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthEntries = cycleEntries.filter((e) => e.date.startsWith(monthStr));
  const symptomCounts: Record<string, number> = {};
  monthEntries.forEach((e) => {
    (e.symptoms ?? []).forEach((s) => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });
  const sortedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = sortedSymptoms[0]?.[1] || 1;

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Selected day data
  const selectedEntry = selectedDay ? entryMap[selectedDay] : null;
  const selectedLogs = selectedDay ? (logsByDate[selectedDay] || []) : [];

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row */}
        <AnimatedListItem index={0}>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            {[
              { label: 'Cycle Day', value: cycleDay !== null ? `Day ${cycleDay}` : '—' },
              { label: 'Avg Length', value: `${avgLength} days` },
              { label: 'Next Period', value: nextPeriodStr },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: C.surface,
                  borderRadius: 16,
                  padding: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: C.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text style={{ fontFamily: 'Nunito-ExtraBold', fontSize: 18, color: C.primary }}>
                  {stat.value}
                </Text>
                <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 11, color: C.textSecondary, marginTop: 4, textAlign: 'center' }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </AnimatedListItem>

        {/* Calendar */}
        <AnimatedListItem index={1}>
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: C.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {/* Month nav */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <AnimatedPressable onPress={handlePrevMonth} style={{ padding: 8 }}>
                <ChevronLeft size={20} color={C.textSecondary} />
              </AnimatedPressable>
              <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 16, color: C.text }}>
                {monthName}
              </Text>
              <AnimatedPressable onPress={handleNextMonth} style={{ padding: 8 }}>
                <ChevronRight size={20} color={C.textSecondary} />
              </AnimatedPressable>
            </View>

            {/* Day headers */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {DAY_HEADERS.map((d) => (
                <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 11, color: C.textTertiary }}>
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {calendarCells.map((dateStr, idx) => {
                if (!dateStr) {
                  return <View key={`empty-${idx}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
                }

                const entry = entryMap[dateStr];
                const dayLogs = logsByDate[dateStr] || [];
                const isToday = dateStr === todayStr;
                const hasTaken = dayLogs.some((l) => l.status === 'taken');
                const hasMissed = dayLogs.some((l) => l.status === 'missed');
                const flowColor = entry ? FLOW_COLORS[entry.flow] : 'transparent';
                const hasFlow = entry && entry.flow !== 'none';
                const dayNum = parseInt(dateStr.split('-')[2], 10);

                return (
                  <AnimatedPressable
                    key={dateStr}
                    onPress={() => handleDayPress(dateStr)}
                    scaleValue={0.9}
                    style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: hasFlow ? flowColor : 'transparent',
                        borderWidth: isToday ? 2 : 0,
                        borderColor: C.primary,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: isToday ? 'Nunito-Bold' : 'Nunito-Regular',
                          fontSize: 13,
                          color: isToday ? C.primary : hasFlow ? '#FFFFFF' : C.text,
                        }}
                      >
                        {dayNum}
                      </Text>
                    </View>
                    {/* Dose dots */}
                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 2, height: 5 }}>
                      {hasTaken && (
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.success }} />
                      )}
                      {hasMissed && (
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.danger }} />
                      )}
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>

            {/* Legend */}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { color: C.success, label: 'Dose taken' },
                { color: C.danger, label: 'Dose missed' },
                { color: '#D4607A', label: 'Period' },
              ].map((item) => (
                <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                  <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 11, color: C.textSecondary }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </AnimatedListItem>

        {/* Symptom frequency */}
        {sortedSymptoms.length > 0 && (
          <AnimatedListItem index={2}>
            <View
              style={{
                backgroundColor: C.surface,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: C.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 18, color: C.text, marginBottom: 16 }}>
                Symptoms This Month
              </Text>
              <View style={{ gap: 12 }}>
                {sortedSymptoms.map(([symptom, count]) => {
                  const barWidth = (count / maxCount) * 100;
                  const label = SYMPTOM_LABELS[symptom] || symptom;
                  return (
                    <View key={symptom}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontFamily: 'Nunito-Medium', fontSize: 13, color: C.text }}>
                          {label}
                        </Text>
                        <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 13, color: C.primary }}>
                          {count}
                        </Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: C.surfaceSecondary, borderRadius: 4 }}>
                        <View
                          style={{
                            height: 8,
                            width: `${barWidth}%`,
                            backgroundColor: C.primary,
                            borderRadius: 4,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </AnimatedListItem>
        )}
      </ScrollView>

      {/* Day detail modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View
            style={{
              backgroundColor: C.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 40,
              maxHeight: '70%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 18, color: C.text }}>
                {selectedDay ? formatDate(selectedDay) : ''}
              </Text>
              <AnimatedPressable
                onPress={() => {
                  console.log('[Cycle] Day detail modal closed');
                  setModalVisible(false);
                }}
                style={{ padding: 8 }}
              >
                <X size={20} color={C.textSecondary} />
              </AnimatedPressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedEntry ? (
                <View style={{ gap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: FLOW_COLORS[selectedEntry.flow],
                        borderWidth: selectedEntry.flow === 'none' ? 1 : 0,
                        borderColor: C.border,
                      }}
                    />
                    <Text style={{ fontFamily: 'Nunito-Medium', fontSize: 15, color: C.text }}>
                      Flow: {FLOW_LABELS[selectedEntry.flow]}
                    </Text>
                  </View>

                  {(selectedEntry.symptoms ?? []).length > 0 && (
                    <View>
                      <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
                        Symptoms
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {(selectedEntry.symptoms ?? []).map((s) => (
                          <View
                            key={s}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              backgroundColor: C.primaryMuted,
                            }}
                          >
                            <Text style={{ fontFamily: 'Nunito-Medium', fontSize: 13, color: C.primary }}>
                              {SYMPTOM_LABELS[s] || s}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedEntry.mood && (
                    <Text style={{ fontFamily: 'Nunito-Medium', fontSize: 15, color: C.text }}>
                      Mood: {selectedEntry.mood.charAt(0).toUpperCase() + selectedEntry.mood.slice(1)}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 15, color: C.textSecondary }}>
                  No cycle data logged for this day.
                </Text>
              )}

              {selectedLogs.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
                    Doses
                  </Text>
                  {selectedLogs.map((log) => {
                    const med = medicines.find((m) => m.id === log.medicineId);
                    const statusColor = log.status === 'taken' ? C.success : log.status === 'missed' ? C.danger : C.textTertiary;
                    return (
                      <View
                        key={log.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingVertical: 8,
                          borderBottomWidth: 1,
                          borderBottomColor: C.divider,
                        }}
                      >
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: med?.color || C.primary }} />
                        <Text style={{ fontFamily: 'Nunito-Medium', fontSize: 14, color: C.text, flex: 1 }}>
                          {med?.name || 'Unknown'}
                        </Text>
                        <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 13, color: statusColor }}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
