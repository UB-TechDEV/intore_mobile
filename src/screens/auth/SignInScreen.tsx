import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MAX_SIGN_IN_ATTEMPTS, SAMPLE_PASSWORD, SAMPLE_USERNAME, verifySampleSignIn } from '../../domain/rules';
import { useTx } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useSession } from '../../state/session';
import { Text, TextInput } from '../../theme/text';
import { colors, radius } from '../../theme/tokens';

type Stage = 'sign-in' | 'reset' | 'reset-sent' | 'username' | 'username-sent' | 'roles';

export function SignInScreen() {
  const { tx } = useTx();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const session = useSession();
  const [stage, setStage] = useState<Stage>('sign-in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const locked = attempts >= MAX_SIGN_IN_ATTEMPTS;

  const enter = (role: 'protocol' | 'member') => {
    session.signIn();
    session.setRole(role);
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: role === 'protocol' ? 'Protocol' : 'Member' }] }));
  };

  const submit = () => {
    if (locked) return;
    if (verifySampleSignIn(username, password)) {
      setError('');
      setAttempts(0);
      setStage('roles');
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setError(
      next >= MAX_SIGN_IN_ATTEMPTS
        ? tx('Account locked until a system admin unlocks it.', 'Compte bloqué jusqu’au déverrouillage par un administrateur.')
        : tx('Username or password is wrong.', 'Nom d’utilisateur ou mot de passe incorrect.'),
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>FPR Inkotanyi · Diaspora in Europe</Text>
        <Text style={styles.tagline}>{tx('Together, wherever we are.', 'Ensemble, où que nous soyons.')}</Text>

        {stage === 'sign-in' ? (
          <View style={styles.card}>
            <Text style={styles.heading}>{tx('Sign in', 'Connexion')}</Text>
            <Text style={styles.lead}>{tx('Enter your username and password.', 'Saisissez votre nom d’utilisateur et votre mot de passe.')}</Text>
            <Field label={tx('Username', 'Nom d’utilisateur')} value={username} onChangeText={setUsername} placeholder="e.g. ange.uwase" autoCapitalize="none" />
            <View>
              <Field label={tx('Password', 'Mot de passe')} value={password} onChangeText={setPassword} secure={hidden} />
              <Pressable accessibilityRole="button" accessibilityLabel={hidden ? tx('Show password', 'Afficher le mot de passe') : tx('Hide password', 'Masquer le mot de passe')} onPress={() => setHidden((value) => !value)}>
                <Text style={styles.link}>{hidden ? tx('Show', 'Afficher') : tx('Hide', 'Masquer')}</Text>
              </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" accessibilityLabel={tx('Sign in', 'Connexion')} disabled={locked} onPress={submit} style={[styles.button, locked ? styles.buttonOff : null]}>
              <Text style={styles.buttonText}>{tx('Sign in', 'Connexion')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setStage('reset')}><Text style={styles.link}>{tx('Forgot your password?', 'Mot de passe oublié ?')}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => setStage('username')}><Text style={styles.link}>{tx('Forgot your username?', 'Nom d’utilisateur oublié ?')}</Text></Pressable>
            <Text style={styles.note}>{tx('New member? Your cell leader added you. Use the link in your welcome email to set your password first.', 'Nouveau membre ? Votre responsable vous a ajouté. Utilisez le lien de l’e-mail de bienvenue pour choisir votre mot de passe.')}</Text>
            <Text style={styles.sample}>{tx(`Sample account: ${SAMPLE_USERNAME} · ${SAMPLE_PASSWORD}. No server is connected.`, `Compte d’exemple : ${SAMPLE_USERNAME} · ${SAMPLE_PASSWORD}. Aucun serveur n’est connecté.`)}</Text>
          </View>
        ) : null}

        {stage === 'reset' || stage === 'username' ? (
          <View style={styles.card}>
            <Text style={styles.heading}>{stage === 'reset' ? tx('Reset your password', 'Réinitialiser le mot de passe') : tx('Forgot your username?', 'Nom d’utilisateur oublié ?')}</Text>
            <Text style={styles.lead}>
              {stage === 'reset'
                ? tx('Enter your username. We email you a link to choose a new password.', 'Saisissez votre nom d’utilisateur. Nous vous envoyons un lien pour choisir un nouveau mot de passe.')
                : tx('Enter the email on your profile and we will send your username to it.', 'Saisissez l’e-mail de votre profil et nous vous enverrons votre nom d’utilisateur.')}
            </Text>
            <Field label={stage === 'reset' ? tx('Username', 'Nom d’utilisateur') : tx('Email', 'E-mail')} value={username} onChangeText={setUsername} autoCapitalize="none" keyboardType={stage === 'username' ? 'email-address' : 'default'} />
            <Pressable accessibilityRole="button" onPress={() => setStage(stage === 'reset' ? 'reset-sent' : 'username-sent')} style={styles.button}>
              <Text style={styles.buttonText}>{stage === 'reset' ? tx('Email me a reset link', 'M’envoyer un lien') : tx('Email me my username', 'M’envoyer mon nom d’utilisateur')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setStage('sign-in')}><Text style={styles.link}>{tx('Back to sign in', 'Retour à la connexion')}</Text></Pressable>
          </View>
        ) : null}

        {stage === 'reset-sent' || stage === 'username-sent' ? (
          <View style={styles.card}>
            <Text style={styles.heading}>{tx('Check your email', 'Vérifiez votre e-mail')}</Text>
            <Text style={styles.lead}>
              {tx(
                'Nothing was sent. This build has no email server yet. Ask your cell leader if you are stuck.',
                'Rien n’a été envoyé. Cette version n’a pas encore de serveur d’e-mail. Demandez à votre responsable si vous êtes bloqué.',
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
            <Pressable accessibilityRole="button" accessibilityLabel={tx('Protocol officer', 'Agent protocole')} onPress={() => enter('protocol')} style={styles.role}>
              <Text style={styles.roleTitle}>{tx('Protocol officer', 'Agent protocole')}</Text>
              <Text style={styles.roleBody}>RPF Europe Retreat — Poland · Gate 2</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={tx('Member', 'Membre')} onPress={() => enter('member')} style={styles.role}>
              <Text style={styles.roleTitle}>{tx('Member', 'Membre')}</Text>
              <Text style={styles.roleBody}>{tx('France cell', 'Cellule France')}</Text>
            </Pressable>
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
  sample: { color: colors.inkSoft, fontSize: 12.5, lineHeight: 18 },
  error: { color: colors.dangerText, fontWeight: '600' },
  role: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, gap: 2 },
  roleTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  roleBody: { color: colors.muted, fontSize: 13 },
});
