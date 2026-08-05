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

function OldRulesScreen() {
  const theme = useAppTheme();

  return (
    <LinearGradient colors={theme.gradients.screenAlt} style={styles.background}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>GUIA RÁPIDO</Text>
            <Text style={styles.title}>Regras</Text>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {modes.map((mode) => (
            <View key={mode.id} style={styles.card}>
              <Text style={styles.modeTitle}>{mode.emoji} {mode.name}</Text>
              <Text style={styles.description}>{mode.description}</Text>
              <Text style={styles.minPlayers}>Mínimo: {mode.minPlayers} jogadores</Text>
            </View>
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
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
  content: { gap: 12, paddingBottom: 30 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTitle: { color: colors.text, fontSize: 21, fontWeight: '900', marginBottom: 8 },
  description: { color: colors.mutedStrong, fontSize: 16, lineHeight: 22 },
  minPlayers: { color: colors.cyan, fontWeight: '900', marginTop: 12 },
});

export default function RulesScreen() {
  const theme = useAppTheme();

  return (
    <AppScreen variant="soft">
      <SafeAreaView style={ruleStyles.safe}>
        <AppHeader title="Regras" eyebrow="Guia rápido" onBack={() => router.back()} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ruleStyles.content}>
          {gameRegistry.map((game) => (
            <Card key={game.id} style={ruleStyles.card}>
              <View style={ruleStyles.cardHeader}>
                <View style={[ruleStyles.icon, { backgroundColor: `${game.color}1F` }]}>
                  <Ionicons name={game.icon} size={22} color={game.color} />
                </View>
                <View style={ruleStyles.flex}>
                  <Text style={[ruleStyles.gameTitle, { color: theme.colors.text }]}>{game.name}</Text>
                  <Text style={[ruleStyles.description, { color: theme.colors.mutedStrong }]}>{game.description}</Text>
                </View>
              </View>
              <View style={ruleStyles.chips}>
                <Chip label={`mín. ${game.minPlayers}`} icon="people-outline" />
                {game.maxPlayers ? <Chip label={`máx. ${game.maxPlayers}`} icon="person-add-outline" /> : null}
              </View>
              <View style={ruleStyles.rules}>
                {game.rules.map((rule, index) => (
                  <View key={rule} style={ruleStyles.ruleRow}>
                    <Text style={[ruleStyles.ruleNumber, { color: theme.colors.accent }]}>{index + 1}</Text>
                    <Text style={[ruleStyles.ruleText, { color: theme.colors.mutedStrong }]}>{rule}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

const ruleStyles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  content: { gap: spacing.sm, paddingBottom: spacing.xl },
  card: { gap: spacing.sm },
  cardHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  gameTitle: { ...typography.h3 },
  description: { ...typography.caption, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  rules: { gap: spacing.xs, marginTop: spacing.xs },
  ruleRow: { flexDirection: 'row', gap: spacing.sm },
  ruleNumber: { width: 22, fontWeight: '900' },
  ruleText: { ...typography.caption, flex: 1 },
});
