import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { PartyButton } from '../components/PartyButton';
import { FloatingDecorations } from '../components/FloatingDecorations';
import { colors, gradients, radii, useAppTheme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppScreen, Card, Chip } from '../components/ui';
import { spacing, typography } from '../styles/theme';

function OldHomeScreen() {
  const theme = useAppTheme();

  return (
    <LinearGradient colors={theme.gradients.screen} style={styles.background}>
      <FloatingDecorations />
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <View style={[styles.mark, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
            <Text style={[styles.markText, { color: theme.colors.lime }]}>?</Text>
          </View>
          <Text style={[styles.badge, { color: theme.colors.cyan }]}>OFFLINE · PRESENCIAL · CASUAL</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>Hangout</Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedStrong }]}>Jogos rápidos de blefe, pistas e caos leve para jogar no mesmo sofá.</Text>
        </View>

        <View style={[styles.menu, { backgroundColor: theme.colors.panel, borderColor: theme.colors.border }]}>
          <PartyButton title="Jogar" emoji="🎮" onPress={() => router.push('/modes')} />
          <PartyButton title="Regras" emoji="📜" variant="secondary" onPress={() => router.push('/rules')} />
          <PartyButton title="Configurações" emoji="⚙️" variant="secondary" onPress={() => router.push('/settings')} />
        </View>

        <View>
          <Text style={[styles.footer, { color: theme.colors.muted }]}>Feito para uma rodada rápida, sem internet e sem cadastro.</Text>
          <Text style={[styles.credit, { color: theme.colors.muted }]}>Feito por Samuel Nascimento</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, padding: 22, justifyContent: 'space-between' },
  hero: { alignItems: 'center', marginTop: 54 },
  mark: {
    width: 78,
    height: 78,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  markText: { color: colors.lime, fontSize: 44, fontWeight: '900' },
  badge: { color: colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 0, marginBottom: 12 },
  title: { color: colors.text, fontSize: 44, fontWeight: '900', textAlign: 'center', letterSpacing: 0 },
  subtitle: { color: colors.mutedStrong, fontSize: 17, textAlign: 'center', lineHeight: 25, marginTop: 12, maxWidth: 340 },
  menu: {
    gap: 12,
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  footer: { color: colors.muted, textAlign: 'center', fontWeight: '700', marginBottom: 8 },
  credit: { textAlign: 'center', fontSize: 12, fontWeight: '800', opacity: 0.78, marginBottom: 8 },
});

export default function HomeScreen() {
  const theme = useAppTheme();

  return (
    <AppScreen>
      <SafeAreaView style={homeStyles.container}>
        <View style={homeStyles.hero}>
          <View style={[homeStyles.mark, { backgroundColor: theme.colors.accent }]}>
            <Ionicons name="people-outline" size={34} color={theme.colors.onAccent} />
          </View>
          <View style={homeStyles.chips}>
            <Chip label="Offline" icon="cloud-offline-outline" />
            <Chip label="Presencial" icon="phone-portrait-outline" />
          </View>
          <Text style={[homeStyles.title, { color: theme.colors.text }]}>GroupGames</Text>
          <Text style={[homeStyles.subtitle, { color: theme.colors.mutedStrong }]}>
            Jogos sociais para grupos jogarem no mesmo celular, com regras rápidas e partidas leves.
          </Text>
        </View>

        <Card style={homeStyles.menu}>
          <AppButton label="Jogar" icon="play-outline" onPress={() => router.push('/modes')} />
          <AppButton label="Jogar online" icon="globe-outline" variant="secondary" onPress={() => router.push('/online')} />
          <AppButton label="Regras" icon="reader-outline" variant="secondary" onPress={() => router.push('/rules')} />
          <AppButton label="Configurações" icon="settings-outline" variant="secondary" onPress={() => router.push('/settings')} />
        </Card>

        <View>
          <Text style={[homeStyles.footer, { color: theme.colors.muted }]}>Feito para uma rodada rápida, sem internet e sem cadastro.</Text>
          <Text style={[homeStyles.credit, { color: theme.colors.muted }]}>Feito por Samuel Nascimento</Text>
        </View>
      </SafeAreaView>
    </AppScreen>
  );
}

const homeStyles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  hero: { alignItems: 'center', marginTop: 42 },
  mark: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  chips: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  title: { fontSize: 42, fontWeight: '900', textAlign: 'center', letterSpacing: 0 },
  subtitle: { ...typography.body, textAlign: 'center', marginTop: spacing.sm, maxWidth: 360 },
  menu: { gap: spacing.sm, marginBottom: spacing.md },
  footer: { textAlign: 'center', fontWeight: '700', marginBottom: 8 },
  credit: { textAlign: 'center', fontSize: 12, fontWeight: '800', opacity: 0.78, marginBottom: 8 },
});
