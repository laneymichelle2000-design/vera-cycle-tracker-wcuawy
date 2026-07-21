import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  useColorScheme,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pill, Calendar, FileText, Plus } from 'lucide-react-native';
import { COLORS, DARK_COLORS } from '@/constants/AppColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { getDoseLogs, getCycleEntries, getHealthNotes, getMedicines } from '@/utils/storage';
import { formatDate, formatTime, formatTimeFromISO } from '@/utils/dateHelpers';
import { DoseLog, CycleEntry, HealthNote, Medicine } from '@/types/models';

type FilterType = 'all' | 'doses' | 'cycle' | 'notes';

interface TimelineItem {
  id: string;
  date: string;
  type: 'dose' | 'cycle' | 'note';
  data: DoseLog | CycleEntry | HealthNote;
}

const FLOW_LABELS: Record<CycleEntry['flow'], string> = {
  none: 'No flow',
  spotting: 'Spotting',
  light: 'Light flow',
  medium: 'Medium flow',
  heavy: 'Heavy flow',
};

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
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: Math.min(index * 40, 400), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay: Math.min(index * 40, 400), useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? DARK_COLORS : COLORS;
  const router = useRouter();

  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const loadData = useCallback(async () => {
    console.log('[History] Loading history data');
    try {
      const [logs, cycleEntries, notes, meds] = await Promise.all([
        getDoseLogs(),
        getCycleEntries(),
        getHealthNotes(),
        getMedicines(),
      ]);

      setMedicines(meds);

      const timeline: TimelineItem[] = [];

      logs.forEach((log) => {
        timeline.push({ id: `dose_${log.id}`, date: log.date, type: 'dose', data: log });
      });

      cycleEntries.forEach((entry) => {
        if (entry.flow !== 'none' || entry.symptoms.length > 0 || entry.mood) {
          timeline.push({ id: `cycle_${entry.id}`, date: entry.date, type: 'cycle', data: entry });
        }
      });

      notes.forEach((note) => {
        timeline.push({ id: `note_${note.id}`, date: note.date, type: 'note', data: note });
      });

      timeline.sort((a, b) => b.date.localeCompare(a.date));
      setItems(timeline);
    } catch (e) {
      console.error('[History] Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadData])
  );

  const handleFilterChange = (f: FilterType) => {
    console.log('[History] Filter changed to:', f);
    setFilter(f);
  };

  const handleAddNote = () => {
    console.log('[History] Add note button pressed');
    router.push('/note/add');
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'doses') return item.type === 'dose';
    if (filter === 'cycle') return item.type === 'cycle';
    if (filter === 'notes') return item.type === 'note';
    return true;
  });

  // Group by date
  const grouped: Record<string, TimelineItem[]> = {};
  filteredItems.forEach((item) => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'doses', label: 'Doses' },
    { key: 'cycle', label: 'Cycle' },
    { key: 'notes', label: 'Notes' },
  ];

  let itemIndex = 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <AnimatedPressable
                key={f.key}
                onPress={() => handleFilterChange(f.key)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isActive ? C.primary : C.surface,
                  borderWidth: 1,
                  borderColor: isActive ? C.primary : C.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: isActive ? 'Nunito-SemiBold' : 'Nunito-Regular',
                    fontSize: 14,
                    color: isActive ? '#FFFFFF' : C.textSecondary,
                  }}
                >
                  {f.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>

        {/* Timeline */}
        <View style={{ paddingHorizontal: 20 }}>
          {loading ? (
            <View style={{ gap: 12, marginTop: 8 }}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: C.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: C.border,
                    height: 72,
                    opacity: 0.6,
                  }}
                />
              ))}
            </View>
          ) : sortedDates.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  backgroundColor: C.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <FileText size={32} color={C.primary} />
              </View>
              <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 18, color: C.text, marginBottom: 8 }}>
                No history yet
              </Text>
              <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
                Your dose logs, cycle entries, and health notes will appear here
              </Text>
            </View>
          ) : (
            sortedDates.map((date) => {
              const dayItems = grouped[date];
              return (
                <View key={date} style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontFamily: 'Nunito-Bold',
                      fontSize: 14,
                      color: C.textSecondary,
                      marginBottom: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {formatDate(date)}
                  </Text>
                  <View style={{ gap: 8 }}>
                    {dayItems.map((item) => {
                      const idx = itemIndex++;
                      return (
                        <AnimatedListItem key={item.id} index={idx}>
                          <TimelineCard item={item} medicines={medicines} C={C} />
                        </AnimatedListItem>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <AnimatedPressable
        onPress={handleAddNote}
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
          shadowColor: '#D4607A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Plus size={24} color="#FFFFFF" />
      </AnimatedPressable>
    </View>
  );
}

interface TimelineCardProps {
  item: TimelineItem;
  medicines: Medicine[];
  C: typeof COLORS;
}

function TimelineCard({ item, medicines, C }: TimelineCardProps) {
  if (item.type === 'dose') {
    const log = item.data as DoseLog;
    const med = medicines.find((m) => m.id === log.medicineId);
    const isTaken = log.status === 'taken';
    const isMissed = log.status === 'missed';
    const statusColor = isTaken ? C.success : isMissed ? C.danger : C.textTertiary;
    const statusBg = isTaken ? C.successMuted : isMissed ? C.dangerMuted : C.surfaceSecondary;
    const statusLabel = log.status.charAt(0).toUpperCase() + log.status.slice(1);
    const timeLabel = log.takenAt ? formatTimeFromISO(log.takenAt) : '';

    return (
      <View
        style={{
          backgroundColor: C.surface,
          borderRadius: 14,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: (med?.color || C.primary) + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Pill size={18} color={med?.color || C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.text }} numberOfLines={1}>
            {med?.name || 'Unknown medicine'}
          </Text>
          {timeLabel ? (
            <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
              {timeLabel}
            </Text>
          ) : null}
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            backgroundColor: statusBg,
          }}
        >
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 12, color: statusColor }}>
            {statusLabel}
          </Text>
        </View>
      </View>
    );
  }

  if (item.type === 'cycle') {
    const entry = item.data as CycleEntry;
    const flowLabel = FLOW_LABELS[entry.flow];
    const symptomsText = entry.symptoms.map((s) => SYMPTOM_LABELS[s] || s).join(', ');

    return (
      <View
        style={{
          backgroundColor: C.surface,
          borderRadius: 14,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: C.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Calendar size={18} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.text }}>
            {flowLabel}
          </Text>
          {symptomsText ? (
            <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 }} numberOfLines={2}>
              {symptomsText}
            </Text>
          ) : null}
          {entry.mood ? (
            <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 12, color: C.textTertiary, marginTop: 2 }}>
              Mood: {entry.mood}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (item.type === 'note') {
    const note = item.data as HealthNote;
    return (
      <View
        style={{
          backgroundColor: C.surface,
          borderRadius: 14,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: C.accentMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileText size={18} color={C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 14, color: C.text, lineHeight: 20 }} numberOfLines={3}>
            {note.content}
          </Text>
          {note.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {note.tags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: C.accentMuted,
                  }}
                >
                  <Text style={{ fontFamily: 'Nunito-Medium', fontSize: 11, color: C.accent }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  return null;
}
