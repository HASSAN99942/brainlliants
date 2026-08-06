import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../core/constants/colors';

type Variant = 'primary' | 'secondary';

export function AppButton({
  label, onPress, disabled, loading, variant = 'primary', style,
}: { label: string; onPress?: () => void; disabled?: boolean; loading?: boolean; variant?: Variant; style?: ViewStyle }) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={[
        styles.base,
        isPrimary
          ? { backgroundColor: disabled ? Colors.actionDisabled : Colors.action }
          : { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.primary },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? Colors.actionText : Colors.primary} />
      ) : (
        <Text style={[styles.label, { color: isPrimary ? Colors.actionText : Colors.primary }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 56, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
});
