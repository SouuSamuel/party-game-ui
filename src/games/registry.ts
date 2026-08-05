import type { GameDefinition, GameId } from './types';

export const gameRegistry: GameDefinition[] = [
  {
    id: 'mimica',
    name: 'Mímica',
    shortName: 'Mímica',
    description: 'Times ou jogadores tentam adivinhar termos antes do cronômetro acabar.',
    icon: 'body-outline',
    emoji: '',
    color: '#2563EB',
    gradient: ['#2563EB', '#0891B2'],
    minPlayers: 2,
    maxPlayers: 24,
    setupRoute: '/mimica',
    playRoute: '/mimica',
    onlineRoute: '/online-game',
    status: 'ready',
    supportsLocal: true,
    supportsOnline: true,
    onlineProtocolVersion: 1,
    rules: [
      'Escolha jogar por times ou individualmente.',
      'Selecione categorias, dificuldades, duração, rodadas e meta de pontos.',
      'Durante o turno, quem representa não pode falar nem apontar letras.',
      'Acertos somam 1, 2 ou 3 pontos conforme a dificuldade. Pulos não somam pontos.',
      'A partida termina ao atingir a meta ou ao concluir as rodadas configuradas.'
    ],
    config: {
      teams: true,
      players: true,
      categories: true,
      difficulties: true,
      duration: true,
      scoreTarget: true,
      rounds: true
    }
  },
  {
    id: 'contato',
    name: 'Contato',
    shortName: 'Contato',
    description: 'Descubra a palavra secreta usando categorias, pistas e sintonia entre jogadores.',
    icon: 'chatbubbles-outline',
    emoji: '',
    color: '#DB2777',
    gradient: ['#DB2777', '#F97316'],
    minPlayers: 3,
    setupRoute: '/setup',
    playRoute: '/contato',
    onlineRoute: '/online-game',
    status: 'ready',
    supportsLocal: true,
    supportsOnline: true,
    onlineProtocolVersion: 1,
    rules: [
      'Um jogador recebe uma palavra secreta e começa revelando letra por letra.',
      'Os outros jogadores tentam pensar em palavras da mesma categoria que combinem com as letras reveladas.',
      'Quando dois jogadores acham que pensaram na mesma resposta, eles gritam "Contato!".',
      'O jogador da palavra secreta precisa tentar adivinhar antes do contato acontecer.',
      'Esta versão digital organiza a palavra secreta e o controle das letras.'
    ],
    config: {
      players: true
    }
  },
  {
    id: 'nota',
    name: 'Adivinhe a Nota',
    shortName: 'Nota',
    description: 'Duplas tentam descobrir uma nota secreta de 0 a 10 usando pistas criativas.',
    icon: 'speedometer-outline',
    emoji: '',
    color: '#D97706',
    gradient: ['#D97706', '#FACC15'],
    minPlayers: 4,
    maxPlayers: 22,
    setupRoute: '/setup',
    playRoute: '/adivinhe-nota',
    onlineRoute: '/online-game',
    status: 'ready',
    supportsLocal: true,
    supportsOnline: true,
    onlineProtocolVersion: 1,
    rules: [
      'O jogo é pensado para duplas.',
      'Um jogador recebe uma nota secreta de 0 a 10.',
      'O parceiro tenta descobrir a nota usando exemplos, comparações e perguntas divertidas.',
      'A cada rodada, os papéis dentro da dupla se alternam.',
      'O app registra acertos e mostra um resumo final.'
    ],
    config: {
      players: true,
      rounds: true
    }
  },
  {
    id: 'impostor',
    name: 'Impostor',
    shortName: 'Impostor',
    description: 'Todos sabem a palavra, menos o impostor, que tenta se misturar ao grupo.',
    icon: 'eye-off-outline',
    emoji: '',
    color: '#0891B2',
    gradient: ['#0891B2', '#2563EB'],
    minPlayers: 4,
    setupRoute: '/setup',
    playRoute: '/impostor',
    onlineRoute: '/online-game',
    status: 'ready',
    supportsLocal: true,
    supportsOnline: true,
    onlineProtocolVersion: 1,
    rules: [
      'Todos recebem a mesma palavra secreta, exceto um jogador.',
      'Cada pessoa fala pistas, frases ou comentários sobre a palavra.',
      'Quem sabe a palavra precisa ajudar sem entregar demais.',
      'O impostor tenta fingir que sabe e sobreviver à votação.',
      'No final, o grupo vota e o app revela se acertaram.'
    ],
    config: {
      players: true
    }
  },
  {
    id: 'frase',
    name: 'Frase Cortada',
    shortName: 'Frase',
    description: 'Jogadores montam pistas em frases de uma palavra por vez para ajudar o adivinhador.',
    icon: 'cut-outline',
    emoji: '',
    color: '#7C3AED',
    gradient: ['#7C3AED', '#DB2777'],
    minPlayers: 3,
    setupRoute: '/setup',
    playRoute: '/frase-cortada',
    onlineRoute: '/online-game',
    status: 'ready',
    supportsLocal: true,
    supportsOnline: true,
    onlineProtocolVersion: 1,
    rules: [
      'Todos conhecem uma palavra, exceto quem vai adivinhar.',
      'Os jogadores que sabem a palavra montam frases juntos, uma palavra por vez.',
      'A frase deve ajudar sem revelar diretamente a resposta.',
      'O desafio é ser claro, engraçado e estratégico.',
      'O app controla o tempo, a palavra atual e a pontuação do turno.'
    ],
    config: {
      players: true,
      duration: true
    }
  }
];

export function getGameById(id?: string | string[]) {
  const value = Array.isArray(id) ? id[0] : id;
  return gameRegistry.find((game) => game.id === value) ?? gameRegistry[0];
}

export function getGameRoute(id: GameId) {
  return getGameById(id).playRoute;
}

export function getOnlineGames() {
  return gameRegistry.filter((game) => game.supportsOnline);
}

export function normalizeGameId(id?: string): GameId {
  if (id === 'online-note') return 'nota';
  if (id === 'mimica' || id === 'contato' || id === 'nota' || id === 'impostor' || id === 'frase') return id;
  return 'nota';
}
