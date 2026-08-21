import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Radius } from '../../core/constants/colors';
import { useTheme } from '../../core/theme';

type Variant = 'primary' | 'secondary';

export function AppButton({
  label, onPress, disabled, loading, variant = 'primary', style,
}: { label: string; onPress?: () => void; disabled?: boolean; loading?: boolean; variant?: Variant; style?: ViewStyle }) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={[
        styles.base,
        isPrimary
          ? { backgroundColor: disabled ? colors.actionDisabled : colors.action }
          : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.actionText : colors.primary} />
      ) : (
        <Text style={[styles.label, { color: isPrimary ? colors.actionText : colors.primary }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 56, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
});
