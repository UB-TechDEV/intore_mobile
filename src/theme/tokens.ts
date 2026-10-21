import { Platform, type TextStyle } from 'react-native';

export const colors = {
  background: '#F2F2F7',
  ballotBackground: '#F3F6F8',
  surface: '#FFFFFF',
  ink: '#0F1F2A',
  inkSoft: '#3F525F',
  muted: '#586B78',
  label: '#6D7A86',
  faint: '#8A99A6',
  chevron: '#C4CCD2',
  line: 'rgba(15,31,42,0.14)',
  tabBar: 'rgba(249,249,251,0.96)',
  primary: '#1479B8',
  primaryDark: '#0E5E92',
  primarySoft: '#E6F2FA',
  sky: '#3AA7DF',
  success: '#15803D',
  successSoft: '#E4F5EB',
  successText: '#0F6B3A',
  live: '#34C759',
  liveDot: '#22C55E',
  warningSoft: '#FFF1D6',
  warningText: '#7A4E00',
  danger: '#E01626',
  dangerText: '#B00F1C',
  dangerSoft: '#FCE8EA',
  track: '#EDF1F4',
  field: '#E3EAEF',
  disabled: '#EAF0F4',
  chip: '#F3F6F8',
  night: '#0B1520',
  nightCard: '#1B2733',
  white: '#FFFFFF',
  message: '#6B2FA8',
} as const;

export const font = {
  light: 'Glancyr-Light',
  regular: 'Glancyr-Regular',
  medium: 'Glancyr-Medium',
  semibold: 'Glancyr-Semibold',
  bold: 'Glancyr-Bold',
  display: Platform.select({ ios: 'System', default: 'Glancyr-Bold' }) as string,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 13,
} as const;

export const type = {
  hero: 32,
  title: 22,
  cardTitle: 30,
  section: 17,
  body: 15.5,
  label: 13,
  caption: 12.5,
  micro: 11.5,
  tab: 10.5,
} as const;

export const displayTitle: TextStyle = {
  fontFamily: font.display,
  fontSize: type.hero,
  lineHeight: 38,
  fontWeight: '700',
  letterSpacing: -0.8,
  color: colors.ink,
};

export const displayName: TextStyle = {
  fontFamily: font.display,
  fontSize: 19,
  fontWeight: '600',
  color: colors.ink,
};
