import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DetailLine, IconButton, PrimaryButton, SecondaryButton } from '../../components/ui';
import { SAMPLE_EVENT } from '../../data/sample';
import { Text, TextInput } from '../../theme/text';
import { faceStatus, verifyEnrolmentCode } from '../../domain/rules';
import { useTx } from '../../i18n';
import type { FacesStackParamList } from '../../navigation/types';
import { useSession } from '../../state/session';
import { colors, radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<FacesStackParamList, 'Enrol'>;
type Step = 'check' | 'camera' | 'review' | 'saved';

const LIVE_STEPS = [
  ['Face inside the oval', 'Visage dans l’ovale'],
  ['Blink slowly', 'Clignez lentement'],
  ['Turn your head a little to the left', 'Tournez un peu la tête à gauche'],
  ['Look straight at the camera', 'Regardez l’objectif'],
] as const;

const DOCUMENT_CHECKS = [
  ['name', 'The name on the document matches', 'Le nom sur la pièce correspond'],
  ['num', 'The ID / passport number matches', 'Le numéro de la pièce correspond'],
  ['face', 'The person matches the document photo', 'La personne correspond à la photo de la pièce'],
] as const;

const QUALITY_CHECKS = [
  ['Real person, not a photo', 'Vraie personne, pas une photo'],
  ['Face sharp and well lit', 'Visage net et bien éclairé'],
  ['Eyes open, one face only', 'Yeux ouverts, un seul visage'],
  ['Matches the ID document', 'Correspond à la pièce'],
] as const;

export function EnrolScreen({ route, navigation }: Props) {
  const { tx } = useTx();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const person = session.people.find((item) => item.id === route.params.personId);
  const [step, setStep] = useState<Step>('check');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [code, setCode] = useState('');
  const [codeState, setCodeState] = useState<'idle' | 'ok' | 'bad'>('idle');
  const [resent, setResent] = useState(false);
  const [liveIndex, setLiveIndex] = useState(-1);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (step !== 'camera') return;
    setLiveIndex(0);
    const timer = setInterval(() => {
      setLiveIndex((current) => {
        const next = current + 1;
        if (next >= LIVE_STEPS.length) {
          clearInterval(timer);
          return LIVE_STEPS.length;
        }
        return next;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (step === 'camera' && !permission?.granted) {
      void requestPermission();
    }
  }, [step, permission?.granted, requestPermission]);

  if (!person) {
    return null;
  }

  const status = faceStatus(person, session.enrolledIds);
  const idMissing = status === 'id-missing';
  const checksDone = DOCUMENT_CHECKS.every(([id]) => checks[id]);
  const codeOk = codeState === 'ok';
  const liveDone = liveIndex >= LIVE_STEPS.length;
  const givenName = person.name.split(' ')[0] ?? person.name;

  const submitCode = (value: string) => {
    setCode(value);
    if (value.trim().length < 4) {
      setCodeState('idle');
      return;
    }
    setCodeState(verifyEnrolmentCode(value) ? 'ok' : 'bad');
  };

  const takePhoto = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    const picture = await cameraRef.current?.takePictureAsync({ quality: 0.6 });
    if (picture?.uri) {
      setPhotoUri(picture.uri);
      setStep('review');
    }
  };

  const save = () => {
    if (saving) return;
    setSaving(true);
    session.enrol({
      personId: person.id,
      at: '9 Oct 2026',
      photoUri,
      by: 'Karangwa Fidèle',
      gate: 'Gate 2',
    });
    setStep('saved');
    setSaving(false);
  };

  if (step === 'camera') {
    const currentStep = LIVE_STEPS[Math.min(liveIndex, LIVE_STEPS.length - 1)];
    return (
      <View style={[styles.cameraScreen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <StatusBar style="light" />
        <View style={styles.cameraHeader}>
          <IconButton icon="close" light accessibilityLabel={tx('Cancel', 'Annuler')} onPress={() => setStep('check')} />
          <View style={styles.stepText}>
            <Text style={styles.cameraKicker}>{tx('Enrol a face · step 2 of 3', 'Enregistrer un visage · étape 2 sur 3')}</Text>
            <Text style={styles.cameraName}>{person.name}</Text>
          </View>
        </View>
        <View style={styles.preview}>
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
          ) : (
            <View style={styles.permission}>
              <Text style={styles.permissionText}>
                {tx('The camera is needed for the real-person check.', 'L’appareil photo est nécessaire pour vérifier que c’est une vraie personne.')}
              </Text>
            </View>
          )}
          <View pointerEvents="none" style={[styles.oval, liveDone ? styles.ovalDone : null]} />
          <ScanLine />
          <View style={styles.camMsg} accessibilityLiveRegion="polite">
            <Text style={styles.camMsgText}>
              {liveDone
                ? tx('Real person confirmed — take the photo', 'Personne réelle confirmée — prenez la photo')
                : tx(currentStep[0], currentStep[1])}
            </Text>
          </View>
        </View>
        <View style={styles.liveCard}>
          <Text style={styles.liveTitle}>{tx('Real-person check', 'Vérification d’une vraie personne')}</Text>
          {LIVE_STEPS.map(([en, fr], index) => {
            const done = liveIndex > index;
            const current = liveIndex === index;
            return (
              <View key={en} style={styles.liveRow} accessibilityState={{ checked: done }}>
                {done ? (
                  <View style={[styles.liveMark, styles.liveMarkDone]}>
                    <Ionicons name="checkmark" size={12} color={colors.white} />
                  </View>
                ) : current ? (
                  <PulseRing />
                ) : (
                  <View style={styles.liveMark} />
                )}
                <Text style={styles.liveLabel}>{tx(en, fr)}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.cameraFooter}>
          {liveDone && permission?.granted ? (
            <PrimaryButton label={tx('Take the photo', 'Prendre la photo')} icon="camera" onPress={() => void takePhoto()} />
          ) : (
            <View style={styles.cameraWait}>
              <Text style={styles.cameraWaitText}>
                {permission?.granted
                  ? tx('Follow the steps…', 'Suivez les étapes…')
                  : tx('Allow the camera', 'Autoriser l’appareil photo')}
              </Text>
            </View>
          )}
          {!permission?.granted ? (
            <SecondaryButton label={tx('Allow the camera', 'Autoriser l’appareil photo')} onPress={() => void requestPermission()} />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.smallHead}>
        <Text style={styles.smallHeadTitle}>{tx('Enrol a face', 'Enregistrer un visage')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 'saved' ? (
          <View style={styles.saved}>
            <View style={styles.savedPhoto}>
              {photoUri ? <Image source={{ uri: photoUri }} style={styles.savedImage} /> : <Text style={styles.savedInitials}>{person.initials}</Text>}
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark" size={18} color={colors.white} />
              </View>
            </View>
            <Text style={styles.savedTitle}>{tx('Face enrolled', 'Visage enregistré')}</Text>
            <Text style={styles.savedBody}>
              {tx(
                `${givenName}’s photo is now on the profile. When the QR code is scanned at the gate, this photo shows so you can be sure it’s the right person.`,
                `La photo de ${givenName} est maintenant sur le profil. Quand le code QR est scanné à la porte, cette photo s’affiche pour confirmer la personne.`,
              )}
            </Text>
            <Text style={styles.savedMeta}>{tx('Enrolled by Karangwa Fidèle · Gate 2', 'Enregistré par Karangwa Fidèle · Porte 2')}</Text>
            <PrimaryButton
              label={tx('Go to gate check', 'Aller au contrôle')}
              icon="scan"
              onPress={() => {
                navigation.popToTop();
                navigation.getParent()?.navigate('CheckIn', { screen: 'CheckHome' });
              }}
            />
            <SecondaryButton label={tx('Enrol the next person', 'Enregistrer la personne suivante')} onPress={() => navigation.popToTop()} />
          </View>
        ) : (
          <>
            <View style={styles.stepHeader}>
              <IconButton
                icon="chevron-back"
                accessibilityLabel={tx('Back to the list', 'Retour à la liste')}
                onPress={() => (step === 'review' ? setStep('camera') : navigation.goBack())}
              />
              <View style={styles.stepText}>
                <Text style={styles.kicker}>
                  {step === 'review'
                    ? tx('Enrol a face · step 3 of 3', 'Enregistrer un visage · étape 3 sur 3')
                    : tx('Enrol a face · step 1 of 3', 'Enregistrer un visage · étape 1 sur 3')}
                </Text>
                <Text style={styles.stepTitle}>
                  {step === 'review' ? tx('Check the photo and save', 'Vérifiez la photo et enregistrez') : tx('Check it is really them', 'Vérifiez que c’est bien cette personne')}
                </Text>
              </View>
            </View>
            <View style={styles.progress}>
              <View style={styles.progressOn} />
              <View style={step === 'review' ? styles.progressOn : styles.progressOff} />
              <View style={step === 'review' ? styles.progressOn : styles.progressOff} />
            </View>

            {step === 'check' ? (
              <>
                <View style={styles.identity}>
                  <View style={styles.placeholder}>
                    <Ionicons name="person" size={26} color={colors.muted} />
                  </View>
                  <View>
                    <Text style={styles.identityName}>{person.name}</Text>
                    <Text style={styles.identityMeta}>
                      {status === 'enrolled'
                        ? tx('Face already enrolled', 'Visage déjà enregistré')
                        : tx('No photo on file yet', 'Pas encore de photo')}
                    </Text>
                  </View>
                </View>
                <View style={styles.identityCard}>
                  <DetailLine label={person.documentLabel || tx('ID', 'Pièce')} value={person.documentNumber || tx('Missing', 'Manquante')} warning={idMissing} />
                  <DetailLine label={tx('Cell', 'Cellule')} value={person.cell} />
                  <DetailLine label={tx('Role', 'Rôle')} value={`${person.role} · ${tx('seat', 'place')} ${person.seat}`} />
                  <DetailLine label={tx('Invited to', 'Invité à')} value={SAMPLE_EVENT} />
                </View>
                {idMissing ? (
                  <Text style={styles.block}>
                    {tx(
                      'The identity document is missing, so a face cannot be enrolled. Call the protocol lead.',
                      'La pièce d’identité manque, le visage ne peut pas être enregistré. Appelez le responsable protocole.',
                    )}
                  </Text>
                ) : (
                  <>
                    <Text style={styles.ask}>{tx('Ask for their ID card or passport', 'Demandez la carte d’identité ou le passeport')}</Text>
                    <View style={styles.checkList}>
                      {DOCUMENT_CHECKS.map(([id, en, fr]) => {
                        const on = !!checks[id];
                        return (
                          <Pressable
                            key={id}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: on }}
                            accessibilityLabel={tx(en, fr)}
                            onPress={() => setChecks((current) => ({ ...current, [id]: !current[id] }))}
                            style={styles.checkRow}
                          >
                            <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? colors.primary : colors.muted} />
                            <Text style={styles.checkLabel}>{tx(en, fr)}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.ask}>{tx('Ask for the code we just emailed them', 'Demandez le code que nous venons de leur envoyer')}</Text>
                    <Text style={styles.mail}>
                      {tx(
                        `Sent to ${person.emailMasked} — proves the email on their profile is theirs`,
                        `Envoyé à ${person.emailMasked} — prouve que l’e-mail du profil est le leur`,
                      )}
                    </Text>
                    <TextInput
                      accessibilityLabel={tx('Code from their email', 'Code reçu par e-mail')}
                      value={code}
                      onChangeText={submitCode}
                      keyboardType="number-pad"
                      maxLength={4}
                      placeholder="••••"
                      placeholderTextColor={colors.faint}
                      style={styles.code}
                    />
                    <Text style={styles.demo}>
                      {tx('Sample code:', 'Code d’exemple :')} <Text style={styles.demoStrong}>4829</Text>
                      {'  ·  '}
                      <Text style={styles.link} onPress={() => setResent(true)}>{tx('Resend email', 'Renvoyer l’e-mail')}</Text>
                    </Text>
                    {resent ? (
                      <Text style={styles.mail}>
                        {tx(
                          'Resend is saved on this phone. No email server is connected in this build.',
                          'Le renvoi est noté sur ce téléphone. Aucun serveur d’e-mail n’est connecté dans cette version.',
                        )}
                      </Text>
                    ) : null}
                    {codeState === 'ok' ? <Text style={styles.ok}>{tx('Code correct', 'Code correct')}</Text> : null}
                    {codeState === 'bad' ? <Text style={styles.bad}>{tx('Wrong code', 'Code incorrect')}</Text> : null}
                    {checksDone && codeOk ? (
                      <PrimaryButton label={tx('Open the camera', 'Ouvrir l’appareil photo')} icon="camera" onPress={() => setStep('camera')} />
                    ) : (
                      <View style={styles.wait}>
                        <Text style={styles.waitText}>{tx('Open the camera', 'Ouvrir l’appareil photo')}</Text>
                      </View>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <View style={styles.reviewCard}>
                  {photoUri ? (
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.reviewPhoto}
                      resizeMode="cover"
                      accessibilityLabel={tx(`Photo just taken of ${person.name}`, `Photo venant d’être prise de ${person.name}`)}
                    />
                  ) : (
                    <View style={styles.reviewPhoto} />
                  )}
                  <View style={styles.reviewCopy}>
                    <Text style={styles.reviewName}>{person.name}</Text>
                    <Text style={styles.reviewMeta}>
                      {person.documentLabel} {person.documentNumber}
                    </Text>
                    {QUALITY_CHECKS.map(([en, fr]) => (
                      <View key={en} style={styles.quality}>
                        <Ionicons name="checkmark" size={15} color={colors.successText} />
                        <Text style={styles.qualityText}>{tx(en, fr)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>
                    {tx(
                      `Saving attaches this photo to ${givenName}’s profile. It appears every time her QR code or number is checked, at every gate.`,
                      `L’enregistrement joint cette photo au profil de ${givenName}. Elle apparaît à chaque contrôle de son code QR ou de son numéro, à toutes les portes.`,
                    )}
                  </Text>
                </View>
                <View style={styles.reviewActions}>
                  <PrimaryButton
                    label={tx('Save to her profile', 'Enregistrer sur son profil')}
                    tone="success"
                    icon="checkmark"
                    disabled={saving}
                    onPress={save}
                  />
                  <SecondaryButton label={tx('Retake', 'Reprendre')} onPress={() => setStep('camera')} />
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
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
              translateY: translateY.interpolate({
                inputRange: [0, 1],
                outputRange: [28, 300],
              }),
            },
          ],
        },
      ]}
    />
  );
}

function PulseRing() {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.liveMarkNow, { opacity }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  smallHead: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  smallHeadTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  stepText: { flex: 1 },
  kicker: {
    color: colors.muted,
    fontSize: 11.5,
    fontWeight: '400',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  stepTitle: { color: colors.ink, fontSize: 17, lineHeight: 23, fontWeight: '400' },
  progress: { flexDirection: 'row', gap: 6, marginTop: 10, marginBottom: 16 },
  progressOn: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.primary },
  progressOff: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#E1E8ED' },
  identity: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  placeholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityName: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  identityMeta: { color: colors.muted, fontSize: 12.5, marginTop: 2 },
  identityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
  },
  ask: { color: colors.ink, fontSize: 13, fontWeight: '600', marginTop: 6 },
  checkList: { gap: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkLabel: { flex: 1, color: colors.ink, fontSize: 14 },
  mail: { color: colors.muted, fontSize: 12.5, lineHeight: 18 },
  code: {
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 20,
    letterSpacing: 6,
    color: colors.ink,
  },
  demo: { color: colors.muted, fontSize: 12 },
  demoStrong: { color: colors.ink, fontWeight: '700' },
  link: { color: colors.primary, fontWeight: '700' },
  ok: { color: colors.successText, fontWeight: '600' },
  bad: { color: colors.dangerText, fontWeight: '600' },
  block: { color: colors.warningText, fontSize: 14, lineHeight: 20 },
  wait: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  cameraScreen: { flex: 1, backgroundColor: colors.night, padding: 16, gap: 16 },
  cameraHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cameraKicker: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11.5,
    fontWeight: '400',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  cameraName: { color: colors.white, fontSize: 15, fontWeight: '400' },
  preview: {
    width: 300,
    height: 360,
    alignSelf: 'center',
    marginTop: 2,
    borderRadius: radius.lg,
    backgroundColor: colors.nightCard,
    overflow: 'hidden',
  },
  oval: {
    position: 'absolute',
    left: 33,
    top: 25,
    width: 234,
    height: 310,
    borderRadius: 155,
    borderWidth: 3,
    borderColor: colors.white,
  },
  ovalDone: { borderColor: colors.liveDot },
  scanLine: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    height: 2,
    backgroundColor: colors.sky,
  },
  camMsg: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(11,21,32,0.78)',
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  camMsgText: { color: colors.white, textAlign: 'center', fontSize: 13, fontWeight: '400' },
  permission: { flex: 1, padding: 24, justifyContent: 'center' },
  permissionText: { color: colors.white, textAlign: 'center' },
  liveCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  liveTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11.5,
    fontWeight: '400',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  liveMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveMarkDone: { backgroundColor: colors.liveDot, borderColor: colors.liveDot },
  liveMarkNow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.white,
  },
  liveLabel: { color: colors.white, fontSize: 12.5, lineHeight: 18, flex: 1, fontWeight: '400' },
  cameraFooter: { marginTop: 'auto', paddingTop: 8, gap: 10 },
  cameraWait: {
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraWaitText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '400' },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: colors.ink,
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  reviewPhoto: { width: 120, height: 150, borderRadius: radius.lg, backgroundColor: colors.chip },
  reviewCopy: { flex: 1, minWidth: 0 },
  reviewName: { color: colors.ink, fontSize: 15, fontWeight: '400' },
  reviewMeta: { color: colors.muted, fontSize: 12, fontWeight: '400', marginBottom: 6 },
  quality: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  qualityText: { flex: 1, color: colors.ink, fontSize: 12.5, fontWeight: '400' },
  notice: {
    marginTop: 2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  noticeText: { color: colors.primary, fontSize: 12.5, lineHeight: 18, fontWeight: '400' },
  reviewActions: { marginTop: 4, gap: 10 },
  saved: { alignItems: 'center', gap: 12, paddingTop: 24 },
  savedPhoto: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center' },
  savedImage: { width: 132, height: 132, borderRadius: 66 },
  savedInitials: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 132,
    fontSize: 32,
    fontWeight: '600',
    overflow: 'hidden',
  },
  savedBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedTitle: { fontSize: 21, fontWeight: '600', color: colors.ink },
  savedBody: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  savedMeta: { color: colors.muted, fontSize: 12 },
});
