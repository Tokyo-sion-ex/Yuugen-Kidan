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
