import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../core/constants/colors';

export function Chip({ label, variant = 'default' }: { label: string; variant?: 'default' | 'selected' | 'success' }) {
  const bg = variant === 'selected' ? Colors.primary : variant === 'success' ? Colors.successLight : Colors.primaryLight;
  const fg = variant === 'selected' ? '#fff' : variant === 'success' ? Colors.success : Colors.textPrimary;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, alignSelf: 'flex-start' },
});
