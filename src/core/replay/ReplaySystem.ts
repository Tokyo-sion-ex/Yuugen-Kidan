import { Tile, Player, GameMode } from '../../types/game.types';
import { GameEngine } from '../game/GameEngine';

interface ReplayAction {
  type: 'draw' | 'discard' | 'riichi' | 'pon' | 'chi' | 'kan' | 'ron' | 'tsumo';
  playerIndex: number;
  tileId?: string;
  timestamp: number;
  gameState: any;
}

interface ReplayData {
  id: string;
  gameMode: GameMode;
  players: Player[];
  actions: ReplayAction[];
  createdAt: string;
  duration: number;
  finalScores: number[];
}

export class ReplaySystem {
  private currentReplay: ReplayData | null = null;
  private replayActions: ReplayAction[] = [];
  private gameEngine: GameEngine | null = null;
  private isRecording: boolean = false;
  private startTime: number = 0;

  // 録画開始
  startRecording(gameMode: GameMode, initialPlayers: Player[]): void {
    this.isRecording = true;
    this.startTime = Date.now();
    this.replayActions = [];
    
    this.currentReplay = {
      id: this.generateReplayId(),
      gameMode,
      players: JSON.parse(JSON.stringify(initialPlayers)), // ディープコピー
      actions: [],
      createdAt: new Date().toISOString(),
      duration: 0,
      finalScores: []
    };
  }

  // アクション記録
  recordAction(type: ReplayAction['type'], playerIndex: number, tileId?: string): void {
    if (!this.isRecording || !this.gameEngine) return;

    const action: ReplayAction = {
      type,
      playerIndex,
      tileId,
      timestamp: Date.now() - this.startTime,
      gameState: this.captureGameState()
    };

    this.replayActions.push(action);
    if (this.currentReplay) {
      this.currentReplay.actions = [...this.replayActions];
    }
  }

  // 録画停止
  stopRecording(finalScores: number[]): ReplayData | null {
    if (!this.isRecording || !this.currentReplay) return null;

    this.isRecording = false;
    this.currentReplay.duration = Date.now() - this.startTime;
    this.currentReplay.finalScores = finalScores;

    const replay = { ...this.currentReplay };
    
    // 保存
    this.saveReplay(replay);
    
    // リセット
    this.reset();
    
    return replay;
  }

  // ゲーム状態をキャプチャ
  private captureGameState(): any {
    if (!this.gameEngine) return null;
    
    const gameInfo = this.gameEngine.getGameInfo();
    return {
      players: gameInfo.players.map(player => ({
        ...player,
        hand: player.hand.map(tile => ({ ...tile }))
      })),
      wallCount: gameInfo.wallCount,
      doraIndicators: [...gameInfo.doraIndicators],
      currentPlayerIndex: gameInfo.players.findIndex(p => 
        p.position === gameInfo.currentPlayer.position
      )
    };
  }

  // リプレイ再生
  playReplay(replayData: ReplayData, speed: number = 1.0): {
    currentAction: ReplayAction | null;
    progress: number;
    isPlaying: boolean;
    isPaused: boolean;
    speed: number;
  } {
    const state = {
      currentAction: null as ReplayAction | null,
      progress: 0,
      isPlaying: false,
      isPaused: false,
      speed
    };

    // ゲームエンジンを初期状態で再構築
    this.gameEngine = new GameEngine(replayData.gameMode);
    
    // 初期状態を設定
    const initialAction = replayData.actions[0];
    if (initialAction && initialAction.gameState) {
      this.restoreGameState(initialAction.gameState);
    }

    let currentActionIndex = 0;
    const totalActions = replayData.actions.length;

    const playNextAction = () => {
      if (currentActionIndex >= totalActions) {
        state.isPlaying = false;
        return;
      }

      const action = replayData.actions[currentActionIndex];
      state.currentAction = action;
      state.progress = (currentActionIndex + 1) / totalActions;

      // ゲーム状態を復元
      this.restoreGameState(action.gameState);

      currentActionIndex++;
      
      if (state.isPlaying && !state.isPaused) {
        const delay = currentActionIndex < totalActions ? 
          (replayData.actions[currentActionIndex].timestamp - action.timestamp) / state.speed : 
          1000;
        
        setTimeout(playNextAction, delay);
      }
    };

    return {
      ...state,
      play: () => {
        state.isPlaying = true;
        state.isPaused = false;
        playNextAction();
      },
      pause: () => {
        state.isPaused = true;
      },
      resume: () => {
        state.isPaused = false;
        if (state.isPlaying) {
          playNextAction();
        }
      },
      stop: () => {
        state.isPlaying = false;
        state.isPaused = false;
        currentActionIndex = 0;
        state.progress = 0;
      },
      seek: (actionIndex: number) => {
        if (actionIndex >= 0 && actionIndex < totalActions) {
          currentActionIndex = actionIndex;
          const action = replayData.actions[actionIndex];
          state.currentAction = action;
          state.progress = (actionIndex + 1) / totalActions;
          this.restoreGameState(action.gameState);
        }
      },
      setSpeed: (newSpeed: number) => {
        state.speed = newSpeed;
      }
    };
  }

  // ゲーム状態を復元
  private restoreGameState(gameState: any): void {
    if (!this.gameEngine) return;
    
    // ゲームエンジンの状態を復元するロジック
    // 実際の実装ではGameEngineに状態復元メソッドが必要
  }

  // リプレイ保存
  private saveReplay(replayData: ReplayData): void {
    try {
      const replays = this.getSavedReplays();
      replays.unshift(replayData);
      
      // 最新100件のみ保存
      const limitedReplays = replays.slice(0, 100);
      
      localStorage.setItem('mahjong_replays', JSON.stringify(limitedReplays));
      
      console.log('Replay saved:', replayData.id);
    } catch (error) {
      console.error('Failed to save replay:', error);
    }
  }

  // 保存されたリプレイを取得
  getSavedReplays(): ReplayData[] {
    try {
      const saved = localStorage.getItem('mahjong_replays');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load replays:', error);
      return [];
    }
  }

  // リプレイを削除
  deleteReplay(replayId: string): boolean {
    try {
      const replays = this.getSavedReplays();
      const filtered = replays.filter(replay => replay.id !== replayId);
      
      localStorage.setItem('mahjong_replays', JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete replay:', error);
      return false;
    }
  }

  // リプレイをエクスポート
  exportReplay(replayData: ReplayData): string {
    return JSON.stringify(replayData, null, 2);
  }

  // リプレイをインポート
  importReplay(jsonString: string): ReplayData | null {
    try {
      const replayData = JSON.parse(jsonString);
      
      // バリデーション
      if (!replayData.id || !replayData.gameMode || !replayData.actions) {
        throw new Error('Invalid replay data');
      }
      
      return replayData;
    } catch (error) {
      console.error('Failed to import replay:', error);
      return null;
    }
  }

  // リプレイID生成
  private generateReplayId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `replay_${timestamp}_${random}`;
  }

  // リセット
  private reset(): void {
    this.currentReplay = null;
    this.replayActions = [];
    this.isRecording = false;
    this.startTime = 0;
  }

  // 統計情報
  getReplayStatistics(replayData: ReplayData): {
    totalActions: number;
    actionTypes: Record<string, number>;
    playerActions: Record<number, number>;
    averageActionTime: number;
  } {
    const actionTypes: Record<string, number> = {};
    const playerActions: Record<number, number> = {};
    
    let totalActionTime = 0;
    
    replayData.actions.forEach((action, index) => {
      // アクションタイプ集計
      actionTypes[action.type] = (actionTypes[action.type] || 0) + 1;
      
      // プレイヤー別アクション集計
      playerActions[action.playerIndex] = (playerActions[action.playerIndex] || 0) + 1;
      
      // アクション時間
      if (index > 0) {
        const timeDiff = action.timestamp - replayData.actions[index - 1].timestamp;
        totalActionTime += timeDiff;
      }
    });
    
    return {
      totalActions: replayData.actions.length,
      actionTypes,
      playerActions,
      averageActionTime: replayData.actions.length > 1 ? 
        totalActionTime / (replayData.actions.length - 1) : 0
    };
  }

  // リプレイ分析
  analyzeReplay(replayData: ReplayData): {
    highlights: Array<{
      action: ReplayAction;
      description: string;
      importance: number; // 1-10
    }>;
    playerPerformance: Array<{
      playerIndex: number;
      winRate: number;
      averagePoints: number;
      efficiency: number;
    }>;
  } {
    const highlights: Array<{
      action: ReplayAction;
      description: string;
      importance: number;
    }> = [];
    
    const playerPerformance: Array<{
      playerIndex: number;
      winRate: number;
      averagePoints: number;
      efficiency: number;
    }> = [];
    
    // ハイライト検出
    replayData.actions.forEach((action, index) => {
      if (action.type === 'riichi') {
        highlights.push({
          action,
          description: `${replayData.players[action.playerIndex].name}がリーチ宣言`,
          importance: 7
        });
      }
      
      if (action.type === 'ron' || action.type === 'tsumo') {
        highlights.push({
          action,
          description: `${replayData.players[action.playerIndex].name}が和了！`,
          importance: 10
        });
      }
      
      if (action.type === 'kan') {
        highlights.push({
          action,
          description: `${replayData.players[action.playerIndex].name}がカンを宣言`,
          importance: 6
        });
      }
    });
    
    // プレイヤーパフォーマンス計算
    replayData.players.forEach((player, index) => {
      const playerActions = replayData.actions.filter(a => a.playerIndex === index);
      const winActions = playerActions.filter(a => a.type === 'ron' || a.type === 'tsumo');
      
      playerPerformance.push({
        playerIndex: index,
        winRate: playerActions.length > 0 ? (winActions.length / playerActions.length) * 100 : 0,
        averagePoints: replayData.finalScores[index],
        efficiency: this.calculateEfficiency(playerActions)
      });
    });
    
    // ハイライトを重要性順にソート
    highlights.sort((a, b) => b.importance - a.importance);
    
    return {
      highlights: highlights.slice(0, 10), // トップ10
      playerPerformance
    };
  }

  // 効率計算（簡易版）
  private calculateEfficiency(actions: ReplayAction[]): number {
    if (actions.length === 0) return 0;
    
    const effectiveActions = actions.filter(action => 
      ['pon', 'chi', 'kan', 'riichi', 'ron', 'tsumo'].includes(action.type)
    ).length;
    
    return (effectiveActions / actions.length) * 100;
  }
}
