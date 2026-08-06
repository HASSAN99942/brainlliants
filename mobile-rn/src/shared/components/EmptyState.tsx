import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../core/constants/colors';
import { AppButton } from './AppButton';

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </View>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: Colors.error }]}>Something went wrong</Text>
      <Text style={styles.msg}>{message}</Text>
      {onRetry ? <AppButton label="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: 16, width: 160 }} /> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  msg: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
});
