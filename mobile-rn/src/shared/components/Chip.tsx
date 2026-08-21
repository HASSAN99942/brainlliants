import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Radius } from '../../core/constants/colors';
import { useTheme } from '../../core/theme';

export function Chip({ label, variant = 'default' }: { label: string; variant?: 'default' | 'selected' | 'success' }) {
  const { colors } = useTheme();
  const bg = variant === 'selected'
    ? colors.primary
    : variant === 'success' ? colors.successLight : colors.primaryLight;
  const fg = variant === 'selected'
    ? '#fff'
    : variant === 'success' ? colors.success : colors.textPrimary;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, alignSelf: 'flex-start' },
});
