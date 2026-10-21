import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui';
import { MONTHS, PAYMENT_HISTORY, SAMPLE_EVENT } from '../../data/sample';
import { useTx } from '../../i18n';
import type { MemberTabParamList, RootStackParamList } from '../../navigation/types';
import { useSession } from '../../state/session';
import { Text } from '../../theme/text';
import { colors, displayTitle, font, radius } from '../../theme/tokens';

export function MemberChrome({
  title,
  subtitle,
  children,
  overlay,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MemberTabParamList>>();
  const { tx } = useTx();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        </View>
        <View style={styles.headerAvatar}>
          <Avatar
            initials="KF"
            accessibilityLabel={tx('Profile', 'Profil')}
            onPress={() => navigation.navigate('Profile')}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {overlay}
    </View>
  );
}

export function MemberHomeScreen() {
  const { tx } = useTx();
  const navigation = useNavigation<BottomTabNavigationProp<MemberTabParamList>>();
  const root = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [toast, setToast] = useState('');
  return (
    <MemberChrome
      title={tx('Hi, Fidèle', 'Bonjour, Fidèle')}
      subtitle={tx('Member · France cell', 'Membre · cellule France')}
      overlay={
        toast ? (
          <Pressable accessibilityRole="button" accessibilityLabel={tx('Dismiss', 'Fermer')} onPress={() => setToast('')} style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
            <Text style={styles.toastClose}>×</Text>
          </Pressable>
        ) : null
      }
    >
      <View style={styles.stack}>
        <LinearGradient colors={['#1479B8', '#0E5E92']} start={{ x: 0.05, y: 0 }} end={{ x: 0.95, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.kicker}>{tx('Your next event', 'Votre prochain événement')}</Text>
            <View style={styles.days}>
              <Text style={styles.daysText}>{tx('In 19 days', 'Dans 19 jours')}</Text>
            </View>
          </View>
          <Text style={styles.event}>{SAMPLE_EVENT}</Text>
          <Text style={styles.when}>Fri 30 – Sat 31 Oct · EXPO XXI, Warsaw</Text>
          <View style={styles.stats}>
            <Stat label={tx('You gave', 'Vous avez donné')} value="€80" />
            <Stat label={tx('France cell', 'Cellule France')} value="14%" />
            <Stat label={tx('Closes', 'Clôture')} value="16 Oct" />
          </View>
        </LinearGradient>
        <View style={styles.qr}>
          <View style={styles.qrIcon}>
            <Ionicons name="ticket-outline" size={24} color={colors.warningText} />
          </View>
          <View style={styles.qrText}>
            <Text style={styles.qrTitle}>{tx('Your QR codes', 'Vos codes QR')}</Text>
            <Text style={styles.qrBody}>
              {tx(
                'They arrive once your cell’s payments are checked.',
                'Ils arrivent une fois les paiements de votre cellule vérifiés.',
              )}
            </Text>
          </View>
        </View>
        <View>
          <Text style={styles.section}>{tx('To do', 'À faire')}</Text>
          <View style={styles.group}>
            <Todo
              color={colors.primary}
              mark="✓"
              markSize={13}
              first
              title={tx('Vote for the 2027 host', 'Votez pour l’hôte 2027')}
              subtitle={tx('Closes 25 Oct', 'Clôture le 25 oct')}
              onPress={() => root.getParent()?.navigate('Ballot')}
            />
            <Todo
              color={colors.live}
              mark="€"
              markSize={14}
              title={tx('Pay your October contribution', 'Payez votre contribution d’octobre')}
              subtitle={tx('€10 to the France cell', '10 € à la cellule France')}
              onPress={() => navigation.navigate('Pay')}
            />
            <Todo
              color={colors.message}
              mark="MS"
              markSize={13}
              title={tx('Message from your cell', 'Message de votre cellule')}
              subtitle={tx('Mukamana Solange · 2 days ago', 'Mukamana Solange · il y a 2 jours')}
              onPress={() =>
                setToast(
                  tx(
                    'Mukamana Solange: “Our cell is at 14% of its pledge — please give before 16 October.”',
                    'Mukamana Solange : « Notre cellule est à 14 % de son engagement — merci de donner avant le 16 octobre. »',
                  ),
                )
              }
            />
          </View>
        </View>
      </View>
    </MemberChrome>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Todo({
  color,
  mark,
  markSize = 13,
  title,
  subtitle,
  onPress,
  first = false,
}: {
  color: string;
  mark: string;
  markSize?: number;
  title: string;
  subtitle: string;
  onPress: () => void;
  first?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={[styles.todo, first ? styles.todoFirst : null]}
    >
      <View style={[styles.mark, { backgroundColor: color }]}>
        <Text style={[styles.markText, { fontSize: markSize }]}>{mark}</Text>
      </View>
      <View style={styles.todoText}>
        <Text style={styles.todoTitle}>{title}</Text>
        <Text style={styles.todoSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.chevron} />
    </Pressable>
  );
}

export function MemberPayScreen() {
  const { tx } = useTx();
  const session = useSession();
  const given = session.octoberPaid ? '€225' : '€215';
  const history = session.octoberPaid
    ? [{ id: 'october', name: tx('October payment', 'Paiement d’octobre'), detail: tx('Today · recorded for your cell leader', 'Aujourd’hui · à vérifier par votre responsable'), amount: '€10' }, ...PAYMENT_HISTORY]
    : PAYMENT_HISTORY;
  return (
    <MemberChrome title={tx('Pay', 'Payer')} subtitle={tx('Your contributions', 'Vos contributions')}>
      <View style={styles.stack}>
        <View style={styles.given}>
          <Text style={styles.givenLabel}>{tx('Given in 2026', 'Donné en 2026')}</Text>
          <Text style={styles.givenValue}>{given}</Text>
          <Text style={styles.givenLabel}>{tx('monthly payments, collections and events', 'mensualités, collectes et événements')}</Text>
        </View>
        <Text style={styles.section}>{tx('Monthly payments · €10', 'Mensualités · 10 €')}</Text>
        <View style={styles.months}>
          {MONTHS.map((month, index) => {
            const paid = index < 9 || session.octoberPaid;
            return (
              <View key={month} style={[styles.month, paid ? styles.monthPaid : styles.monthDue]}>
                <Text style={[styles.monthName, paid ? styles.monthPaidText : styles.monthDueText]}>{month}</Text>
                <Text style={[styles.monthState, paid ? styles.monthPaidText : styles.monthDueText]}>{paid ? '✓' : tx('Due', 'Dû')}</Text>
              </View>
            );
          })}
        </View>
        {session.octoberPaid ? (
          <View style={styles.paid}>
            <View style={styles.paidMark}><Text style={styles.markText}>✓</Text></View>
            <Text style={styles.paidText}>{tx('October paid · your cell leader will check it', 'Octobre payé · votre responsable va le vérifier')}</Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('Pay October · €10', 'Payer octobre · 10 €')}
            onPress={session.markOctoberPaid}
            style={styles.pay}
          >
            <Text style={styles.payText}>{tx('Pay October · €10', 'Payer octobre · 10 €')}</Text>
          </Pressable>
        )}
        <Text style={styles.sample}>
          {tx(
            'This records the payment for your cell leader to check. No bank or wallet is charged in this build.',
            'Ceci note le paiement pour vérification par votre responsable. Aucune banque ni aucun portefeuille n’est débité dans cette version.',
          )}
        </Text>
        <Text style={styles.section}>{tx('History', 'Historique')}</Text>
        <View style={styles.group}>
          {history.map((item) => (
            <View key={item.id} style={styles.history}>
              <View style={styles.todoText}>
                <Text style={styles.todoTitle}>{item.name}</Text>
                <Text style={styles.todoSubtitle}>{item.detail}</Text>
              </View>
              <Text style={styles.amount}>{item.amount}</Text>
            </View>
          ))}
        </View>
      </View>
    </MemberChrome>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 2,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
    backgroundColor: colors.background,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerAvatar: { marginBottom: 4 },
  subtitle: { color: colors.label, fontSize: 12.5, fontWeight: '300' },
  title: { ...displayTitle, marginTop: 2 },
  stack: { paddingHorizontal: 16, paddingTop: 6, gap: 16 },
  hero: {
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },
  days: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  daysText: { color: colors.white, fontSize: 12, fontWeight: '400' },
  event: {
    color: colors.white,
    fontFamily: font.display,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    marginTop: 8,
  },
  when: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '400' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: '400' },
  statValue: { color: colors.white, fontSize: 18, fontWeight: '600' },
  qr: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  qrIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' },
  qrText: { flex: 1 },
  qrTitle: { color: colors.ink, fontSize: 15.5, fontWeight: '500' },
  qrBody: { color: colors.label, fontSize: 13, fontWeight: '400' },
  section: {
    color: colors.label,
    fontSize: 12.5,
    fontWeight: '300',
    letterSpacing: 0.25,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  group: { backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' },
  todo: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  todoFirst: { borderTopWidth: 0 },
  mark: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  markText: { color: colors.white, fontWeight: '400' },
  todoText: { flex: 1, minWidth: 0 },
  todoTitle: { color: colors.ink, fontSize: 15.5, fontWeight: '400' },
  todoSubtitle: { color: colors.label, fontSize: 13, fontWeight: '400', marginTop: 1 },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    backgroundColor: 'rgba(15,31,42,0.92)',
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  toastText: { color: colors.white, flex: 1, fontSize: 14 },
  toastClose: { color: colors.white, fontSize: 20 },
  given: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 2 },
  givenLabel: { color: colors.label, fontSize: 13 },
  givenValue: { fontFamily: font.display, color: colors.ink, fontSize: 38, fontWeight: '700', letterSpacing: -0.8 },
  months: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  month: { width: '18%', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  monthPaid: { backgroundColor: '#E8F7EE' },
  monthDue: { backgroundColor: '#FFF4E0' },
  monthName: { fontSize: 12 },
  monthState: { fontSize: 14, fontWeight: '700' },
  monthPaidText: { color: colors.successText },
  monthDueText: { color: colors.warningText },
  pay: { minHeight: 52, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  payText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  paid: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  paidMark: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.live, alignItems: 'center', justifyContent: 'center' },
  paidText: { flex: 1, color: colors.successText, fontSize: 14.5, fontWeight: '600' },
  sample: { color: colors.muted, fontSize: 12, lineHeight: 17, marginHorizontal: 4 },
  history: { minHeight: 56, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  amount: { color: colors.ink, fontSize: 15, fontWeight: '600' },
});
