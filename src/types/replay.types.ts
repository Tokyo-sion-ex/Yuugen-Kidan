export interface GameReplay {
  id: string;
  gameId: string;
  gameMode: string;
  players: ReplayPlayer[];
  startTime: Date;
  endTime: Date;
  duration: number; // 秒単位
  totalRounds: number;
  
  // ゲーム状態のスナップショット
  snapshots: GameSnapshot[];
  
  // メタデータ
  isPublic: boolean;
  isAnalyzed: boolean;
  tags: string[];
  title?: string;
  description?: string;
  
  // 統計情報
  statistics: ReplayStatistics;
  
  // 分析結果
  analysis?: GameAnalysis;
}

export interface ReplayPlayer {
  playerId: string;
  username: string;
  avatar: string;
  finalScore: number;
  position: number;
  rank: string;
}

export interface GameSnapshot {
  timestamp: number; // ゲーム開始からの秒数
  round: number;
  turn: number;
  playerStates: PlayerState[];
  tableState: TableState;
  lastAction?: GameAction;
}

export interface PlayerState {
  playerId: string;
  hand: Tile[];
  discards: Tile[];
  melds: Meld[];
  riichi: boolean;
  points: number;
}

export interface TableState {
  wall: Tile[];
  doraIndicators: Tile[];
  roundWind: Wind;
  prevailingWind: Wind;
  remainingTiles: number;
}

export interface GameAction {
  type: 'draw' | 'discard' | 'chi' | 'pon' | 'kan' | 'riichi' | 'ron' | 'tsumo';
  playerId: string;
  tile?: Tile;
  timestamp: number;
}

export interface ReplayStatistics {
  totalActions: number;
  averageTurnTime: number;
  riichiCount: number;
  winCount: number;
  dealerWins: number;
  biggestWin: number;
  longestHand: number; // 打牌数
}

export interface GameAnalysis {
  highlights: GameHighlight[];
  playerAnalysis: PlayerAnalysis[];
  keyMoments: KeyMoment[];
  suggestions: AnalysisSuggestion[];
  aiEvaluation: AIEvaluation;
}

export interface GameHighlight {
  id: string;
  type: 'big_win' | 'comeback' | 'mistake' | 'brilliant_move';
  timestamp: number;
  playerId: string;
  description: string;
  significance: number; // 1-10
}

export interface PlayerAnalysis {
  playerId: string;
  strengths: string[];
  weaknesses: string[];
  playStyle: 'aggressive' | 'defensive' | 'balanced';
  efficiency: number; // 0-100
  decisionAccuracy: number; // 0-100
  riskAssessment: number; // 0-100
}

export interface KeyMoment {
  id: string;
  round: number;
  turn: number;
  description: string;
  significance: 'critical' | 'important' | 'interesting';
  screenshot?: string; // スクリーンショットのパス
}

export interface AnalysisSuggestion {
  type: 'improvement' | 'strategy' | 'technical';
  playerId: string;
  suggestion: string;
  referenceTimestamp: number;
}

export interface AIEvaluation {
  overallSkill: number; // 0-100
  positionalPlay: number; // 0-100
  tileEfficiency: number; // 0-100
  defense: number; // 0-100
  aggression: number; // 0-100
}
