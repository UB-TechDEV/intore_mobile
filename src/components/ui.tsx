import { Ionicons } from '@expo/vector-icons';
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text, TextInput } from '../theme/text';
import { colors, radius, type } from '../theme/tokens';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
  tone = 'primary',
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'success' | 'danger' | 'night';
  accessibilityLabel?: string;
}) {
  const background =
    tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : tone === 'night' ? colors.warningText : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: disabled ? colors.disabled : background },
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={18} color={disabled ? colors.muted : colors.white} />
      ) : null}
      <Text style={[styles.primaryLabel, disabled ? styles.primaryLabelDisabled : null]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  color = colors.ink,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, pressed ? styles.pressed : null]}
    >
      {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
      <Text style={[styles.secondaryLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Avatar({
  initials,
  size = 36,
  filled = false,
  onPress,
  accessibilityLabel,
}: {
  initials: string;
  size?: number;
  filled?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
}) {
  const body = (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: filled ? colors.primary : colors.primarySoft,
        },
      ]}
    >
      <Text
        style={{
          color: filled ? colors.white : colors.primary,
          fontSize: size >= 60 ? 21 : size > 40 ? 16 : 13,
          fontWeight: '500',
        }}
      >
        {initials}
      </Text>
    </View>
  );
  if (!onPress) {
    return body;
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} hitSlop={8}>
      {body}
    </Pressable>
  );
}

export function Pill({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'warning' | 'danger';
}) {
  const palette = {
    success: { bg: colors.successSoft, fg: colors.successText },
    warning: { bg: colors.warningSoft, fg: colors.warningText },
    danger: { bg: colors.dangerSoft, fg: colors.dangerText },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <View style={[styles.dot, { backgroundColor: palette.fg }]} />
      <Text style={[styles.pillLabel, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Group({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.group}>
      {items.map((child, index) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ style?: object }>, {
              key: child.key ?? index,
              style: [index > 0 ? styles.groupDivider : null, (child.props as { style?: object }).style],
            })
          : child,
      )}
    </View>
  );
}

export function DetailLine({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, warning ? { color: colors.warningText } : null]}>{value}</Text>
    </View>
  );
}

export function ToggleRow({
  label,
  value,
  onValueChange,
  style,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.rowTitle}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E3E5E8', true: colors.live }}
        thumbColor={colors.white}
      />
    </View>
  );
}

export function NavRow({
  title,
  subtitle,
  onPress,
  destructive = false,
  trailing,
  style,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const content = (
    <View style={[styles.row, style]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, destructive ? { color: colors.danger } : null]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
      {onPress && !destructive ? <Ionicons name="chevron-forward" size={14} color={colors.chevron} /> : null}
    </View>
  );
  if (!onPress) {
    return content;
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        style={styles.searchInput}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.id)}
            style={[styles.segmentItem, selected ? styles.segmentOn : null]}
          >
            <Text style={[styles.segmentLabel, selected ? styles.segmentLabelOn : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  light = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress: () => void;
  light?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.iconButton, light ? styles.iconButtonLight : null]}
    >
      <Ionicons name={icon} size={20} color={light ? colors.white : colors.ink} />
    </Pressable>
  );
}

export function Keypad({
  onDigit,
  onDelete,
}: {
  onDigit: (digit: string) => void;
  onDelete: () => void;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  return (
    <View style={styles.keys}>
      {keys.map((key) => {
        if (!key) {
          return <View key="blank" style={styles.keySpacer} />;
        }
        if (key === 'del') {
          return (
            <Pressable
              key="del"
              accessibilityRole="button"
              accessibilityLabel="Delete"
              onPress={onDelete}
              style={styles.key}
            >
              <Ionicons name="backspace-outline" size={22} color={colors.inkSoft} />
            </Pressable>
          );
        }
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={key}
            onPress={() => onDigit(key)}
            style={({ pressed }) => [styles.key, styles.keyFilled, pressed ? styles.pressed : null]}
          >
            <Text style={styles.keyLabel}>{key}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type ButtonProps = PressableProps;

export function TextLink({ label, onPress }: { label: string; onPress: ButtonProps['onPress'] }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
  },
  primary: {
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryLabel: {
    color: colors.white,
    fontSize: 14.5,
    fontWeight: '400',
  },
  primaryLabelDisabled: {
    color: colors.muted,
  },
  secondary: {
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  secondaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.72,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    minHeight: 26,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillLabel: {
    fontSize: 12.5,
    fontWeight: '400',
  },
  sectionLabel: {
    color: colors.label,
    fontSize: type.caption,
    fontWeight: '300',
    letterSpacing: 0.25,
    textTransform: 'uppercase',
    marginLeft: 16,
    marginBottom: 6,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  detail: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingVertical: 9,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 13,
    flex: 1,
  },
  detailValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '500',
    flex: 1.2,
    textAlign: 'right',
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
  },
  groupDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: type.body,
    fontWeight: '300',
    flex: 1,
  },
  rowSubtitle: {
    color: colors.label,
    fontSize: 13,
    fontWeight: '300',
    marginTop: 1,
  },
  search: {
    minHeight: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    paddingVertical: 10,
  },
  segment: {
    backgroundColor: colors.field,
    borderRadius: radius.sm,
    padding: 3,
    flexDirection: 'row',
    gap: 2,
  },
  segmentItem: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: {
    backgroundColor: colors.surface,
  },
  segmentLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  segmentLabelOn: {
    color: colors.ink,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonLight: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  keys: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    width: '31%',
    minHeight: 50,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyFilled: {
    backgroundColor: colors.surface,
  },
  keySpacer: {
    width: '31%',
    minHeight: 50,
  },
  keyLabel: {
    fontSize: 22,
    color: colors.ink,
    fontWeight: '500',
  },
  link: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
