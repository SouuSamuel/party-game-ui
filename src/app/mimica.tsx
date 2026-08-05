import { useEffect, useMemo, useReducer, useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppHeader, AppScreen, Card, Chip, EmptyState, ScorePill, TimerBadge } from '../components/ui';
import { charadesCategories, charadesTerms, difficultyLabels } from '../games/charades/content';
import { getCharadesTerms, initializeCharadesDatabase } from '../games/charades/database';
import { playCorrectFeedback } from '../games/charades/feedback';
import { charadesReducer, defaultCharadesSetup, initialCharadesState } from '../games/charades/state';
import type { CharadesDifficulty, CharadesMode, CharadesTerm } from '../games/charades/types';
import { spacing, typography, useAppTheme } from '../styles/theme';
import { playSoundEffect } from '../utils/audio';

const quickDurations = [45, 60, 90, 120];
const quickRounds = [2, 4, 6, 8];
const quickTargets = [15, 30, 45, 60];

function categoryCount(categoryId: string) {
  return charadesTerms.filter((term) => term.categoryId === categoryId).length;
}

function parsePositiveInteger(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function validateNames(names: string[], min: number, max?: number) {
  const cleanNames = names.map((name) => name.trim()).filter(Boolean);
  const uniqueNames = new Set(cleanNames.map((name) => name.toLowerCase()));
  if (cleanNames.length < min) return `Adicione pelo menos ${min} participantes.`;
  if (max && cleanNames.length > max) return `Use no máximo ${max} participantes.`;
  if (uniqueNames.size !== cleanNames.length) return 'Use nomes diferentes para cada participante.';
  return undefined;
}

export default function MimicaScreen() {
  const theme = useAppTheme();
  const [state, dispatch] = useReducer(charadesReducer, initialCharadesState);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState('');
  const [db, setDb] = useState<Awaited<ReturnType<typeof initializeCharadesDatabase>>['db']>();
  const [modeDraft, setModeDraft] = useState<CharadesMode>(defaultCharadesSetup.mode);
  const [playersDraft, setPlayersDraft] = useState(defaultCharadesSetup.players);
  const [teamsDraft, setTeamsDraft] = useState(defaultCharadesSetup.teams);
  const [categoryDraft, setCategoryDraft] = useState(charadesCategories.map((category) => category.id));
  const [difficultyDraft, setDifficultyDraft] = useState<CharadesDifficulty[]>(defaultCharadesSetup.selectedDifficulties);
  const [durationDraft, setDurationDraft] = useState(String(defaultCharadesSetup.turnDuration));
  const [roundsDraft, setRoundsDraft] = useState(String(defaultCharadesSetup.maxRounds));
  const [targetDraft, setTargetDraft] = useState(String(defaultCharadesSetup.targetScore));
  const [endOnTargetScore, setEndOnTargetScore] = useState(defaultCharadesSetup.endOnTargetScore);
  const [error, setError] = useState('');

  const activeParticipant = state.participants[state.activeParticipantIndex];
  const selectedCategoryNames = useMemo(
    () => charadesCategories.filter((category) => state.setup.selectedCategoryIds.includes(category.id)).map((category) => category.name),
    [state.setup.selectedCategoryIds]
  );

  useEffect(() => {
    let mounted = true;
    if (Platform.OS === 'web') {
      setDatabaseReady(true);
      return () => {
        mounted = false;
      };
    }
    initializeCharadesDatabase()
      .then(({ db: nextDb }) => {
        if (!mounted) return;
        setDb(nextDb);
        setDatabaseReady(true);
      })
      .catch((nextError: unknown) => {
        if (!mounted) return;
        setDatabaseError(nextError instanceof Error ? nextError.message : 'Não foi possível inicializar o banco da Mímica.');
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (state.phase !== 'ACTIVE_ROUND') return undefined;
    const timer = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(timer);
  }, [state.phase]);

  useEffect(() => {
    if (!state.actionLocked) return undefined;
    const unlock = setTimeout(() => dispatch({ type: 'UNLOCK_ACTION' }), 180);
    return () => clearTimeout(unlock);
  }, [state.actionLocked]);

  function updateName(list: string[], setList: (value: string[]) => void, index: number, value: string) {
    setList(list.map((name, itemIndex) => (itemIndex === index ? value : name)));
  }

  function removeName(list: string[], setList: (value: string[]) => void, index: number, min: number) {
    if (list.length <= min) return;
    setList(list.filter((_, itemIndex) => itemIndex !== index));
  }

  async function confirmRules() {
    if (!db && Platform.OS !== 'web') return;
    const duration = parsePositiveInteger(durationDraft, 0);
    const maxRounds = parsePositiveInteger(roundsDraft, 0);
    const targetScore = parsePositiveInteger(targetDraft, 0);

    if (duration <= 0 || maxRounds <= 0 || targetScore <= 0) {
      setError('Duração, rodadas e meta precisam ser números inteiros positivos.');
      return;
    }

    if (categoryDraft.length === 0) {
      setError('Selecione pelo menos uma categoria.');
      return;
    }

    if (difficultyDraft.length === 0) {
      setError('Selecione pelo menos uma dificuldade.');
      return;
    }

    const filteredTerms: CharadesTerm[] = db
      ? await getCharadesTerms(db, categoryDraft, difficultyDraft)
      : charadesTerms.filter((term) => categoryDraft.includes(term.categoryId) && difficultyDraft.includes(term.difficulty));
    const participantCount = modeDraft === 'teams' ? teamsDraft.filter(Boolean).length : playersDraft.filter(Boolean).length;
    const minimumNeeded = Math.max(10, participantCount * maxRounds);
    if (filteredTerms.length < minimumNeeded) {
      setError(`Estes filtros retornaram ${filteredTerms.length} termos. Use pelo menos ${minimumNeeded} para evitar repetição.`);
      return;
    }

    dispatch({ type: 'SET_CATEGORIES', categoryIds: categoryDraft });
    dispatch({ type: 'SET_DIFFICULTIES', difficulties: difficultyDraft });
    dispatch({ type: 'SET_RULES', duration, maxRounds, targetScore, endOnTargetScore });
    dispatch({ type: 'CONFIRM_SETUP', terms: filteredTerms });
    setError('');
  }

  function handleCorrect() {
    if (state.actionLocked) return;
    dispatch({ type: 'CORRECT' });
    void playCorrectFeedback();
    void playSoundEffect('correct');
  }

  function handleSkip() {
    if (state.actionLocked) return;
    dispatch({ type: 'SKIP' });
    void playSoundEffect('click');
  }

  function renderIntro() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader title="Mímica" eyebrow="Novo jogo" icon="body-outline" onBack={() => router.back()} description="Represente termos sem falar e faça seu time adivinhar antes do tempo acabar." />
        <Card style={styles.stack}>
          {['Escolha times ou todos jogam.', 'Selecione categorias e dificuldades.', 'Acertos valem 1, 2 ou 3 pontos.', 'Nenhuma palavra se repete na mesma partida.'].map((item, index) => (
            <View key={item} style={styles.ruleRow}>
              <Text style={[styles.ruleNumber, { backgroundColor: theme.colors.accent, color: theme.colors.onAccent }]}>{index + 1}</Text>
              <Text style={[styles.ruleText, { color: theme.colors.mutedStrong }]}>{item}</Text>
            </View>
          ))}
        </Card>
        {databaseError ? <Text style={[styles.error, { color: theme.colors.danger }]}>{databaseError}</Text> : null}
        <AppButton label={databaseReady ? 'Configurar partida' : 'Preparando banco offline'} icon="options-outline" disabled={!databaseReady} onPress={() => dispatch({ type: 'START_SETUP' })} />
      </ScrollView>
    );
  }

  function renderModeSetup() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader title="Modo de jogo" eyebrow="Etapa 1 de 4" onBack={() => dispatch({ type: 'NEW_GAME' })} />
        <View style={styles.stack}>
          {[
            { id: 'teams' as const, title: 'Times', description: '2 a 4 times se alternam a cada turno.', icon: 'people-outline' as const },
            { id: 'everyone' as const, title: 'Todos Jogam', description: 'Cada jogador participa individualmente.', icon: 'person-outline' as const },
          ].map((option) => (
            <Pressable key={option.id} onPress={() => setModeDraft(option.id)}>
              <Card style={modeDraft === option.id ? { ...styles.optionCard, borderColor: theme.colors.accent } : styles.optionCard}>
                <Ionicons name={option.icon} size={24} color={theme.colors.accent} />
                <View style={styles.flex}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{option.title}</Text>
                  <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>{option.description}</Text>
                </View>
                {modeDraft === option.id ? <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} /> : null}
              </Card>
            </Pressable>
          ))}
        </View>
        <AppButton label="Continuar" icon="arrow-forward-outline" onPress={() => dispatch({ type: 'SET_MODE', mode: modeDraft })} />
      </ScrollView>
    );
  }

  function renderNameEditor() {
    const isTeams = state.setup.mode === 'teams';
    const list = isTeams ? teamsDraft : playersDraft;
    const setList = isTeams ? setTeamsDraft : setPlayersDraft;
    const min = isTeams ? 2 : 2;
    const max = isTeams ? 4 : 24;

    function continuePlayers() {
      const validation = validateNames(list, min, max);
      if (validation) {
        setError(validation);
        return;
      }
      if (isTeams) {
        dispatch({ type: 'SET_TEAMS', teams: list.map((name) => name.trim()).filter(Boolean) });
      } else {
        dispatch({ type: 'SET_PLAYERS', players: list.map((name) => name.trim()).filter(Boolean) });
      }
      dispatch({ type: 'GO_TO_CATEGORIES' });
      setError('');
    }

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <AppHeader title={isTeams ? 'Times' : 'Jogadores'} eyebrow="Etapa 2 de 4" onBack={() => dispatch({ type: 'START_SETUP' })} />
          <View style={styles.stack}>
            {list.map((name, index) => (
              <Card key={index} style={styles.nameRow}>
                <TextInput value={name} onChangeText={(value) => updateName(list, setList, index, value)} placeholder={isTeams ? `Time ${index + 1}` : `Jogador ${index + 1}`} style={[styles.input, { color: theme.colors.text }]} placeholderTextColor={theme.colors.muted} />
                <Pressable onPress={() => removeName(list, setList, index, min)}>
                  <Ionicons name="remove-circle-outline" size={24} color={theme.colors.danger} />
                </Pressable>
              </Card>
            ))}
          </View>
          <AppButton label={isTeams ? 'Adicionar time' : 'Adicionar jogador'} icon="add-outline" variant="secondary" disabled={list.length >= max} onPress={() => setList([...list, isTeams ? `Time ${list.length + 1}` : `Jogador ${list.length + 1}`])} />
          {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
          <AppButton label="Continuar" icon="arrow-forward-outline" onPress={continuePlayers} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  function renderCategories() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader title="Categorias" eyebrow="Etapa 3 de 4" onBack={() => dispatch({ type: 'SET_MODE', mode: modeDraft })} description="Selecione uma ou mais categorias para montar a fila de palavras." />
        <View style={styles.toolbar}>
          <AppButton label="Todas" icon="checkmark-done-outline" variant="secondary" style={styles.toolbarButton} onPress={() => setCategoryDraft(charadesCategories.map((category) => category.id))} />
          <AppButton label="Limpar" icon="close-outline" variant="secondary" style={styles.toolbarButton} onPress={() => setCategoryDraft([])} />
        </View>
        <View style={styles.stack}>
          {charadesCategories.map((category) => {
            const selected = categoryDraft.includes(category.id);
            return (
              <Pressable
                key={category.id}
                onPress={() => setCategoryDraft((current) => (selected ? current.filter((id) => id !== category.id) : [...current, category.id]))}
              >
                <Card style={selected ? { ...styles.categoryCard, borderColor: theme.colors.accent } : styles.categoryCard}>
                  <View style={[styles.categoryIcon, { backgroundColor: theme.colors.accentSoft }]}>
                    <Ionicons name={category.icon as never} size={22} color={theme.colors.accent} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{category.name}</Text>
                    <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>{category.description}</Text>
                    <Text style={[styles.caption, { color: theme.colors.muted }]}>{categoryCount(category.id)} termos</Text>
                  </View>
                  {selected ? <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} /> : null}
                </Card>
              </Pressable>
            );
          })}
        </View>
        <AppButton label="Continuar" icon="arrow-forward-outline" onPress={() => {
          if (categoryDraft.length === 0) {
            setError('Selecione pelo menos uma categoria.');
            return;
          }
          dispatch({ type: 'SET_CATEGORIES', categoryIds: categoryDraft });
          dispatch({ type: 'GO_TO_RULES' });
          setError('');
        }} />
        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      </ScrollView>
    );
  }

  function renderRules() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader title="Configuração" eyebrow="Etapa 4 de 4" onBack={() => dispatch({ type: 'GO_TO_CATEGORIES' })} />
        <Card style={styles.stack}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Dificuldades</Text>
          <View style={styles.wrap}>
            {(['easy', 'medium', 'hard'] as CharadesDifficulty[]).map((difficulty) => (
              <Chip
                key={difficulty}
                label={`${difficultyLabels[difficulty]} · ${difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3} pts`}
                selected={difficultyDraft.includes(difficulty)}
                onPress={() =>
                  setDifficultyDraft((current) =>
                    current.includes(difficulty) ? current.filter((item) => item !== difficulty) : [...current, difficulty]
                  )
                }
              />
            ))}
          </View>
        </Card>
        <Card style={styles.stack}>
          <NumberSetting label="Duração do turno" value={durationDraft} setValue={setDurationDraft} suffix="seg" options={quickDurations} />
          <NumberSetting label="Rodadas máximas" value={roundsDraft} setValue={setRoundsDraft} options={quickRounds} />
          <NumberSetting label="Meta de pontos" value={targetDraft} setValue={setTargetDraft} options={quickTargets} />
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Encerrar ao bater meta</Text>
              <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>A partida termina no fim do turno em que alguém atingir a meta.</Text>
            </View>
            <Switch value={endOnTargetScore} onValueChange={setEndOnTargetScore} />
          </View>
        </Card>
        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        <AppButton label="Iniciar partida" icon="play-outline" onPress={confirmRules} />
      </ScrollView>
    );
  }

  function renderRoundReady() {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader title="Prepare o turno" eyebrow={`Rodada ${state.currentRound} de ${state.setup.maxRounds}`} onBack={() => router.replace('/modes')} />
        <Card style={styles.centerCard}>
          <Text style={[styles.caption, { color: theme.colors.muted }]}>Vez de</Text>
          <Text style={[styles.bigTitle, { color: theme.colors.text }]}>{activeParticipant?.name}</Text>
          <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>Passe o celular para quem vai controlar acertos e pulos.</Text>
        </Card>
        <View style={styles.scoreGrid}>
          {state.participants.map((participant) => (
            <ScorePill key={participant.id} label={participant.name} value={participant.score} />
          ))}
        </View>
        <AppButton label="Começar turno" icon="timer-outline" onPress={() => dispatch({ type: 'START_TURN' })} />
      </ScrollView>
    );
  }

  function renderActiveRound() {
    const term = state.currentTerm;
    const category = charadesCategories.find((item) => item.id === term?.categoryId);
    if (!term) return <EmptyState title="Sem palavra" description="O banco disponível acabou para estes filtros." />;

    return (
      <View style={styles.activeRound}>
        <View style={styles.activeTop}>
          <Text style={[styles.caption, { color: theme.colors.muted }]}>Vez de {activeParticipant?.name}</Text>
          <TimerBadge seconds={state.timeLeft} urgent={state.timeLeft <= 10} />
        </View>
        <Card style={styles.wordCard}>
          <Chip label={category?.name ?? 'Categoria'} icon="albums-outline" />
          <Text adjustsFontSizeToFit numberOfLines={2} style={[styles.word, { color: theme.colors.text }]}>{term.term}</Text>
          <Chip label={`${difficultyLabels[term.difficulty]} · ${term.points} pts`} selected />
        </Card>
        <View style={styles.actions}>
          <AppButton label="Acertou" icon="checkmark-outline" disabled={state.actionLocked} onPress={handleCorrect} />
          <AppButton label="Pular" icon="play-skip-forward-outline" variant="secondary" disabled={state.actionLocked} onPress={handleSkip} />
        </View>
        <View style={styles.scoreGrid}>
          <ScorePill label="Turno" value={state.turnScore} />
          <ScorePill label="Usadas" value={state.usedTermIds.length} />
        </View>
      </View>
    );
  }

  function renderSummary() {
    const nextIndex = (state.activeParticipantIndex + 1) % state.participants.length;
    const nextName = state.participants[nextIndex]?.name;
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader title="Resumo do turno" eyebrow={activeParticipant?.name} />
        <View style={styles.scoreGrid}>
          <ScorePill label="Pontos no turno" value={state.turnScore} />
          <ScorePill label="Acertos" value={state.turnItems.filter((item) => item.result === 'correct').length} />
          <ScorePill label="Pulos" value={state.turnItems.filter((item) => item.result === 'skipped').length} />
        </View>
        <Card style={styles.stack}>
          {state.turnItems.length === 0 ? (
            <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>Nenhuma palavra registrada neste turno.</Text>
          ) : (
            state.turnItems.map((item) => (
              <View key={item.term.id} style={styles.resultRow}>
                <Ionicons name={item.result === 'correct' ? 'checkmark-circle-outline' : 'play-skip-forward-outline'} size={20} color={item.result === 'correct' ? theme.colors.accent : theme.colors.muted} />
                <Text style={[styles.resultText, { color: theme.colors.text }]}>{item.term.term}</Text>
                <Text style={[styles.caption, { color: theme.colors.muted }]}>{item.result === 'correct' ? `+${item.term.points}` : '0'}</Text>
              </View>
            ))
          )}
        </Card>
        <View style={styles.scoreGrid}>
          {state.participants.map((participant) => (
            <ScorePill key={participant.id} label={participant.name} value={participant.score} />
          ))}
        </View>
        <AppButton label={nextName ? `Próximo: ${nextName}` : 'Próximo turno'} icon="arrow-forward-outline" onPress={() => dispatch({ type: 'NEXT_TURN' })} />
      </ScrollView>
    );
  }

  function renderGameOver() {
    const tied = state.winnerIds.length > 1;
    const winners = state.participants.filter((participant) => state.winnerIds.includes(participant.id)).map((participant) => participant.name).join(', ');
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader title={tied ? 'Empate técnico' : 'Fim de jogo'} eyebrow="Resultado final" />
        <Card style={styles.centerCard}>
          <Ionicons name={tied ? 'git-compare-outline' : 'trophy-outline'} size={34} color={theme.colors.accent} />
          <Text style={[styles.bigTitle, { color: theme.colors.text }]}>{tied ? 'Sem campeão único' : winners}</Text>
          <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>
            {tied ? `Empate entre ${winners}. Use jogar novamente para um desempate com a mesma configuração.` : 'Campeão da partida.'}
          </Text>
        </Card>
        <Card style={styles.stack}>
          {state.ranking.map((item) => (
            <View key={item.participant.id} style={styles.resultRow}>
              <Text style={[styles.place, { color: theme.colors.accent }]}>{item.place}º</Text>
              <Text style={[styles.resultText, { color: theme.colors.text }]}>{item.participant.name}</Text>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>{item.participant.score}</Text>
            </View>
          ))}
        </Card>
        <View style={styles.stack}>
          <AppButton label="Jogar novamente" icon="refresh-outline" onPress={() => dispatch({ type: 'PLAY_AGAIN' })} />
          <AppButton label="Criar nova partida" icon="options-outline" variant="secondary" onPress={() => dispatch({ type: 'NEW_GAME' })} />
          <AppButton label="Voltar aos jogos" icon="grid-outline" variant="secondary" onPress={() => router.replace('/modes')} />
        </View>
      </ScrollView>
    );
  }

  if (state.phase === 'IDLE') return <AppScreen><SafeAreaView style={styles.safe}>{renderIntro()}</SafeAreaView></AppScreen>;
  if (state.phase === 'SETUP_MODE') return <AppScreen><SafeAreaView style={styles.safe}>{renderModeSetup()}</SafeAreaView></AppScreen>;
  if (state.phase === 'SETUP_PLAYERS') return <AppScreen><SafeAreaView style={styles.safe}>{renderNameEditor()}</SafeAreaView></AppScreen>;
  if (state.phase === 'SETUP_CATEGORIES') return <AppScreen><SafeAreaView style={styles.safe}>{renderCategories()}</SafeAreaView></AppScreen>;
  if (state.phase === 'SETUP_RULES') return <AppScreen><SafeAreaView style={styles.safe}>{renderRules()}</SafeAreaView></AppScreen>;
  if (state.phase === 'ROUND_READY') return <AppScreen><SafeAreaView style={styles.safe}>{renderRoundReady()}</SafeAreaView></AppScreen>;
  if (state.phase === 'ACTIVE_ROUND') return <AppScreen><SafeAreaView style={styles.safe}>{renderActiveRound()}</SafeAreaView></AppScreen>;
  if (state.phase === 'ROUND_SUMMARY') return <AppScreen><SafeAreaView style={styles.safe}>{renderSummary()}</SafeAreaView></AppScreen>;
  return <AppScreen><SafeAreaView style={styles.safe}>{renderGameOver()}</SafeAreaView></AppScreen>;
}

function NumberSetting({ label, value, setValue, suffix, options }: { label: string; value: string; setValue: (value: string) => void; suffix?: string; options: number[] }) {
  const theme = useAppTheme();
  return (
    <View style={styles.numberSetting}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput value={value} onChangeText={setValue} keyboardType="number-pad" style={[styles.numberInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]} />
        {suffix ? <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>{suffix}</Text> : null}
      </View>
      <View style={styles.wrap}>
        {options.map((option) => (
          <Chip key={option} label={`${option}${suffix ? ` ${suffix}` : ''}`} selected={value === String(option)} onPress={() => setValue(String(option))} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  stack: { gap: spacing.sm },
  toolbar: { flexDirection: 'row', gap: spacing.sm },
  toolbarButton: { flex: 1 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  ruleNumber: { width: 28, height: 28, borderRadius: 10, textAlign: 'center', lineHeight: 28, overflow: 'hidden', fontWeight: '900' },
  ruleText: { ...typography.body, flex: 1 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionTitle: { ...typography.h3 },
  caption: { ...typography.caption },
  categoryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  categoryIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { ...typography.body, flex: 1, minHeight: 44, padding: 0 },
  numberSetting: { gap: spacing.sm },
  sectionTitle: { ...typography.h3 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  numberInput: { minWidth: 96, minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: spacing.md, fontSize: 18, fontWeight: '900' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  error: { ...typography.caption, fontWeight: '900', textAlign: 'center' },
  centerCard: { alignItems: 'center', gap: spacing.sm },
  bigTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: 0 },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  activeRound: { flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'space-between' },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  wordCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, minHeight: 260 },
  word: { fontSize: 44, fontWeight: '900', textAlign: 'center', letterSpacing: 0 },
  actions: { gap: spacing.sm },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 36 },
  resultText: { ...typography.body, flex: 1, fontWeight: '800' },
  place: { width: 34, fontSize: 18, fontWeight: '900' },
});
