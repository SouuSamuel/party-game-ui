import type { CharadesCategory, CharadesDifficulty, CharadesTerm } from './types';

export const CHARADES_CONTENT_VERSION = 1;

export const difficultyPoints: Record<CharadesDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export const difficultyLabels: Record<CharadesDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};

export const charadesCategories: CharadesCategory[] = [
  { id: 'atores-tv', name: 'Atores, atrizes e televisão', icon: 'tv-outline', description: 'Pessoas e programas conhecidos da TV.' },
  { id: 'animais', name: 'Animais', icon: 'paw-outline', description: 'Bichos conhecidos, selvagens e domésticos.' },
  { id: 'bandas', name: 'Bandas e grupos musicais', icon: 'musical-notes-outline', description: 'Bandas brasileiras e internacionais.' },
  { id: 'basquete', name: 'Basquete', icon: 'basketball-outline', description: 'Jogadores, equipes e termos das quadras.' },
  { id: 'cantores', name: 'Cantores e cantoras', icon: 'mic-outline', description: 'Vozes famosas de vários estilos.' },
  { id: 'comidas', name: 'Comidas e bebidas', icon: 'restaurant-outline', description: 'Pratos, doces, bebidas e ingredientes.' },
  { id: 'esportes', name: 'Esportes', icon: 'trophy-outline', description: 'Modalidades e objetos esportivos.' },
  { id: 'famosos', name: 'Famosos e personalidades', icon: 'star-outline', description: 'Personalidades públicas e históricas.' },
  { id: 'filmes', name: 'Filmes', icon: 'film-outline', description: 'Títulos populares do cinema.' },
  { id: 'futebol', name: 'Futebol', icon: 'football-outline', description: 'Termos, posições e momentos do futebol.' },
  { id: 'personagens', name: 'Heróis e personagens', icon: 'sparkles-outline', description: 'Personagens de filmes, jogos e quadrinhos.' },
  { id: 'instrumentos', name: 'Instrumentos musicais', icon: 'radio-outline', description: 'Instrumentos e famílias musicais.' },
  { id: 'jogadores', name: 'Jogadores de futebol', icon: 'person-outline', description: 'Craques brasileiros e internacionais.' },
  { id: 'livros', name: 'Livros', icon: 'book-outline', description: 'Obras conhecidas e autores populares.' },
  { id: 'lutadores', name: 'Lutadores', icon: 'fitness-outline', description: 'Atletas de luta, boxe e artes marciais.' },
  { id: 'musicas', name: 'Músicas', icon: 'headset-outline', description: 'Canções populares de vários estilos.' },
  { id: 'selecoes', name: 'Seleções nacionais', icon: 'flag-outline', description: 'Países e seleções marcantes.' },
  { id: 'series', name: 'Séries', icon: 'albums-outline', description: 'Séries de TV, streaming e animações.' },
  { id: 'times', name: 'Times de futebol', icon: 'shield-outline', description: 'Clubes brasileiros e internacionais.' },
];

const baseTerms: Record<string, string[]> = {
  'atores-tv': ['Fernanda Montenegro', 'Tony Ramos', 'Gloria Pires', 'Taís Araújo', 'Lázaro Ramos', 'Selton Mello', 'Paolla Oliveira', 'Rodrigo Santoro', 'Regina Duarte', 'Silvio Santos', 'Faustão', 'Xuxa', 'Angélica', 'Ana Maria Braga', 'William Bonner', 'Jô Soares', 'Marília Gabriela', 'Tatá Werneck', 'Fábio Porchat', 'Hebe Camargo', 'Viola Davis', 'Meryl Streep', 'Tom Hanks', 'Will Smith', 'Denzel Washington', 'Emma Stone', 'Jennifer Lawrence', 'Leonardo DiCaprio', 'Sandra Bullock', 'Morgan Freeman'],
  animais: ['cachorro', 'gato', 'leão', 'tigre', 'elefante', 'girafa', 'zebra', 'macaco', 'gorila', 'panda', 'coala', 'canguru', 'urso polar', 'urso panda', 'lobo', 'raposa', 'coelho', 'cavalo', 'vaca', 'porco', 'galinha', 'pato', 'águia', 'coruja', 'papagaio', 'pinguim', 'tubarão', 'golfinho', 'baleia', 'jacaré', 'crocodilo', 'cobra', 'camaleão', 'sapo', 'tartaruga'],
  bandas: ['Beatles', 'Rolling Stones', 'Queen', 'U2', 'Coldplay', 'Linkin Park', 'Nirvana', 'Metallica', 'Green Day', 'Foo Fighters', 'Imagine Dragons', 'Maroon 5', 'Backstreet Boys', 'Spice Girls', 'ABBA', 'Bee Gees', 'Legião Urbana', 'Titãs', 'Paralamas do Sucesso', 'Skank', 'Charlie Brown Jr.', 'Jota Quest', 'Roupa Nova', 'Sepultura', 'Racionais MCs'],
  basquete: ['Michael Jordan', 'LeBron James', 'Kobe Bryant', 'Stephen Curry', 'Shaquille ONeal', 'Magic Johnson', 'Larry Bird', 'Kevin Durant', 'Giannis Antetokounmpo', 'Luka Doncic', 'Nikola Jokic', 'Chicago Bulls', 'Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors', 'Miami Heat', 'arremesso de três pontos', 'enterrada', 'toco', 'rebote', 'bandeja', 'ponte aérea'],
  cantores: ['Michael Jackson', 'Madonna', 'Beyoncé', 'Rihanna', 'Adele', 'Taylor Swift', 'Lady Gaga', 'Bruno Mars', 'Elvis Presley', 'Freddie Mercury', 'Elton John', 'Whitney Houston', 'Bob Marley', 'Shakira', 'Anitta', 'Ivete Sangalo', 'Caetano Veloso', 'Gilberto Gil', 'Chico Buarque', 'Marisa Monte', 'Roberto Carlos', 'Tim Maia', 'Ludmilla', 'Sandy', 'Djavan'],
  comidas: ['pizza', 'hambúrguer', 'coxinha', 'pastel', 'brigadeiro', 'feijoada', 'churrasco', 'sushi', 'lasanha', 'macarrão', 'risoto', 'tapioca', 'pão de queijo', 'acarajé', 'moqueca', 'strogonoff', 'salada', 'omelete', 'panqueca', 'bolo de chocolate', 'suco de laranja', 'café', 'chá gelado', 'açaí', 'pipoca'],
  esportes: ['futebol', 'basquete', 'vôlei', 'tênis', 'natação', 'surfe', 'skate', 'ciclismo', 'corrida', 'ginástica', 'judô', 'boxe', 'karatê', 'beisebol', 'rugby', 'handebol', 'golfe', 'fórmula 1', 'xadrez', 'esgrima', 'remo', 'canoagem', 'hóquei', 'patinação'],
  famosos: ['Albert Einstein', 'Pelé', 'Ayrton Senna', 'Marta', 'Neymar', 'Cristiano Ronaldo', 'Lionel Messi', 'Serena Williams', 'Usain Bolt', 'Barack Obama', 'Nelson Mandela', 'Martin Luther King', 'Princesa Diana', 'Oprah Winfrey', 'Steve Jobs', 'Bill Gates', 'Marie Curie', 'Frida Kahlo', 'Pablo Picasso', 'Walt Disney', 'Monteiro Lobato', 'Clarice Lispector'],
  filmes: ['Titanic', 'Avatar', 'Matrix', 'O Rei Leão', 'Toy Story', 'Frozen', 'Procurando Nemo', 'Shrek', 'Jurassic Park', 'Harry Potter', 'Senhor dos Anéis', 'Star Wars', 'Vingadores', 'Homem-Aranha', 'Batman', 'Coringa', 'Pantera Negra', 'O Poderoso Chefão', 'Forrest Gump', 'De Volta para o Futuro', 'E.T.', 'Rocky', 'Karate Kid'],
  futebol: ['gol de bicicleta', 'pênalti', 'escanteio', 'falta', 'goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante', 'camisa dez', 'impedimento', 'cartão amarelo', 'cartão vermelho', 'cobrança de falta', 'disputa de pênaltis', 'Copa do Mundo', 'Libertadores', 'Champions League', 'Brasileirão'],
  personagens: ['Homem-Aranha', 'Batman', 'Superman', 'Mulher-Maravilha', 'Hulk', 'Capitão América', 'Homem de Ferro', 'Thor', 'Pantera Negra', 'Wolverine', 'Harry Potter', 'Hermione', 'Darth Vader', 'Yoda', 'Mario', 'Sonic', 'Pikachu', 'Bob Esponja', 'Shrek', 'Elsa', 'Mickey Mouse', 'Minions'],
  instrumentos: ['violão', 'guitarra', 'baixo', 'piano', 'teclado', 'bateria', 'violino', 'violoncelo', 'flauta', 'saxofone', 'trompete', 'trombone', 'harpa', 'acordeão', 'pandeiro', 'cavaquinho', 'ukulele', 'berimbau', 'tambor', 'clarinete', 'oboé', 'gaita'],
  jogadores: ['Pelé', 'Garrincha', 'Zico', 'Romário', 'Ronaldo Fenômeno', 'Ronaldinho Gaúcho', 'Rivaldo', 'Kaká', 'Neymar', 'Marta', 'Cristiano Ronaldo', 'Lionel Messi', 'Mbappé', 'Haaland', 'Modric', 'Iniesta', 'Xavi', 'Zidane', 'Maradona', 'Beckenbauer', 'Bellingham', 'Vini Jr.'],
  livros: ['O Pequeno Príncipe', 'Harry Potter', 'Dom Casmurro', 'Memórias Póstumas de Brás Cubas', 'Capitães da Areia', 'A Hora da Estrela', 'Grande Sertão Veredas', '1984', 'A Revolução dos Bichos', 'O Hobbit', 'Senhor dos Anéis', 'Orgulho e Preconceito', 'Dom Quixote', 'A Menina que Roubava Livros', 'Percy Jackson', 'O Código Da Vinci'],
  lutadores: ['Anderson Silva', 'Amanda Nunes', 'José Aldo', 'Charles do Bronx', 'Minotauro', 'Conor McGregor', 'Khabib Nurmagomedov', 'Jon Jones', 'Mike Tyson', 'Muhammad Ali', 'Floyd Mayweather', 'Manny Pacquiao', 'Ronda Rousey', 'Holly Holm', 'Vitor Belfort', 'Lyoto Machida'],
  musicas: ['Bohemian Rhapsody', 'Billie Jean', 'Thriller', 'Like a Prayer', 'Imagine', 'Hey Jude', 'Yesterday', 'Hotel California', 'Smells Like Teen Spirit', 'Wonderwall', 'Shape of You', 'Bad Romance', 'Single Ladies', 'Evidências', 'Garota de Ipanema', 'País Tropical', 'Aquarela', 'Tempo Perdido', 'Trem-Bala'],
  selecoes: ['Brasil', 'Argentina', 'França', 'Alemanha', 'Itália', 'Espanha', 'Inglaterra', 'Portugal', 'Uruguai', 'Holanda', 'Bélgica', 'Croácia', 'Japão', 'Coreia do Sul', 'México', 'Estados Unidos', 'Canadá', 'Marrocos', 'Nigéria', 'Camarões', 'Austrália'],
  series: ['Friends', 'Breaking Bad', 'Game of Thrones', 'Stranger Things', 'The Office', 'The Big Bang Theory', 'Todo Mundo Odeia o Chris', 'Chaves', 'Chapolin', 'Round 6', 'La Casa de Papel', 'Dark', 'The Crown', 'Grey’s Anatomy', 'Lost', 'The Last of Us', 'Wandinha', 'Black Mirror', 'Os Simpsons'],
  times: ['Flamengo', 'Corinthians', 'Palmeiras', 'São Paulo', 'Santos', 'Vasco', 'Botafogo', 'Fluminense', 'Grêmio', 'Internacional', 'Cruzeiro', 'Atlético Mineiro', 'Bahia', 'Sport', 'Fortaleza', 'Ceará', 'Barcelona', 'Real Madrid', 'Manchester United', 'Liverpool', 'Bayern de Munique', 'PSG', 'Boca Juniors', 'River Plate'],
};

const modifiers = ['clássico', 'famoso', 'brasileiro', 'internacional', 'lendário', 'popular', 'de campeonato', 'de cinema', 'de novela', 'de estádio', 'dos anos 80', 'dos anos 90', 'dos anos 2000', 'de festa', 'de domingo', 'infantil', 'olímpico', 'histórico', 'de palco', 'de final'];
const endings = ['no palco', 'na final', 'na TV', 'no estádio', 'no cinema', 'na escola', 'na festa', 'no verão', 'no domingo', 'em família'];

export function normalizeTerm(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function difficultyFor(index: number): CharadesDifficulty {
  if (index % 5 === 0) return 'hard';
  if (index % 2 === 0) return 'medium';
  return 'easy';
}

function makeTerm(categoryId: string, rawTerm: string, index: number): CharadesTerm {
  const difficulty = difficultyFor(index);
  const term = rawTerm.trim();
  return {
    id: `${categoryId}-${normalizeTerm(term).replace(/\s+/g, '-')}`,
    term,
    normalized: normalizeTerm(term),
    categoryId,
    difficulty,
    points: difficultyPoints[difficulty],
    active: true,
    contentVersion: CHARADES_CONTENT_VERSION,
  };
}

export function buildCharadesTerms() {
  const terms: CharadesTerm[] = [];
  const seen = new Set<string>();

  for (const category of charadesCategories) {
    const bases = baseTerms[category.id] ?? [];
    const candidates: string[] = [...bases];

    for (const base of bases) {
      for (const modifier of modifiers) {
        candidates.push(`${base} ${modifier}`);
      }
      for (const ending of endings) {
        candidates.push(`${base} ${ending}`);
      }
    }

    candidates.forEach((candidate) => {
      const normalized = normalizeTerm(candidate);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      terms.push(makeTerm(category.id, candidate, terms.length));
    });
  }

  return terms;
}

export const charadesTerms = buildCharadesTerms();
