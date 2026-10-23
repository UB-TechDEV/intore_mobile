import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui';
import { getContributionEntries, getMyContributions, payMonth } from '../../api/contribution';
import { daysUntil, formatDateRange, formatDay, formatMoney } from '../../api/format';
import { digitsOnly, formatInvitation } from '../../domain/rules';
import { getMemberHome } from '../../api/member';
import type { ContributionEntryView, ContributionMeView, HomeView, MonthView } from '../../api/types';
import { useTx } from '../../i18n';
import type { MemberTabParamList } from '../../navigation/types';
import { errorMessage, useSession } from '../../state/session';
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
  const session = useSession();
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
            initials={session.initials}
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
  const session = useSession();
  const [home, setHome] = useState<HomeView | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const loadHome = useCallback(() => {
    void getMemberHome()
      .then(setHome)
      .catch((caught) => setError(errorMessage(caught, tx('Could not load home.', 'Impossible de charger l’accueil.'))));
  }, [tx]);

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome]),
  );

  const next = home?.nextEvent;
  const until = daysUntil(next?.startsOn);
  const qrReady = next?.invitationIssued === true && next.qrPayload;
  const firstName = home?.firstName || session.fullName.split(' ')[0] || session.fullName;

  return (
    <MemberChrome
      title={firstName ? tx(`Hi, ${firstName}`, `Bonjour, ${firstName}`) : tx('Home', 'Accueil')}
      subtitle={tx(`Member · ${home?.cellName || session.member?.cellName || '—'}`, `Membre · ${home?.cellName || session.member?.cellName || '—'}`)}
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
        {!home && !error ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.sample}>{error}</Text> : null}
        {next ? (
          <LinearGradient colors={['#1479B8', '#0E5E92']} start={{ x: 0.05, y: 0 }} end={{ x: 0.95, y: 1 }} style={styles.hero}>
            <View style={styles.heroTop}>
              <Text style={styles.kicker}>{tx('Your next event', 'Votre prochain événement')}</Text>
              {until != null ? (
                <View style={styles.days}>
                  <Text style={styles.daysText}>
                    {until >= 0 ? tx(`In ${until} days`, `Dans ${until} jours`) : tx('Now', 'Maintenant')}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.event}>{next.title}</Text>
            <Text style={styles.when}>{[formatDateRange(next.startsOn, next.endsOn), next.venue].filter(Boolean).join(' · ')}</Text>
            <View style={styles.stats}>
              <Stat label={tx('You gave', 'Vous avez donné')} value={formatMoney(next.youGave)} />
              <Stat label={next.cellName || tx('Cell', 'Cellule')} value={next.cellPercent != null ? `${next.cellPercent}%` : '—'} />
              <Stat label={tx('Closes', 'Clôture')} value={formatDay(next.contributionsCloseOn) || '—'} />
            </View>
          </LinearGradient>
        ) : null}
        <View style={styles.qr}>
          <View style={styles.qrIcon}>
            <Ionicons name="ticket-outline" size={24} color={colors.warningText} />
          </View>
          <View style={styles.qrText}>
            <Text style={styles.qrTitle}>{tx('Your QR codes', 'Vos codes QR')}</Text>
            <Text style={styles.qrBody}>
              {qrReady
                ? digitsOnly(next?.qrPayload ?? '').length === 8
                  ? formatInvitation(next?.qrPayload ?? '')
                  : next?.qrPayload
                : tx(
                    'They arrive once your cell’s payments are checked.',
                    'Ils arrivent une fois les paiements de votre cellule vérifiés.',
                  )}
            </Text>
          </View>
        </View>
        <View>
          <Text style={styles.section}>{tx('To do', 'À faire')}</Text>
          <View style={styles.group}>
            {(home?.todo ?? []).map((item, index) => {
              if (item.kind === 'VOTE') {
                return (
                  <Todo
                    key={`vote-${item.eventId ?? index}`}
                    color={colors.primary}
                    mark="✓"
                    markSize={13}
                    first={index === 0}
                    title={tx(`Vote for the ${item.hostYear ?? ''} host`, `Votez pour l’hôte ${item.hostYear ?? ''}`)}
                    subtitle={item.eventTitle || ''}
                    onPress={() => navigation.getParent()?.navigate('Ballot')}
                  />
                );
              }
              if (item.kind === 'PAY_MONTH' || item.kind === 'GIVE_EVENT') {
                return (
                  <Todo
                    key={`pay-${item.month ?? item.eventId ?? index}`}
                    color={colors.live}
                    mark="€"
                    markSize={14}
                    first={index === 0}
                    title={
                      item.kind === 'GIVE_EVENT'
                        ? tx(`Give for ${item.eventTitle ?? 'the event'}`, `Donner pour ${item.eventTitle ?? 'l’événement'}`)
                        : tx(`Pay your ${item.month ?? ''} contribution`, `Payez votre contribution ${item.month ?? ''}`)
                    }
                    subtitle={`${formatMoney(item.amount ?? item.pledge)}${item.cellName ? ` · ${item.cellName}` : ''}`}
                    onPress={() => navigation.navigate('Pay')}
                  />
                );
              }
              return (
                <Todo
                  key={`${item.kind}-${index}`}
                  color={colors.message}
                  mark="·"
                  first={index === 0}
                  title={item.eventTitle || item.kind || ''}
                  subtitle={item.cellName || ''}
                  onPress={() => navigation.navigate('Pay')}
                />
              );
            })}
            {home?.fromCell ? (
              <Todo
                color={colors.message}
                mark={(home.fromCell.senderName ?? '·').slice(0, 2).toUpperCase()}
                markSize={11}
                first={(home.todo ?? []).length === 0}
                title={tx('Message from your cell', 'Message de votre cellule')}
                subtitle={home.fromCell.senderName || ''}
                onPress={() => setToast(home.fromCell?.excerpt || '')}
              />
            ) : null}
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

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MemberPayScreen() {
  const { tx } = useTx();
  const year = new Date().getFullYear();
  const [summary, setSummary] = useState<ContributionMeView | null>(null);
  const [entries, setEntries] = useState<ContributionEntryView[]>([]);
  const [pendingMonth, setPendingMonth] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [nextSummary, nextEntries] = await Promise.all([getMyContributions(year), getContributionEntries(year)]);
    setSummary(nextSummary);
    setEntries(nextEntries.data ?? []);
  }, [year]);

  useFocusEffect(
    useCallback(() => {
      void reload().catch((caught) => setError(errorMessage(caught, tx('Could not load contributions.', 'Impossible de charger les contributions.'))));
    }, [reload, tx]),
  );

  const due: MonthView | undefined = summary?.months?.find((month) => month.status === 'DUE' && month.month === summary.openMonth)
    ?? summary?.months?.find((month) => month.status === 'DUE');
  const rate = summary?.monthlyRate ?? due?.amount ?? 10;
  const currency = summary?.currency ?? 'EUR';

  const pay = async () => {
    if (!due?.month || busy) return;
    setBusy(true);
    setError('');
    try {
      await payMonth({ year, month: due.month, amount: rate ?? 10, currency });
      setPendingMonth(due.month);
      await reload();
    } catch (caught) {
      setError(errorMessage(caught, tx('Could not record the payment.', 'Impossible d’enregistrer le paiement.')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <MemberChrome title={tx('Pay', 'Payer')} subtitle={tx('Your contributions', 'Vos contributions')}>
      <View style={styles.stack}>
        <View style={styles.given}>
          <Text style={styles.givenLabel}>{tx(`Given in ${summary?.year ?? year}`, `Donné en ${summary?.year ?? year}`)}</Text>
          <Text style={styles.givenValue}>{formatMoney(summary?.given, currency)}</Text>
          <Text style={styles.givenLabel}>{tx('monthly payments, collections and events', 'mensualités, collectes et événements')}</Text>
        </View>
        <Text style={styles.section}>{tx(`Monthly payments · ${formatMoney(rate, currency)}`, `Mensualités · ${formatMoney(rate, currency)}`)}</Text>
        <View style={styles.months}>
          {(summary?.months ?? []).map((month) => {
            const paid = month.status === 'PAID';
            const pending = month.month === pendingMonth || month.status === 'TO_CHECK';
            return (
              <View key={month.month} style={[styles.month, paid ? styles.monthPaid : styles.monthDue]}>
                <Text style={[styles.monthName, paid ? styles.monthPaidText : styles.monthDueText]}>{MONTH_LABELS[(month.month ?? 1) - 1]}</Text>
                <Text style={[styles.monthState, paid ? styles.monthPaidText : styles.monthDueText]}>
                  {paid ? '✓' : pending ? '…' : tx('Due', 'Dû')}
                </Text>
              </View>
            );
          })}
        </View>
        {pendingMonth ? (
          <View style={styles.paid}>
            <View style={styles.paidMark}><Text style={styles.markText}>✓</Text></View>
            <Text style={styles.paidText}>{tx('Recorded · your cell leader will check it', 'Noté · votre responsable va le vérifier')}</Text>
          </View>
        ) : due ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx(`Pay month ${due.month} · ${formatMoney(rate, currency)}`, `Payer le mois ${due.month} · ${formatMoney(rate, currency)}`)}
            onPress={() => void pay()}
            style={styles.pay}
          >
            <Text style={styles.payText}>
              {busy ? tx('Saving…', 'Enregistrement…') : tx(`Pay · ${formatMoney(rate, currency)}`, `Payer · ${formatMoney(rate, currency)}`)}
            </Text>
          </Pressable>
        ) : null}
        <Text style={styles.sample}>
          {tx(
            'This records the payment for your cell leader to check. A month stays due until they confirm it. No bank is charged from this phone.',
            'Ceci note le paiement pour vérification par votre responsable. Un mois reste dû jusqu’à leur confirmation. Aucune banque n’est débitée depuis ce téléphone.',
          )}
        </Text>
        {error ? <Text style={styles.sample}>{error}</Text> : null}
        <Text style={styles.section}>{tx('History', 'Historique')}</Text>
        <View style={styles.group}>
          {entries.map((item) => (
            <View key={item.id} style={styles.history}>
              <View style={styles.todoText}>
                <Text style={styles.todoTitle}>{item.name}</Text>
                <Text style={styles.todoSubtitle}>{[formatDay(item.occurredOn), item.how, item.status].filter(Boolean).join(' · ')}</Text>
              </View>
              <Text style={styles.amount}>{formatMoney(item.amount, item.currency)}</Text>
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
