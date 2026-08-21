import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Radius, Spacing, ThemeColors } from '../../core/constants/colors';
import { useTheme } from '../../core/theme';

export function AppCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return <View style={[cardStyles(colors), style]}>{children}</View>;
}
const cardStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.cardSurface, borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 0.5, borderColor: c.inputBorder,
  },
});
