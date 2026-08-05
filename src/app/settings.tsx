import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, themeNames, themes, useThemeController } from '../styles/theme';
import { getSoundEnabled, playSoundEffect, setSoundEnabled } from '../utils/audio';
import { AppButton, AppHeader, AppScreen, Card } from '../components/ui';
import { spacing, typography } from '../styles/theme';

function OldSettingsScreen() {
  const { theme, themeName, setThemeName } = useThemeController();
  const { colors, gradients } = theme;
  const [soundsEnabled, setSoundsEnabled] = useState(true);

  useEffect(() => {
    void getSoundEnabled().then(setSoundsEnabled);
  }, []);

  function toggleSounds() {
    const nextValue = !soundsEnabled;
    setSoundsEnabled(nextValue);
    void setSoundEnabled(nextValue);
    if (nextValue) {
      void playSoundEffect('click');
    }
  }

  return (
    <LinearGradient colors={gradients.screen} style={styles.background}>
      <SafeAreaView style={styles.safe}>
        <Pressable
          onPress={() => {
            void playSoundEffect('click');
            router.back();
          }}
          style={[styles.backButton, { backgroundColor: colors.panel, borderColor: colors.border }]}
        >
          <Text style={[styles.backText, { color: colors.text }]}>‹</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={[styles.eyebrow, { color: colors.cyan }]}>PREFERÊNCIAS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
          <Text style={[styles.text, { color: colors.mutedStrong }]}>Ajuste sons, tema e preferências futuras.</Text>

          <Pressable onPress={toggleSounds} style={[styles.option, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <Text style={[styles.optionText, { color: colors.text }]}>Sons do jogo</Text>
            <Text style={[styles.optionStatus, { color: soundsEnabled ? colors.lime : colors.muted }]}>
              {soundsEnabled ? 'Ativado' : 'Desativado'}
            </Text>
          </Pressable>

          <View style={styles.themeGrid}>
            {themeNames.map((name) => {
              const isSelected = name === themeName;
              return (
                <Pressable
                  key={name}
                  onPress={() => {
                    void playSoundEffect('click');
                    void setThemeName(name);
                  }}
                  style={[
                    styles.themeButton,
                    { backgroundColor: colors.panel, borderColor: isSelected ? colors.cyan : colors.border },
                    isSelected && { backgroundColor: colors.panelStrong },
                  ]}
                >
                  <Text style={[styles.themeText, { color: colors.text }]}>{themes[name].label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.credit, { color: colors.muted }]}>Feito por Samuel Nascimento</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1, padding: 18 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 36, marginTop: -3 },
  card: { flex: 1, justifyContent: 'center' },
  eyebrow: { fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 36, fontWeight: '900', textAlign: 'center' },
  text: { fontSize: 17, textAlign: 'center', lineHeight: 24, marginVertical: 22 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.button,
    padding: 16,
    marginBottom: 14,
  },
  optionText: { fontWeight: '900', fontSize: 16 },
  optionStatus: { fontWeight: '900' },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeButton: {
    width: '48%',
    minHeight: 54,
    borderRadius: radii.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  themeText: {
    fontWeight: '900',
    textAlign: 'center',
  },
  credit: {
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 6,
  },
});

export default function SettingsScreen() {
  const { theme, themeName, setThemeName } = useThemeController();
  const { colors } = theme;
  const [soundsEnabled, setSoundsEnabled] = useState(true);

  useEffect(() => {
    void getSoundEnabled().then(setSoundsEnabled);
  }, []);

  function toggleSounds() {
    const nextValue = !soundsEnabled;
    setSoundsEnabled(nextValue);
    void setSoundEnabled(nextValue);
    if (nextValue) {
      void playSoundEffect('click');
    }
  }

  return (
    <AppScreen variant="soft">
      <SafeAreaView style={settingsStyles.safe}>
        <AppHeader title="Configurações" eyebrow="GroupGames" onBack={() => router.back()} />
        <View style={settingsStyles.content}>
          <Card style={settingsStyles.card}>
            <View style={settingsStyles.optionRow}>
              <View style={settingsStyles.flex}>
                <Text style={[settingsStyles.optionTitle, { color: colors.text }]}>Sons do jogo</Text>
                <Text style={[settingsStyles.optionDescription, { color: colors.mutedStrong }]}>Efeitos curtos para cliques, acertos e fim de turno.</Text>
              </View>
              <AppButton label={soundsEnabled ? 'Ativado' : 'Desativado'} variant={soundsEnabled ? 'primary' : 'secondary'} style={settingsStyles.statusButton} onPress={toggleSounds} />
            </View>
          </Card>

          <Card style={settingsStyles.card}>
            <Text style={[settingsStyles.sectionTitle, { color: colors.text }]}>Tema</Text>
            <View style={settingsStyles.themeGrid}>
              {themeNames.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => {
                    void playSoundEffect('click');
                    void setThemeName(name);
                  }}
                  style={[
                    settingsStyles.themeButton,
                    { backgroundColor: colors.surfaceStrong, borderColor: name === themeName ? colors.accent : colors.border },
                  ]}
                >
                  <Text style={[settingsStyles.themeText, { color: colors.text }]}>{themes[name].label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        </View>
        <Text style={[settingsStyles.credit, { color: colors.muted }]}>Feito por Samuel Nascimento</Text>
      </SafeAreaView>
    </AppScreen>
  );
}

const settingsStyles = StyleSheet.create({
  safe: { flex: 1, padding: spacing.lg },
  content: { flex: 1, gap: spacing.md },
  card: { gap: spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  optionTitle: { ...typography.h3 },
  optionDescription: { ...typography.caption, marginTop: 4 },
  statusButton: { minWidth: 126 },
  sectionTitle: { ...typography.h3 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  themeButton: { width: '48%', minHeight: 54, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  themeText: { fontWeight: '900', textAlign: 'center' },
  credit: { textAlign: 'center', fontWeight: '800', marginBottom: 6 },
});
