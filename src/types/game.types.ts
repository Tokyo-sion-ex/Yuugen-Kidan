// 追加する型定義
export interface TurnAction {
  playerId: number;
  action: 'draw' | 'discard' | 'chii' | 'pon' | 'kan' | 'riichi' | 'win' | 'tsumo';
  tile?: TileType; // 操作した牌
  timestamp: number; // 行動のタイムスタンプ
  handState?: TileType[]; // 行動前の手牌状態（オプショナル）
  score?: number; // 行動後の点数
}

export interface GameContext {
  round: number; // 局数
  honba: number; // 本場
  riichis: number[]; // 立直しているプレイヤーID
  doraIndicators: TileType[]; // 表示ドラ
  wallTilesRemaining: number; // 残り牌数
}

export interface GameRecord {
  gameId: string; // 対戦ごとの一意識別子
  startTime: number; // 開始時刻
  endTime: number; // 終了時刻
  gameMode: string; // 対戦モード
  players: { id: number; name: string; finalScore: number }[];
  actions: TurnAction[]; // 全行動のログ
  contextSnapshots: { [turn: number]: GameContext }; // 定期的なコンテキストスナップショット
  finalResult: {
    winner?: number;
    winType?: 'tsumo' | 'ron';
    yaku?: string[];
    points?: number;
  };
}

// データ収集用
export interface TurnAction {
  playerId: number;
  action: 'draw' | 'discard' | 'chii' | 'pon' | 'kan' | 'riichi' | 'win' | 'tsumo';
  tile?: TileType;
  timestamp: number;
  handState?: TileType[];
  handEfficiency?: TileEfficiency[]; // 牌効率分析用
  suggestedActions?: SuggestedAction[]; // AI提案アクション
}

// 牌効率分析用
export interface TileEfficiency {
  tile: TileType;
  efficiencyScore: number; // 0-100の効率スコア
  possibleMelds: number; // 可能な面子構成数
  waitImprovement: number; // 待ちの改善度
  dangerLevel?: number; // 危険度（放銃確率）
}

export interface SuggestedAction {
  type: 'discard' | 'chii' | 'pon';
  tile: TileType;
  reason: string;
  expectedValue: number;
}

// 学習分析用
export interface PlayerTendency {
  playerId: number;
  averageDiscardSpeed: number; // 平均打牌速度
  riichiRate: number; // 立直率
  foldRate: number; //  fold（降り）率
  dangerousDiscardPatterns: { // 危険な打牌パターン
    tile: TileType;
    situation: string;
    frequency: number;
  }[];
}

export interface GameInsight {
  keyTurn: number; // 重要なターン
  turningPoint: boolean; // 局面の転換点か
  missedOpportunities?: { // 見逃したチャンス
    playerId: number;
    action: SuggestedAction;
    actualAction: TurnAction;
  }[];
}

// 牌の基本型
export type TileType = string; // 例: "m1", "p5", "s9", "ton", "haku"

// 牌の詳細情報
export interface TileDetail {
  type: TileType;
  name: string;
  category: 'manzu' | 'pinzu' | 'souzu' | 'jihai';
  number?: number;
  isYaochu: boolean;
  isWind?: 'east' | 'south' | 'west' | 'north';
  isDragon?: 'haku' | 'hatsu' | 'chun';
}

// 行動記録
export interface TurnAction {
  gameId: string;
  playerId: number;
  action: 'draw' | 'discard' | 'chii' | 'pon' | 'kan' | 'riichi' | 'win' | 'tsumo' | 'pass';
  tile?: TileType;
  timestamp: number;
  turnNumber: number;
  handState?: TileType[];
  handEfficiency?: TileEfficiency[];
  suggestedActions?: SuggestedAction[];
  context?: {
    round: number;
    honba: number;
    riichiSticks: number;
    doraIndicators: TileType[];
    remainingTiles: number;
  };
}

// 牌効率分析
export interface TileEfficiency {
  tile: TileType;
  efficiencyScore: number; // 0-100
  possibleMelds: number;
  waitImprovement: number;
  dangerLevel?: number;
  discardPriority: 'high' | 'medium' | 'low';
  reasons: string[];
}

// AI提案アクション
export interface SuggestedAction {
  type: 'discard' | 'chii' | 'pon' | 'kan' | 'riichi';
  tile: TileType;
  reason: string;
  expectedValue: number;
  confidence: number; // 0-1
  alternativeTiles?: TileType[];
}

// プレイヤー傾向
export interface PlayerTendency {
  playerId: number;
  totalGames: number;
  averageDiscardTime: number;
  riichiRate: number; // 立直率 (%)
  winRate: number;
  dealInRate: number; // 放銃率
  averageHandScore: number;
  favoriteYaku: Array<{yaku: string, count: number}>;
  discardPatterns: Array<{
    situation: string;
    tile: TileType;
    frequency: number;
    successRate: number;
  }>;
  playingStyle: 'aggressive' | 'defensive' | 'balanced';
}

// ゲーム洞察
export interface GameInsight {
  keyTurn: number;
  turningPoint: boolean;
  description: string;
  significance: 'high' | 'medium' | 'low';
  missedOpportunities?: Array<{
    playerId: number;
    suggestedAction: SuggestedAction;
    actualAction: TurnAction;
    valueLoss: number;
  }>;
  keyMoments?: Array<{
    turn: number;
    event: string;
    impact: number;
  }>;
}

// 完全なゲーム記録
export interface GameRecord {
  gameId: string;
  startTime: number;
  endTime: number;
  duration: number; // 秒
  gameMode: 'tonpu' | 'hanchan' | 'tonnan';
  ruleset: string;
  players: Array<{
    id: number;
    name: string;
    initialScore: number;
    finalScore: number;
    position: 'east' | 'south' | 'west' | 'north';
    rank: number;
  }>;
  settings: {
    kuitan: boolean;
    akaAri: boolean;
    kiriage: boolean;
    sanma: boolean;
  };
  actions: TurnAction[];
  contextSnapshots: { [turn: number]: GameContext };
  finalResult: {
    winner?: number;
    winType?: 'tsumo' | 'ron';
    yaku?: Array<{name: string, han: number}>;
    fu: number;
    totalHan: number;
    points: number;
    limit: 'mangan' | 'haneman' | null;
  };
  insights: GameInsight[];
  metadata: {
    version: string;
    recordedBy: string;
    tags: string[];
  };
}

// ゲームコンテキスト
export interface GameContext {
  round: number;
  honba: number;
  riichiSticks: number;
  riichis: number[];
  doraIndicators: TileType[];
  uraDoraIndicators?: TileType[];
  wallTilesRemaining: number;
  deadWallTilesRemaining: number;
  playerWind: { [playerId: number]: string };
  roundWind: string;
  scores: { [playerId: number]: number };
}

// 統計データ
export interface PlayerStats {
  playerId: number;
  totalGames: number;
  totalWins: number;
  totalDealIns: number;
  totalRiichi: number;
  averageScore: number;
  bestYaku: {yaku: string, han: number, date: number};
  recentPerformance: Array<{
    date: number;
    score: number;
    rank: number;
  }>;
  streak: {
    currentWinstreak: number;
    bestWinstreak: number;
    currentLosingStreak: number;
  };
}

// 学習セッション
export interface LearningSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  focusArea: 'efficiency' | 'defense' | 'riichi' | 'all';
  exercises: Array<{
    type: string;
    completed: boolean;
    score: number;
    feedback: string;
  }>;
  progress: {
    startLevel: number;
    currentLevel: number;
    pointsEarned: number;
  };
}

// 分析設定
export interface AnalysisSettings {
  enabled: boolean;
  realTimeSuggestions: boolean;
  showEfficiencyScores: boolean;
  dangerWarnings: boolean;
  postGameAnalysis: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
}

// エクスポートすべての型
export type {
  TileType,
  TileDetail,
  TurnAction,
  TileEfficiency,
  SuggestedAction,
  PlayerTendency,
  GameInsight,
  GameRecord,
  GameContext,
  PlayerStats,
  LearningSession,
  AnalysisSettings
};
