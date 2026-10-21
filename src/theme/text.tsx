import {
  Platform,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { font } from './tokens';

const FAMILY: Record<string, string> = {
  '100': font.light,
  '200': font.light,
  '300': font.light,
  '400': font.regular,
  '500': font.medium,
  '600': font.semibold,
  '700': font.bold,
  '800': font.bold,
  '900': font.bold,
  normal: font.regular,
  bold: font.bold,
};

function familyFrom(style?: StyleProp<TextStyle>) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (flat?.fontFamily) {
    return undefined;
  }
  return FAMILY[String(flat?.fontWeight ?? '300')] ?? font.light;
}

const androidFix = Platform.OS === 'android' ? ({ includeFontPadding: false } satisfies TextStyle) : null;

export function Text({ style, allowFontScaling = false, ...rest }: TextProps) {
  const family = familyFrom(style);
  return (
    <RNText
      {...rest}
      allowFontScaling={allowFontScaling}
      style={[androidFix, family ? { fontFamily: family } : null, style]}
    />
  );
}

export function TextInput({ style, allowFontScaling = false, ...rest }: TextInputProps) {
  const family = familyFrom(style) ?? font.regular;
  return (
    <RNTextInput
      {...rest}
      allowFontScaling={allowFontScaling}
      style={[androidFix, { fontFamily: family }, style]}
    />
  );
}
