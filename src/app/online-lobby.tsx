import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAnonymousIdentity } from '../config/firebase';
import { AppButton, AppHeader, AppScreen, Card, Chip, EmptyState } from '../components/ui';
import { getGameById, getOnlineGames, normalizeGameId } from '../games/registry';
import { getOnlineRoomService } from '../online/firebase';
import type { OnlineGameId, OnlineRoomSnapshot } from '../online/types';
import { spacing, typography, useAppTheme } from '../styles/theme';

export default function OnlineLobbyScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const roomId = String(params.roomId ?? '');
  const code = String(params.code ?? '');
  const playerName = String(params.playerName ?? '');
  const [snapshot, setSnapshot] = useState<OnlineRoomSnapshot>();
  const [uid, setUid] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const service = useMemo(() => getOnlineRoomService(), []);
  const onlineGames = useMemo(() => getOnlineGames(), []);

  const currentParticipant = snapshot?.participants.find((participant) => participant.uid === uid);
  const isHost = snapshot?.room.hostUid === uid;
  const selectedGameId = normalizeGameId(String(snapshot?.room.selectedGameId ?? 'nota'));
  const selectedGame = getGameById(selectedGameId);
  const activeCount = snapshot?.participants.filter((participant) => participant.status !== 'left').length ?? 0;
  const canStart = activeCount >= selectedGame.minPlayers && (!selectedGame.maxPlayers || activeCount <= selectedGame.maxPlayers);

  useEffect(() => {
    void getAnonymousIdentity().then((identity) => {
      setUid(identity.uid);
      if (roomId && playerName) void service.reconnect(roomId, playerName);
    });
  }, [playerName, roomId, service]);

  useEffect(() => {
    if (!roomId) return undefined;
    const unsubscribe = service.watchRoom(roomId, setSnapshot);
    const heartbeat = setInterval(() => {
      void service.heartbeat(roomId);
    }, 15000);
    return () => {
      unsubscribe();
      clearInterval(heartbeat);
    };
  }, [roomId, service]);

  useEffect(() => {
    if (snapshot?.room.status === 'playing' || snapshot?.room.status === 'finished') {
      router.replace({ pathname: '/online-game', params: { roomId, playerName } });
    }
    if (snapshot?.room.status === 'ended') setMessage('Esta sala foi encerrada.');
  }, [playerName, roomId, snapshot?.room.status]);

  async function selectGame(gameId: OnlineGameId) {
    setBusy(true);
    setMessage('');
    const result = await service.selectGame(roomId, gameId);
    if (!result.ok) setMessage(result.message);
    setBusy(false);
  }

  async function startGame() {
    setBusy(true);
    setMessage('');
    const result = await service.startGame(roomId, selectedGameId, selectedGameId === 'nota' ? { roundsCount: 3 } : undefined);
    if (!result.ok) setMessage(result.message);
    setBusy(false);
  }

  async function leaveRoom() {
    await service.leaveRoom(roomId);
    router.replace('/online');
  }

  async function endRoom() {
    setBusy(true);
    const result = await service.endRoom(roomId);
    if (!result.ok) setMessage(result.message);
    setBusy(false);
  }

  if (!snapshot) {
    return (
      <AppScreen>
        <SafeAreaView style={styles.safe}>
          <EmptyState title="Conectando ao lobby" description="Buscando participantes e estado da sala em tempo real." icon="sync-outline" />
        </SafeAreaView>
      </AppScreen>
    );
  }

  return (
    <AppScreen variant="soft">
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <AppHeader title="Lobby online" eyebrow={`Codigo ${code || snapshot.room.code}`} icon="globe-outline" onBack={leaveRoom} description="Compartilhe o codigo com quem vai jogar em outro celular." />

          <Card style={styles.codeCard}>
            <Text style={[styles.code, { color: theme.colors.text }]}>{snapshot.room.code}</Text>
            <Chip label={currentParticipant?.isHost ? 'Voce e anfitriao' : 'Aguardando anfitriao'} selected={currentParticipant?.isHost} />
          </Card>

          <Card style={styles.stack}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Participantes</Text>
            {snapshot.participants.map((participant) => (
              <View key={participant.uid} style={styles.participantRow}>
                <Ionicons name={participant.isHost ? 'star-outline' : 'person-outline'} size={20} color={participant.isHost ? theme.colors.accent : theme.colors.muted} />
                <Text style={[styles.participantName, { color: theme.colors.text }]}>{participant.name}</Text>
                <Chip label={participant.isHost ? 'Anfitriao' : participant.status} selected={participant.status === 'online'} />
              </View>
            ))}
          </Card>

          <Card style={styles.stack}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Jogo online</Text>
            {onlineGames.map((game) => (
              <Pressable key={game.id} disabled={!isHost || busy} onPress={() => selectGame(game.id)}>
                <View style={[styles.gameRow, selectedGameId === game.id && { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentSoft }]}>
                  <Ionicons name={game.icon} size={22} color={theme.colors.accent} />
                  <View style={styles.flex}>
                    <Text style={[styles.participantName, { color: theme.colors.text }]}>{game.name}</Text>
                    <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>{game.description}</Text>
                  </View>
                  <Chip label={`Online v${game.onlineProtocolVersion ?? 1}`} selected={selectedGameId === game.id} />
                </View>
              </Pressable>
            ))}
          </Card>

          {message ? <Text style={[styles.error, { color: theme.colors.danger }]}>{message}</Text> : null}

          {isHost ? (
            <>
              <AppButton label={`Iniciar ${selectedGame.shortName}`} icon="play-outline" disabled={busy || !canStart} onPress={startGame} />
              {!canStart ? <Text style={[styles.error, { color: theme.colors.mutedStrong }]}>{selectedGame.name} precisa de {selectedGame.minPlayers} jogador(es).</Text> : null}
              <AppButton label="Encerrar sala" icon="close-circle-outline" variant="danger" disabled={busy} onPress={endRoom} />
            </>
          ) : (
            <EmptyState title="Aguardando inicio" description="O anfitriao escolhera o jogo e iniciara a partida." icon="hourglass-outline" />
          )}
          <AppButton label="Sair da sala" icon="exit-outline" variant="secondary" disabled={busy} onPress={leaveRoom} />
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  stack: { gap: spacing.sm },
  codeCard: { alignItems: 'center', gap: spacing.sm },
  code: { fontSize: 42, fontWeight: '900', letterSpacing: 0 },
  sectionTitle: { ...typography.h3 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  participantName: { ...typography.body, flex: 1, fontWeight: '900' },
  gameRow: { minHeight: 74, borderWidth: 1, borderColor: 'transparent', borderRadius: 16, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  caption: { ...typography.caption },
  flex: { flex: 1 },
  error: { ...typography.caption, fontWeight: '900', textAlign: 'center' },
});
