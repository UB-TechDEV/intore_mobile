import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import { Keypad, PrimaryButton, SecondaryButton } from '../../components/ui';
import { EVENT_FACE_TOTALS, SAMPLE_EVENT, SAMPLE_FACE } from '../../data/sample';
import { digitsOnly, findByInvitation, formatInvitation, sampleFaceMatch } from '../../domain/rules';
import { useTx } from '../../i18n';
import type { CheckStackParamList } from '../../navigation/types';
import { useSession } from '../../state/session';
import { ProtocolChrome } from './MyPostScreen';
import { Text } from '../../theme/text';
import { colors, radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<CheckStackParamList, 'CheckHome'>;
type Mode = 'face' | 'qr' | 'number';
type FacePhase = 'ready' | 'searching' | 'match' | 'none';

export function CheckInScreen({ navigation }: Props) {
  const { tx } = useTx();
  const session = useSession();
  const [mode, setMode] = useState<Mode>('face');
  const [phase, setPhase] = useState<FacePhase>('ready');
  const [typed, setTyped] = useState('');
  const [numberError, setNumberError] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const qrHandled = useRef(false);
  const match = sampleFaceMatch(session.people, session.enrolledIds);
  const totals = EVENT_FACE_TOTALS[SAMPLE_EVENT] ?? { enrolled: 0, invited: 0 };
  const extraEnrolled = session.enrolledIds.filter(
    (id) => session.people.find((person) => person.id === id)?.baseStatus !== 'enrolled',
  ).length;
  const enrolledCount = Math.min(totals.invited, totals.enrolled + extraEnrolled);
  const matchPhoto = match
    ? session.enrolments.find((entry) => entry.personId === match.id)?.photoUri
    : undefined;

  useEffect(() => {
    if (!permission?.granted) {
      void requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const openConfirm = (personId: string, how: 'face' | 'qr' | 'number') => {
    navigation.navigate('Confirm', { personId, how });
  };

  const scanFace = () => {
    setPhase('searching');
    setTimeout(() => {
      setPhase(match ? 'match' : 'none');
    }, 1800);
  };

  const faceCaption =
    phase === 'searching'
      ? tx(`Looking among ${enrolledCount} enrolled faces…`, `Recherche parmi ${enrolledCount} visages enregistrés…`)
      : phase === 'match'
        ? tx('Match found', 'Correspondance trouvée')
        : phase === 'none'
          ? tx('No match found', 'Aucune correspondance')
          : tx('Ask the person to look at the camera', 'Demandez à la personne de regarder l’appareil');

  const lookupNumber = (raw: string) => {
    const person = findByInvitation(session.people, raw);
    if (!person) {
      setNumberError(true);
      return;
    }
    setNumberError(false);
    openConfirm(person.id, 'number');
  };

  return (
    <ProtocolChrome title={tx('Check in', 'Contrôle')}>
      <View style={styles.stack}>
        <View style={styles.modes}>
          {([
            ['face', tx('Face', 'Visage')],
            ['qr', tx('QR code', 'Code QR')],
            ['number', tx('Number', 'Numéro')],
          ] as const).map(([id, label]) => {
            const selected = mode === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
                onPress={() => {
                  setMode(id);
                  setPhase('ready');
                  setNumberError(false);
                }}
                style={[styles.mode, selected ? styles.modeOn : null]}
              >
                <Text style={[styles.modeLabel, selected ? styles.modeLabelOn : null]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {mode === 'face' ? (
          <View style={styles.panel}>
            <View style={styles.cameraCard}>
              {permission?.granted ? (
                <CameraView style={StyleSheet.absoluteFill} facing="front" />
              ) : (
                <Image source={SAMPLE_FACE} style={StyleSheet.absoluteFill} resizeMode="cover" />
              )}
              <View pointerEvents="none" style={styles.ovalWrap}>
                <View style={styles.oval} />
              </View>
              {phase === 'searching' ? <ScanLine /> : null}
              <View style={styles.caption}>
                {phase === 'searching' ? <View style={styles.captionDot} /> : null}
                <Text style={styles.captionText}>{faceCaption}</Text>
              </View>
            </View>
            {phase === 'ready' ? (
              <>
                <PrimaryButton label={tx('Scan their face', 'Scanner le visage')} icon="scan-outline" onPress={scanFace} />
                <Text style={styles.help}>
                  {tx(
                    'The face is compared with every face enrolled for this event. No code needed.',
                    'Le visage est comparé à tous les visages enregistrés pour cet événement. Aucun code n’est nécessaire.',
                  )}
                </Text>
              </>
            ) : null}
            {phase === 'searching' ? (
              <View style={styles.searching}>
                <Text style={styles.searchingText}>{tx('Searching…', 'Recherche…')}</Text>
              </View>
            ) : null}
            {phase === 'match' && match ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={match.name}
                  onPress={() => openConfirm(match.id, 'face')}
                  style={styles.matchCard}
                >
                  <Image
                    source={matchPhoto ? { uri: matchPhoto } : SAMPLE_FACE}
                    style={styles.matchPhoto}
                    resizeMode="cover"
                  />
                  <View style={styles.matchText}>
                    <Text style={styles.matchName}>{match.name}</Text>
                    <Text style={styles.matchMeta}>
                      {tx(`97% match · ${match.cell} · ${match.role}`, `Correspondance 97 % · ${match.cell} · ${match.role}`)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.successText} />
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setPhase('ready')} style={styles.rescan}>
                  <Text style={styles.rescanText}>{tx('Not them — scan again', 'Ce n’est pas cette personne — scanner encore')}</Text>
                </Pressable>
              </>
            ) : null}
            {phase === 'none' ? (
              <View style={styles.none}>
                <Text style={styles.noneTitle}>{tx('No match found', 'Aucune correspondance')}</Text>
                <Text style={styles.noneBody}>
                  {tx(
                    'Their face may not be enrolled yet. Scan their QR code or type their number — you can enrol their face from there.',
                    'Le visage n’est peut-être pas encore enregistré. Scannez le code QR ou saisissez le numéro — vous pourrez enregistrer le visage ensuite.',
                  )}
                </Text>
                <View style={styles.noneActions}>
                  <Pressable accessibilityRole="button" onPress={() => setMode('qr')} style={styles.nonePrimary}>
                    <Text style={styles.nonePrimaryText}>{tx('Scan QR code', 'Scanner le code QR')}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => setPhase('ready')} style={styles.noneSecondary}>
                    <Text style={styles.noneSecondaryText}>{tx('Try again', 'Réessayer')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {mode === 'qr' ? (
          <View style={styles.panel}>
            <View style={styles.qrFrame}>
              {permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={({ data }) => {
                    if (qrHandled.current) return;
                    const person = findByInvitation(session.people, digitsOnly(data));
                    if (!person) return;
                    qrHandled.current = true;
                    openConfirm(person.id, 'qr');
                  }}
                />
              ) : null}
              <View pointerEvents="none" style={styles.qrCorners} />
              <Text style={styles.qrHint}>{tx('Point the camera at the participant’s QR code', 'Visez le code QR du participant')}</Text>
            </View>
            {!permission?.granted ? (
              <SecondaryButton label={tx('Allow the camera', 'Autoriser l’appareil photo')} onPress={() => void requestPermission()} />
            ) : null}
            <PrimaryButton
              label={tx('Scan the code', 'Scanner le code')}
              icon="qr-code"
              onPress={() => openConfirm('ange', 'qr')}
            />
            <SecondaryButton
              label={tx('Type their number instead', 'Saisir le numéro à la place')}
              icon="keypad-outline"
              onPress={() => setMode('number')}
            />
          </View>
        ) : null}

        {mode === 'number' ? (
          <View style={styles.panel}>
            <Text style={styles.help}>{tx('Type the 8-digit number on their invitation', 'Saisissez le numéro à 8 chiffres de l’invitation')}</Text>
            <View style={styles.numberBox}>
              <Text style={styles.numberText}>{formatInvitation(typed) || ' '}</Text>
            </View>
            <Keypad
              onDigit={(digit) => {
                setNumberError(false);
                setTyped((current) => digitsOnly(current + digit).slice(0, 8));
              }}
              onDelete={() => {
                setNumberError(false);
                setTyped((current) => digitsOnly(current).slice(0, -1));
              }}
            />
            {digitsOnly(typed).length === 8 ? (
              <PrimaryButton label={tx('Find the person', 'Trouver la personne')} icon="search" onPress={() => lookupNumber(typed)} />
            ) : (
              <View style={styles.disabledFind}>
                <Text style={styles.disabledFindText}>{tx('Find the person', 'Trouver la personne')}</Text>
              </View>
            )}
            {numberError ? <Text style={styles.error}>{tx('No invitation with that number', 'Aucune invitation avec ce numéro')}</Text> : null}
            <Text style={styles.help}>
              {tx('Sample number:', 'Numéro d’exemple :')} <Text style={styles.strong}>5347 6150</Text>
            </Text>
            <Pressable accessibilityRole="button" onPress={() => setMode('qr')}>
              <Text style={styles.link}>{tx('Scan QR code instead', 'Scanner le code QR à la place')}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.counters}>
          <Text style={styles.counter}>
            {tx('In today', 'Aujourd’hui')} <Text style={styles.counterValue}>184</Text>
          </Text>
          <Text style={styles.counter}>
            {tx('This gate', 'Cette porte')} <Text style={styles.counterValue}>{62 + session.admissions.length}</Text>
          </Text>
        </View>
      </View>
    </ProtocolChrome>
  );
}

function ScanLine() {
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [translateY]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.scanLine,
        {
          transform: [
            {
              translateY: translateY.interpolate({ inputRange: [0, 1], outputRange: [40, 310] }),
            },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  stack: { paddingHorizontal: 16, gap: 14, paddingBottom: 8 },
  modes: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    gap: 4,
  },
  mode: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeOn: { backgroundColor: colors.primary },
  modeLabel: { color: colors.inkSoft, fontSize: 13, fontWeight: '400' },
  modeLabelOn: { color: colors.white },
  panel: { gap: 12 },
  cameraCard: {
    minHeight: 380,
    height: 380,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.night,
  },
  ovalWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 52,
  },
  oval: {
    width: 228,
    height: 296,
    borderRadius: 148,
    borderWidth: 3,
    borderColor: colors.white,
  },
  scanLine: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: colors.sky,
  },
  caption: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(11,21,32,0.8)',
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captionDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.sky },
  captionText: { color: colors.white, textAlign: 'center', fontSize: 13, fontWeight: '400' },
  searching: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchingText: { color: colors.muted, fontSize: 14.5, fontWeight: '400' },
  matchCard: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.success,
    padding: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  matchPhoto: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.chip },
  matchText: { flex: 1, minWidth: 0 },
  matchName: { color: colors.ink, fontSize: 14, fontWeight: '400' },
  matchMeta: { color: colors.successText, fontSize: 12.5, fontWeight: '400' },
  rescan: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C9D6DE',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescanText: { color: colors.ink, fontSize: 13, fontWeight: '400' },
  none: { backgroundColor: colors.warningSoft, borderRadius: radius.lg, padding: 14 },
  noneTitle: { color: colors.ink, fontSize: 14, fontWeight: '400', marginBottom: 4 },
  noneBody: { color: colors.inkSoft, fontSize: 12.5, lineHeight: 19 },
  noneActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  nonePrimary: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nonePrimaryText: { color: colors.white, fontSize: 13, fontWeight: '400' },
  noneSecondary: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C9D6DE',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noneSecondaryText: { color: colors.ink, fontSize: 13, fontWeight: '400' },
  help: { color: colors.muted, fontSize: 12, lineHeight: 17, textAlign: 'center', fontWeight: '400' },
  qrFrame: {
    height: 330,
    borderRadius: radius.lg,
    backgroundColor: colors.night,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qrCorners: {
    width: 210,
    height: 210,
    borderWidth: 3,
    borderColor: colors.white,
    borderRadius: 16,
  },
  qrHint: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontSize: 12.5,
  },
  numberBox: {
    minHeight: 62,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontSize: 24, letterSpacing: 2, color: colors.ink, fontWeight: '500' },
  disabledFind: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledFindText: { color: colors.muted, fontWeight: '600' },
  error: { color: colors.dangerText, textAlign: 'center', fontWeight: '600' },
  strong: { color: colors.ink, fontWeight: '700' },
  link: { color: colors.primary, textAlign: 'center', fontWeight: '600' },
  counters: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 2 },
  counter: { color: colors.muted, fontSize: 12.5, fontWeight: '400' },
  counterValue: { color: colors.ink, fontWeight: '400' },
});
