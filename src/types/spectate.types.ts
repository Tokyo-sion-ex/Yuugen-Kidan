export interface SpectatableGame {
  id: string;
  roomId: string;
  gameMode: string;
  players: SpectatorPlayer[];
  spectators: number;
  maxSpectators: number;
  startedAt: Date;
  currentRound: number;
  totalRounds: number;
  isPrivate: boolean;
  hasPassword: boolean;
}

export interface SpectatorPlayer {
  playerId: string;
  username: string;
  avatar?: string;
  score: number;
  position: number;
  isReady: boolean;
}

export interface SpectatorViewState {
  gameId: string;
  viewpoint: 'table' | 'player' | 'god';
  followingPlayer?: string;
  showAllHands: boolean;
  chatEnabled: boolean;
  delaySeconds: number;
}

export interface SpectatorChatMessage {
  id: string;
  spectatorId: string;
  username: string;
  message: string;
  timestamp: Date;
  isModerator: boolean;
}
