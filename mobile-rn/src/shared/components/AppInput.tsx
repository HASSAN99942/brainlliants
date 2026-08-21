import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Radius } from '../../core/constants/colors';
import { useTheme } from '../../core/theme';

export function AppInput({ label, ...props }: { label?: string } & TextInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: colors.cardSurface,
            color: colors.textPrimary,
            borderColor: focused ? colors.inputBorderFocus : colors.inputBorder,
            borderWidth: focused ? 1.5 : 0.5,
          },
        ]}
        {...props}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  label: { fontSize: 13, marginBottom: 6 },
  input: { borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
});
