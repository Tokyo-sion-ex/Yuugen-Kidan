import { GameMode, GameSettings, Player, Tile, Wind, PlayerPosition } from '../../types/game.types';
import { TileManager } from './TileManager';
import { createGameSettings } from './GameSettings';
import { GameFlowManager } from './GameFlowManager';

export class GameEngine {
  private tileManager: TileManager;
  private flowManager: GameFlowManager;
  private settings: GameSettings;
  private players: Player[] = [];
  private currentPlayerIndex: number = 0;
  private wall: Tile[] = [];
  private doraIndicators: Tile[] = [];
  private gameState: 'waiting' | 'drawing' | 'discarding' | 'waitingForAction' | 'gameOver' = 'waiting';

  constructor(mode: GameMode) {
    this.settings = createGameSettings(mode);
    this.tileManager = new TileManager(this.settings.redFives);
    this.flowManager = new GameFlowManager(mode);
    this.initializeGame();
  }

  private initializeGame(): void {
    // 1. 牌山の初期化
    this.wall = this.tileManager.generateWall();
    
    // 2. ドラ表示牌の設定
    this.doraIndicators = [this.wall.pop()!];
    
    // 3. プレイヤーの初期化
    this.players = [
      this.createPlayer('east', 'あなた'),
      this.createPlayer('south', 'CPU南'),
      this.createPlayer('west', 'CPU西'),
      this.createPlayer('north', 'CPU北'),
    ];
    
    // 4. 配牌
    this.dealInitialHands();
    
    // 5. ゲーム状態の初期化
    this.gameState = 'drawing';
  }

  private createPlayer(position: PlayerPosition, name: string): Player {
    return {
      id: `${position}_${Date.now()}`,
      name,
      position,
      hand: [],
      discards: [],
      points: this.settings.startingPoints,
      isRiichi: false,
      isDealer: position === 'east',
    };
  }

  private dealInitialHands(): void {
    // 各プレイヤーに13枚配る
    for (let i = 0; i < 13; i++) {
      for (const player of this.players) {
        if (this.wall.length > 0) {
          player.hand.push(this.wall.pop()!);
        }
      }
    }
    
    // 手牌をソート
    this.players.forEach(player => {
      player.hand = this.tileManager.sortTiles(player.hand);
    });
  }

  // ツモ（牌を引く）
  public drawTile(): Tile | null {
    if (this.wall.length === 0 || this.gameState !== 'drawing') {
      return null;
    }

    const tile = this.wall.pop()!;
    const currentPlayer = this.players[this.currentPlayerIndex];
    
    currentPlayer.hand.push(tile);
    currentPlayer.hand = this.tileManager.sortTiles(currentPlayer.hand);
    
    this.gameState = 'discarding';
    
    return tile;
  }

  // 打牌（牌を捨てる）
  public discardTile(tileId: string): boolean {
    const currentPlayer = this.players[this.currentPlayerIndex];
    const tileIndex = currentPlayer.hand.findIndex(t => t.id === tileId);
    
    if (tileIndex === -1) {
      return false;
    }

    const [discardedTile] = currentPlayer.hand.splice(tileIndex, 1);
    currentPlayer.discards.push(discardedTile);
    
    // リーチ宣言チェック
    if (currentPlayer.isRiichi) {
      currentPlayer.isRiichi = false;
    }
    
    // 次のプレイヤーへ
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
    this.gameState = 'drawing';
    
    return true;
  }

  // リーチ宣言
  public declareRiichi(): boolean {
    const currentPlayer = this.players[this.currentPlayerIndex];
    
    if (currentPlayer.points < 1000 || currentPlayer.isRiichi) {
      return false;
    }
    
    currentPlayer.points -= 1000;
    currentPlayer.isRiichi = true;
    
    return true;
  }

  // 役の判定（簡易版）
  public checkYaku(hand: Tile[], winningTile: Tile): string[] {
    const yaku: string[] = [];
    
    // ここに役判定ロジックを実装
    // とりあえずダミー
    if (this.isTsumo()) {
      yaku.push('門前清自摸和');
    }
    
    if (this.players[this.currentPlayerIndex].isRiichi) {
      yaku.push('立直');
    }
    
    return yaku;
  }

  private isTsumo(): boolean {
    // 自摸かどうかの判定（簡易版）
    return true;
  }

  // ゲーム情報取得
  public getGameInfo() {
    return {
      players: this.players,
      currentPlayer: this.players[this.currentPlayerIndex],
      wallCount: this.wall.length,
      doraIndicators: this.doraIndicators,
      round: this.flowManager.getCurrentRound(),
      wind: this.flowManager.getCurrentWind(),
      gameState: this.gameState,
    };
  }
}
