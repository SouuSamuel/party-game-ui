import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

import { phraseCutBank } from '../data/wordBank';
import { getRandomPhraseCutWord } from '../utils/gameUtils';
import { colors, gradients, radii, useAppTheme } from '../styles/theme';
import { playSoundEffect } from '../utils/audio';

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

export default function FraseCortadaGame() {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const players = useMemo(() => parsePlayers(params.players), [params.players]);

  const [guesser, setGuesser] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);

  const [timeLeft, setTimeLeft] = useState(60);
  const [currentWord, setCurrentWord] = useState(getRandomPhraseCutWord(phraseCutBank));
  const [score, setScore] = useState(0);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const wordPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!gameStarted || finished) return;

    if (timeLeft <= 0) {
      void playSoundEffect('roundEnd');
      setFinished(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameStarted, timeLeft, finished]);

  useEffect(() => {
    wordPulse.setValue(0.92);
    Animated.spring(wordPulse, {
      toValue: 1,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [currentWord.word, wordPulse]);

  function startGame() {
    if (!guesser) {
      alert('Escolha quem vai adivinhar antes de começar.');
      return;
    }

    setTimeLeft(timeLimit);
    setGameStarted(true);
    void playSoundEffect('start');
  }

  function handleCorrect() {
    setScore((prev) => prev + 1);
    setCorrectWords((prev) => [...prev, currentWord.word]);
    setCurrentWord(getRandomPhraseCutWord(phraseCutBank));
    void playSoundEffect('correct');
  }

  function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  if (players.length < 3) {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.container}>
        <Text style={styles.title}>Jogadores insuficientes</Text>
        <Text style={styles.description}>Frase Cortada precisa de pelo menos 3 jogadores.</Text>

        <TouchableOpacity style={styles.mainButton} onPress={() => router.back()}>
          <Text style={styles.mainButtonText}>Voltar</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (finished) {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.container}>
        <Text style={styles.eyebrow}>Fim da rodada</Text>
        <Text style={styles.title}>Tempo esgotado</Text>
        <Text style={styles.score}>Acertos: {score}</Text>

        <ScrollView style={styles.list}>
          {correctWords.length === 0 ? (
            <Text style={styles.empty}>Nenhuma palavra acertada ainda.</Text>
          ) : (
            correctWords.map((word, index) => (
              <Text key={index} style={styles.wordItem}>
                {word}
              </Text>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={styles.mainButton} onPress={() => router.replace('/')}>
          <Text style={styles.mainButtonText}>Voltar ao menu</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (!gameStarted) {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Frase Cortada</Text>
          <Text style={styles.title}>Quem vai adivinhar?</Text>
          <Text style={styles.description}>Os outros jogadores verão a palavra e darão pistas na vida real.</Text>

          <View style={styles.panel}>
            {players.map((player, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.playerButton, guesser === player && styles.selectedPlayer]}
                onPress={() => setGuesser(player)}
              >
                <Text style={styles.playerText}>{player}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Tempo</Text>
          <View style={styles.timeBox}>
            {[60, 120, 180].map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.timeButton, timeLimit === time && styles.selectedTime]}
                onPress={() => setTimeLimit(time)}
              >
                <Text style={styles.timeText}>{time / 60} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.mainButton} onPress={startGame}>
            <Text style={styles.mainButtonText}>Começar</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.gradients.screen} style={styles.container}>
      <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

      <Text style={styles.smallText}>Adivinhador</Text>
      <Text style={styles.guesser}>{guesser}</Text>

      <Animated.View style={[styles.card, { opacity: wordPulse, transform: [{ scale: wordPulse }] }]}>
        <Text style={styles.category}>{currentWord.category}</Text>
        <Text style={styles.secretWord}>{currentWord.word}</Text>
      </Animated.View>

      <Text style={styles.description}>Mostre esta palavra apenas para quem vai dar as dicas.</Text>

      <TouchableOpacity style={styles.correctButton} onPress={handleCorrect}>
        <Text style={styles.correctText}>Acertou</Text>
      </TouchableOpacity>

      <Text style={styles.scoreMini}>Acertos: {score}</Text>
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
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    color: colors.text,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0,
  },
  description: {
    color: colors.mutedStrong,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  panel: {
    gap: 10,
    marginBottom: 22,
  },
  playerButton: {
    backgroundColor: colors.panel,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedPlayer: {
    backgroundColor: 'rgba(167,139,250,0.22)',
    borderColor: colors.violet,
  },
  playerText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  timeBox: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  timeButton: {
    flex: 1,
    backgroundColor: colors.panel,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTime: {
    backgroundColor: 'rgba(103,232,249,0.18)',
    borderColor: colors.cyan,
  },
  timeText: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: '900',
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
  timer: {
    color: colors.lime,
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
  },
  smallText: {
    color: colors.muted,
    textAlign: 'center',
  },
  guesser: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  category: {
    color: colors.cyan,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  secretWord: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '900',
  },
  correctButton: {
    backgroundColor: colors.lime,
    padding: 19,
    borderRadius: radii.button,
    marginTop: 8,
  },
  correctText: {
    color: colors.textDark,
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '900',
  },
  scoreMini: {
    color: colors.text,
    textAlign: 'center',
    marginTop: 18,
    fontSize: 18,
    fontWeight: '800',
  },
  score: {
    color: colors.lime,
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '900',
    marginVertical: 14,
  },
  list: {
    maxHeight: 220,
    marginBottom: 20,
  },
  wordItem: {
    color: colors.text,
    fontSize: 17,
    padding: 12,
    backgroundColor: colors.panel,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    color: colors.muted,
    textAlign: 'center',
  },
});
