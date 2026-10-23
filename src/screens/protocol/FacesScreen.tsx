import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Pill, SearchField, Segmented } from '../../components/ui';
import { initialsOf, mapFaceStatus } from '../../api/format';
import { errorMessage, useSession } from '../../state/session';
import type { FaceStatus } from '../../domain/rules';
import { useTx } from '../../i18n';
import type { FacesStackParamList } from '../../navigation/types';
import { ProtocolChrome } from './MyPostScreen';
import { Text } from '../../theme/text';
import { colors, displayName, radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<FacesStackParamList, 'FacesHome'>;

export function FacesScreen({ navigation }: Props) {
  const { tx } = useTx();
  const session = useSession();
  const [query, setQuery] = useState('');
  const [eventId, setEventId] = useState<string | undefined>(session.post?.eventId);
  const [cell, setCell] = useState('All cells');
  const [filter, setFilter] = useState<'todo' | 'enrolled' | 'all'>('todo');
  const [showEvents, setShowEvents] = useState(false);
  const [showCells, setShowCells] = useState(false);
  const [loading, setLoading] = useState(!session.faces);
  const [error, setError] = useState('');

  const loadFaces = session.loadFaces;
  const assignedEventId = session.post?.eventId;
  const load = useCallback(
    async (id?: string) => {
      setLoading(true);
      setError('');
      try {
        await loadFaces(id);
      } catch (caught) {
        setError(errorMessage(caught, tx('Could not load the faces list.', 'Impossible de charger la liste des visages.')));
      } finally {
        setLoading(false);
      }
    },
    [loadFaces, tx],
  );

  useFocusEffect(
    useCallback(() => {
      void load(eventId ?? assignedEventId);
    }, [assignedEventId, eventId, load]),
  );

  const faces = session.faces;
  const people = faces?.people ?? [];
  const events = faces?.events ?? [];
  const cells = useMemo(() => {
    const names = [...new Set(people.map((person) => person.cell).filter(Boolean))] as string[];
    return ['All cells', ...names];
  }, [people]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return people
      .map((person) => ({ person, status: mapFaceStatus(person.status) }))
      .filter(({ person }) => cell === 'All cells' || person.cell === cell)
      .filter(({ person }) => {
        if (!needle) return true;
        return (
          (person.name ?? '').toLowerCase().includes(needle) ||
          (person.nationalId ?? '').toLowerCase().replace(/\s/g, '').includes(needle.replace(/\s/g, ''))
        );
      })
      .filter(({ status }) => {
        if (filter === 'all') return true;
        if (filter === 'enrolled') return status === 'enrolled';
        return status !== 'enrolled';
      });
  }, [people, query, cell, filter]);

  const enrolled = faces?.enrolled ?? 0;
  const total = faces?.total ?? 0;
  const remaining = Math.max(total - enrolled, 0);
  const toEnrol = rows.filter((row) => row.status !== 'enrolled').length;

  return (
    <ProtocolChrome title={tx('Faces', 'Visages')} scroll={false}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.person.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>{tx('Faces enrolled for this event', 'Visages enregistrés pour cet événement')}</Text>
              <Text style={styles.summaryCount}>
                {enrolled} {tx('of', 'sur')} {total}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${total ? (enrolled / total) * 100 : 0}%` }]} />
              </View>
              <Text style={styles.summaryNote}>
                {tx(
                  `${remaining} invited to this event still need a face photo.`,
                  `${remaining} invités à cet événement n’ont pas encore de photo.`,
                )}
              </Text>
            </View>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder={tx('Search name, ID or passport', 'Nom, carte ou passeport')}
              accessibilityLabel={tx('Search by name or ID', 'Chercher par nom ou pièce')}
            />
            <View style={styles.filters}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('Event', 'Événement')}
                style={styles.select}
                onPress={() => {
                  setShowEvents((open) => !open);
                  setShowCells(false);
                }}
              >
                <Text numberOfLines={1} style={styles.selectText}>{faces?.eventName || tx('Event', 'Événement')}</Text>
                <Text style={styles.chevron}>▾</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tx('Cell', 'Cellule')}
                style={styles.select}
                onPress={() => {
                  setShowCells((open) => !open);
                  setShowEvents(false);
                }}
              >
                <Text numberOfLines={1} style={styles.selectText}>{cell === 'All cells' ? tx('All cells', 'Toutes les cellules') : cell}</Text>
                <Text style={styles.chevron}>▾</Text>
              </Pressable>
            </View>
            {showEvents ? (
              <View style={styles.menu}>
                {events.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setEventId(item.id);
                      setShowEvents(false);
                      void load(item.id);
                    }}
                    style={styles.menuItem}
                  >
                    <Text style={styles.menuText}>{item.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {showCells ? (
              <View style={styles.menu}>
                {cells.map((item) => (
                  <Pressable key={item} accessibilityRole="button" onPress={() => { setCell(item); setShowCells(false); }} style={styles.menuItem}>
                    <Text style={styles.menuText}>{item === 'All cells' ? tx('All cells', 'Toutes les cellules') : item}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Segmented
              value={filter}
              onChange={(id) => setFilter(id as typeof filter)}
              options={[
                { id: 'todo', label: tx('To enrol', 'À enregistrer') },
                { id: 'enrolled', label: tx('Enrolled', 'Enregistrés') },
                { id: 'all', label: tx('All', 'Tous') },
              ]}
            />
            <Text style={styles.count}>
              {tx(`${rows.length} people · ${toEnrol} to enrol`, `${rows.length} personnes · ${toEnrol} à enregistrer`)}
            </Text>
            {error ? <Text style={styles.empty}>{error}</Text> : null}
            {loading ? <ActivityIndicator color={colors.primary} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.person.name}, ${statusLabel(item.status, tx)}`}
            onPress={() => navigation.navigate('Enrol', { personId: item.person.id })}
            style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
          >
            <Avatar initials={initialsOf(item.person.name)} size={44} accessibilityLabel={item.person.name ?? ''} />
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.person.name}</Text>
              <Text style={styles.meta}>{[item.person.cell, item.person.role].filter(Boolean).join(' · ')}</Text>
            </View>
            <StatusBadge status={item.status} />
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{tx('Nobody here.', 'Personne ici.')}</Text> : null}
      />
    </ProtocolChrome>
  );
}

function statusLabel(status: FaceStatus, tx: (en: string, fr: string) => string) {
  if (status === 'enrolled') return tx('Enrolled', 'Enregistré');
  if (status === 'id-missing') return tx('ID missing', 'Pièce manquante');
  return tx('No photo', 'Pas de photo');
}

function StatusBadge({ status }: { status: FaceStatus }) {
  const { tx } = useTx();
  if (status === 'enrolled') return <Pill label={tx('Enrolled', 'Enregistré')} tone="success" />;
  if (status === 'id-missing') return <Pill label={tx('ID missing', 'Pièce manquante')} tone="danger" />;
  return <Pill label={tx('No photo', 'Pas de photo')} tone="warning" />;
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 8,
  },
  headerBlock: {
    gap: 10,
    marginBottom: 8,
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    gap: 6,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryCount: {
    ...displayName,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.liveDot,
  },
  summaryNote: {
    color: colors.inkSoft,
    fontSize: 12.5,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  select: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
  },
  chevron: {
    color: colors.muted,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  menuItem: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  menuText: {
    color: colors.ink,
    fontSize: 14,
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    padding: 24,
  },
});
