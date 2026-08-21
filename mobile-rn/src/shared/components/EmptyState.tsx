import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../core/constants/colors';
import { useTheme } from '../../core/theme';
import { AppButton } from './AppButton';

export function EmptyState({ title, message }: { title: string; message?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </View>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.error }]}>{t('error')}</Text>
      <Text style={styles.msg}>{message}</Text>
      {onRetry ? <AppButton label={t('retry')} variant="secondary" onPress={onRetry} style={{ marginTop: 16, width: 160 }} /> : null}
    </View>
  );
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 16, fontWeight: '600', color: c.textPrimary },
  msg: { fontSize: 13, color: c.textSecondary, marginTop: 6, textAlign: 'center' },
});
