import { GameRecord, TurnAction, GameContext } from '../../types/game.types';
import { GameState } from '../game/GameState';

export class GameRecorder {
  private currentRecord: GameRecord;
  private actionLog: TurnAction[] = [];
  private contextHistory: Map<number, GameContext> = new Map();
  private lastSnapshotTurn = 0;

  constructor(gameState: GameState) {
    this.currentRecord = {
      gameId: this.generateGameId(),
      startTime: Date.now(),
      endTime: 0,
      gameMode: gameState.gameMode,
      players: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        finalScore: p.score
      })),
      actions: [],
      contextSnapshots: {},
      finalResult: {}
    };
  }

  // 行動を記録
  logAction(action: Omit<TurnAction, 'timestamp'>): void {
    const fullAction: TurnAction = {
      ...action,
      timestamp: Date.now()
    };
    
    this.actionLog.push(fullAction);
    
    // 10ターンごとにコンテキストスナップショットを記録
    if (this.actionLog.length % 10 === 0) {
      this.takeContextSnapshot();
    }
  }

  // ゲームコンテキストのスナップショット
  takeContextSnapshot(): void {
    const gameState = this.getCurrentGameState(); // 現在のゲーム状態を取得
    const context: GameContext = {
      round: gameState.round,
      honba: gameState.honba,
      riichis: gameState.players.filter(p => p.isRiichi).map(p => p.id),
      doraIndicators: gameState.doraIndicators,
      wallTilesRemaining: gameState.wall.tilesRemaining
    };
    
    this.contextHistory.set(this.actionLog.length, context);
  }

  // ゲーム終了時の記録完了処理
  finalizeGame(result: GameRecord['finalResult']): void {
    this.currentRecord.endTime = Date.now();
    this.currentRecord.actions = [...this.actionLog];
    this.currentRecord.contextSnapshots = Object.fromEntries(this.contextHistory);
    this.currentRecord.finalResult = result;
    
    this.saveToStorage();
    this.sendToAnalytics(); // 将来的な分析サーバー送信用
  }

  // ローカルストレージに保存（IndexedDB推奨）
  private saveToStorage(): void {
    const records = this.getStoredRecords();
    records.push(this.currentRecord);
    
    // 最新100試合のみ保存する例
    const limitedRecords = records.slice(-100);
    
    localStorage.setItem('yugen_kitan_game_records', JSON.stringify(limitedRecords));
  }

  // ストレージから記録を取得
  getStoredRecords(): GameRecord[] {
    const stored = localStorage.getItem('yugen_kitan_game_records');
    return stored ? JSON.parse(stored) : [];
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentGameState(): GameState {
    // ゲームストアから現在の状態を取得
    // 実際の実装では適切な方法でゲーム状態を取得
    return (window as any).gameStore?.getState()?.game;
  }

  private sendToAnalytics(): void {
    // 将来的な実装: 分析サーバーにデータ送信
    console.log('Game recorded:', this.currentRecord);
  }
}
