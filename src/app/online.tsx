import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { isFirebaseConfigured } from '../config/firebase';
import { AppButton, AppHeader, AppScreen, Card, Chip, EmptyState } from '../components/ui';
import { getOnlineRoomService } from '../online/firebase';
import { getLastOnlineSession } from '../online/localSession';
import { normalizeRoomCode } from '../online/model/roomRules';
import type { LastOnlineSession } from '../online/types';
import { spacing, typography, useAppTheme } from '../styles/theme';

export default function OnlineHomeScreen() {
  const theme = useAppTheme();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [lastSession, setLastSession] = useState<LastOnlineSession>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const configured = isFirebaseConfigured();

  const normalizedCode = useMemo(() => normalizeRoomCode(roomCode), [roomCode]);

  useEffect(() => {
    void getLastOnlineSession().then((session) => {
      if (!session?.roomId) return;
      setLastSession(session);
      setPlayerName(session.playerName);
    });
  }, []);

  async function createRoom() {
    if (!configured) {
      setMessage('Firebase ainda não está configurado neste build.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const service = getOnlineRoomService();
      const result = await service.createRoom(playerName);
      router.replace({ pathname: '/online-lobby', params: { roomId: result.roomId, code: result.code, playerName } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível criar a sala.');
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom() {
    if (!configured) {
      setMessage('Firebase ainda não está configurado neste build.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const service = getOnlineRoomService();
      const result = await service.joinRoom(normalizedCode, playerName);
      if ('ok' in result) {
        if (!result.ok) {
          setMessage(result.message);
        }
        return;
      }
      router.replace({ pathname: '/online-lobby', params: { roomId: result.roomId, code: result.code, playerName } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível entrar na sala.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen variant="soft">
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content}>
            <AppHeader title="Jogar online" eyebrow="Multiplayer" icon="globe-outline" onBack={() => router.back()} description="Crie uma sala pela internet ou entre usando um código compartilhado." />

            {!configured ? (
              <EmptyState title="Configuração pendente" description="Defina as variáveis públicas do Firebase no EAS ou no ambiente local para ativar o multiplayer." icon="construct-outline" />
            ) : null}

            <Card style={styles.stack}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Seu nome</Text>
              <TextInput value={playerName} onChangeText={setPlayerName} placeholder="Ex.: Samuel" placeholderTextColor={theme.colors.muted} style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]} />
            </Card>

            <Card style={styles.stack}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Criar sala</Text>
              <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>Você será o anfitrião e poderá escolher o jogo online.</Text>
              <AppButton label={loading ? 'Aguarde' : 'Criar sala online'} icon="add-circle-outline" disabled={loading || !playerName.trim()} onPress={createRoom} />
            </Card>

            <Card style={styles.stack}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Entrar por código</Text>
              <TextInput value={roomCode} onChangeText={setRoomCode} autoCapitalize="characters" placeholder="ABC234" placeholderTextColor={theme.colors.muted} style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong }]} />
              <AppButton label="Entrar na sala" icon="log-in-outline" variant="secondary" disabled={loading || !playerName.trim() || normalizedCode.length < 4} onPress={joinRoom} />
            </Card>

            {lastSession ? (
              <Pressable onPress={() => router.push({ pathname: '/online-lobby', params: { roomId: lastSession.roomId, code: lastSession.code, playerName: lastSession.playerName } })}>
                <Card style={styles.resumeCard}>
                  <Ionicons name="refresh-outline" size={22} color={theme.colors.accent} />
                  <View style={styles.flex}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Reconectar</Text>
                    <Text style={[styles.caption, { color: theme.colors.mutedStrong }]}>Última sala: {lastSession.code}</Text>
                  </View>
                  <Chip label="Continuar" selected />
                </Card>
              </Pressable>
            ) : null}

            {message ? <Text style={[styles.error, { color: theme.colors.danger }]}>{message}</Text> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  stack: { gap: spacing.sm },
  sectionTitle: { ...typography.h3 },
  caption: { ...typography.caption },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: spacing.md, ...typography.body, fontWeight: '800' },
  resumeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  error: { ...typography.caption, fontWeight: '900', textAlign: 'center' },
});
