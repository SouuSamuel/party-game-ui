import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { impostorWords } from '../data/wordBank';
import { getRandomItem } from '../utils/gameUtils';
import { colors, gradients, radii, useAppTheme } from '../styles/theme';
import { playSoundEffect } from '../utils/audio';

type Phase = 'settings' | 'reveal' | 'discussion' | 'vote' | 'result';
type ImpostorWord = {
  word: string;
  hint: string;
};

function parsePlayers(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((player) => typeof player === 'string') : [];
  } catch {
    return [];
  }
}

function getVoteLeaders(votes: Record<string, number>) {
  const entries = Object.entries(votes);
  const maxVotes = Math.max(...entries.map(([, count]) => count));

  if (maxVotes <= 0) return [];

  return entries.filter(([, count]) => count === maxVotes).map(([player]) => player);
}

export default function ImpostorGame() {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const players = useMemo(() => parsePlayers(params.players), [params.players]);
  const secret = useMemo(() => getRandomItem(impostorWords) as ImpostorWord, []);
  const impostorIndex = useMemo(() => Math.floor(Math.random() * players.length), [players.length]);

  const [phase, setPhase] = useState<Phase>('settings');
  const [hintEnabled, setHintEnabled] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>(() =>
    players.reduce((currentVotes, player) => ({ ...currentVotes, [player]: 0 }), {})
  );
  const revealAnim = useRef(new Animated.Value(0)).current;

  const currentPlayer = players[currentPlayerIndex];
  const impostor = players[impostorIndex];
  const isImpostor = currentPlayerIndex === impostorIndex;
  const voteLeaders = getVoteLeaders(votes);
  const crowdFoundImpostor = voteLeaders.includes(impostor);

  useEffect(() => {
    if (!showInfo) return;

    revealAnim.setValue(0);
    Animated.spring(revealAnim, {
      toValue: 1,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [revealAnim, showInfo]);

  function startReveal() {
    setCurrentPlayerIndex(0);
    setShowInfo(false);
    setPhase('reveal');
    void playSoundEffect('start');
  }

  function hideAndPass() {
    setShowInfo(false);

    if (currentPlayerIndex + 1 >= players.length) {
      setCurrentPlayerIndex((current) => current + 1);
      setPhase('discussion');
      return;
    }

    setCurrentPlayerIndex((current) => current + 1);
  }

  function addVote(player: string) {
    setVotes((currentVotes) => ({
      ...currentVotes,
      [player]: (currentVotes[player] ?? 0) + 1,
    }));
  }

  if (players.length < 4) {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.container}>
        <Text style={styles.title}>Jogadores insuficientes</Text>
        <Text style={styles.description}>Impostor precisa de pelo menos 4 jogadores.</Text>

        <TouchableOpacity style={styles.mainButton} onPress={() => router.back()}>
          <Text style={styles.mainButtonText}>Voltar</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (phase === 'settings') {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.container}>
        <Text style={styles.eyebrow}>Impostor</Text>
        <Text style={styles.title}>Preparar rodada</Text>
        <Text style={styles.description}>Escolha se o impostor recebe uma dica relacionada à palavra.</Text>

        <TouchableOpacity
          style={[styles.optionCard, hintEnabled && styles.selectedOption]}
          onPress={() => setHintEnabled((current) => !current)}
        >
          <Text style={styles.optionTitle}>Dar dica ao impostor</Text>
          <Text style={styles.optionText}>{hintEnabled ? 'Ativado' : 'Desativado'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={startReveal}>
          <Text style={styles.mainButtonText}>Começar</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (phase === 'discussion') {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.container}>
        <Text style={styles.eyebrow}>Todos prontos</Text>
        <Text style={styles.title}>Discussão</Text>
        <Text style={styles.description}>Conversem na vida real, observem as pistas e decidam quem parece estar fingindo.</Text>

        <TouchableOpacity style={styles.mainButton} onPress={() => setPhase('vote')}>
          <Text style={styles.mainButtonText}>Ir para votação</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (phase === 'vote') {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Votação</Text>
          <Text style={styles.title}>Quem é o impostor?</Text>
          <Text style={styles.description}>Toque em um nome para somar 1 voto. Votos repetidos são permitidos nesta versão.</Text>

          <View style={styles.voteList}>
            {players.map((player) => (
              <TouchableOpacity key={player} style={styles.voteCard} onPress={() => addVote(player)}>
                <Text style={styles.voteName}>{player}</Text>
                <Text style={styles.voteCount}>{votes[player] ?? 0}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => {
              setPhase('result');
              void playSoundEffect(crowdFoundImpostor ? 'correct' : 'error');
            }}
          >
            <Text style={styles.mainButtonText}>Revelar impostor</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (phase === 'result') {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Revelação</Text>
          <Text style={styles.title}>{crowdFoundImpostor ? 'A galera acertou' : 'O impostor escapou'}</Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Impostor</Text>
            <Text style={styles.secretText}>{impostor}</Text>
          </View>

          <View style={styles.resultGrid}>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Palavra</Text>
              <Text style={styles.resultText}>{secret.word}</Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Mais votado</Text>
              <Text style={styles.resultText}>{voteLeaders.length > 0 ? voteLeaders.join(', ') : 'Ninguém'}</Text>
            </View>
          </View>

          <Text style={styles.description}>
            {crowdFoundImpostor ? 'O grupo encontrou o impostor na votação.' : 'O jogador mais votado não era o impostor.'}
          </Text>

          <TouchableOpacity style={styles.mainButton} onPress={() => router.replace('/')}>
            <Text style={styles.mainButtonText}>Voltar ao menu</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.gradients.screen} style={styles.container}>
      <Text style={styles.eyebrow}>Informação secreta</Text>
      <Text style={styles.title}>Passe o celular para {currentPlayer}</Text>

      {!showInfo ? (
        <>
          <Text style={styles.description}>Quando estiver sozinho com a tela, revele seu papel.</Text>

          <TouchableOpacity style={styles.mainButton} onPress={() => setShowInfo(true)}>
            <Text style={styles.mainButtonText}>Ver minha informação</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Animated.View style={[styles.card, { opacity: revealAnim, transform: [{ scale: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }]}>
            <Text style={styles.cardLabel}>{isImpostor ? 'Seu papel' : 'Palavra secreta'}</Text>
            <Text style={styles.secretText}>{isImpostor ? 'Você é o impostor' : secret.word}</Text>
            {isImpostor && hintEnabled ? (
              <Text style={styles.hintText}>Dica: {secret.hint}</Text>
            ) : null}
          </Animated.View>

          <TouchableOpacity style={styles.mainButton} onPress={hideAndPass}>
            <Text style={styles.mainButtonText}>Esconder e passar</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.progress}>
        {currentPlayerIndex + 1} de {players.length}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    paddingBottom: 36,
    justifyContent: 'center',
    flexGrow: 1,
  },
  eyebrow: {
    color: colors.cyan,
    textAlign: 'center',
    fontWeight: '900',
    marginBottom: 10,
  },
  title: {
    fontSize: 31,
    color: colors.text,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0,
  },
  description: {
    color: colors.mutedStrong,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  selectedOption: {
    backgroundColor: 'rgba(103,232,249,0.16)',
    borderColor: colors.cyan,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  optionText: {
    color: colors.cyan,
    fontWeight: '900',
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  cardLabel: {
    color: colors.cyan,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  secretText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 31,
    fontWeight: '900',
  },
  hintText: {
    color: colors.mutedStrong,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 14,
  },
  voteList: {
    gap: 10,
    marginBottom: 18,
  },
  voteCard: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voteName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  voteCount: {
    minWidth: 34,
    color: colors.textDark,
    backgroundColor: colors.lime,
    borderRadius: radii.chip,
    overflow: 'hidden',
    paddingVertical: 5,
    textAlign: 'center',
    fontWeight: '900',
  },
  resultGrid: {
    gap: 10,
    marginBottom: 18,
  },
  resultBox: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  resultLabel: {
    color: colors.cyan,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  resultText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  mainButton: {
    backgroundColor: colors.lime,
    padding: 18,
    borderRadius: radii.button,
    marginTop: 8,
  },
  mainButtonText: {
    color: colors.textDark,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
  },
  progress: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 18,
    fontSize: 16,
    fontWeight: '800',
  },
});
