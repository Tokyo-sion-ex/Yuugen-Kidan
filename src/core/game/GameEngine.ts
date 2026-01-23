import { GameRecorder } from '../analytics/GameRecorder';

export class GameEngine {
  private gameRecorder: GameRecorder;
  
  constructor() {
    // ... 既存の初期化
    this.gameRecorder = new GameRecorder(this.gameState);
  }
  
  // 牌を切るメソッドの例 - 既存メソッドを拡張
  discardTile(playerId: number, tile: TileType): void {
    // 1. 元のゲームロジックを実行
    const originalResult = this.executeDiscard(playerId, tile);
    
    // 2. 行動を記録
    this.gameRecorder.logAction({
      playerId,
      action: 'discard',
      tile,
      handState: this.getPlayerHand(playerId), // 手牌の状態を記録
      score: this.getPlayerScore(playerId)
    });
    
    // 3. 立直のチェック
    if (this.checkRiichi(playerId)) {
      this.gameRecorder.logAction({
        playerId,
        action: 'riichi',
        tile // 立直宣言牌
      });
    }
    
    return originalResult;
  }
  
  // ゲーム終了時
  endGame(result: GameResult): void {
    // 1. 元の終了処理
    this.executeGameEnd(result);
    
    // 2. 記録を完了
    this.gameRecorder.finalizeGame({
      winner: result.winner?.id,
      winType: result.winType,
      yaku: result.yakuList,
      points: result.points
    });
  }
}
