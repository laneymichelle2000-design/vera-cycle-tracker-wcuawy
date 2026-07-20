import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Plus, X, Clock, ChevronDown } from 'lucide-react-native';
import { COLORS, DARK_COLORS } from '@/constants/AppColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { getMedicines, saveMedicines } from '@/utils/storage';
import { Medicine } from '@/types/models';
import { formatTime } from '@/utils/dateHelpers';

const MEDICINE_TYPES: { key: Medicine['type']; label: string }[] = [
  { key: 'pill', label: 'Pill' },
  { key: 'injection', label: 'Injection' },
  { key: 'patch', label: 'Patch' },
  { key: 'ring', label: 'Ring' },
  { key: 'other', label: 'Other' },
];

const PRESET_COLORS = [
  '#D4607A', // rose
  '#E8A598', // coral
  '#B07CC6', // lavender
  '#5BAD8F', // mint
  '#5B9BD4', // sky
  '#E8A030', // amber
  '#7AAD6A', // sage
  '#C07AB8', // lilac
];

export default function AddMedicineScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? DARK_COLORS : COLORS;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState('');
  const [type, setType] = useState<Medicine['type']>('pill');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [nameError, setNameError] = useState('');

  const nameRef = useRef<TextInput>(null);

  useEffect(() => {
    if (id) {
      console.log('[AddMedicine] Loading existing medicine for edit, id:', id);
      loadExisting(id);
    } else {
      setTimeout(() => nameRef.current?.focus(), 300);
    }
  }, [id]);

  const loadExisting = async (medicineId: string) => {
    try {
      const meds = await getMedicines();
      const med = meds.find((m) => m.id === medicineId);
      if (med) {
        setName(med.name);
        setType(med.type);
        setColor(med.color);
        setDosage(med.dosage);
        setTimes(med.times.length > 0 ? med.times : ['08:00']);
        setNotes(med.notes);
      }
    } catch (e) {
      console.error('[AddMedicine] Failed to load medicine:', e);
    }
  };

  const handleSave = async () => {
    console.log('[AddMedicine] Save button pressed, name:', name, 'type:', type);
    if (!name.trim()) {
      setNameError('Please enter a medicine name');
      return;
    }

    setSaving(true);
    try {
      const meds = await getMedicines();

      if (id) {
        const updated = meds.map((m) =>
          m.id === id
            ? { ...m, name: name.trim(), type, color, dosage: dosage.trim(), times, notes: notes.trim() }
            : m
        );
        await saveMedicines(updated);
        console.log('[AddMedicine] Medicine updated successfully:', name);
      } else {
        const newMed: Medicine = {
          id: `med_${Date.now()}`,
          name: name.trim(),
          type,
          color,
          dosage: dosage.trim() || '1 dose',
          times,
          notes: notes.trim(),
          active: true,
          createdAt: new Date().toISOString(),
        };
        await saveMedicines([...meds, newMed]);
        console.log('[AddMedicine] New medicine saved:', newMed.name, 'id:', newMed.id);
      }

      router.back();
    } catch (e) {
      console.error('[AddMedicine] Failed to save medicine:', e);
      Alert.alert('Error', 'Failed to save medicine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTime = () => {
    console.log('[AddMedicine] Add time button pressed');
    setTimes((prev) => [...prev, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    console.log('[AddMedicine] Remove time at index:', index);
    setTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTimePress = (index: number) => {
    console.log('[AddMedicine] Time picker opened for index:', index);
    setEditingTimeIndex(index);
    setShowTimePicker(true);
  };

  const handleTimeChange = (_: unknown, date?: Date) => {
    if (process.env.EXPO_OS === 'android') {
      setShowTimePicker(false);
    }
    if (date && editingTimeIndex !== null) {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      const timeStr = `${h}:${m}`;
      console.log('[AddMedicine] Time changed to:', timeStr, 'for index:', editingTimeIndex);
      setTimes((prev) => prev.map((t, i) => (i === editingTimeIndex ? timeStr : t)));
    }
  };

  const currentTimeDate = (() => {
    if (editingTimeIndex === null) return new Date();
    const t = times[editingTimeIndex] || '08:00';
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    return d;
  })();

  const isEditing = !!id;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Nunito-ExtraBold', fontSize: 24, color: C.text }}>
            {isEditing ? 'Edit Medicine' : 'Add Medicine'}
          </Text>
          <AnimatedPressable
            onPress={() => {
              console.log('[AddMedicine] Close button pressed');
              router.back();
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color={C.textSecondary} />
          </AnimatedPressable>
        </View>

        {/* Name */}
        <View>
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.textSecondary, marginBottom: 8 }}>
            Medicine name *
          </Text>
          <TextInput
            ref={nameRef}
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (t.trim()) setNameError('');
            }}
            onBlur={() => {
              if (!name.trim()) setNameError('Please enter a medicine name');
            }}
            placeholder="e.g. Yasmin, Metformin"
            placeholderTextColor={C.textTertiary}
            style={{
              backgroundColor: C.surfaceSecondary,
              borderRadius: 12,
              padding: 14,
              fontFamily: 'Nunito-Regular',
              fontSize: 16,
              color: C.text,
              borderWidth: 1,
              borderColor: nameError ? C.danger : 'transparent',
            }}
          />
          {nameError ? (
            <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 12, color: C.danger, marginTop: 4 }}>
              {nameError}
            </Text>
          ) : null}
        </View>

        {/* Type */}
        <View>
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.textSecondary, marginBottom: 8 }}>
            Type
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MEDICINE_TYPES.map((t) => {
              const isSelected = type === t.key;
              return (
                <AnimatedPressable
                  key={t.key}
                  onPress={() => {
                    console.log('[AddMedicine] Type selected:', t.key);
                    setType(t.key);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: isSelected ? C.primaryMuted : C.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: isSelected ? C.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: isSelected ? 'Nunito-SemiBold' : 'Nunito-Regular',
                      fontSize: 14,
                      color: isSelected ? C.primary : C.textSecondary,
                    }}
                  >
                    {t.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* Color */}
        <View>
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.textSecondary, marginBottom: 8 }}>
            Color
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((c) => (
              <AnimatedPressable
                key={c}
                onPress={() => {
                  console.log('[AddMedicine] Color selected:', c);
                  setColor(c);
                }}
                scaleValue={0.9}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: C.text,
                }}
              />
            ))}
          </View>
        </View>

        {/* Dosage */}
        <View>
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.textSecondary, marginBottom: 8 }}>
            Dosage
          </Text>
          <TextInput
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g. 1 tablet, 0.5mg"
            placeholderTextColor={C.textTertiary}
            style={{
              backgroundColor: C.surfaceSecondary,
              borderRadius: 12,
              padding: 14,
              fontFamily: 'Nunito-Regular',
              fontSize: 16,
              color: C.text,
            }}
          />
        </View>

        {/* Times */}
        <View>
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.textSecondary, marginBottom: 8 }}>
            Reminder times
          </Text>
          <View style={{ gap: 8 }}>
            {times.map((t, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AnimatedPressable
                  onPress={() => handleTimePress(idx)}
                  style={{
                    flex: 1,
                    backgroundColor: C.surfaceSecondary,
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Clock size={18} color={C.primary} />
                  <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 16, color: C.text, flex: 1 }}>
                    {formatTime(t)}
                  </Text>
                  <ChevronDown size={16} color={C.textTertiary} />
                </AnimatedPressable>
                {times.length > 1 && (
                  <AnimatedPressable
                    onPress={() => handleRemoveTime(idx)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: C.dangerMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={16} color={C.danger} />
                  </AnimatedPressable>
                )}
              </View>
            ))}
            <AnimatedPressable
              onPress={handleAddTime}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                borderStyle: 'dashed',
              }}
            >
              <Plus size={16} color={C.primary} />
              <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.primary }}>
                Add time
              </Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Notes */}
        <View>
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.textSecondary, marginBottom: 8 }}>
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Take with food"
            placeholderTextColor={C.textTertiary}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: C.surfaceSecondary,
              borderRadius: 12,
              padding: 14,
              fontFamily: 'Nunito-Regular',
              fontSize: 15,
              color: C.text,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Save button */}
        <AnimatedPressable
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: C.primary,
            borderRadius: 16,
            padding: 18,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 16, color: '#FFFFFF' }}>
            {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Save medicine'}
          </Text>
        </AnimatedPressable>
      </ScrollView>

      {/* Time picker */}
      {showTimePicker && (
        <View>
          {process.env.EXPO_OS === 'ios' ? (
            <View
              style={{
                backgroundColor: C.surface,
                borderTopWidth: 1,
                borderTopColor: C.border,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AnimatedPressable
                  onPress={() => {
                    console.log('[AddMedicine] Time picker cancelled');
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 16, color: C.textSecondary }}>
                    Cancel
                  </Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={() => {
                    console.log('[AddMedicine] Time picker confirmed');
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={{ fontFamily: 'Nunito-Bold', fontSize: 16, color: C.primary }}>
                    Done
                  </Text>
                </AnimatedPressable>
              </View>
              <DateTimePicker
                value={currentTimeDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                textColor={C.text}
              />
            </View>
          ) : (
            <DateTimePicker
              value={currentTimeDate}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
