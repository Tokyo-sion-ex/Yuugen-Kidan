import { Player, Tile, Suit } from '../../types/game.types';
import { TileManager } from '../tiles/TileManager';

export class AIPlayer {
  private tileManager: TileManager;
  private difficulty: 'easy' | 'normal' | 'hard';
  private player: Player;
  private lastActionTime: number = 0;
  private actionDelay: number;

  constructor(player: Player, difficulty: 'easy' | 'normal' | 'hard' = 'normal') {
    this.player = player;
    this.difficulty = difficulty;
    this.tileManager = new TileManager();
    
    // 難易度に応じた思考時間
    this.actionDelay = {
      easy: 2000,
      normal: 1500,
      hard: 1000,
    }[difficulty];
  }

  // 次の行動を決定
  public decideAction(
    currentTile: Tile | null,
    canRon: boolean,
    canPon: boolean,
    canChi: boolean,
    canKan: boolean
  ): { action: 'none' | 'draw' | 'discard' | 'ron' | 'pon' | 'chi' | 'kan' | 'riichi'; tileId?: string } {
    
    // 行動間隔の制限
    const now = Date.now();
    if (now - this.lastActionTime < this.actionDelay) {
      return { action: 'none' };
    }

    // 和了可能かチェック
    if (canRon && this.shouldRon()) {
      this.lastActionTime = now;
      return { action: 'ron' };
    }

    // 鳴きの判断
    if (currentTile) {
      if (canPon && this.shouldPon(currentTile)) {
        this.lastActionTime = now;
        return { action: 'pon' };
      }

      if (canKan && this.shouldKan(currentTile)) {
        this.lastActionTime = now;
        return { action: 'kan' };
      }

      if (canChi && this.shouldChi(currentTile)) {
        this.lastActionTime = now;
        return { action: 'chi' };
      }
    }

    // リーチの判断
    if (!this.player.isRiichi && this.shouldRiichi()) {
      this.lastActionTime = now;
      return { action: 'riichi' };
    }

    // 通常のターン
    if (this.player.hand.length < 14) {
      // ツモ
      this.lastActionTime = now;
      return { action: 'draw' };
    } else {
      // 打牌
      const tileToDiscard = this.chooseTileToDiscard();
      this.lastActionTime = now;
      return { action: 'discard', tileId: tileToDiscard?.id };
    }
  }

  // 捨てる牌を選択
  private chooseTileToDiscard(): Tile | null {
    const hand = this.player.hand;
    
    // 簡単な戦略: 孤立牌、端牌、安全牌の順に捨てる
    const isolatedTiles = this.findIsolatedTiles(hand);
    const edgeTiles = this.findEdgeTiles(hand);
    const safeTiles = this.findSafeTiles(hand);
    
    // 捨てる牌を決定
    if (isolatedTiles.length > 0) {
      return this.selectTileByStrategy(isolatedTiles);
    } else if (edgeTiles.length > 0) {
      return this.selectTileByStrategy(edgeTiles);
    } else if (safeTiles.length > 0) {
      return this.selectTileByStrategy(safeTiles);
    } else {
      // ランダムに捨てる
      return hand[Math.floor(Math.random() * hand.length)];
    }
  }

  // 孤立牌を探す（隣接する牌がない）
  private findIsolatedTiles(hand: Tile[]): Tile[] {
    const sorted = this.tileManager.sortTiles([...hand]);
    const isolated: Tile[] = [];
    
    for (let i = 0; i < sorted.length; i++) {
      const tile = sorted[i];
      
      // 字牌は常に孤立牌として扱う
      if (tile.suit === 'wind' || tile.suit === 'dragon') {
        isolated.push(tile);
        continue;
      }
      
      // 数牌の孤立判定
      if (typeof tile.value === 'number') {
        const hasLeftNeighbor = sorted.some((t, idx) => 
          idx !== i && 
          t.suit === tile.suit && 
          typeof t.value === 'number' && 
          t.value === tile.value - 1
        );
        
        const hasRightNeighbor = sorted.some((t, idx) => 
          idx !== i && 
          t.suit === tile.suit && 
          typeof t.value === 'number' && 
          t.value === tile.value + 1
        );
        
        const hasSame = sorted.filter((t, idx) => 
          idx !== i && 
          t.suit === tile.suit && 
          t.value === tile.value
        ).length;
        
        if (!hasLeftNeighbor && !hasRightNeighbor && hasSame === 0) {
          isolated.push(tile);
        }
      }
    }
    
    return isolated;
  }

  // 端牌を探す（1, 9）
  private findEdgeTiles(hand: Tile[]): Tile[] {
    return hand.filter(tile => {
      if (tile.suit === 'man' || tile.suit === 'pin' || tile.suit === 'sou') {
        return tile.value === 1 || tile.value === 9;
      }
      return false;
    });
  }

  // 安全牌を探す（場に多く出ている牌）
  private findSafeTiles(hand: Tile[]): Tile[] {
    // 簡易実装: とりあえず全ての牌を返す
    return [...hand];
  }

  // 戦略に基づいて牌を選択
  private selectTileByStrategy(tiles: Tile[]): Tile {
    // 難易度に応じた選択
    switch (this.difficulty) {
      case 'easy':
        // ランダム選択
        return tiles[Math.floor(Math.random() * tiles.length)];
        
      case 'normal':
        // 点数が高い牌を優先して捨てる
        return tiles.sort((a, b) => {
          const valueA = this.getTileValue(a);
          const valueB = this.getTileValue(b);
          return valueB - valueA; // 高い順
        })[0];
        
      case 'hard':
        // 高度な判断: 手牌の形を考慮
        return this.advancedTileSelection(tiles);
        
      default:
        return tiles[0];
    }
  }

  // 牌の価値を計算（簡易版）
  private getTileValue(tile: Tile): number {
    let value = 0;
    
    if (tile.suit === 'dragon') {
      value = 3; // 三元牌は価値が高い
    } else if (tile.suit === 'wind') {
      value = 2; // 風牌
    } else if (typeof tile.value === 'number') {
      // 中張牌（2-8）は価値が高い
      if (tile.value >= 2 && tile.value <= 8) {
        value = 3;
      } else {
        value = 1; // 端牌
      }
    }
    
    return value;
  }

  // 高度な牌選択アルゴリズム
  private advancedTileSelection(tiles: Tile[]): Tile {
    // テンパイに近い牌を優先して残す
    // ここでは簡易実装としてランダム選択
    return tiles[Math.floor(Math.random() * tiles.length)];
  }

  // ロンするか判断
  private shouldRon(): boolean {
    // 難易度に応じた判断
    const ronProbability = {
      easy: 0.3,   // 30%の確率でロン
      normal: 0.6, // 60%の確率でロン
      hard: 0.8,   // 80%の確率でロン
    }[this.difficulty];
    
    return Math.random() < ronProbability;
  }

  // ポンするか判断
  private shouldPon(tile: Tile): boolean {
    // 同じ牌が2枚以上あるか確認
    const sameTileCount = this.player.hand.filter(t => 
      t.suit === tile.suit && t.value === tile.value
    ).length;
    
    if (sameTileCount >= 2) {
      const ponProbability = {
        easy: 0.4,
        normal: 0.6,
        hard: 0.8,
      }[this.difficulty];
      
      return Math.random() < ponProbability;
    }
    
    return false;
  }

  // カンするか判断
  private shouldKan(tile: Tile): boolean {
    // 同じ牌が3枚あるか確認
    const sameTileCount = this.player.hand.filter(t => 
      t.suit === tile.suit && t.value === tile.value
    ).length;
    
    if (sameTileCount >= 3) {
      const kanProbability = {
        easy: 0.3,
        normal: 0.5,
        hard: 0.7,
      }[this.difficulty];
      
      return Math.random() < kanProbability;
    }
    
    return false;
  }

  // チーするか判断
  private shouldChi(tile: Tile): boolean {
    // 数牌でなければチーできない
    if (!(tile.suit === 'man' || tile.suit === 'pin' || tile.suit === 'sou')) {
      return false;
    }
    
    const value = tile.value as number;
    const hand = this.player.hand;
    
    // 連続する牌の組み合わせをチェック
    for (let i = -2; i <= 0; i++) {
      const neededValues = [value + i, value + i + 1, value + i + 2];
      
      // 必要な牌が手牌にあるか確認
      const hasAll = neededValues.every(neededValue => 
        hand.some(t => 
          t.suit === tile.suit && 
          t.value === neededValue &&
          (neededValue !== value || hand.filter(t2 => 
            t2.suit === tile.suit && t2.value === neededValue
          ).length >= 2) // 捨て牌と同じ牌がもう1枚必要
        )
      );
      
      if (hasAll) {
        const chiProbability = {
          easy: 0.3,
          normal: 0.5,
          hard: 0.7,
        }[this.difficulty];
        
        return Math.random() < chiProbability;
      }
    }
    
    return false;
  }

  // リーチするか判断
  private shouldRiichi(): boolean {
    // 点数チェック
    if (this.player.points < 1000) {
      return false;
    }
    
    // テンパイ判定（簡易版）
    const isTenpai = this.checkTenpai();
    
    if (!isTenpai) {
      return false;
    }
    
    const riichiProbability = {
      easy: 0.2,
      normal: 0.4,
      hard: 0.6,
    }[this.difficulty];
    
    return Math.random() < riichiProbability;
  }

  // テンパイ判定（簡易版）
  private checkTenpai(): boolean {
    const hand = this.player.hand;
    
    // ここでは簡易実装としてランダム判定
    // 実際は麻雀の待ち判定アルゴリズムが必要
    const tenpaiProbability = 0.3;
    return Math.random() < tenpaiProbability;
  }

  // 手牌を更新
  public updateHand(newHand: Tile[]): void {
    this.player.hand = newHand;
  }

  // プレイヤー情報を取得
  public getPlayer(): Player {
    return this.player;
  }

  // 難易度を変更
  public setDifficulty(difficulty: 'easy' | 'normal' | 'hard'): void {
    this.difficulty = difficulty;
    this.actionDelay = {
      easy: 2000,
      normal: 1500,
      hard: 1000,
    }[difficulty];
  }
}
