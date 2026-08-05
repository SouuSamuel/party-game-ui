import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { modes } from '../data/modes';
import { colors, gradients, radii, useAppTheme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, AppScreen, Card, Chip } from '../components/ui';
import { gameRegistry } from '../games/registry';
import { spacing, typography } from '../styles/theme';

function OldModesScreen() {
  const theme = useAppTheme();

  return (
    <LinearGradient colors={theme.gradients.screenAlt} style={styles.background}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ESCOLHA O CLIMA</Text>
            <Text style={styles.title}>Modos de jogo</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {modes.map((mode) => (
            <Pressable
              key={mode.id}
              onPress={() => router.push({ pathname: '/setup', params: { modeId: mode.id } })}
              style={({ pressed }) => [styles.cardWrap, pressed && styles.pressed]}
            >
              <View style={styles.card}>
                <LinearGradient colors={mode.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconBox}>
                  <Text style={styles.icon}>{mode.emoji}</Text>
                </LinearGradient>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{mode.name}</Text>
                  <Text style={styles.cardDescription}>{mode.description}</Text>
                  <Text style={styles.minPlayers}>mínimo: {mode.minPlayers} jogadores</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 18 },
  headerText: { flex: 1 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 36, marginTop: -3 },
  eyebrow: { color: colors.cyan, fontWeight: '900', fontSize: 12, letterSpacing: 0 },
  title: { color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: 0 },
  list: { paddingBottom: 28, gap: 12 },
  cardWrap: { borderRadius: radii.card },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  card: {
    minHeight: 132,
    borderRadius: radii.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  icon: { fontSize: 30 },
  cardContent: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 23, fontWeight: '900', marginBottom: 5 },
  cardDescription: { color: colors.mutedStrong, fontSize: 15, lineHeight: 20 },
  minPlayers: {
    color: colors.lime,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: 'rgba(190,242,100,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.chip,
    fontWeight: '900',
    fontSize: 12,
  },
  arrow: { color: colors.muted, fontSize: 24, fontWeight: '900', marginLeft: 10 },
});

export default function ModesScreen() {
  const theme = useAppTheme();

  return (
    <AppScreen variant="soft">
      <SafeAreaView style={gameStyles.safe}>
        <AppHeader eyebrow="Escolha um jogo" title="Modos do GroupGames" onBack={() => router.back()} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={gameStyles.list}>
          {gameRegistry.map((game) => (
            <Pressable
              key={game.id}
              onPress={() => {
                if (game.setupRoute === '/setup') {
                  router.push({ pathname: '/setup', params: { modeId: game.id } });
                  return;
                }
                router.push(game.setupRoute);
              }}
              style={({ pressed }) => [pressed && gameStyles.pressed]}
            >
              <Card style={gameStyles.card}>
                <View style={[gameStyles.iconBox, { backgroundColor: `${game.color}1F` }]}>
                  <Ionicons name={game.icon} size={25} color={game.color} />
                </View>
                <View style={gameStyles.cardContent}>
                  <View style={gameStyles.cardTop}>
                    <Text style={[gameStyles.cardTitle, { color: theme.colors.text }]}>{game.name}</Text>
                    <Chip label={game.status === 'ready' ? 'Pronto' : game.status} selected />
                  </View>
                  <Text style={[gameStyles.cardDescription, { color: theme.colors.mutedStrong }]}>{game.description}</Text>
                  <View style={gameStyles.metaRow}>
                    <Chip label={`mín. ${game.minPlayers}`} icon="people-outline" />
                    {game.maxPlayers ? <Chip label={`máx. ${game.maxPlayers}`} icon="person-add-outline" /> : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color={theme.colors.muted} />
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

const gameStyles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  list: { paddingBottom: spacing.xl, gap: spacing.sm },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.9 },
  card: { minHeight: 132, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, gap: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { ...typography.h3 },
  cardDescription: { ...typography.caption },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
});
