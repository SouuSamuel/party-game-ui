import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getModeById } from '../data/modes';
import { PartyButton } from '../components/PartyButton';
import { colors, gradients, radii, useAppTheme } from '../styles/theme';

export default function SetupScreen() {
  const theme = useAppTheme();
  const { modeId } = useLocalSearchParams();
  const mode = useMemo(() => getModeById(modeId), [modeId]);
  const [players, setPlayers] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState('');

  function addPlayer() {
    const cleanName = playerName.trim();
    if (!cleanName) return;
    setPlayers((current) => [...current, cleanName]);
    setPlayerName('');
  }

  function removePlayer(index: number) {
    setPlayers((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function goNext() {
    if (players.length < mode.minPlayers) {
      alert(`Esse modo precisa de pelo menos ${mode.minPlayers} jogadores.`);
      return;
    }

    const uniquePlayerNames = new Set(players.map((player) => player.trim().toLowerCase()));

    if (uniquePlayerNames.size !== players.length) {
      alert('Use nomes diferentes para cada jogador antes de continuar.');
      return;
    }

    if (mode.id === 'nota') {
      if (players.length % 2 !== 0) {
        alert('Adivinhe a Nota precisa de um número par de jogadores.');
        return;
      }

      router.push({ pathname: '/adivinhe-nota', params: { players: JSON.stringify(players) } });
      return;
    }

    if (mode.id === 'contato') {
      router.push({ pathname: '/contato', params: { players: JSON.stringify(players) } });
      return;
    }

    if (mode.id === 'frase') {
      router.push({ pathname: '/frase-cortada', params: { players: JSON.stringify(players) } });
      return;
    }

    if (mode.id === 'impostor') {
      router.push({ pathname: '/impostor', params: { players: JSON.stringify(players) } });
      return;
    }

    alert(`Modo "${mode.name}" será implementado em breve.`);
  }

  return (
    <LinearGradient colors={theme.gradients.screenAlt} style={styles.background}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backText}>‹</Text>
              </Pressable>
              <LinearGradient colors={mode.gradient} style={styles.modeBadge}>
                <Text style={styles.modeEmoji}>{mode.emoji}</Text>
              </LinearGradient>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>PREPARAR PARTIDA</Text>
                <Text style={styles.title}>{mode.name}</Text>
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Como funciona?</Text>
              {mode.rules.map((rule, index) => (
                <View key={index} style={styles.ruleRow}>
                  <Text style={[styles.ruleNumber, { backgroundColor: mode.color }]}>{index + 1}</Text>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
              <View style={styles.infoPill}>
                <Text style={styles.infoText}>Mínimo: {mode.minPlayers} jogadores</Text>
              </View>
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Jogadores</Text>
              <TextInput
                value={playerName}
                onChangeText={setPlayerName}
                placeholder="Nome do jogador"
                placeholderTextColor="rgba(226,232,240,0.45)"
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={addPlayer}
              />
              <PartyButton title="Adicionar jogador" emoji="+" onPress={addPlayer} style={styles.addButton} />

              <View style={styles.playersHeader}>
                <Text style={styles.playersTitle}>Na sala</Text>
                <Text style={styles.counter}>{players.length}</Text>
              </View>

              {players.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>Adicione os nomes para começar a rodada.</Text>
                </View>
              ) : (
                players.map((player, index) => (
                  <View key={`${player}-${index}`} style={styles.playerCard}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{player[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.playerName}>{player}</Text>
                    <Pressable onPress={() => removePlayer(index)} style={styles.removeButton}>
                      <Text style={styles.removeText}>Remover</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            <PartyButton title="Próximo" emoji="→" variant="primary" onPress={goNext} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 18, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backText: { color: colors.text, fontSize: 34, marginTop: -3 },
  modeBadge: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  modeEmoji: { fontSize: 28 },
  headerText: { flex: 1 },
  eyebrow: { color: colors.cyan, fontWeight: '900', fontSize: 12, letterSpacing: 0 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: 0 },
  panel: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '900', marginBottom: 14 },
  ruleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  ruleNumber: {
    width: 26,
    height: 26,
    borderRadius: 9,
    color: colors.text,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 26,
    overflow: 'hidden',
  },
  ruleText: { flex: 1, color: colors.mutedStrong, fontSize: 15, lineHeight: 21 },
  infoPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderRadius: radii.chip,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginTop: 4,
  },
  infoText: { color: colors.cyan, fontWeight: '900' },
  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  addButton: { marginBottom: 18 },
  playersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  playersTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  counter: {
    color: colors.textDark,
    backgroundColor: colors.lime,
    minWidth: 34,
    textAlign: 'center',
    paddingVertical: 5,
    borderRadius: radii.chip,
    overflow: 'hidden',
    fontWeight: '900',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { color: colors.muted, textAlign: 'center', fontWeight: '700', lineHeight: 20 },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 10,
    marginBottom: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.backgroundSoft, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: colors.lime, fontWeight: '900', fontSize: 18 },
  playerName: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '900' },
  removeButton: { backgroundColor: 'rgba(251,113,133,0.16)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  removeText: { color: colors.pink, fontWeight: '900' },
});
