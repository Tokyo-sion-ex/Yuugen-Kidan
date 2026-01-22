import { Tile, Suit } from '../../types/game.types';

export class TileManager {
  private redFives: boolean;

  constructor(redFives: boolean = true) {
    this.redFives = redFives;
  }

  // 牌山の生成
  public generateWall(): Tile[] {
    const wall: Tile[] = [];
    
    // 萬子 (1-9, 各4枚)
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 4; i++) {
        wall.push(this.createTile('man', value, this.isRedFive('man', value, i)));
      }
    }
    
    // 筒子 (1-9, 各4枚)
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 4; i++) {
        wall.push(this.createTile('pin', value, this.isRedFive('pin', value, i)));
      }
    }
    
    // 索子 (1-9, 各4枚)
    for (let value = 1; value <= 9; value++) {
      for (let i = 0; i < 4; i++) {
        wall.push(this.createTile('sou', value, this.isRedFive('sou', value, i)));
      }
    }
    
    // 風牌 (東南西北, 各4枚)
    const winds: Array<'east' | 'south' | 'west' | 'north'> = ['east', 'south', 'west', 'north'];
    winds.forEach(wind => {
      for (let i = 0; i < 4; i++) {
        wall.push(this.createTile('wind', wind, false));
      }
    });
    
    // 三元牌 (白發中, 各4枚)
    const dragons: Array<'white' | 'green' | 'red'> = ['white', 'green', 'red'];
    dragons.forEach(dragon => {
      for (let i = 0; i < 4; i++) {
        wall.push(this.createTile('dragon', dragon, false));
      }
    });
    
    // 牌をシャッフル
    return this.shuffle(wall);
  }

  private createTile(suit: Suit, value: number | string, isRedFive: boolean): Tile {
    return {
      id: `${suit}_${value}_${Date.now()}_${Math.random()}`,
      suit,
      value,
      isRedFive,
      isDora: false,
    };
  }

  private isRedFive(suit: Suit, value: number, index: number): boolean {
    if (!this.redFives || value !== 5) return false;
    
    // 各スートの5の牌のうち1枚を赤牌にする
    return index === 0; // 最初の1枚を赤牌に
  }

  // フィッシャー・イェーツのシャッフル
  private shuffle(array: Tile[]): Tile[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 手牌のソート
  public sortTiles(tiles: Tile[]): Tile[] {
    return [...tiles].sort((a, b) => {
      // スートの優先順位: 萬子 < 筒子 < 索子 < 風牌 < 三元牌
      const suitOrder: Record<Suit, number> = {
        'man': 1,
        'pin': 2,
        'sou': 3,
        'wind': 4,
        'dragon': 5,
      };
      
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      
      // 同じスートの場合、数値でソート
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return a.value - b.value;
      }
      
      // 風牌、三元牌の順序
      if (a.suit === 'wind') {
        const windOrder = ['east', 'south', 'west', 'north'];
        return windOrder.indexOf(a.value as string) - windOrder.indexOf(b.value as string);
      }
      
      if (a.suit === 'dragon') {
        const dragonOrder = ['white', 'green', 'red'];
        return dragonOrder.indexOf(a.value as string) - dragonOrder.indexOf(b.value as string);
      }
      
      return 0;
    });
  }

  // 牌の表示名を取得
  public getTileDisplayName(tile: Tile): string {
    if (tile.suit === 'wind') {
      const windNames = { east: '東', south: '南', west: '西', north: '北' };
      return windNames[tile.value as keyof typeof windNames];
    }
    
    if (tile.suit === 'dragon') {
      const dragonNames = { white: '白', green: '發', red: '中' };
      return dragonNames[tile.value as keyof typeof dragonNames];
    }
    
    const suitNames = { man: '萬', pin: '筒', sou: '索' };
    return `${tile.value}${suitNames[tile.suit]}`;
  }

  // 牌のユニコード文字を取得（表示用）
  public getTileUnicode(tile: Tile): string {
    // 簡易的なマッピング（実際は麻雀牌のユニコードを使用）
    const unicodeMap: Record<string, string> = {
      'man_1': '🀇', 'man_2': '🀈', 'man_3': '🀉', 'man_4': '🀊', 'man_5': '🀋',
      'man_6': '🀌', 'man_7': '🀍', 'man_8': '🀎', 'man_9': '🀏',
      'pin_1': '🀙', 'pin_2': '🀚', 'pin_3': '🀛', 'pin_4': '🀜', 'pin_5': '🀝',
      'pin_6': '🀞', 'pin_7': '🀟', 'pin_8': '🀠', 'pin_9': '🀡',
      'sou_1': '🀐', 'sou_2': '🀑', 'sou_3': '🀒', 'sou_4': '🀓', 'sou_5': '🀔',
      'sou_6': '🀕', 'sou_7': '🀖', 'sou_8': '🀗', 'sou_9': '🀘',
      'wind_east': '🀀', 'wind_south': '🀁', 'wind_west': '🀂', 'wind_north': '🀃',
      'dragon_white': '🀆', 'dragon_green': '🀅', 'dragon_red': '🀄',
    };
    
    const key = `${tile.suit}_${tile.value}`;
    return unicodeMap[key] || '🀫';
  }
}
