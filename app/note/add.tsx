import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { COLORS, DARK_COLORS } from '@/constants/AppColors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { getHealthNotes, saveHealthNotes } from '@/utils/storage';
import { HealthNote } from '@/types/models';
import { today } from '@/utils/dateHelpers';

const TAG_OPTIONS = [
  { key: 'mood', label: 'Mood' },
  { key: 'energy', label: 'Energy' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'pain', label: 'Pain' },
  { key: 'diet', label: 'Diet' },
  { key: 'exercise', label: 'Exercise' },
];

export default function AddNoteScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? DARK_COLORS : COLORS;
  const router = useRouter();

  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [contentError, setContentError] = useState('');

  const contentRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => contentRef.current?.focus(), 300);
  }, []);

  const handleTagToggle = (tag: string) => {
    console.log('[AddNote] Tag toggled:', tag);
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    console.log('[AddNote] Save button pressed, content length:', content.trim().length, 'tags:', tags);
    if (!content.trim()) {
      setContentError('Please write something before saving');
      return;
    }

    setSaving(true);
    try {
      const notes = await getHealthNotes();
      const newNote: HealthNote = {
        id: `note_${Date.now()}`,
        date: today(),
        content: content.trim(),
        tags,
        createdAt: new Date().toISOString(),
      };
      await saveHealthNotes([...notes, newNote]);
      console.log('[AddNote] Note saved successfully, id:', newNote.id);
      router.back();
    } catch (e) {
      console.error('[AddNote] Failed to save note:', e);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
            Health Note
          </Text>
          <AnimatedPressable
            onPress={() => {
              console.log('[AddNote] Close button pressed');
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

        {/* Content */}
        <View>
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.textSecondary, marginBottom: 8 }}>
            How are you feeling? *
          </Text>
          <TextInput
            ref={contentRef}
            value={content}
            onChangeText={(t) => {
              setContent(t);
              if (t.trim()) setContentError('');
            }}
            onBlur={() => {
              if (!content.trim()) setContentError('Please write something before saving');
            }}
            placeholder="Write about your day, symptoms, how you're feeling..."
            placeholderTextColor={C.textTertiary}
            multiline
            style={{
              backgroundColor: C.surfaceSecondary,
              borderRadius: 16,
              padding: 16,
              fontFamily: 'Nunito-Regular',
              fontSize: 16,
              color: C.text,
              minHeight: 160,
              textAlignVertical: 'top',
              lineHeight: 24,
              borderWidth: 1,
              borderColor: contentError ? C.danger : 'transparent',
            }}
          />
          {contentError ? (
            <Text style={{ fontFamily: 'Nunito-Regular', fontSize: 12, color: C.danger, marginTop: 4 }}>
              {contentError}
            </Text>
          ) : null}
        </View>

        {/* Tags */}
        <View>
          <Text style={{ fontFamily: 'Nunito-SemiBold', fontSize: 14, color: C.textSecondary, marginBottom: 8 }}>
            Tags
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TAG_OPTIONS.map((tag) => {
              const isActive = tags.includes(tag.key);
              return (
                <AnimatedPressable
                  key={tag.key}
                  onPress={() => handleTagToggle(tag.key)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: isActive ? C.primaryMuted : C.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: isActive ? C.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: isActive ? 'Nunito-SemiBold' : 'Nunito-Regular',
                      fontSize: 14,
                      color: isActive ? C.primary : C.textSecondary,
                    }}
                  >
                    {tag.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
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
            {saving ? 'Saving...' : 'Save note'}
          </Text>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
