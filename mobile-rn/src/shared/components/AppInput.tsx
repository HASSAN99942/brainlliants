import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Radius } from '../../core/constants/colors';

export function AppInput({ label, ...props }: { label?: string } & TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={Colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, { borderColor: focused ? Colors.inputBorderFocus : Colors.inputBorder, borderWidth: focused ? 1.5 : 0.5 }]}
        {...props}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: Colors.cardSurface, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
});
