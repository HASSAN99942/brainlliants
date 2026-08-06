export const Colors = {
  bg: '#EEEEF5',
  cardSurface: '#FFFFFF',

  primary: '#3C3489',
  primaryLight: '#E8E8F8',
  primaryMid: '#7F77DD',

  textPrimary: '#2D2770',
  textSecondary: '#8888AA',
  textMuted: '#AAAAAA',

  action: '#E8A020',
  actionDisabled: '#F0C878',
  actionText: '#2A1A00',

  success: '#1D9E75',
  successLight: '#E1F5EE',
  error: '#E24B4A',
  errorLight: '#FCEBEB',

  inputBorder: '#E0E0F0',
  inputBorderFocus: '#3C3489',

  navActive: '#E8A020',
  navInactive: '#3C3489',

  mtn: '#F7C948',
  orange: '#FF6600',
} as const;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const Radius = { xs: 6, sm: 8, md: 12, lg: 14, xl: 16, xxl: 20, full: 999 } as const;

export const FontSize = {
  bodySmall: 12, bodyMedium: 13, body: 14, title: 15,
  titleLarge: 17, heading: 20, display: 26, displayLarge: 28,
} as const;
