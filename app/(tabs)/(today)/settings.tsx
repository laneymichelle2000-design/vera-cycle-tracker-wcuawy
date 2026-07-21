/**
 * Settings Screen — Vera Cycle
 * Account management, data deletion, and legal links.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  useColorScheme,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Trash2, FileText, Shield, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { COLORS, DARK_COLORS } from '@/constants/AppColors';
import { deleteAllData } from '@/utils/storage';
import { cancelAllMedicineNotifications } from '@/utils/notifications';

const PRIVACY_POLICY_URL = 'https://veracycle.app/privacy';
const TERMS_OF_SERVICE_URL = 'https://veracycle.app/terms';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const C = colorScheme === 'dark' ? DARK_COLORS : COLORS;
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your medicines, cycle entries, dose logs, and health notes. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await cancelAllMedicineNotifications();
      await deleteAllData();
      Alert.alert(
        'Data Deleted',
        'All your health data has been permanently deleted.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/(today)') }]
      );
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const styles = makeStyles(C);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Data & Privacy */}
      <Text style={styles.sectionHeader}>Data & Privacy</Text>
      <View style={[styles.card, { backgroundColor: C.surface }]}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
        >
          <View style={[styles.iconBox, { backgroundColor: C.primaryMuted }]}>
            <Shield size={18} color={C.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: C.text }]}>Privacy Policy</Text>
          <ChevronRight size={16} color={C.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: C.divider }]} />

        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
        >
          <View style={[styles.iconBox, { backgroundColor: C.primaryMuted }]}>
            <FileText size={18} color={C.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: C.text }]}>Terms of Service</Text>
          <ChevronRight size={16} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <Text style={styles.sectionHeader}>Danger Zone</Text>
      <View style={[styles.card, { backgroundColor: C.surface }]}>
        <TouchableOpacity
          style={styles.row}
          onPress={handleDeleteAllData}
          disabled={deleting}
        >
          <View style={[styles.iconBox, { backgroundColor: '#FFF0F0' }]}>
            <Trash2 size={18} color="#D93025" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: '#D93025' }]}>
              {deleting ? 'Deleting…' : 'Delete All My Data'}
            </Text>
            <Text style={[styles.rowSub, { color: C.textSecondary }]}>
              Permanently removes all health data from this device
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.warningBox, { backgroundColor: '#FFF8E1', borderColor: '#FFD54F' }]}>
        <AlertTriangle size={14} color="#F57F17" style={{ marginTop: 1 }} />
        <Text style={styles.warningText}>
          Vera Cycle stores all data locally on your device. Deleting your data is immediate and irreversible.
        </Text>
      </View>

      <Text style={styles.version}>Vera Cycle · v1.0.0</Text>
    </ScrollView>
  );
}

function makeStyles(C: typeof COLORS) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 48 },
    sectionHeader: {
      fontFamily: 'Nunito-Bold',
      fontSize: 13,
      color: C.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginTop: 20,
      marginLeft: 4,
    },
    card: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      flex: 1,
      fontFamily: 'Nunito-SemiBold',
      fontSize: 15,
    },
    rowSub: {
      fontFamily: 'Nunito-Regular',
      fontSize: 12,
      marginTop: 2,
      lineHeight: 16,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 62,
    },
    warningBox: {
      flexDirection: 'row',
      gap: 8,
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      marginTop: 16,
      alignItems: 'flex-start',
    },
    warningText: {
      flex: 1,
      fontFamily: 'Nunito-Regular',
      fontSize: 12,
      color: '#7A5800',
      lineHeight: 17,
    },
    version: {
      fontFamily: 'Nunito-Regular',
      fontSize: 12,
      color: C.textSecondary,
      textAlign: 'center',
      marginTop: 32,
      opacity: 0.6,
    },
  });
}
