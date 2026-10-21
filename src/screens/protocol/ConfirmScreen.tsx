import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DetailLine, IconButton, Pill, PrimaryButton } from '../../components/ui';
import { SAMPLE_FACE } from '../../data/sample';
import { SAMPLE_MATCH_SCORE, admitBlock, faceStatus } from '../../domain/rules';
import { useTx } from '../../i18n';
import type { CheckStackParamList } from '../../navigation/types';
import { useSession } from '../../state/session';
import { Text } from '../../theme/text';
import { colors, radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<CheckStackParamList, 'Confirm'>;
type Phase = 'details' | 'comparing' | 'matched' | 'welcome' | 'stopped' | 'already';

export function ConfirmScreen({ route, navigation }: Props) {
  const { tx } = useTx();
  const insets = useSafeAreaInsets();
  const session = useSession();
  const person = session.people.find((item) => item.id === route.params.personId);
  const [phase, setPhase] = useState<Phase>('details');
  const [busy, setBusy] = useState(false);

  if (!person) return null;

  const enrolled = faceStatus(person, session.enrolledIds) === 'enrolled';
  const photoUri = session.enrolments.find((entry) => entry.personId === person.id)?.photoUri;
  const block = admitBlock({
    personId: person.id,
    paid: person.paid,
    idMissing: !person.documentNumber,
    admittedIds: session.admittedIds,
    stoppedIds: session.stoppedIds,
  });
  const howLabel = {
    face: tx('face scan', 'scan du visage'),
    qr: tx('QR code', 'code QR'),
    number: tx('typed number', 'numéro saisi'),
  }[route.params.how];
  const photoSource = photoUri ? { uri: photoUri } : person.id === 'ange' ? SAMPLE_FACE : undefined;

  const compare = () => {
    setPhase('comparing');
    setTimeout(() => setPhase('matched'), 800);
  };

  const admit = () => {
    if (busy || block) return;
    setBusy(true);
    session.admit({
      personId: person.id,
      at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      how: route.params.how,
      gate: 'Gate 2',
    });
    setPhase('welcome');
  };

  const stop = () => {
    if (busy) return;
    setBusy(true);
    session.stop(person.id);
    setPhase('stopped');
  };

  if (phase === 'welcome') {
    const admission = session.admissions.find((entry) => entry.personId === person.id);
    return (
      <Result
        icon="checkmark"
        iconBg={colors.success}
        title={tx('Welcome in', 'Bienvenue')}
        body={tx(
          `${person.name} · checked in at ${admission?.at ?? ''} · Gate 2`,
          `${person.name} · entrée à ${admission?.at ?? ''} · Porte 2`,
        )}
        note={`${tx('Seat', 'Place')} ${person.seat} · ${tx('Day 1 of 2', 'Jour 1 sur 2')}`}
        action={tx('Scan the next person', 'Scanner la personne suivante')}
        onAction={() => navigation.popToTop()}
      />
    );
  }

  if (phase === 'stopped' || block === 'stopped') {
    return (
      <Result
        icon="close"
        iconBg={colors.danger}
        title={tx('Entry stopped', 'Entrée arrêtée')}
        body={tx(
          `The protocol lead has been alerted. The QR code of ${person.name} is paused until someone checks it.`,
          `Le responsable protocole a été prévenu. Le code QR de ${person.name} est suspendu jusqu’à vérification.`,
        )}
        action={tx('Back to the gate', 'Retour à la porte')}
        onAction={() => navigation.popToTop()}
      />
    );
  }

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
          <Pill label={tx('Invited · valid today', 'Invité · valable aujourd’hui')} tone="success" />
        </View>

        {block === 'already' ? (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>{tx('Already checked in today', 'Déjà enregistré aujourd’hui')}</Text>
            <Text style={styles.warningBody}>
              {tx(
                `${person.name} · ${session.admissions.find((entry) => entry.personId === person.id)?.at ?? ''} · Gate 2. No second record.`,
                `${person.name} · ${session.admissions.find((entry) => entry.personId === person.id)?.at ?? ''} · Porte 2. Pas de second enregistrement.`,
              )}
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {enrolled ? (
            <View style={styles.photoWrap}>
              {photoSource ? (
                <Image
                  source={photoSource}
                  style={styles.photo}
                  resizeMode="cover"
                  accessibilityLabel={tx(`Enrolled photo of ${person.name}`, `Photo enregistrée de ${person.name}`)}
                />
              ) : null}
              <View style={styles.photoCaption}>
                <Text style={styles.photoName}>{person.name}</Text>
                <Text style={styles.photoDate}>{tx('Enrolled photo · 9 Oct 2026', 'Photo enregistrée · 9 oct 2026')}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.missing}>
              <Ionicons name="alert-circle-outline" size={28} color={colors.warningText} />
              <View style={styles.missingText}>
                <Text style={styles.warningTitle}>{tx(`${person.name} — no face on file`, `${person.name} — pas de visage`)}</Text>
                <Text style={styles.warningBody}>
                  {tx(
                    'Check the ID card or passport carefully, then enrol the face now so the next gate can see it.',
                    'Vérifiez soigneusement la pièce, puis enregistrez le visage maintenant pour que la porte suivante le voie.',
                  )}
                </Text>
                <PrimaryButton
                  label={tx('Enrol the face now', 'Enregistrer le visage maintenant')}
                  tone="night"
                  onPress={() => navigation.getParent()?.navigate('Faces', { screen: 'Enrol', params: { personId: person.id } })}
                />
              </View>
            </View>
          )}
          <View style={styles.details}>
            <DetailLine label={person.documentLabel || tx('ID', 'Pièce')} value={person.documentNumber || tx('Missing', 'Manquante')} warning={!person.documentNumber} />
            <DetailLine label={tx('Cell', 'Cellule')} value={person.cell} />
            <DetailLine label={tx('Role · seat', 'Rôle · place')} value={`${person.role} · ${person.seat}`} />
            <DetailLine label={tx('Day pass', 'Pass du jour')} value={tx('Day 1 of 2 · first entry today', 'Jour 1 sur 2 · première entrée')} />
            <DetailLine
              label={tx('Contribution', 'Contribution')}
              value={person.paid ? person.contributionLabel : tx('Unpaid — contribution desk', 'Impayée — bureau des contributions')}
              warning={!person.paid}
            />
          </View>
        </View>

        {enrolled && phase === 'details' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tx('Scan their face to compare', 'Scanner le visage pour comparer')}
            onPress={compare}
            style={styles.compareBtn}
          >
            <Ionicons name="scan-outline" size={18} color={colors.primary} />
            <Text style={styles.compareBtnText}>{tx('Scan their face to compare', 'Scanner le visage pour comparer')}</Text>
          </Pressable>
        ) : null}
        {phase === 'comparing' ? (
          <View style={styles.compare}>
            <View style={styles.pulse} />
            <Text style={styles.compareText}>{tx('Comparing with the enrolled photo…', 'Comparaison avec la photo enregistrée…')}</Text>
          </View>
        ) : null}
        {phase === 'matched' ? (
          <View style={styles.matched}>
            <Ionicons name="checkmark-circle" size={18} color={colors.successText} />
            <Text style={styles.matchedText}>
              {tx(`Same person · ${SAMPLE_MATCH_SCORE}% match`, `Même personne · correspondance ${SAMPLE_MATCH_SCORE} %`)}
            </Text>
          </View>
        ) : null}

        {block === 'unpaid' ? (
          <Text style={styles.question}>
            {tx('Send them to the contribution desk. They can be admitted after the payment is confirmed.', 'Envoyez-les au bureau des contributions. L’entrée sera possible après confirmation du paiement.')}
          </Text>
        ) : block === 'already' || block === 'id-missing' ? (
          block === 'id-missing' ? (
            <Text style={styles.question}>
              {tx('The identity document is missing, so this person cannot be admitted.', 'La pièce d’identité manque, cette personne ne peut pas entrer.')}
            </Text>
          ) : null
        ) : (
          <>
            <Text style={styles.question}>{tx('Is the person in front of you the one in the photo?', 'La personne devant vous est-elle celle de la photo ?')}</Text>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('No, stop', 'Non, arrêter')}
                onPress={stop}
                style={styles.stopBtn}
              >
                <Text style={styles.stopText}>{tx('No, stop', 'Non, arrêter')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('Yes, let in', 'Oui, laisser entrer')}
                accessibilityState={{ disabled: busy || !enrolled }}
                disabled={busy || !enrolled}
                onPress={admit}
                style={[styles.letInBtn, busy || !enrolled ? styles.letInDisabled : null]}
              >
                <Text style={styles.letInText}>{tx('Yes, let in', 'Oui, laisser entrer')}</Text>
              </Pressable>
            </View>
            {!enrolled ? (
              <Text style={styles.help}>{tx('Enrol the face before letting them in.', 'Enregistrez le visage avant de laisser entrer.')}</Text>
            ) : null}
          </>
        )}
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
  warning: { backgroundColor: colors.warningSoft, borderRadius: radius.lg, padding: 14, gap: 4 },
  warningTitle: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  warningBody: { color: colors.inkSoft, fontSize: 13, lineHeight: 18 },
  compareBtn: {
    minHeight: 46,
    marginTop: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compareBtnText: { color: colors.primary, fontSize: 13, fontWeight: '400' },
  compare: {
    minHeight: 46,
    marginTop: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pulse: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  compareText: { color: colors.primary, fontSize: 13, fontWeight: '400' },
  matched: {
    minHeight: 46,
    marginTop: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.successSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  matchedText: { color: colors.successText, fontSize: 13, fontWeight: '400' },
  question: { color: colors.ink, fontSize: 13, fontWeight: '400', textAlign: 'center', marginTop: 16, marginBottom: 10 },
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
