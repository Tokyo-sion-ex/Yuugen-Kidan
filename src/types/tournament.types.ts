export type TournamentStatus = 'upcoming' | 'registration' | 'in_progress' | 'completed' | 'cancelled';
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'swiss' | 'round_robin';
export type TournamentType = 'public' | 'private' | 'invitational';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  organizer: string;
  type: TournamentType;
  format: TournamentFormat;
  status: TournamentStatus;
  
  // 設定
  maxParticipants: number;
  entryFee?: number;
  prizePool?: number[];
  rules: {
    gameMode: string;
    timeLimit?: number;
    requiredRounds: number;
  };
  
  // スケジュール
  registrationStart: Date;
  registrationEnd: Date;
  tournamentStart: Date;
  estimatedDuration: number; // 分単位
  
  // 参加者
  participants: TournamentParticipant[];
  waitingList: string[];
  
  // トーナメント表
  brackets?: TournamentBracket;
  currentRound: number;
  
  // メタデータ
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentParticipant {
  playerId: string;
  username: string;
  avatar?: string;
  joinedAt: Date;
  seed?: number;
  isReady: boolean;
}

export interface TournamentMatch {
  id: string;
  round: number;
  matchNumber: number;
  playerIds: string[];
  scores: number[];
  winnerId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledTime?: Date;
  startedAt?: Date;
  completedAt?: Date;
  roomId?: string;
}

export interface TournamentBracket {
  id: string;
  matches: TournamentMatch[];
  rounds: TournamentRound[];
  winners: string[];
}

export interface TournamentRound {
  round: number;
  name: string;
  matches: string[]; // Match IDs
  isComplete: boolean;
}
