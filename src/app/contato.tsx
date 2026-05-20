import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { contactWords } from '../data/wordBank';
import { getRandomItem } from '../utils/gameUtils';
import { colors, gradients, radii, useAppTheme } from '../styles/theme';
import { playSoundEffect } from '../utils/audio';

type Phase = 'selectMaster' | 'secretWord' | 'control';

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

function maskWord(word: string, revealedCount: number) {
  return Array.from(word)
    .map((letter, index) => (index < revealedCount ? letter.toUpperCase() : '_'))
    .join(' ');
}

export default function ContatoGame() {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const players = useMemo(() => parsePlayers(params.players), [params.players]);

  const [phase, setPhase] = useState<Phase>('selectMaster');
  const [master, setMaster] = useState('');
  const [secretWord, setSecretWord] = useState(() => getRandomItem(contactWords));
  const [revealedLetters, setRevealedLetters] = useState(0);

  const wordComplete = revealedLetters >= secretWord.length;
  const hiddenWord = maskWord(secretWord, revealedLetters);

  function chooseMaster(player: string) {
    setMaster(player);
    setPhase('secretWord');
    void playSoundEffect('click');
  }

  function revealNextLetter() {
    setRevealedLetters((current) => Math.min(current + 1, secretWord.length));
  }

  function showAnswer() {
    setRevealedLetters(secretWord.length);
    void playSoundEffect('roundEnd');
  }

  function newWord() {
    setSecretWord(getRandomItem(contactWords));
    setRevealedLetters(0);
    setPhase('secretWord');
    void playSoundEffect('start');
  }

  if (players.length < 3) {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.container}>
        <Text style={styles.title}>Jogadores insuficientes</Text>
        <Text style={styles.description}>Contato precisa de pelo menos 3 jogadores.</Text>

        <TouchableOpacity style={styles.mainButton} onPress={() => router.back()}>
          <Text style={styles.mainButtonText}>Voltar</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (phase === 'selectMaster') {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.screen}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>Contato</Text>
          <Text style={styles.title}>Quem será o mestre?</Text>
          <Text style={styles.description}>O mestre vê a palavra e controla as letras reveladas.</Text>

          <View style={styles.playersList}>
            {players.map((player) => (
              <TouchableOpacity key={player} style={styles.playerButton} onPress={() => chooseMaster(player)}>
                <Text style={styles.playerButtonText}>{player}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (phase === 'secretWord') {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.container}>
        <Text style={styles.eyebrow}>Palavra secreta</Text>
        <Text style={styles.title}>Passe o celular para {master}</Text>
        <Text style={styles.description}>A palavra deve ser vista apenas pelo mestre.</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Resposta</Text>
          <Text style={styles.secretWord}>{secretWord}</Text>
        </View>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => {
            setPhase('control');
            void playSoundEffect('start');
          }}
        >
          <Text style={styles.mainButtonText}>Esconder e começar</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.gradients.screen} style={styles.container}>
      <Text style={styles.eyebrow}>Mestre: {master}</Text>
      <Text style={styles.title}>Controle da palavra</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{wordComplete ? 'Palavra completa' : 'Palavra escondida'}</Text>
        <Text style={styles.maskedWord}>{hiddenWord}</Text>
      </View>

      <Text style={styles.description}>
        {wordComplete ? 'A palavra completa foi revelada.' : 'Revele uma letra por vez enquanto o grupo tenta descobrir.'}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.mainButton} onPress={revealNextLetter}>
          <Text style={styles.mainButtonText}>Revelar próxima letra</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={showAnswer}>
          <Text style={styles.secondaryButtonText}>Mostrar resposta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={newWord}>
          <Text style={styles.secondaryButtonText}>Nova palavra</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
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
  playersList: {
    gap: 10,
  },
  playerButton: {
    backgroundColor: colors.panel,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerButtonText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '900',
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
  secretWord: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '900',
  },
  maskedWord: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 44,
  },
  actions: {
    gap: 12,
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
  secondaryButton: {
    backgroundColor: colors.panel,
    padding: 18,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
  },
});
