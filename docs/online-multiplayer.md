# GroupGames Online Multiplayer

Este guia cobre a configuracao manual e a arquitetura do multiplayer online com Firebase, Expo SDK 54, Expo Router e EAS Update preview.

## Arquitetura

- `src/games/registry.ts` e a fonte central de metadados: suporte local/online, rotas, limites e versao de protocolo.
- `src/games/online/types.ts` define o contrato `OnlineGameAdapter`.
- `src/games/online/registry.ts` registra os adaptadores online.
- `src/online/firebase/roomService.ts` cuida de salas, participantes, reconexao, actions, estado publico e estado privado por jogador.
- `rooms/{roomId}.gameState` guarda apenas o envelope publico da partida.
- `rooms/{roomId}/privateStates/{uid}` guarda informacoes privadas do jogador, como palavra, papel ou nota.
- `rooms/{roomId}/actions/{actionId}` registra actions processadas para idempotencia.

Para adicionar um jogo novo:

1. Crie ou isole as regras locais do jogo.
2. Implemente um adaptador online em `src/games/<jogo>/onlineAdapter.ts`.
3. Registre o adaptador em `src/games/online/registry.ts`.
4. Registre metadados em `src/games/registry.ts`.
5. Adicione apenas a UI especifica em `src/app/online-game.tsx` ou extraia um componente dedicado.

## Firebase

1. Crie um projeto no Firebase Console.
2. Ative Authentication > Sign-in method > Anonymous.
3. Crie o Cloud Firestore em modo production.
4. Publique `firestore.rules`.
5. Publique os indices de `firestore.indexes.json` se o console solicitar.

O projeto usa Cloud Firestore. Nao ha Realtime Database nesta base.

## Variaveis publicas

Configure no ambiente local e no EAS preview:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

No EAS:

```bash
eas env:create --environment preview --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..."
```

Repita para todas as variaveis acima. Elas sao publicas do app cliente; nao use chaves administrativas.

## GitHub Secrets

Crie estes secrets no repositorio:

- `EXPO_TOKEN`
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

O workflow `.github/workflows/eas-update-preview.yml` executa typecheck, testes, validacao do banco de palavras e `eas update --channel preview`.

## Teste local

```bash
npm install
npm run typecheck
npm test
npm run validate:words
npm run doctor
npm start
```

Para Web:

```bash
npm run web
```

## Teste com dois celulares

1. Abra o mesmo build preview nos dois celulares.
2. Confira se o build recebeu as variaveis `EXPO_PUBLIC_FIREBASE_*`.
3. Celular A: Jogar online > informe nome > Criar sala online.
4. Celular B: Jogar online > informe outro nome > digite o codigo.
5. Confirme que o lobby mostra ambos em tempo real e quem e o anfitriao.
6. Escolha um jogo online no lobby.
7. Inicie a partida e confira se estado publico, dados privados, turnos e placar sincronizam.
8. Feche e abra o app para testar reconexao pela ultima sala.
9. Encerre a sala e confirme que os clientes recebem o status.

## Estado dos jogos online

- Adivinhe a Nota: online completo, com notas privadas por dono da nota.
- Mimica: online completo dentro das regras locais atuais, com palavra privada para quem esta na vez.
- Impostor: online completo dentro das regras locais atuais, com papel/palavra privados e voto unico por jogador.
- Contato: online completo dentro das regras locais simplificadas, com palavra privada para o mestre.
- Frase Cortada: online completo dentro das regras locais atuais, com palavra privada para quem da dicas.

## Publicacao por EAS Update

```bash
eas update --channel preview --message "Multiplayer online modular"
```

Nao publique sem conferir as regras do Firestore e as variaveis do ambiente preview.

## Limitacoes

- Os testes usam adaptadores/mocks e nao acessam o banco de producao.
- Esta etapa ainda nao foi validada manualmente com dois celulares neste ambiente.
- Sem Cloud Functions, a validacao autoritativa total contra clientes modificados e limitada. As regras protegem leitura privada por jogador, mas a aplicacao de actions ainda acontece no cliente por transacao. Para blindagem forte, mova `sendGameAction` para Cloud Functions.
- Presenca usa `lastSeenAt`/heartbeat leve; nao ha limpeza automatica de salas antigas.
