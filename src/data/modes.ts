export type GameMode = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  gradient: readonly [string, string];
  description: string;
  minPlayers: number;
  rules: string[];
};

export const modes: GameMode[] = [
  {
    id: 'contato',
    name: 'Contato',
    emoji: '🧠',
    color: '#FF5C8A',
    gradient: ['#FF5C8A', '#FF9671'],
    description: 'Descubra a palavra secreta usando categorias, pistas e muita sintonia.',
    minPlayers: 3,
    rules: [
      'Um jogador recebe uma palavra secreta e começa revelando letra por letra.',
      'Os outros jogadores tentam pensar em palavras da mesma categoria que combinem com as letras reveladas.',
      'Quando dois jogadores acham que pensaram na mesma resposta, eles gritam “Contato!”.',
      'O jogador da palavra secreta precisa tentar adivinhar antes do contato acontecer.',
      'Nesta fase do app, a tela prepara a partida. A lógica do jogo fica para depois.'
    ]
  },
  {
    id: 'nota',
    name: 'Adivinhe a Nota',
    emoji: '🎯',
    color: '#FFD23F',
    gradient: ['#FFD23F', '#FF9F1C'],
    description: 'Um jogador recebe uma nota de 0 a 10 e o parceiro tenta adivinhar.',
    minPlayers: 4,
    rules: [
      'O jogo é pensado para duplas.',
      'Um jogador recebe uma nota secreta de 0 a 10.',
      'O parceiro tenta descobrir a nota usando exemplos, comparações e perguntas divertidas.',
      'Exemplo: “Esse filme seria mais perto de um 7 ou de um 9?”.',
      'Nesta fase, o app mostra apenas a preparação visual da partida.'
    ]
  },
  {
    id: 'impostor',
    name: 'Impostor',
    emoji: '🕵️',
    color: '#45E0C4',
    gradient: ['#45E0C4', '#0984E3'],
    description: 'Todos sabem a palavra... menos o impostor. Descubram quem está fingindo.',
    minPlayers: 4,
    rules: [
      'Todos os jogadores recebem a mesma palavra secreta, menos um: o impostor.',
      'Cada jogador fala pistas, frases ou comentários sobre a palavra.',
      'Quem sabe a palavra precisa ajudar sem entregar demais.',
      'O impostor tenta fingir que sabe e sobreviver à rodada.',
      'Nesta versão, ainda não existe sorteio real de impostor ou palavra.'
    ]
  },
  {
    id: 'frase',
    name: 'Frase Cortada',
    emoji: '✂️',
    color: '#A66CFF',
    gradient: ['#A66CFF', '#6C5CE7'],
    description: 'Formem frases com uma palavra por vez para ajudar sem revelar diretamente.',
    minPlayers: 3,
    rules: [
      'Todos conhecem uma palavra, exceto um jogador.',
      'Os jogadores que sabem a palavra montam frases em conjunto, falando uma palavra por vez.',
      'A frase deve ajudar o jogador perdido sem revelar diretamente a resposta.',
      'O desafio é ser criativo, engraçado e estratégico.',
      'Por enquanto, esta tela só organiza a preparação visual da partida.'
    ]
  }
];

export function getModeById(id?: string | string[]) {
  const value = Array.isArray(id) ? id[0] : id;
  return modes.find((mode) => mode.id === value) ?? modes[0];
}
