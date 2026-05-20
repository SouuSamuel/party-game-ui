import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, themeNames, themes, useThemeController } from '../styles/theme';
import { getSoundEnabled, playSoundEffect, setSoundEnabled } from '../utils/audio';

export default function SettingsScreen() {
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
