import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { modes } from '../data/modes';
import { colors, gradients, radii, useAppTheme } from '../styles/theme';

export default function RulesScreen() {
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
