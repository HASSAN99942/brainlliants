import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../../core/constants/colors';

export function AppCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardSurface, borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 0.5, borderColor: Colors.inputBorder,
  },
});
