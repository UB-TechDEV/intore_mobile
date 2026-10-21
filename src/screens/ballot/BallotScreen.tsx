import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BALLOT_OPTIONS } from '../../data/sample';
import { canCastVote } from '../../domain/rules';
import { useTx } from '../../i18n';
import { useSession } from '../../state/session';
import { Text } from '../../theme/text';
import { colors, radius } from '../../theme/tokens';

const FPR_MARK = require('../../../assets/brand/fpr-inkotanyi.png');
const START_SECONDS = 12 * 24 * 60 * 60 + 6 * 60 * 60 + 42 * 60 + 6;
const KEY_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '<'],
] as const;

export function BallotScreen() {
  const { tx, language, setLanguage } = useTx();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const session = useSession();
  const [step, setStep] = useState<'pin' | 'ballot' | 'done'>(session.voteChoice ? 'done' : 'pin');
  const [pin, setPin] = useState('');
  const [pick, setPick] = useState<string | null>(session.voteChoice);
  const [left, setLeft] = useState(START_SECONDS);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const days = Math.floor(left / 86400);
  const hours = Math.floor((left % 86400) / 3600);
  const minutes = Math.floor((left % 3600) / 60);
  const seconds = left % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  const countdown = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  const choiceName = BALLOT_OPTIONS.find((option) => option.id === pick)?.name ?? session.voteChoice ?? '';

  const addDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) setStep('ballot');
  };

  const vote = () => {
    if (!pick || submitting || !canCastVote(session.voteChoice)) return;
    setSubmitting(true);
    const option = BALLOT_OPTIONS.find((item) => item.id === pick);
    if (option) session.castVote(option.name);
    setStep('done');
    setSubmitting(false);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.bar}>
        <Image source={FPR_MARK} style={styles.brand} resizeMode="contain" accessibilityLabel="FPR Inkotanyi" />
        <View style={styles.barRight}>
          <View style={styles.lang}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="English"
              accessibilityState={{ selected: language === 'en' }}
              onPress={() => setLanguage('en')}
              style={[styles.langItem, language === 'en' ? styles.langOn : null]}
            >
              <Text style={[styles.langText, language === 'en' ? styles.langTextOn : null]}>EN</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Français"
              accessibilityState={{ selected: language === 'fr' }}
              onPress={() => setLanguage('fr')}
              style={[styles.langItem, language === 'fr' ? styles.langOn : null]}
            >
              <Text style={[styles.langText, language === 'fr' ? styles.langTextOn : null]}>FR</Text>
            </Pressable>
          </View>
          <View style={styles.ua} accessibilityLabel="Uwase Ange">
            <Text style={styles.uaText}>UA</Text>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 'pin' ? (
          <View style={styles.pin}>
            <View style={styles.lock}>
              <Feather name="check-square" size={28} color={colors.primary} />
            </View>
            <Text style={styles.question}>
              {tx('Who should host the RPF Europe Retreat 2027?', 'Qui doit accueillir la retraite Europe du FPR 2027 ?')}
            </Text>
            <Text style={styles.lead}>
              {tx('Confirm it’s you, Ange — enter your 4-digit PIN.', 'Confirmez que c’est vous, Ange — saisissez votre code à 4 chiffres.')}
            </Text>
            <View style={styles.countdownPill} accessibilityRole="timer">
              <Feather name="clock" size={14} color={colors.primary} />
              <Text style={styles.countdownText}>
                {tx('Closes in', 'Clôture dans')} <Text style={styles.countdownMono}>{countdown}</Text>
              </Text>
            </View>
            <View style={styles.dots}>
              {[0, 1, 2, 3].map((index) => (
                <View key={index} style={[styles.dot, index < pin.length ? styles.dotOn : null]} />
              ))}
            </View>
            <View style={styles.keys}>
              {KEY_ROWS.map((row) => (
                <View key={row.join('-')} style={styles.keyRow}>
                  {row.map((key, index) => {
                    if (!key) {
                      return <View key={`blank-${index}`} style={styles.keySpacer} />;
                    }
                    if (key === '<') {
                      return (
                        <Pressable
                          key="del"
                          accessibilityRole="button"
                          accessibilityLabel={tx('Delete', 'Effacer')}
                          onPress={() => setPin((value) => value.slice(0, -1))}
                          style={({ pressed }) => [styles.key, pressed ? styles.keyPressed : null]}
                        >
                          <Text style={styles.keyLabel}>&lt;</Text>
                        </Pressable>
                      );
                    }
                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityLabel={key}
                        onPress={() => addDigit(key)}
                        style={({ pressed }) => [styles.key, pressed ? styles.keyPressed : null]}
                      >
                        <Text style={styles.keyLabel}>{key}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Use face recognition', 'Utiliser la reconnaissance du visage')}
              onPress={() => {
                setPin('0000');
                setStep('ballot');
              }}
              style={styles.face}
            >
              <MaterialCommunityIcons name="face-recognition" size={18} color={colors.ink} />
              <Text style={styles.faceText}>{tx('Use face recognition', 'Utiliser la reconnaissance du visage')}</Text>
            </Pressable>
          </View>
        ) : null}
        {step === 'ballot' ? (
          <View style={styles.ballot}>
            <View style={styles.countdownBar} accessibilityRole="timer">
              <Feather name="clock" size={17} color={colors.primary} />
              <Text style={styles.countdownText}>
                {tx('Closes in', 'Clôture dans')} <Text style={styles.countdownMono}>{countdown}</Text>
              </Text>
            </View>
            <Text style={styles.meta}>{tx('Ballot · closes 20 Oct 2026', 'Scrutin · clôture le 20 oct 2026')}</Text>
            <Text style={styles.ballotQuestion}>
              {tx('Who should host the RPF Europe Retreat 2027?', 'Qui doit accueillir la retraite Europe du FPR 2027 ?')}
            </Text>
            {BALLOT_OPTIONS.map((option) => {
              const selected = pick === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.name}
                  onPress={() => setPick(option.id)}
                  style={[styles.option, selected ? styles.optionOn : null]}
                >
                  <View style={[styles.radio, selected ? styles.radioOn : null]} />
                  <View style={styles.optionText}>
                    <Text style={styles.optionName}>{option.name}</Text>
                    <Text style={styles.optionCity}>
                      {option.league} · {option.city}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Cast my vote', 'Voter')}
              disabled={!pick || submitting}
              onPress={vote}
              style={[styles.cast, !pick ? styles.castOff : null]}
            >
              <Text style={styles.castText}>{tx('Cast my vote', 'Voter')}</Text>
            </Pressable>
            <Text style={styles.secret}>{tx('Your choice is secret. You can vote once.', 'Votre choix est secret. Vous ne votez qu’une fois.')}</Text>
          </View>
        ) : null}
        {step === 'done' ? (
          <View style={styles.done}>
            <View style={styles.doneIcon}>
              <Ionicons name="checkmark" size={36} color={colors.successText} />
            </View>
            <Text style={styles.doneTitle}>{tx('Vote recorded', 'Vote enregistré')}</Text>
            <Text style={styles.doneBody}>
              {tx(
                `You voted for ${choiceName}. Results are published when the vote closes on 20 Oct 2026.`,
                `Vous avez voté pour ${choiceName}. Les résultats sont publiés à la clôture du vote, le 20 oct 2026.`,
              )}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.back}>
              <Text style={styles.backText}>{tx('Back to votes', 'Retour aux votes')}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ballotBackground },
  bar: {
    minHeight: 64,
    backgroundColor: colors.surface,
    paddingLeft: 20,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  brand: { width: 80, height: 43 },
  barRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lang: {
    flexDirection: 'row',
    backgroundColor: colors.ballotBackground,
    borderRadius: 5,
    padding: 3,
    gap: 2,
  },
  langItem: { minWidth: 38, minHeight: 30, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  langOn: { backgroundColor: colors.primary },
  langText: { color: colors.inkSoft, fontSize: 12.5, fontWeight: '400' },
  langTextOn: { color: colors.white },
  ua: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uaText: { color: colors.white, fontSize: 12.5, fontWeight: '400' },
  body: { flexGrow: 1, paddingBottom: 32 },
  pin: { paddingHorizontal: 20, paddingTop: 24, alignItems: 'center' },
  lock: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '400',
    lineHeight: 26,
    textAlign: 'center',
    marginTop: 14,
  },
  lead: { color: colors.inkSoft, fontSize: 13, textAlign: 'center', marginTop: 8, fontWeight: '400' },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.primarySoft,
  },
  countdownBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.primarySoft,
  },
  countdownText: { color: colors.primary, fontSize: 12.5, fontWeight: '400' },
  countdownMono: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 12.5,
    fontWeight: '400',
    color: colors.primary,
  },
  dots: { flexDirection: 'row', gap: 14, marginTop: 20 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#9DB0BC' },
  dotOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  keys: { width: '100%', gap: 10, marginTop: 22 },
  keyRow: { flexDirection: 'row', gap: 10 },
  key: {
    flex: 1,
    minHeight: 58,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keySpacer: { flex: 1 },
  keyPressed: { opacity: 0.72 },
  keyLabel: { fontSize: 21, fontWeight: '400', color: colors.ink },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 18,
    marginTop: 16,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#C9D6DE',
    backgroundColor: colors.surface,
  },
  faceText: { color: colors.ink, fontSize: 13, fontWeight: '400' },
  ballot: { padding: 20, gap: 10 },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  ballotQuestion: { color: colors.ink, fontSize: 19, lineHeight: 26, fontWeight: '400', marginTop: 6 },
  option: {
    minHeight: 64,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    backgroundColor: colors.surface,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#9DB0BC' },
  radioOn: { borderWidth: 6, borderColor: colors.primary },
  optionText: { flex: 1 },
  optionName: { color: colors.ink, fontSize: 15, fontWeight: '400' },
  optionCity: { color: colors.muted, fontSize: 12.5, fontWeight: '400' },
  cast: {
    minHeight: 52,
    marginTop: 8,
    borderRadius: 5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castOff: { opacity: 0.45 },
  castText: { color: colors.white, fontSize: 15, fontWeight: '400' },
  secret: { color: colors.muted, fontSize: 12.5, textAlign: 'center', fontWeight: '400' },
  done: { alignItems: 'center', gap: 12, paddingTop: 56, paddingHorizontal: 24 },
  doneIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 21, fontWeight: '400', color: colors.ink },
  doneBody: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', lineHeight: 20, fontWeight: '400' },
  back: { minHeight: 44, paddingHorizontal: 18, borderRadius: radius.sm, backgroundColor: colors.surface, justifyContent: 'center' },
  backText: { color: colors.primary, fontWeight: '400' },
});
