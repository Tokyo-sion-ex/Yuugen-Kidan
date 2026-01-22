export type MatchmakingStatus = 'idle' | 'searching' | 'matched' | 'in_queue' | 'error';
export type GameMode = 'quick' | 'ranked' | 'friendly' | 'tournament';
export type RoomType = 'public' | 'private' | 'friends_only';

export interface MatchmakingPreferences {
  gameMode: GameMode;
  roomType: RoomType;
  minRank?: number;
  maxRank?: number;
  allowAI?: boolean;
  region?: string;
  estimatedWaitTime?: number;
}

export interface MatchmakingQueue {
  queueId: string;
  gameMode: GameMode;
  playersInQueue: number;
  averageWaitTime: number;
  eloRange: [number, number];
}

export interface MatchResult {
  matchId: string;
  roomId: string;
  players: MatchedPlayer[];
  gameMode: GameMode;
  serverRegion: string;
  matchFoundAt: Date;
}

export interface MatchedPlayer {
  playerId: string;
  username: string;
  avatar?: string;
  rank: string;
  elo: number;
  isReady: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

export interface RoomSettings {
  roomName: string;
  password?: string;
  maxPlayers: number;
  gameMode: string;
  ruleSet: string;
  allowSpectators: boolean;
  maxSpectators: number;
  isRanked: boolean;
}
