import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Avatar, Card, PrimaryButton } from '../../components/ui';
import { formatDay, initialsOf } from '../../api/format';
import { useTx } from '../../i18n';
import type { ProtocolTabParamList } from '../../navigation/types';
import { useSession } from '../../state/session';
import { Text } from '../../theme/text';
import { colors, displayTitle, radius, type } from '../../theme/tokens';

export function ProtocolChrome({
  title,
  children,
  scroll = true,
}: {
  title: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { tx } = useTx();
  const session = useSession();
  const navigation = useNavigation<BottomTabNavigationProp<ProtocolTabParamList>>();
  const post = session.post;
  const day = post?.dayOfEdition && post?.totalDays ? `${post.dayOfEdition} / ${post.totalDays}` : post?.days ?? '';
  const eventLine = [post?.eventName, post?.gateName, day].filter(Boolean).join(' · ');
  const header = (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <View style={styles.eyebrowRow}>
          <View style={styles.live} />
          <Text style={styles.eyebrow} numberOfLines={1}>
            {eventLine || tx('No live gate assignment', 'Aucune affectation de porte')}
          </Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      <View style={styles.headerAvatar}>
        <Avatar
          initials={session.initials}
          filled
          accessibilityLabel={tx('Profile', 'Profil')}
          onPress={() => navigation.navigate('Profile', { screen: 'ProfileHome' })}
        />
      </View>
    </View>
  );
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
    </View>
  );
}

export function MyPostScreen() {
  const { tx } = useTx();
  const session = useSession();
  const navigation = useNavigation<BottomTabNavigationProp<ProtocolTabParamList>>();
  useFocusEffect(
    useCallback(() => {
      void session.loadPost();
    }, [session.loadPost]),
  );
  const post = session.post;
  const assigned = post?.assignedAt ? formatDay(post.assignedAt) : '';
  return (
    <ProtocolChrome title={tx('My post', 'Mon poste')}>
      <View style={styles.stack}>
        {post ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>{tx('Your post', 'Votre poste')}</Text>
              <Text style={styles.gate}>{post.gateName || tx('Gate', 'Porte')}</Text>
              <Text style={styles.purpose}>{post.purpose || ''}</Text>
              <View style={styles.venueRow}>
                <Ionicons name="location-sharp" size={14} color={colors.white} />
                <Text style={styles.venue}>{[post.eventName, post.venue].filter(Boolean).join(' · ')}</Text>
              </View>
            </View>

            {(post.dayRows ?? []).length > 0 ? (
              <Card>
                <Text style={styles.cardTitle}>{tx('On duty every day of the event', 'De service chaque jour de l’événement')}</Text>
                <View style={styles.dayList}>
                  {post.dayRows?.map((day) => (
                    <View key={`${day.date}-${day.label}`} style={[styles.day, day.isToday ? styles.dayOn : null]}>
                      <Text style={[styles.dayLabel, day.isToday ? styles.dayLabelOn : null]}>{day.label}</Text>
                      {day.isToday ? <Text style={styles.dayNote}>{tx('Today', 'Aujourd’hui')}</Text> : null}
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            {(post.colleagues ?? []).length > 0 ? (
              <Card>
                <Text style={styles.cardTitle}>{tx(`At ${post.gateName ?? 'this gate'} with you`, `À ${post.gateName ?? 'cette porte'} avec vous`)}</Text>
                {post.colleagues?.map((person) => (
                  <View key={`${person.name}-${person.phone}`} style={styles.person}>
                    <Avatar initials={initialsOf(person.name)} size={34} accessibilityLabel={person.name ?? ''} />
                    <View style={styles.personText}>
                      <Text style={styles.personName}>{person.name}</Text>
                      <Text style={styles.personDetail}>{[person.cell, person.role, person.phone].filter(Boolean).join(' · ')}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            ) : null}

            {(post.otherGates ?? []).length > 0 ? (
              <Card>
                <Text style={styles.cardTitle}>{tx('Other gates and desks', 'Autres portes et bureaux')}</Text>
                {post.otherGates?.map((gate) => (
                  <View key={gate.name} style={styles.gateRow}>
                    <View style={styles.personText}>
                      <Text style={styles.personName}>{gate.name}</Text>
                      <Text style={styles.personDetail}>{gate.detail}</Text>
                    </View>
                    {gate.officerCount != null ? (
                      <Text style={styles.officerCount}>
                        {gate.officerCount} {tx('officers', 'agents')}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </Card>
            ) : null}

            <Text style={styles.note}>
              {post.assignedBy || assigned
                ? tx(
                    `Assigned${post.assignedBy ? ` by ${post.assignedBy}` : ''}${assigned ? ` on ${assigned}` : ''}. Ask your gate’s team or the committee if something changes.`,
                    `Affecté${post.assignedBy ? ` par ${post.assignedBy}` : ''}${assigned ? ` le ${assigned}` : ''}. Demandez à l’équipe de votre porte ou au comité si quelque chose change.`,
                  )
                : tx('Ask your gate’s team or the committee if something changes.', 'Demandez à l’équipe de votre porte ou au comité si quelque chose change.')}
            </Text>
            <PrimaryButton
              label={tx('Start gate check', 'Commencer le contrôle')}
              icon="scan-outline"
              onPress={() => navigation.navigate('CheckIn', { screen: 'CheckHome' })}
            />
          </>
        ) : (
          <Text style={styles.note}>
            {tx(
              'You are not assigned to a gate for a live event. Ask the protocol lead.',
              'Vous n’êtes pas affecté à une porte pour un événement en cours. Demandez au responsable protocole.',
            )}
          </Text>
        )}
      </View>
    </ProtocolChrome>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: 24,
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.background,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerAvatar: {
    marginBottom: 4,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  live: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.live,
  },
  eyebrow: {
    flex: 1,
    color: colors.label,
    fontSize: type.caption,
    fontWeight: '300',
  },
  title: {
    ...displayTitle,
    marginTop: 2,
  },
  stack: {
    paddingHorizontal: 16,
    gap: 14,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 18,
    gap: 2,
  },
  kicker: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: type.micro,
    fontWeight: '400',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  gate: {
    color: colors.white,
    fontSize: type.cardTitle,
    lineHeight: 36,
    fontWeight: '400',
    letterSpacing: -0.6,
    marginTop: 6,
  },
  purpose: {
    color: colors.white,
    fontSize: 14,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.35)',
  },
  venue: {
    flex: 1,
    color: colors.white,
    fontSize: type.caption,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 10,
  },
  dayList: {
    gap: 6,
  },
  day: {
    minHeight: 40,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.chip,
  },
  dayOn: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayLabel: {
    color: colors.ink,
    fontSize: 13,
  },
  dayLabelOn: {
    color: colors.primary,
  },
  dayNote: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  personText: {
    flex: 1,
    gap: 2,
  },
  personName: {
    color: colors.ink,
    fontSize: 13.5,
    fontWeight: '400',
  },
  personDetail: {
    color: colors.muted,
    fontSize: 12,
  },
  gateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  officerCount: {
    color: colors.inkSoft,
    fontSize: 12,
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});
