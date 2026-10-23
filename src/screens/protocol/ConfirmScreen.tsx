import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DetailLine, IconButton, Pill, PrimaryButton } from '../../components/ui';
import { commitAttendance, getEnrolledPhoto, stopGate, verifyCheckInOtp } from '../../api/event';
import { formatDay, jpegPart, participantName } from '../../api/format';
import { useTx } from '../../i18n';
import type { CheckStackParamList } from '../../navigation/types';
import { errorMessage, useSession } from '../../state/session';
import { Text, TextInput } from '../../theme/text';
import { colors, radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<CheckStackParamList, 'Confirm'>;
type Phase = 'details' | 'welcome' | 'stopped';

export function ConfirmScreen({ route, navigation }: Props) {
  const { tx } = useTx();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const resolved = route.params.resolve;
  const person = resolved.participant;
  const name = participantName(person);
  const token = resolved.resolutionToken;
  const outcome = resolved.outcome ?? '';
  const [phase, setPhase] = useState<Phase>(outcome === 'STOPPED' ? 'stopped' : 'details');
  const [otp, setOtp] = useState('');
  const [otpOk, setOtpOk] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [enrolledUri, setEnrolledUri] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [admitError, setAdmitError] = useState('');
  const [checkedAt, setCheckedAt] = useState('');
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);

  const eventId = session.post?.eventId;
  const memberId = person?.memberId;

  useEffect(() => {
    if (!memberId || !eventId || !person?.hasEnrolledPhoto) return;
    void getEnrolledPhoto(memberId, eventId)
      .then(setEnrolledUri)
      .catch(() => undefined);
  }, [memberId, eventId, person?.hasEnrolledPhoto]);

  if (!person) return null;

  const howLabel = route.params.how === 'qr' ? tx('QR code', 'code QR') : tx('typed number', 'numéro saisi');
  const already = outcome === 'ALREADY_CHECKED_IN';
  const declined = outcome === 'DECLINED';
  const closed = outcome === 'EVENT_CLOSED' || outcome === 'REVOKED_CREDENTIAL';
  const unpaid = person.contributionGiven === false;
  const idMissing = !person.nationalId;
  const noFace = person.hasEnrolledPhoto === false;
  const canOverride = (session.me?.activeRole?.permissions ?? session.me?.permissions ?? []).includes('ATTENDANCE_OVERRIDE');
  const original = resolved.originalAttendance ?? resolved.original;

  const verifyOtp = async () => {
    if (!token || otp.replace(/\D/g, '').length < 6) return;
    setBusy(true);
    setOtpError('');
    try {
      const result = await verifyCheckInOtp(token, otp.replace(/\D/g, ''));
      if (result.verified) setOtpOk(true);
      else setOtpError(tx('Wrong code', 'Code incorrect'));
    } catch (caught) {
      setOtpError(errorMessage(caught, tx('Wrong code', 'Code incorrect')));
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    const picture = await cameraRef.current?.takePictureAsync({ quality: 0.6 });
    if (picture?.uri) {
      setPhotoUri(picture.uri);
      setCameraOpen(false);
    }
  };

  const admit = async () => {
    if (busy || !token || !photoUri) return;
    setBusy(true);
    setAdmitError('');
    try {
      const record = await commitAttendance(token, jpegPart(photoUri, 'entrance.jpg'), declined && canOverride ? 'Admitted after declined RSVP' : undefined);
      setCheckedAt(record.checkedInAt ? formatDay(record.checkedInAt) : '');
      setPhase('welcome');
    } catch (caught) {
      setAdmitError(errorMessage(caught, tx('Could not admit this person.', 'Impossible d’admettre cette personne.')));
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (busy || !token) return;
    setBusy(true);
    try {
      await stopGate(token);
      setPhase('stopped');
    } catch (caught) {
      setAdmitError(errorMessage(caught, tx('Could not stop this entry.', 'Impossible d’arrêter cette entrée.')));
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'welcome') {
    return (
      <Result
        icon="checkmark"
        iconBg={colors.success}
        title={tx('Welcome in', 'Bienvenue')}
        body={tx(
          `${name} · checked in${checkedAt ? ` at ${checkedAt}` : ''}${session.post?.gateName ? ` · ${session.post.gateName}` : ''}`,
          `${name} · entrée${checkedAt ? ` à ${checkedAt}` : ''}${session.post?.gateName ? ` · ${session.post.gateName}` : ''}`,
        )}
        note={person.seat ? `${tx('Seat', 'Place')} ${person.seat}` : undefined}
        action={tx('Scan the next person', 'Scanner la personne suivante')}
        onAction={() => navigation.popToTop()}
      />
    );
  }

  if (phase === 'stopped') {
    return (
      <Result
        icon="close"
        iconBg={colors.danger}
        title={tx('Entry stopped', 'Entrée arrêtée')}
        body={tx(
          `This invitation is paused. The QR code of ${name || 'this person'} will not work until it is cleared.`,
          `Cette invitation est suspendue. Le code QR de ${name || 'cette personne'} ne fonctionnera plus tant qu’il n’est pas levé.`,
        )}
        action={tx('Back to the gate', 'Retour à la porte')}
        onAction={() => navigation.popToTop()}
      />
    );
  }

  if (cameraOpen) {
    return (
      <View style={[styles.screen, styles.cameraWrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="light" />
        <Text style={styles.cameraTitle}>{tx('Entrance photo', 'Photo d’entrée')}</Text>
        <View style={styles.cameraBox}>
          {permission?.granted ? (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
          ) : (
            <Text style={styles.help}>{tx('Allow the camera', 'Autoriser l’appareil photo')}</Text>
          )}
        </View>
        <PrimaryButton label={tx('Take the photo', 'Prendre la photo')} icon="camera" onPress={() => void takePhoto()} />
        <PrimaryButton label={tx('Cancel', 'Annuler')} onPress={() => setCameraOpen(false)} />
      </View>
    );
  }

  const readyToAdmit = otpOk && !!photoUri && !already && !closed && outcome !== 'NOT_INVITED' && (!declined || canOverride);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.smallHead}>
        <Text style={styles.smallHeadTitle}>{tx('Check in', 'Contrôle')}</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 32 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <IconButton icon="chevron-back" accessibilityLabel={tx('Back', 'Retour')} onPress={() => navigation.goBack()} />
          <Text style={styles.found}>{tx(`Found by ${howLabel}`, `Trouvé par ${howLabel}`)}</Text>
          <Pill
            label={already ? tx('Already in', 'Déjà entré') : tx('Invited', 'Invité')}
            tone={already || declined || unpaid ? 'warning' : 'success'}
          />
        </View>

        {already ? (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>{tx('Already checked in today', 'Déjà enregistré aujourd’hui')}</Text>
            <Text style={styles.warningBody}>
              {tx(
                `${name}${original?.checkedInAt ? ` · ${formatDay(original.checkedInAt)}` : ''}${original?.gateName ? ` · ${original.gateName}` : ''}. No second record.`,
                `${name}${original?.checkedInAt ? ` · ${formatDay(original.checkedInAt)}` : ''}${original?.gateName ? ` · ${original.gateName}` : ''}. Pas de second enregistrement.`,
              )}
            </Text>
          </View>
        ) : null}

        {closed ? (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>{tx('This invitation cannot be used', 'Cette invitation ne peut pas être utilisée')}</Text>
            <Text style={styles.warningBody}>{outcome.replace(/_/g, ' ').toLowerCase()}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {person.hasEnrolledPhoto && enrolledUri ? (
            <View style={styles.photoWrap}>
              <Image
                source={{ uri: enrolledUri }}
                style={styles.photo}
                resizeMode="cover"
                accessibilityLabel={tx(`Enrolled photo of ${name}`, `Photo enregistrée de ${name}`)}
              />
              <View style={styles.photoCaption}>
                <Text style={styles.photoName}>{name}</Text>
                <Text style={styles.photoDate}>{tx('Enrolled photo', 'Photo enregistrée')}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.missing}>
              <Ionicons name="alert-circle-outline" size={28} color={colors.warningText} />
              <View style={styles.missingText}>
                <Text style={styles.warningTitle}>{tx(`${name} — no face on file`, `${name} — pas de visage`)}</Text>
                <Text style={styles.warningBody}>
                  {tx(
                    'The server will refuse admission until a face is enrolled.',
                    'Le serveur refusera l’entrée tant qu’un visage n’est pas enregistré.',
                  )}
                </Text>
                {memberId ? (
                  <PrimaryButton
                    label={tx('Enrol the face now', 'Enregistrer le visage maintenant')}
                    tone="night"
                    onPress={() => navigation.getParent()?.navigate('Faces', { screen: 'Enrol', params: { personId: memberId } })}
                  />
                ) : null}
              </View>
            </View>
          )}
          <View style={styles.details}>
            <DetailLine label={tx('ID', 'Pièce')} value={person.nationalId || tx('Missing', 'Manquante')} warning={idMissing} />
            <DetailLine label={tx('Cell', 'Cellule')} value={person.cellName || '—'} />
            <DetailLine label={tx('Role · seat', 'Rôle · place')} value={`${person.isDelegate ? tx('Delegate', 'Délégué') : tx('Participant', 'Participant')} · ${person.seat || '—'}`} />
            <DetailLine
              label={tx('Contribution', 'Contribution')}
              value={person.contributionGiven ? tx('Paid', 'Payée') : tx('Unpaid — contribution desk', 'Impayée — bureau des contributions')}
              warning={unpaid}
            />
          </View>
        </View>

        {token && !already && !closed ? (
          <>
            <Text style={styles.question}>{tx('Enter the 6-digit code sent to their phone', 'Saisissez le code à 6 chiffres envoyé sur leur téléphone')}</Text>
            <TextInput
              accessibilityLabel={tx('SMS code', 'Code SMS')}
              value={otp}
              onChangeText={(value) => {
                setOtp(value.replace(/\D/g, '').slice(0, 6));
                setOtpOk(false);
                setOtpError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="••••••"
              placeholderTextColor={colors.faint}
              style={styles.code}
            />
            {otp.replace(/\D/g, '').length === 6 && !otpOk ? (
              <PrimaryButton label={tx('Check the code', 'Vérifier le code')} disabled={busy} onPress={() => void verifyOtp()} />
            ) : null}
            {otpOk ? <Text style={styles.ok}>{tx('Code correct', 'Code correct')}</Text> : null}
            {otpError ? <Text style={styles.bad}>{otpError}</Text> : null}

            {otpOk ? (
              <>
                <Text style={styles.question}>{tx('Take an entrance photo — required to admit', 'Prenez une photo d’entrée — obligatoire pour admettre')}</Text>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.entrance} />
                ) : (
                  <PrimaryButton
                    label={tx('Take entrance photo', 'Prendre la photo d’entrée')}
                    icon="camera"
                    onPress={() => {
                      void requestPermission();
                      setCameraOpen(true);
                    }}
                  />
                )}
              </>
            ) : null}
          </>
        ) : null}

        {unpaid ? (
          <Text style={styles.question}>
            {tx('Send them to the contribution desk. They can be admitted after the payment is confirmed.', 'Envoyez-les au bureau des contributions. L’entrée sera possible après confirmation du paiement.')}
          </Text>
        ) : null}
        {idMissing ? (
          <Text style={styles.question}>
            {tx('The identity document is missing, so this person cannot be admitted.', 'La pièce d’identité manque, cette personne ne peut pas entrer.')}
          </Text>
        ) : null}
        {noFace && !unpaid && !idMissing ? (
          <Text style={styles.help}>{tx('Enrol the face before letting them in.', 'Enregistrez le visage avant de laisser entrer.')}</Text>
        ) : null}
        {declined ? (
          <Text style={styles.question}>
            {canOverride
              ? tx('This invitation was declined. You can still admit with your override permission.', 'Cette invitation a été refusée. Vous pouvez tout de même admettre avec votre droit de dérogation.')
              : tx('This invitation was declined. A supervisor with override permission must admit them.', 'Cette invitation a été refusée. Un responsable avec droit de dérogation doit les admettre.')}
          </Text>
        ) : null}

        {admitError ? <Text style={styles.bad}>{admitError}</Text> : null}

        {token && !already && !closed ? (
          <>
            <Text style={styles.question}>{tx('Is the person in front of you the one in the photo?', 'La personne devant vous est-elle celle de la photo ?')}</Text>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel={tx('No, stop', 'Non, arrêter')} onPress={() => void stop()} style={styles.stopBtn}>
                <Text style={styles.stopText}>{tx('No, stop', 'Non, arrêter')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('Yes, let in', 'Oui, laisser entrer')}
                accessibilityState={{ disabled: busy || !readyToAdmit }}
                disabled={busy || !readyToAdmit}
                onPress={() => void admit()}
                style={[styles.letInBtn, busy || !readyToAdmit ? styles.letInDisabled : null]}
              >
                <Text style={styles.letInText}>{tx('Yes, let in', 'Oui, laisser entrer')}</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Result({
  icon,
  iconBg,
  title,
  body,
  note,
  action,
  onAction,
}: {
  icon: 'checkmark' | 'close';
  iconBg: string;
  title: string;
  body: string;
  note?: string;
  action: string;
  onAction: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, styles.result, { paddingTop: insets.top + 30 }]}>
      <StatusBar style="dark" />
      <View style={[styles.resultIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={40} color={colors.white} />
      </View>
      <Text style={styles.resultTitle}>{title}</Text>
      <Text style={styles.resultBody}>{body}</Text>
      {note ? <Text style={styles.help}>{note}</Text> : null}
      <View style={styles.resultAction}>
        <PrimaryButton label={action} icon="scan" onPress={onAction} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  cameraWrap: { backgroundColor: colors.night, padding: 16, gap: 12 },
  cameraTitle: { color: colors.white, fontSize: 16, textAlign: 'center' },
  cameraBox: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.nightCard, minHeight: 320 },
  smallHead: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  smallHeadTitle: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  scroll: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  found: { color: colors.muted, fontSize: 12.5, flex: 1, fontWeight: '400' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  photoWrap: { height: 300, backgroundColor: colors.nightCard, justifyContent: 'flex-end' },
  photo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  photoCaption: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: 'rgba(6,20,34,0.5)' },
  photoName: { color: colors.white, fontSize: 21, fontWeight: '400' },
  photoDate: { color: 'rgba(255,255,255,0.88)', fontSize: 12.5, fontWeight: '400', marginTop: 2 },
  missing: { backgroundColor: colors.warningSoft, padding: 18, flexDirection: 'row', gap: 12 },
  missingText: { flex: 1, gap: 8 },
  details: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  warning: { backgroundColor: colors.warningSoft, borderRadius: radius.lg, padding: 14, gap: 4, marginBottom: 12 },
  warningTitle: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  warningBody: { color: colors.inkSoft, fontSize: 13, lineHeight: 18 },
  question: { color: colors.ink, fontSize: 13, fontWeight: '400', textAlign: 'center', marginTop: 16, marginBottom: 10 },
  code: {
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 20,
    letterSpacing: 6,
    color: colors.ink,
    marginBottom: 10,
  },
  entrance: { width: '100%', height: 180, borderRadius: radius.lg, marginBottom: 10 },
  ok: { color: colors.successText, fontWeight: '600', textAlign: 'center' },
  bad: { color: colors.dangerText, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  stopBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopText: { color: colors.dangerText, fontSize: 14, fontWeight: '400' },
  letInBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letInDisabled: { backgroundColor: colors.disabled },
  letInText: { color: colors.white, fontSize: 14, fontWeight: '400' },
  help: { color: colors.muted, fontSize: 12.5, textAlign: 'center' },
  result: { alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  resultIcon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 23, fontWeight: '600', color: colors.ink },
  resultBody: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  resultAction: { alignSelf: 'stretch', marginTop: 12 },
});
