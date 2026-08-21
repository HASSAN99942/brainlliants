import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { summaryCache } from '../../src/features/ai/offline';

export default function Sessions() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sessions = summaryCache.list();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></Pressable>
        <Text style={styles.title}>{t('learn.sessionsTitle')}</Text>
      </View>
      {sessions.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="time-outline" size={56} color={colors.primaryLight} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textSecondary, marginTop: 14 }}>{t('ai.noSessions')}</Text>
        </View>
      ) : (
        <FlatList
          data={sessions} keyExtractor={(s) => s.session_id} contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconBox}><Ionicons name="document-text-outline" size={20} color={colors.primaryMid} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>{item.file_name}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>{item.saved_at.slice(0, 10)}</Text>
              </View>
              <View style={styles.offlineChip}><Text style={{ fontSize: 11, color: colors.success, fontWeight: '500' }}>{t('ai.offline')}</Text></View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder, padding: 16, marginBottom: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center' },
  offlineChip: { backgroundColor: c.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
});
