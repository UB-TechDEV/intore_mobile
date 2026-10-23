import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { isApiError } from '../../api/problem';
import { useTx } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { assignmentFor, errorMessage, phoneRolesOf, useSession, type PhoneRole } from '../../state/session';
import { Text, TextInput } from '../../theme/text';
import { colors, radius } from '../../theme/tokens';
import * as authApi from '../../api/auth';

type Stage = 'sign-in' | 'reset' | 'reset-sent' | 'roles';

export function SignInScreen() {
  const { tx } = useTx();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const session = useSession();
  const [stage, setStage] = useState<Stage>('sign-in');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (name: keyof RootStackParamList) => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name }] }));
  };

  const enter = async (role: PhoneRole) => {
    setBusy(true);
    setError('');
    try {
      await session.enterRole(role);
      go(role === 'protocol' ? 'Protocol' : 'Member');
    } catch (caught) {
      setError(errorMessage(caught, tx('Could not open that role.', 'Impossible d’ouvrir ce rôle.')));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const me = await session.signIn(identifier, password);
      const roles = phoneRolesOf(me);
      if (roles.length === 0) {
        setError(tx('This account has no phone role.', 'Ce compte n’a pas de rôle pour le téléphone.'));
        await session.signOut();
        return;
      }
      if (roles.length === 1) {
        await enter(roles[0]);
        return;
      }
      setStage('roles');
    } catch (caught) {
      if (isApiError(caught) && caught.code === 'rate_limited') {
        setError(
          tx(
            `Too many attempts — try again in ${caught.retryAfter ?? 30}s.`,
            `Trop de tentatives — réessayez dans ${caught.retryAfter ?? 30} s.`,
          ),
        );
      } else {
        setError(errorMessage(caught, tx('Email, national ID or password is wrong.', 'E-mail, pièce d’identité ou mot de passe incorrect.')));
      }
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await authApi.forgotPassword(identifier.trim());
      setStage('reset-sent');
    } catch (caught) {
      setError(errorMessage(caught, tx('Could not send the reset email.', 'Impossible d’envoyer l’e-mail de réinitialisation.')));
    } finally {
      setBusy(false);
    }
  };

  const protocol = assignmentFor(session.me, 'protocol');
  const member = assignmentFor(session.me, 'member');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>FPR Inkotanyi · Diaspora in Europe</Text>
        <Text style={styles.tagline}>{tx('Together, wherever we are.', 'Ensemble, où que nous soyons.')}</Text>

        {stage === 'sign-in' ? (
          <View style={styles.card}>
            <Text style={styles.heading}>{tx('Sign in', 'Connexion')}</Text>
            <Text style={styles.lead}>
              {tx('Enter your email or national ID, and your password.', 'Saisissez votre e-mail ou votre pièce d’identité, et votre mot de passe.')}
            </Text>
            <Field
              label={tx('Email or national ID', 'E-mail ou pièce d’identité')}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="e.g. name@diaspora.rw"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View>
              <Field label={tx('Password', 'Mot de passe')} value={password} onChangeText={setPassword} secure={hidden} />
              <Pressable accessibilityRole="button" accessibilityLabel={hidden ? tx('Show password', 'Afficher le mot de passe') : tx('Hide password', 'Masquer le mot de passe')} onPress={() => setHidden((value) => !value)}>
                <Text style={styles.link}>{hidden ? tx('Show', 'Afficher') : tx('Hide', 'Masquer')}</Text>
              </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" accessibilityLabel={tx('Sign in', 'Connexion')} disabled={busy} onPress={() => void submit()} style={[styles.button, busy ? styles.buttonOff : null]}>
              {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{tx('Sign in', 'Connexion')}</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setError(''); setStage('reset'); }}><Text style={styles.link}>{tx('Forgot your password?', 'Mot de passe oublié ?')}</Text></Pressable>
            <Text style={styles.note}>
              {tx(
                'New member? Your cell leader added you. Use the link in your welcome email to set your password first.',
                'Nouveau membre ? Votre responsable vous a ajouté. Utilisez le lien de l’e-mail de bienvenue pour choisir votre mot de passe.',
              )}
            </Text>
          </View>
        ) : null}

        {stage === 'reset' ? (
          <View style={styles.card}>
            <Text style={styles.heading}>{tx('Reset your password', 'Réinitialiser le mot de passe')}</Text>
            <Text style={styles.lead}>
              {tx('Enter your email or national ID. If it is on an account, we email a link to choose a new password.', 'Saisissez votre e-mail ou votre pièce. S’il est sur un compte, nous envoyons un lien pour choisir un nouveau mot de passe.')}
            </Text>
            <Field label={tx('Email or national ID', 'E-mail ou pièce d’identité')} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" keyboardType="email-address" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void sendReset()} style={styles.button}>
              {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{tx('Email me a reset link', 'M’envoyer un lien')}</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setStage('sign-in')}><Text style={styles.link}>{tx('Back to sign in', 'Retour à la connexion')}</Text></Pressable>
          </View>
        ) : null}

        {stage === 'reset-sent' ? (
          <View style={styles.card}>
            <Text style={styles.heading}>{tx('Check your email', 'Vérifiez votre e-mail')}</Text>
            <Text style={styles.lead}>
              {tx(
                'If that email or ID is on an account, a reset link is on its way. Ask your cell leader if you are stuck.',
                'Si cet e-mail ou cette pièce est sur un compte, un lien de réinitialisation est en route. Demandez à votre responsable si vous êtes bloqué.',
              )}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => setStage('sign-in')} style={styles.button}>
              <Text style={styles.buttonText}>{tx('Back to sign in', 'Retour à la connexion')}</Text>
            </Pressable>
          </View>
        ) : null}

        {stage === 'roles' ? (
          <View style={styles.card}>
            <Text style={styles.heading}>{tx(`Signed in as ${session.fullName}`, `Connecté en tant que ${session.fullName}`)}</Text>
            <Text style={styles.lead}>{tx('Continue as', 'Continuer en tant que')}</Text>
            <Text style={styles.note}>{tx('Your account has these roles. You can switch at any time from your profile.', 'Votre compte a ces rôles. Vous pouvez changer à tout moment depuis votre profil.')}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {protocol ? (
              <Pressable accessibilityRole="button" accessibilityLabel={tx('Protocol officer', 'Agent protocole')} disabled={busy} onPress={() => void enter('protocol')} style={styles.role}>
                <Text style={styles.roleTitle}>{tx('Protocol officer', 'Agent protocole')}</Text>
                <Text style={styles.roleBody}>{protocol.orgUnitName || tx('Gate assignment', 'Affectation de porte')}</Text>
              </Pressable>
            ) : null}
            {member ? (
              <Pressable accessibilityRole="button" accessibilityLabel={tx('Member', 'Membre')} disabled={busy} onPress={() => void enter('member')} style={styles.role}>
                <Text style={styles.roleTitle}>{tx('Member', 'Membre')}</Text>
                <Text style={styles.roleBody}>{member.orgUnitName || session.member?.cellName || tx('Your cell', 'Votre cellule')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  autoCapitalize = 'none',
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  autoCapitalize?: 'none' | 'words';
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20, gap: 10, paddingBottom: 40 },
  brand: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  tagline: { color: colors.inkSoft, fontSize: 15, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12 },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  lead: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  field: { gap: 6 },
  fieldLabel: { color: colors.muted, fontSize: 12.5 },
  input: { minHeight: 48, borderRadius: radius.sm, backgroundColor: colors.background, paddingHorizontal: 12, color: colors.ink, fontSize: 16 },
  button: { minHeight: 48, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  buttonOff: { backgroundColor: colors.disabled },
  buttonText: { color: colors.white, fontWeight: '700' },
  link: { color: colors.primary, fontWeight: '600' },
  note: { color: colors.muted, fontSize: 12.5, lineHeight: 18 },
  error: { color: colors.dangerText, fontWeight: '600' },
  role: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, gap: 2 },
  roleTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  roleBody: { color: colors.muted, fontSize: 13 },
});
