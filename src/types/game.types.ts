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
