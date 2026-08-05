import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type GameStatus = 'ready' | 'beta' | 'planned';
export type GameId = 'contato' | 'nota' | 'impostor' | 'frase' | 'mimica';
export type GameRoute = '/contato' | '/adivinhe-nota' | '/impostor' | '/frase-cortada' | '/mimica';
export type OnlineGameRoute = '/online-game' | '/adivinhe-nota-online';
export type SetupRoute = '/setup' | GameRoute;
export type GameIconName = ComponentProps<typeof Ionicons>['name'];

export type GameConfigSchema = {
  teams?: boolean;
  players?: boolean;
  categories?: boolean;
  difficulties?: boolean;
  duration?: boolean;
  scoreTarget?: boolean;
  rounds?: boolean;
};

export type GameDefinition = {
  id: GameId;
  name: string;
  shortName: string;
  description: string;
  icon: GameIconName;
  emoji: string;
  color: string;
  gradient: readonly [string, string];
  minPlayers: number;
  maxPlayers?: number;
  setupRoute: SetupRoute;
  playRoute: GameRoute;
  onlineRoute?: OnlineGameRoute;
  status: GameStatus;
  supportsLocal: boolean;
  supportsOnline: boolean;
  onlineProtocolVersion?: number;
  rules: string[];
  config: GameConfigSchema;
};
