import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAnonymousIdentity } from '../config/firebase';
import { AppButton, AppHeader, AppScreen, Card, Chip, EmptyState, ScorePill, TimerBadge } from '../components/ui';
import { createActionId } from '../games/online/types';
import { normalizeGameId } from '../games/registry';
import { getOnlineRoomService } from '../online/firebase';
import type { OnlineGameAction, OnlineRoomSnapshot } from '../online/types';
import { spacing, typography, useAppTheme } from '../styles/theme';

type NoteState = {
  stage: 'reveal' | 'guess' | 'roundResult' | 'gameOver';
  round: number;
  roundsCount: number;
  pairs: Array<[string, string]>;
  revealedByPair: Record<number, boolean>;
  guesses: Record<number, number>;
  results: Array<{ pairs: Array<{ pairIndex: number; note: number; guess: number; correct: boolean }> }>;
  scores: Record<string, number>;
  winnerUids: string[];
};

type NotePrivate = { notesByPair?: Record<number, number> };

type CharadesState = {
  stage: 'ROUND_READY' | 'ACTIVE_ROUND' | 'ROUND_SUMMARY' | 'GAME_OVER';
  participants: Array<{ uid: string; name: string; score: number }>;
  activeParticipantIndex: number;
  currentRound: number;
  timeLeft: number;
  turnItems: Array<{ term: string; points: number; result: 'correct' | 'skipped' }>;
  turnScore: number;
  winnerUids: string[];
  message?: string;
};

type CharadesPrivate = { currentTerm?: { term: string; points: number; difficulty: string } };

type ImpostorState = {
  stage: 'settings' | 'reveal' | 'discussion' | 'vote' | 'result';
  players: Array<{ uid: string; name: string }>;
  hintEnabled: boolean;
  currentRevealIndex: number;
  votesByVoter: Record<string, string>;
  result?: { impostorName: string; word: string; voteLeaders: string[]; crowdFoundImpostor: boolean };
};

type ImpostorPrivate = { role?: 'impostor' | 'civilian'; word?: string; hint?: string };

type ContactState = {
  stage: 'selectMaster' | 'control' | 'finished';
  players: Array<{ uid: string; name: string }>;
  masterUid?: string;
  maskedWord: string;
  answer?: string;
};

type ContactPrivate = { secretWord?: string };

type PhraseState = {
  stage: 'setup' | 'playing' | 'finished';
  players: Array<{ uid: string; name: string }>;
  guesserUid?: string;
  clockOwnerUid?: string;
  timeLimit: number;
  timeLeft: number;
  score: number;
  correctWords: string[];
};

type PhrasePrivate = { currentWord?: { category: string; word: string } };

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function playerName(snapshot: OnlineRoomSnapshot | undefined, uid: string) {
  return snapshot?.participants.find((participant) => participant.uid === uid)?.name ?? 'Jogador';
}

export default function OnlineGameScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const roomId = String(params.roomId ?? '');
  const playerNameParam = String(params.playerName ?? '');
  const [uid, setUid] = useState('');
  const [snapshot, setSnapshot] = useState<OnlineRoomSnapshot>();
  const [privateState, setPrivateState] = useState<unknown>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const service = useMemo(() => getOnlineRoomService(), []);
  const isHost = snapshot?.room.hostUid === uid;
  const gameId = normalizeGameId(String(snapshot?.room.gameState?.gameId ?? snapshot?.room.selectedGameId ?? 'nota'));
  const sequence = snapshot?.room.gameState?.sequence ?? 0;
  const publicState = snapshot?.room.gameState?.publicState;

  useEffect(() => {
    void getAnonymousIdentity().then((identity) => setUid(identity.uid));
  }, []);

  useEffect(() => {
    if (!roomId) return undefined;
    return service.watchRoom(roomId, setSnapshot);
  }, [roomId, service]);

  useEffect(() => {
    if (!roomId || !uid) return undefined;
    return service.watchPrivateState(roomId, uid, setPrivateState);
  }, [roomId, service, uid]);

  async function send(type: string, payload?: Record<string, unknown>) {
    if (!uid || busy) return;
    setBusy(true);
    setMessage('');
    const action: OnlineGameAction = { id: createActionId(uid, type), uid, type, payload, expectedSequence: sequence };
    const result = await service.sendGameAction(roomId, action);
    if (!result.ok) setMessage(result.message);
    setBusy(false);
  }

  useEffect(() => {
    if (!uid || !snapshot?.room.gameState || busy) return undefined;
    const currentGameId = normalizeGameId(String(snapshot.room.gameState.gameId));
    if (currentGameId === 'mimica') {
      const state = snapshot.room.gameState.publicState as CharadesState;
      const activeUid = state.participants[state.activeParticipantIndex]?.uid;
      if (state.stage !== 'ACTIVE_ROUND' || activeUid !== uid || state.timeLeft <= 0) return undefined;
      const timer = setInterval(() => {
        void send('TICK');
      }, 1000);
      return () => clearInterval(timer);
    }
    if (currentGameId === 'frase') {
      const state = snapshot.room.gameState.publicState as PhraseState;
      if (state.stage !== 'playing' || state.clockOwnerUid !== uid || state.timeLeft <= 0) return undefined;
      const timer = setInterval(() => {
        void send('TICK');
      }, 1000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [busy, snapshot?.room.gameState, uid]);

  if (!snapshot || !snapshot.room.gameState) {
    return (
      <AppScreen>
        <SafeAreaView style={styles.safe}>
          <EmptyState title="Sincronizando partida" description="Buscando estado compartilhado e dados privados." icon="sync-outline" />
        </SafeAreaView>
      </AppScreen>
    );
  }

  function shell(title: string, children: ReactNode) {
    return (
      <AppScreen variant="soft">
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.content}>
            <AppHeader title={title} eyebrow="Online" icon="globe-outline" onBack={() => router.replace({ pathname: '/online-lobby', params: { roomId, playerName: playerNameParam } })} />
            {message ? <Text style={[styles.error, { color: theme.colors.danger }]}>{message}</Text> : null}
            {children}
          </ScrollView>
        </SafeAreaView>
      </AppScreen>
    );
  }

  function renderNote() {
    const state = publicState as NoteState;
    const mine = privateState as NotePrivate | undefined;
    if (state.stage === 'gameOver') {
      return shell('Adivinhe a Nota', (
        <>
          <Card style={styles.center}>
            <Ionicons name="trophy-outline" size={34} color={theme.colors.accent} />
            <Text style={[styles.bigTitle, { color: theme.colors.text }]}>{state.winnerUids.map((winnerUid) => playerName(snapshot, winnerUid)).join(', ')}</Text>
          </Card>
          <ScoreGrid scores={state.scores} snapshot={snapshot} />
        </>
      ));
    }
    if (state.stage === 'reveal') {
      return shell('Notas secretas', (
        <>
          <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>Rodada {state.round} de {state.roundsCount}</Text>
          {state.pairs.map((pair, pairIndex) => {
            const note = mine?.notesByPair?.[pairIndex];
            return (
              <Card key={pairIndex} style={styles.stack}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Dupla {pairIndex + 1}</Text>
                <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>{pair.map((pairUid) => playerName(snapshot, pairUid)).join(' + ')}</Text>
                {note !== undefined && state.revealedByPair[pairIndex] ? <Text style={[styles.secret, { color: theme.colors.text }]}>{note}</Text> : <Text style={[styles.caption, { color: theme.colors.muted }]}>Nota privada</Text>}
                {note !== undefined ? <AppButton label={state.revealedByPair[pairIndex] ? 'Esconder nota' : 'Revelar minha nota'} icon="eye-outline" variant="secondary" disabled={busy} onPress={() => send(state.revealedByPair[pairIndex] ? 'HIDE_NOTE' : 'REVEAL_NOTE', { pairIndex })} /> : null}
              </Card>
            );
          })}
          {isHost ? <AppButton label="Ir para tentativas" icon="arrow-forward-outline" disabled={busy} onPress={() => send('GO_TO_GUESSES')} /> : <EmptyState title="Aguardando anfitriao" description="O anfitriao avanca para os palpites." />}
        </>
      ));
    }
    if (state.stage === 'guess') {
      return shell('Tentativas', (
        <>
          {state.pairs.map((pair, pairIndex) => (
            <Card key={pairIndex} style={styles.stack}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Dupla {pairIndex + 1}</Text>
              <View style={styles.noteGrid}>
                {Array.from({ length: 11 }, (_, note) => (
                  <Pressable key={note} disabled={busy || !pair.includes(uid)} onPress={() => send('SUBMIT_GUESS', { pairIndex, guess: note })} style={[styles.noteButton, { borderColor: state.guesses[pairIndex] === note ? theme.colors.accent : theme.colors.border, backgroundColor: state.guesses[pairIndex] === note ? theme.colors.accentSoft : theme.colors.surfaceStrong }]}>
                    <Text style={[styles.noteText, { color: theme.colors.text }]}>{note}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          ))}
          {isHost ? <AppButton label="Ver resultado" icon="checkmark-done-outline" disabled={busy} onPress={() => send('FINISH_ROUND')} /> : null}
        </>
      ));
    }
    return shell('Resultado da rodada', (
      <>
        {(state.results[state.results.length - 1]?.pairs ?? []).map((result) => (
          <Card key={result.pairIndex} style={styles.row}>
            <Ionicons name={result.correct ? 'checkmark-circle-outline' : 'close-circle-outline'} size={22} color={result.correct ? theme.colors.accent : theme.colors.danger} />
            <Text style={[styles.body, { color: theme.colors.text }]}>Dupla {result.pairIndex + 1}: nota {result.note}, palpite {result.guess}</Text>
          </Card>
        ))}
        <ScoreGrid scores={state.scores} snapshot={snapshot} />
        {isHost ? <AppButton label={state.round >= state.roundsCount ? 'Finalizar partida' : 'Proxima rodada'} icon="arrow-forward-outline" disabled={busy} onPress={() => send('NEXT_ROUND')} /> : null}
      </>
    ));
  }

  function renderCharades() {
    const state = publicState as CharadesState;
    const mine = privateState as CharadesPrivate | undefined;
    const active = state.participants[state.activeParticipantIndex];
    const isActive = active?.uid === uid;
    return shell('Mimica', (
      <>
        <Card style={styles.center}>
          <Text style={[styles.caption, { color: theme.colors.muted }]}>Vez de</Text>
          <Text style={[styles.bigTitle, { color: theme.colors.text }]}>{active?.name}</Text>
          {state.stage === 'ACTIVE_ROUND' ? <TimerBadge seconds={state.timeLeft} urgent={state.timeLeft <= 10} /> : null}
        </Card>
        {state.stage === 'ROUND_READY' && isActive ? <AppButton label="Comecar turno" icon="timer-outline" disabled={busy} onPress={() => send('START_TURN')} /> : null}
        {state.stage === 'ACTIVE_ROUND' && isActive ? (
          <>
            <Card style={styles.center}>
              <Text style={[styles.secret, { color: theme.colors.text }]}>{mine?.currentTerm?.term ?? 'Carregando palavra'}</Text>
              <Chip label={`${mine?.currentTerm?.points ?? 0} pts`} selected />
            </Card>
            <AppButton label="Acertou" icon="checkmark-outline" disabled={busy} onPress={() => send('CORRECT')} />
            <AppButton label="Pular" icon="play-skip-forward-outline" variant="secondary" disabled={busy} onPress={() => send('SKIP')} />
            <AppButton label="Encerrar turno" icon="stop-outline" variant="secondary" disabled={busy} onPress={() => send('END_TURN')} />
          </>
        ) : null}
        {state.stage === 'ROUND_SUMMARY' ? (
          <>
            <Card style={styles.stack}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Resumo do turno: {state.turnScore} pts</Text>
              {state.turnItems.map((item) => <Text key={`${item.term}-${item.result}`} style={[styles.caption, { color: theme.colors.mutedStrong }]}>{item.result === 'correct' ? '+' : '0'} {item.term}</Text>)}
            </Card>
            {isActive ? <AppButton label="Proximo turno" icon="arrow-forward-outline" disabled={busy} onPress={() => send('NEXT_TURN')} /> : null}
          </>
        ) : null}
        {state.stage === 'GAME_OVER' ? <Card style={styles.center}><Text style={[styles.bigTitle, { color: theme.colors.text }]}>Fim de jogo</Text></Card> : null}
        <View style={styles.scoreGrid}>{state.participants.map((participant) => <ScorePill key={participant.uid} label={participant.name} value={participant.score} />)}</View>
      </>
    ));
  }

  function renderImpostor() {
    const state = publicState as ImpostorState;
    const mine = privateState as ImpostorPrivate | undefined;
    return shell('Impostor', (
      <>
        {state.stage === 'settings' && isHost ? (
          <>
            <AppButton label={state.hintEnabled ? 'Dica ao impostor: ativa' : 'Dica ao impostor: inativa'} icon="bulb-outline" variant="secondary" disabled={busy} onPress={() => send('SET_HINT', { enabled: !state.hintEnabled })} />
            <AppButton label="Comecar revelacao" icon="eye-outline" disabled={busy} onPress={() => send('START_REVEAL')} />
          </>
        ) : null}
        {state.stage === 'reveal' ? (
          <Card style={styles.center}>
            <Text style={[styles.caption, { color: theme.colors.muted }]}>Revelacao</Text>
            <Text style={[styles.bigTitle, { color: theme.colors.text }]}>{state.players[state.currentRevealIndex]?.name}</Text>
            {state.players[state.currentRevealIndex]?.uid === uid ? (
              <>
                <Text style={[styles.secret, { color: theme.colors.text }]}>{mine?.role === 'impostor' ? 'Voce e o impostor' : mine?.word}</Text>
                {mine?.role === 'impostor' && state.hintEnabled ? <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>{mine.hint}</Text> : null}
                <AppButton label="Ja vi meu papel" icon="checkmark-outline" disabled={busy} onPress={() => send('MARK_REVEALED')} />
              </>
            ) : <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>Aguardando este jogador ver o papel.</Text>}
          </Card>
        ) : null}
        {state.stage === 'discussion' ? <><EmptyState title="Discussao" description="Conversem e observem quem parece estar fingindo." />{isHost ? <AppButton label="Ir para votacao" icon="checkbox-outline" disabled={busy} onPress={() => send('START_VOTE')} /> : null}</> : null}
        {state.stage === 'vote' ? (
          <>
            {state.players.map((player) => <AppButton key={player.uid} label={player.name} icon="person-outline" variant="secondary" disabled={busy || Boolean(state.votesByVoter[uid])} onPress={() => send('CAST_VOTE', { targetUid: player.uid })} />)}
            {isHost ? <AppButton label="Revelar resultado" icon="eye-outline" disabled={busy} onPress={() => send('REVEAL_RESULT')} /> : null}
          </>
        ) : null}
        {state.stage === 'result' && state.result ? <Card style={styles.center}><Text style={[styles.bigTitle, { color: theme.colors.text }]}>{state.result.crowdFoundImpostor ? 'Grupo acertou' : 'Impostor escapou'}</Text><Text style={[styles.body, { color: theme.colors.text }]}>Impostor: {state.result.impostorName}</Text><Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>Palavra: {state.result.word}</Text></Card> : null}
      </>
    ));
  }

  function renderContact() {
    const state = publicState as ContactState;
    const mine = privateState as ContactPrivate | undefined;
    const isMaster = state.masterUid === uid;
    return shell('Contato', (
      <>
        {state.stage === 'selectMaster' && isHost ? state.players.map((player) => <AppButton key={player.uid} label={player.name} icon="person-outline" variant="secondary" disabled={busy} onPress={() => send('CHOOSE_MASTER', { masterUid: player.uid })} />) : null}
        {state.stage === 'control' ? (
          <Card style={styles.center}>
            <Text style={[styles.caption, { color: theme.colors.muted }]}>Mestre: {playerName(snapshot, state.masterUid ?? '')}</Text>
            {isMaster ? <Text style={[styles.secret, { color: theme.colors.text }]}>{mine?.secretWord}</Text> : <Text style={[styles.secret, { color: theme.colors.text }]}>{state.maskedWord}</Text>}
            {(isMaster || isHost) ? <><AppButton label="Revelar proxima letra" icon="add-outline" disabled={busy} onPress={() => send('REVEAL_NEXT')} /><AppButton label="Mostrar resposta" icon="eye-outline" variant="secondary" disabled={busy} onPress={() => send('SHOW_ANSWER')} /><AppButton label="Nova palavra" icon="refresh-outline" variant="secondary" disabled={busy} onPress={() => send('NEW_WORD')} /></> : null}
          </Card>
        ) : null}
        {state.stage === 'finished' ? <Card style={styles.center}><Text style={[styles.bigTitle, { color: theme.colors.text }]}>{state.answer}</Text></Card> : null}
      </>
    ));
  }

  function renderPhrase() {
    const state = publicState as PhraseState;
    const mine = privateState as PhrasePrivate | undefined;
    const isGuesser = state.guesserUid === uid;
    return shell('Frase Cortada', (
      <>
        {state.stage === 'setup' && isHost ? (
          <>
            {state.players.map((player) => <AppButton key={player.uid} label={`Adivinhador: ${player.name}`} icon="person-outline" variant="secondary" disabled={busy} onPress={() => send('SET_GUESSER', { guesserUid: player.uid })} />)}
            {[60, 120, 180].map((timeLimit) => <AppButton key={timeLimit} label={`${timeLimit / 60} min`} icon="timer-outline" variant="secondary" disabled={busy} onPress={() => send('SET_TIME', { timeLimit })} />)}
            <AppButton label="Comecar" icon="play-outline" disabled={busy || !state.guesserUid} onPress={() => send('START')} />
          </>
        ) : null}
        {state.stage === 'playing' ? (
          <>
            <Card style={styles.center}>
              <TimerBadge seconds={state.timeLeft} urgent={state.timeLeft <= 10} />
              <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>Adivinhador: {playerName(snapshot, state.guesserUid ?? '')}</Text>
              {isGuesser ? <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>Aguarde as dicas dos outros jogadores.</Text> : <><Text style={[styles.caption, { color: theme.colors.muted }]}>{mine?.currentWord?.category}</Text><Text style={[styles.secret, { color: theme.colors.text }]}>{mine?.currentWord?.word}</Text></>}
            </Card>
            {!isGuesser ? <><AppButton label="Acertou" icon="checkmark-outline" disabled={busy} onPress={() => send('CORRECT')} /><AppButton label="Finalizar" icon="stop-outline" variant="secondary" disabled={busy} onPress={() => send('FINISH')} /></> : null}
          </>
        ) : null}
        <ScorePill label="Acertos" value={state.score} />
        {state.stage === 'finished' ? <Card style={styles.stack}>{state.correctWords.map((word) => <Text key={word} style={[styles.body, { color: theme.colors.text }]}>{word}</Text>)}</Card> : null}
      </>
    ));
  }

  if (gameId === 'mimica') return renderCharades();
  if (gameId === 'impostor') return renderImpostor();
  if (gameId === 'contato') return renderContact();
  if (gameId === 'frase') return renderPhrase();
  return renderNote();
}

function ScoreGrid({ scores, snapshot }: { scores: Record<string, number>; snapshot?: OnlineRoomSnapshot }) {
  return (
    <View style={styles.scoreGrid}>
      {Object.entries(scores).map(([uid, score]) => <ScorePill key={uid} label={playerName(snapshot, uid)} value={score} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  stack: { gap: spacing.sm },
  center: { alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.h3 },
  caption: { ...typography.caption },
  body: { ...typography.body, fontWeight: '800' },
  bigTitle: { fontSize: 31, fontWeight: '900', textAlign: 'center', letterSpacing: 0 },
  secret: { fontSize: 36, fontWeight: '900', textAlign: 'center', letterSpacing: 0 },
  error: { ...typography.caption, fontWeight: '900', textAlign: 'center' },
  noteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  noteButton: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  noteText: { fontSize: 18, fontWeight: '900' },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
