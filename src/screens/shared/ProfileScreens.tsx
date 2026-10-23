import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState, type ReactNode } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Avatar, Group, NavRow, SectionLabel, ToggleRow } from '../../components/ui';
import { formatDay, maskId } from '../../api/format';
import { updateMe } from '../../api/auth';
import { useTx, type ProfileLanguage } from '../../i18n';
import type { ProfileStackParamList, RootStackParamList } from '../../navigation/types';
import { MemberChrome } from '../member/MemberScreens';
import { ProtocolChrome } from '../protocol/MyPostScreen';
import { errorMessage, useSession } from '../../state/session';
import { Text, TextInput } from '../../theme/text';
import { colors, displayName, displayTitle, radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export function ProtocolProfileScreen({ navigation }: Props) {
  const { tx } = useTx();
  const session = useSession();
  return (
    <ProtocolChrome title={tx('Profile', 'Profil')}>
      <ProfileBody
        roleLine={tx(`Protocol officer${session.post?.gateName ? ` · ${session.post.gateName}` : ''}`, `Agent protocole${session.post?.gateName ? ` · ${session.post.gateName}` : ''}`)}
        today={
          <View>
            <SectionLabel>{tx('Today', 'Aujourd’hui')}</SectionLabel>
            <Group>
              <Info title={tx('Your post', 'Votre poste')} subtitle={[session.post?.gateName, session.post?.purpose].filter(Boolean).join(' · ') || '—'} />
              {session.post?.assignedBy ? (
                <Info title={tx('Assigned by', 'Affecté par')} subtitle={session.post.assignedBy} />
              ) : null}
            </Group>
          </View>
        }
        extraToggles={
          <ToggleRow
            label={tx('Keep the app on during my shift', 'Garder l’app allumée pendant ma vacation')}
            value={session.keepAwake}
            onValueChange={session.setKeepAwake}
          />
        }
        help={
          <View>
            <SectionLabel>{tx('Help', 'Aide')}</SectionLabel>
            <Group>
              <NavRow
                title={tx('How to enrol a face', 'Comment enregistrer un visage')}
                onPress={() =>
                  Alert.alert(
                    tx('How to enrol a face', 'Comment enregistrer un visage'),
                    tx(
                      'Check the identity document, enter the emailed code, follow the real-person steps, then save the photo.',
                      'Vérifiez la pièce, saisissez le code envoyé, suivez les étapes de la vraie personne, puis enregistrez la photo.',
                    ),
                  )
                }
              />
              <NavRow
                title={tx('What to do if the scan fails', 'Si le scan échoue')}
                onPress={() =>
                  Alert.alert(
                    tx('What to do if the scan fails', 'Si le scan échoue'),
                    tx(
                      'Scan the QR code or type the invitation number. If the face cannot be compared, check the identity document and call the protocol lead.',
                      'Scannez le code QR ou saisissez le numéro. Si le visage ne peut pas être comparé, vérifiez la pièce et appelez le responsable protocole.',
                    ),
                  )
                }
              />
              {session.post?.colleagues?.find((person) => person.phone)?.phone ? (
                <NavRow
                  title={tx('Call the protocol lead', 'Appeler le responsable protocole')}
                  onPress={() => {
                    const phone = session.post?.colleagues?.find((person) => person.phone)?.phone;
                    if (phone) void Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
                  }}
                />
              ) : null}
            </Group>
          </View>
        }
        onPersonal={() => navigation.navigate('PersonalDetails')}
        protocolCurrent
      />
    </ProtocolChrome>
  );
}

export function MemberProfileScreen() {
  const { tx } = useTx();
  const session = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <MemberChrome title={tx('Profile', 'Profil')} subtitle={tx('Your account', 'Votre compte')}>
      <ProfileBody
        roleLine={tx(`Member · ${session.member?.cellName || session.me?.memberType || '—'}`, `Membre · ${session.member?.cellName || session.me?.memberType || '—'}`)}
        onPersonal={() => navigation.getParent()?.navigate('PersonalDetails')}
        protocolCurrent={false}
      />
    </MemberChrome>
  );
}

function ProfileBody({
  roleLine,
  today,
  extraToggles,
  help,
  onPersonal,
  protocolCurrent,
}: {
  roleLine: string;
  today?: ReactNode;
  extraToggles?: ReactNode;
  help?: ReactNode;
  onPersonal: () => void;
  protocolCurrent: boolean;
}) {
  const { tx, profileLanguage, setLanguage } = useTx();
  const session = useSession();
  const navigation = useNavigation();
  const [languageOpen, setLanguageOpen] = useState(false);
  const resetRoot = (name: keyof RootStackParamList) => {
    let current = navigation;
    while (current.getParent()) {
      const parent = current.getParent();
      if (!parent) break;
      current = parent;
    }
    current.dispatch(CommonActions.reset({ index: 0, routes: [{ name }] }));
  };
  const languageLabel = profileLanguage === 'fr' ? 'Français' : profileLanguage === 'rw' ? 'Kinyarwanda' : 'English';

  const switchRole = async (role: 'protocol' | 'member') => {
    try {
      await session.enterRole(role);
      resetRoot(role === 'protocol' ? 'Protocol' : 'Member');
    } catch {
      resetRoot(role === 'protocol' ? 'Protocol' : 'Member');
    }
  };

  return (
    <View style={styles.body}>
      <View style={styles.identity}>
        <Avatar initials={session.initials} size={60} filled accessibilityLabel={session.fullName} />
        <View style={styles.identityText}>
          <Text style={styles.name}>{session.fullName}</Text>
          <Text style={styles.roleLine}>{roleLine}</Text>
          <Text style={styles.email}>{session.email}</Text>
        </View>
      </View>

      <View>
        <SectionLabel>{tx('Switch role', 'Changer de rôle')}</SectionLabel>
        <Group>
          {session.phoneRoles.includes('protocol') ? (
            <RoleRow
              initials="PO"
              title={tx('Protocol officer', 'Agent protocole')}
              subtitle={[session.post?.eventName, session.post?.gateName].filter(Boolean).join(' · ') || tx('Gate assignment', 'Affectation de porte')}
              current={protocolCurrent}
              onPress={() => void switchRole('protocol')}
            />
          ) : null}
          {session.phoneRoles.includes('member') ? (
            <RoleRow
              initials="M"
              title={tx('Member', 'Membre')}
              subtitle={session.member?.cellName || tx('Your cell', 'Votre cellule')}
              current={!protocolCurrent}
              onPress={() => void switchRole('member')}
            />
          ) : null}
        </Group>
        <Text style={styles.note}>{tx('You keep one account. Switching changes what the app shows.', 'Vous gardez un seul compte. Le changement modifie ce que l’app affiche.')}</Text>
      </View>

      {today}

      <View>
        <SectionLabel>{tx('Account', 'Compte')}</SectionLabel>
        <Group>
          <NavRow title={tx('Personal details', 'Informations personnelles')} subtitle={tx('Name, phone, ID or passport', 'Nom, téléphone, pièce')} onPress={onPersonal} />
          <ToggleRow label={tx('Notifications', 'Notifications')} value={session.notifications} onValueChange={session.setNotifications} />
          <ToggleRow label={tx('Unlock with Face ID', 'Déverrouiller avec Face ID')} value={session.faceUnlock} onValueChange={session.setFaceUnlock} />
          {extraToggles}
          <NavRow title={tx('Language', 'Langue')} trailing={<Text style={styles.lang}>{languageLabel}</Text>} onPress={() => setLanguageOpen(true)} />
        </Group>
      </View>
      {help}
      <Group>
        <NavRow
          title={tx('Sign out', 'Se déconnecter')}
          destructive
          onPress={() => {
            void session.signOut().then(() => resetRoot('SignIn'));
          }}
        />
      </Group>
      <Text style={styles.version}>FPR Diaspora · version 2.4.0</Text>
      <Modal visible={languageOpen} transparent animationType="slide" onRequestClose={() => setLanguageOpen(false)}>
        <View style={styles.sheet}>
          <Pressable style={[StyleSheet.absoluteFill, styles.sheetBackdrop]} onPress={() => setLanguageOpen(false)} />
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>{tx('Language', 'Langue')}</Text>
            {([
              ['en', 'English'],
              ['fr', 'Français'],
              ['rw', 'Kinyarwanda'],
            ] as const).map(([id, label]) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected: profileLanguage === id }}
                onPress={() => {
                  const next = id as ProfileLanguage;
                  setLanguage(next);
                  setLanguageOpen(false);
                  if (session.fullName && session.email) {
                    void updateMe({ displayName: session.fullName, email: session.email, preferredLanguage: next });
                  }
                }}
                style={styles.sheetRow}
              >
                <Text style={styles.sheetLabel}>{label}</Text>
                {profileLanguage === id ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            ))}
            <Text style={styles.sheetNote}>
              {tx(
                'English and French change the screens. Kinyarwanda is saved on the profile; the screens stay in English until a translation is supplied.',
                'L’anglais et le français changent les écrans. Le kinyarwanda est enregistré sur le profil ; les écrans restent en anglais tant qu’une traduction n’est pas fournie.',
              )}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RoleRow({
  initials,
  title,
  subtitle,
  current,
  onPress,
  style,
}: {
  initials: string;
  title: string;
  subtitle: string;
  current: boolean;
  onPress: () => void;
  style?: object;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: current }} accessibilityLabel={title} onPress={onPress} style={[styles.role, style]}>
      <View style={[styles.roleBadge, current ? styles.roleBadgeOn : null]}>
        <Text style={[styles.roleInitials, current ? styles.roleInitialsOn : null]}>{initials}</Text>
      </View>
      <View style={styles.roleText}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleSubtitle}>{subtitle}</Text>
      </View>
      {current ? (
        <Ionicons name="checkmark" size={18} color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={14} color={colors.chevron} />
      )}
    </Pressable>
  );
}

function Info({ title, subtitle, style }: { title: string; subtitle: string; style?: object }) {
  return (
    <View style={[styles.info, style]}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoSubtitle}>{subtitle}</Text>
    </View>
  );
}

export function PersonalDetailsScreen() {
  const { tx } = useTx();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const session = useSession();
  const [fullName, setFullName] = useState(session.fullName);
  const [email, setEmail] = useState(session.email);
  const [phone, setPhone] = useState(session.phone);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" accessibilityLabel={tx('Back', 'Retour')} onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={styles.backText}>{tx('Profile', 'Profil')}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>{tx('Personal details', 'Informations personnelles')}</Text>
        <Text style={styles.detailsNote}>
          {tx(
            'Saved on your account. A changed email takes effect immediately.',
            'Enregistré sur votre compte. Un e-mail modifié prend effet immédiatement.',
          )}
        </Text>
        <Field label={tx('Full name', 'Nom complet')} value={fullName} onChangeText={setFullName} />
        <Field label={tx('Email', 'E-mail')} value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field label={tx('Phone', 'Téléphone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <View style={styles.locked}>
          <Text style={styles.infoTitle}>{tx('Cell', 'Cellule')}</Text>
          <Text style={styles.infoSubtitle}>
            {session.member?.cellName || '—'}
            {session.member?.joinedOn ? ` · ${tx('member since', 'membre depuis')} ${formatDay(session.member.joinedOn)}` : ''}
          </Text>
        </View>
        <View style={styles.locked}>
          <Text style={styles.infoTitle}>{tx('ID or passport', 'Pièce d’identité')}</Text>
          <Text style={styles.infoSubtitle}>{maskId(session.member?.idNumber, session.member?.idType || 'ID') || '—'}</Text>
        </View>
        {saveError ? <Text style={{ color: colors.dangerText, fontWeight: '600' }}>{saveError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Save changes', 'Enregistrer')}
          disabled={saving}
          onPress={() => {
            setSaving(true);
            setSaveError('');
            void session
              .saveProfile({ displayName: fullName.trim(), email: email.trim(), phoneNumber: phone.trim() })
              .then(() => setSaved(true))
              .catch((caught) => setSaveError(errorMessage(caught, tx('Could not save.', 'Impossible d’enregistrer.'))))
              .finally(() => setSaving(false));
          }}
          style={styles.save}
        >
          <Text style={styles.saveText}>
            {saving ? tx('Saving…', 'Enregistrement…') : saved ? tx('Saved', 'Enregistré') : tx('Save changes', 'Enregistrer')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, paddingBottom: 36, gap: 14 },
  body: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28, gap: 22 },
  title: { ...displayTitle },
  identity: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  identityText: { flex: 1, minWidth: 0 },
  name: { ...displayName },
  roleLine: { color: colors.inkSoft, fontSize: 13.5, fontWeight: '300' },
  email: { color: colors.label, fontSize: 13, fontWeight: '300' },
  note: { color: colors.label, fontSize: 12.5, fontWeight: '300', paddingHorizontal: 16, paddingTop: 6, lineHeight: 17 },
  detailsNote: { color: colors.label, fontSize: 12.5, fontWeight: '300', lineHeight: 17 },
  role: { minHeight: 56, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleBadge: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  roleBadgeOn: { backgroundColor: colors.primary },
  roleInitials: { color: colors.primary, fontSize: 12, fontWeight: '400' },
  roleInitialsOn: { color: colors.white, fontSize: 13 },
  roleText: { flex: 1, minWidth: 0 },
  roleTitle: { color: colors.ink, fontSize: 15.5, fontWeight: '300' },
  roleSubtitle: { color: colors.label, fontSize: 13, fontWeight: '300' },
  info: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 48, justifyContent: 'center' },
  infoTitle: { color: colors.ink, fontSize: 15.5, fontWeight: '300' },
  infoSubtitle: { color: colors.label, fontSize: 13, fontWeight: '300', marginTop: 1 },
  lang: { color: colors.label, fontSize: 15, fontWeight: '300' },
  version: { textAlign: 'center', color: colors.faint, fontSize: 12, fontWeight: '300' },
  sheet: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { backgroundColor: 'rgba(15,31,42,0.35)' },
  sheetCard: { backgroundColor: colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, gap: 4 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  sheetRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetLabel: { fontSize: 16, color: colors.ink },
  sheetNote: { color: colors.muted, fontSize: 12.5, lineHeight: 18, marginTop: 8 },
  back: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  backText: { color: colors.primary, fontSize: 16 },
  field: { gap: 6 },
  fieldLabel: { color: colors.muted, fontSize: 12.5, marginLeft: 4 },
  input: {
    minHeight: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 16,
  },
  locked: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, gap: 2 },
  save: { minHeight: 52, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
