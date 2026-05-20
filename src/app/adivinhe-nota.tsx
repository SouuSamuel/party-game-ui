import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { shuffleArray } from '../utils/gameUtils';
import { colors, gradients, radii, useAppTheme } from '../styles/theme';
import { playSoundEffect } from '../utils/audio';

type Pair = [string, string];
type PairMode = 'auto' | 'manual';
type Phase = 'config' | 'reveal' | 'guess' | 'result' | 'summary';
type PairResult = {
  pairIndex: number;
  owner: string;
  guesser: string;
  note: number;
  guess: number;
  correct: boolean;
};
type RoundResult = {
  round: number;
  pairs: PairResult[];
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

function createEmptyPairs(playersCount: number): (string | null)[][] {
  return Array.from({ length: Math.floor(playersCount / 2) }, () => [null, null]);
}

function createAutoPairs(players: string[]): Pair[] {
  const shuffledPlayers = shuffleArray(players);
  const pairs: Pair[] = [];

  for (let index = 0; index < shuffledPlayers.length; index += 2) {
    pairs.push([shuffledPlayers[index], shuffledPlayers[index + 1]]);
  }

  return pairs;
}

function createRoundNotes(pairCount: number) {
  const notes = shuffleArray(Array.from({ length: 11 }, (_, index) => index));
  return notes.slice(0, pairCount);
}

function getRoles(pair: Pair, roundIndex: number) {
  return {
    owner: pair[roundIndex % 2],
    guesser: pair[(roundIndex + 1) % 2],
  };
}

export default function AdivinheNotaGame() {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const players = useMemo(() => parsePlayers(params.players), [params.players]);

  const [pairMode, setPairMode] = useState<PairMode>('auto');
  const [roundsCount, setRoundsCount] = useState(3);
  const [manualPairs, setManualPairs] = useState<(string | null)[][]>(() => createEmptyPairs(players.length));
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [phase, setPhase] = useState<Phase>('config');
  const [currentRound, setCurrentRound] = useState(0);
  const [roundNotes, setRoundNotes] = useState<number[]>([]);
  const [revealedNotes, setRevealedNotes] = useState<Record<number, boolean>>({});
  const [guesses, setGuesses] = useState<Record<number, number>>({});
  const [results, setResults] = useState<RoundResult[]>([]);

  const selectedPlayers = manualPairs.flat().filter(Boolean) as string[];
  const allGuessesDone = pairs.length > 0 && pairs.every((_, pairIndex) => guesses[pairIndex] !== undefined);
  const currentRoundResult = results.find((result) => result.round === currentRound + 1);

  function updateManualPair(pairIndex: number, slotIndex: number, player: string) {
    setManualPairs((current) =>
      current.map((pair, index) => {
        if (index !== pairIndex) return pair;

        const nextPair = [...pair];
        nextPair[slotIndex] = player;
        return nextPair;
      })
    );
  }

  function clearManualSlot(pairIndex: number, slotIndex: number) {
    setManualPairs((current) =>
      current.map((pair, index) => {
        if (index !== pairIndex) return pair;

        const nextPair = [...pair];
        nextPair[slotIndex] = null;
        return nextPair;
      })
    );
  }

  function startGame() {
    if (players.length < 4 || players.length % 2 !== 0) {
      alert('Adivinhe a Nota precisa de pelo menos 4 jogadores e número par de participantes.');
      return;
    }

    const pairCount = players.length / 2;

    if (pairCount > 11) {
      alert('Este modo aceita no máximo 22 jogadores para manter notas diferentes por dupla.');
      return;
    }

    const nextPairs = pairMode === 'auto' ? createAutoPairs(players) : manualPairs;
    const validPairs = nextPairs.every((pair) => pair[0] && pair[1] && pair[0] !== pair[1]);
    const uniquePlayers = new Set(nextPairs.flat().filter(Boolean));

    if (!validPairs || uniquePlayers.size !== players.length) {
      alert('Defina duplas completas, sem repetir jogadores.');
      return;
    }

    setPairs(nextPairs as Pair[]);
    setRoundNotes(createRoundNotes(pairCount));
    setCurrentRound(0);
    setRevealedNotes({});
    setGuesses({});
    setResults([]);
    setPhase('reveal');
    void playSoundEffect('start');
  }

  function selectGuess(pairIndex: number, guess: number) {
    setGuesses((current) => ({
      ...current,
      [pairIndex]: guess,
    }));
  }

  function finishRound() {
    if (!allGuessesDone) {
      alert('Todas as duplas precisam responder antes de terminar a rodada.');
      return;
    }

    const roundResult: RoundResult = {
      round: currentRound + 1,
      pairs: pairs.map((pair, pairIndex) => {
        const { owner, guesser } = getRoles(pair, currentRound);
        const note = roundNotes[pairIndex];
        const guess = guesses[pairIndex];

        return {
          pairIndex,
          owner,
          guesser,
          note,
          guess,
          correct: guess === note,
        };
      }),
    };

    setResults((current) => [...current, roundResult]);
    setPhase('result');
    void playSoundEffect('roundEnd');
  }

  function goNextRound() {
    if (currentRound + 1 >= roundsCount) {
      setPhase('summary');
      return;
    }

    setCurrentRound((current) => current + 1);
    setRoundNotes(createRoundNotes(pairs.length));
    setRevealedNotes({});
    setGuesses({});
    setPhase('reveal');
  }

  if (players.length < 4 || players.length % 2 !== 0) {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.container}>
        <Text style={styles.title}>Jogadores insuficientes</Text>
        <Text style={styles.description}>Adivinhe a Nota precisa de pelo menos 4 jogadores e número par de participantes.</Text>

        <TouchableOpacity style={styles.mainButton} onPress={() => router.back()}>
          <Text style={styles.mainButtonText}>Voltar</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (phase === 'config') {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Adivinhe a Nota</Text>
          <Text style={styles.title}>Configure a rodada</Text>
          <Text style={styles.description}>Escolha como formar as duplas e quantas rodadas jogar.</Text>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Duplas</Text>
            <View style={styles.segment}>
              <TouchableOpacity style={[styles.segmentButton, pairMode === 'auto' && styles.selectedSegment]} onPress={() => setPairMode('auto')}>
                <Text style={styles.segmentText}>Sortear automaticamente</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segmentButton, pairMode === 'manual' && styles.selectedSegment]} onPress={() => setPairMode('manual')}>
                <Text style={styles.segmentText}>Definir manualmente</Text>
              </TouchableOpacity>
            </View>

            {pairMode === 'manual' ? (
              manualPairs.map((pair, pairIndex) => (
                <View key={pairIndex} style={styles.manualPair}>
                  <Text style={styles.pairTitle}>Dupla {pairIndex + 1}</Text>
                  {[0, 1].map((slotIndex) => (
                    <View key={slotIndex} style={styles.slot}>
                      <Text style={styles.slotTitle}>Jogador {slotIndex + 1}</Text>
                      {pair[slotIndex] ? (
                        <TouchableOpacity style={styles.selectedPlayer} onPress={() => clearManualSlot(pairIndex, slotIndex)}>
                          <Text style={styles.selectedPlayerText}>{pair[slotIndex]}</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.playerGrid}>
                          {players
                            .filter((player) => !selectedPlayers.includes(player))
                            .map((player) => (
                              <TouchableOpacity key={player} style={styles.playerChoice} onPress={() => updateManualPair(pairIndex, slotIndex, player)}>
                                <Text style={styles.playerChoiceText}>{player}</Text>
                              </TouchableOpacity>
                            ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <Text style={styles.helpText}>As duplas serão sorteadas quando o jogo começar.</Text>
            )}
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Rodadas</Text>
            <View style={styles.roundControls}>
              <TouchableOpacity style={styles.smallButton} onPress={() => setRoundsCount((current) => Math.max(1, current - 1))}>
                <Text style={styles.smallButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.roundNumber}>{roundsCount}</Text>
              <TouchableOpacity style={styles.smallButton} onPress={() => setRoundsCount((current) => Math.min(10, current + 1))}>
                <Text style={styles.smallButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.mainButton} onPress={startGame}>
            <Text style={styles.mainButtonText}>Começar</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (phase === 'reveal') {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Rodada {currentRound + 1} de {roundsCount}</Text>
          <Text style={styles.title}>Notas secretas</Text>
          <Text style={styles.description}>Cada dono da nota deve revelar apenas o próprio cartão.</Text>

          {pairs.map((pair, pairIndex) => {
            const { owner, guesser } = getRoles(pair, currentRound);
            const isRevealed = revealedNotes[pairIndex];

            return (
              <View key={pairIndex} style={styles.roundCard}>
                <Text style={styles.summaryTitle}>Dupla {pairIndex + 1}</Text>
                <Text style={styles.summaryText}>Sabe a nota: {owner}</Text>
                <Text style={styles.summaryText}>Vai adivinhar: {guesser}</Text>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setRevealedNotes((current) => ({ ...current, [pairIndex]: !current[pairIndex] }))}
                >
                  <Text style={styles.secondaryButtonText}>{isRevealed ? `Nota: ${roundNotes[pairIndex]}` : 'Ver nota secreta'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity style={styles.mainButton} onPress={() => setPhase('guess')}>
            <Text style={styles.mainButtonText}>Ir para tentativas</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (phase === 'guess') {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Rodada {currentRound + 1} de {roundsCount}</Text>
          <Text style={styles.title}>Tentativas</Text>
          <Text style={styles.description}>Todas as duplas respondem nesta tela. A rodada só termina quando todo mundo escolher.</Text>

          {pairs.map((pair, pairIndex) => {
            const { owner, guesser } = getRoles(pair, currentRound);
            const selectedGuess = guesses[pairIndex];

            return (
              <View key={pairIndex} style={styles.roundCard}>
                <Text style={styles.summaryTitle}>Dupla {pairIndex + 1}</Text>
                <Text style={styles.summaryText}>{owner} dá pistas para {guesser}</Text>
                <View style={styles.noteGrid}>
                  {Array.from({ length: 11 }, (_, note) => (
                    <TouchableOpacity
                      key={note}
                      style={[styles.noteButton, selectedGuess === note && styles.selectedNoteButton]}
                      onPress={() => selectGuess(pairIndex, note)}
                    >
                      <Text style={styles.noteButtonText}>{note}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={[styles.mainButton, !allGuessesDone && styles.disabledButton]} onPress={finishRound}>
            <Text style={styles.mainButtonText}>Ver resultado da rodada</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (phase === 'result' && currentRoundResult) {
    return (
      <LinearGradient colors={theme.gradients.screen} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>Resultado</Text>
          <Text style={styles.title}>Rodada {currentRound + 1}</Text>
          <Text style={styles.description}>Notas e palpites de todas as duplas.</Text>

          {currentRoundResult.pairs.map((result) => (
            <View key={result.pairIndex} style={styles.summaryItem}>
              <Text style={styles.summaryTitle}>Dupla {result.pairIndex + 1}</Text>
              <Text style={styles.summaryText}>{result.owner} deu pistas para {result.guesser}</Text>
              <Text style={styles.summaryText}>Nota correta: {result.note}</Text>
              <Text style={styles.summaryText}>Palpite: {result.guess}</Text>
              <Text style={[styles.summaryStatus, result.correct ? styles.correct : styles.wrong]}>
                {result.correct ? 'Acertou' : 'Errou'}
              </Text>
            </View>
          ))}

          <TouchableOpacity style={styles.mainButton} onPress={goNextRound}>
            <Text style={styles.mainButtonText}>{currentRound + 1 < roundsCount ? 'Próxima rodada' : 'Ver resumo final'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  const flatResults = results.flatMap((result) => result.pairs);
  const correctCount = flatResults.filter((result) => result.correct).length;

  return (
    <LinearGradient colors={theme.gradients.screen} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Fim de jogo</Text>
        <Text style={styles.title}>Resumo final</Text>
        <Text style={styles.description}>
          {correctCount} acertos em {flatResults.length} tentativas.
        </Text>

        {results.map((roundResult) => (
          <View key={roundResult.round} style={styles.summaryItem}>
            <Text style={styles.summaryTitle}>Rodada {roundResult.round}</Text>
            <Text style={styles.summaryText}>
              {roundResult.pairs.filter((result) => result.correct).length} acertos de {roundResult.pairs.length}
            </Text>
          </View>
        ))}

        <TouchableOpacity style={styles.mainButton} onPress={() => router.replace('/')}>
          <Text style={styles.mainButtonText}>Voltar ao menu</Text>
        </TouchableOpacity>
      </ScrollView>
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
  panel: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },
  segment: {
    gap: 10,
  },
  segmentButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  selectedSegment: {
    backgroundColor: 'rgba(103,232,249,0.18)',
    borderColor: colors.cyan,
  },
  segmentText: {
    color: colors.text,
    fontWeight: '900',
    textAlign: 'center',
  },
  manualPair: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    marginTop: 14,
  },
  pairTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  slot: {
    marginBottom: 12,
  },
  slotTitle: {
    color: colors.mutedStrong,
    fontWeight: '800',
    marginBottom: 8,
  },
  playerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerChoice: {
    backgroundColor: colors.panelStrong,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerChoiceText: {
    color: colors.text,
    fontWeight: '800',
  },
  selectedPlayer: {
    backgroundColor: colors.lime,
    borderRadius: 14,
    padding: 12,
  },
  selectedPlayerText: {
    color: colors.textDark,
    fontWeight: '900',
    textAlign: 'center',
  },
  helpText: {
    color: colors.mutedStrong,
    lineHeight: 22,
    marginTop: 12,
  },
  roundControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  smallButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(103,232,249,0.18)',
    borderWidth: 1,
    borderColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  roundNumber: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    minWidth: 60,
    textAlign: 'center',
  },
  roundCard: {
    backgroundColor: colors.panel,
    borderRadius: radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  noteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  noteButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedNoteButton: {
    backgroundColor: 'rgba(190,242,100,0.22)',
    borderColor: colors.lime,
  },
  noteButtonText: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  mainButton: {
    backgroundColor: colors.lime,
    padding: 18,
    borderRadius: radii.button,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  mainButtonText: {
    color: colors.textDark,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButton: {
    backgroundColor: colors.panelStrong,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '900',
    textAlign: 'center',
  },
  summaryItem: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 6,
  },
  summaryText: {
    color: colors.mutedStrong,
    marginBottom: 4,
  },
  summaryStatus: {
    fontWeight: '900',
    marginTop: 4,
  },
  correct: {
    color: colors.lime,
  },
  wrong: {
    color: colors.pink,
  },
});
