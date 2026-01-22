import { Tile, Suit } from '../../types/game.types';

export class WinValidator {
  private redFives: boolean;

  constructor(redFives: boolean = true) {
    this.redFives = redFives;
  }

  // 和了判定（簡易版）
  public checkWin(hand: Tile[], winningTile: Tile, isTsumo: boolean): {
    isValid: boolean;
    yaku: string[];
    han: number;
    fu: number;
  } {
    // 手牌をコピーしてwinningTileを追加
    const fullHand = [...hand, winningTile];
    
    // 基本チェック
    if (fullHand.length !== 14) {
      return { isValid: false, yaku: [], han: 0, fu: 0 };
    }

    // 国士無双チェック
    const kokushiResult = this.checkKokushiMusou(fullHand);
    if (kokushiResult.isValid) {
      return kokushiResult;
    }

    // 七対子チェック
    const chiitoitsuResult = this.checkChiitoitsu(fullHand);
    if (chiitoitsuResult.isValid) {
      return chiitoitsuResult;
    }

    // 通常手チェック
    return this.checkRegularHand(fullHand, winningTile, isTsumo);
  }

  // 国士無双判定
  private checkKokushiMusou(hand: Tile[]): {
    isValid: boolean;
    yaku: string[];
    han: number;
    fu: number;
  } {
    const requiredTiles = [
      // 幺九牌
      { suit: 'man' as Suit, value: 1 },
      { suit: 'man' as Suit, value: 9 },
      { suit: 'pin' as Suit, value: 1 },
      { suit: 'pin' as Suit, value: 9 },
      { suit: 'sou' as Suit, value: 1 },
      { suit: 'sou' as Suit, value: 9 },
      // 風牌
      { suit: 'wind' as Suit, value: 'east' },
      { suit: 'wind' as Suit, value: 'south' },
      { suit: 'wind' as Suit, value: 'west' },
      { suit: 'wind' as Suit, value: 'north' },
      // 三元牌
      { suit: 'dragon' as Suit, value: 'white' },
      { suit: 'dragon' as Suit, value: 'green' },
      { suit: 'dragon' as Suit, value: 'red' },
    ];

    // 幺九牌を集計
    const yaochuCount = requiredTiles.filter(req => 
      hand.some(tile => 
        tile.suit === req.suit && 
        tile.value === req.value
      )
    ).length;

    // ダブりのある幺九牌をチェック
    const duplicates = requiredTiles.filter(req => 
      hand.filter(tile => 
        tile.suit === req.suit && 
        tile.value === req.value
      ).length > 1
    ).length;

    // 国士無双の条件: 13種類の幺九牌がすべてあり、そのうち1つがダブル
    if (yaochuCount === 13 && duplicates === 1) {
      return {
        isValid: true,
        yaku: ['国士無双'],
        han: 13, // 役満
        fu: 0,
      };
    }

    return { isValid: false, yaku: [], han: 0, fu: 0 };
  }

  // 七対子判定
  private checkChiitoitsu(hand: Tile[]): {
    isValid: boolean;
    yaku: string[];
    han: number;
    fu: number;
  } {
    // 14枚であることを確認
    if (hand.length !== 14) {
      return { isValid: false, yaku: [], han: 0, fu: 0 };
    }

    // 牌をソート
    const sortedHand = [...hand].sort((a, b) => {
      const suitOrder = { man: 1, pin: 2, sou: 3, wind: 4, dragon: 5 };
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return a.value - b.value;
      }
      return 0;
    });

    // 対子を数える
    let pairCount = 0;
    let i = 0;
    
    while (i < sortedHand.length) {
      if (i + 1 < sortedHand.length) {
        const tile1 = sortedHand[i];
        const tile2 = sortedHand[i + 1];
        
        // 同じ牌かチェック
        if (tile1.suit === tile2.suit && tile1.value === tile2.value) {
          pairCount++;
          i += 2;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }

    // 七対子の条件: 7つの対子
    if (pairCount === 7) {
      return {
        isValid: true,
        yaku: ['七対子'],
        han: 2,
        fu: 25,
      };
    }

    return { isValid: false, yaku: [], han: 0, fu: 0 };
  }

  // 通常手判定
  private checkRegularHand(
    hand: Tile[], 
    winningTile: Tile, 
    isTsumo: boolean
  ): {
    isValid: boolean;
    yaku: string[];
    han: number;
    fu: number;
  } {
    // ここでは簡易実装として基本的な和了判定のみ
    
    // 4面子1雀頭の形式をチェック
    const groups = this.groupTiles(hand);
    
    // 面子分解の試行
    const decompositions = this.decomposeHand(groups);
    
    if (decompositions.length === 0) {
      return { isValid: false, yaku: [], han: 0, fu: 0 };
    }

    // 役の判定
    const yaku = this.checkYaku(hand, winningTile, isTsumo, decompositions[0]);
    
    // 翻数を計算
    const han = this.calculateHan(yaku);
    
    // 符を計算
    const fu = this.calculateFu(hand, winningTile, isTsumo, decompositions[0]);

    return {
      isValid: true,
      yaku,
      han,
      fu,
    };
  }

  // 牌をグループ化
  private groupTiles(hand: Tile[]): Map<string, Tile[]> {
    const groups = new Map<string, Tile[]>();
    
    for (const tile of hand) {
      const key = `${tile.suit}_${tile.value}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(tile);
    }
    
    return groups;
  }

  // 手牌を面子分解する（簡易版）
  private decomposeHand(groups: Map<string, Tile[]>): any[] {
    // ここでは簡易実装として常に有効と仮定
    // 実際には再帰的な面子分解アルゴリズムが必要
    return [{
      melds: [],
      pair: null,
    }];
  }

  // 役の判定（簡易版）
  private checkYaku(
    hand: Tile[],
    winningTile: Tile,
    isTsumo: boolean,
    decomposition: any
  ): string[] {
    const yaku: string[] = [];

    // 門前清自摸和
    if (isTsumo) {
      yaku.push('門前清自摸和');
    }

    // 立直（リーチ）は別途判定が必要

    // 一盃口（イーペーコー）
    if (this.checkIpeko(decomposition.melds)) {
      yaku.push('一盃口');
    }

    // 断幺九（タンヤオ）
    if (this.checkTanyao(hand)) {
      yaku.push('断幺九');
    }

    // 平和（ピンフ）
    if (this.checkPinfu(decomposition)) {
      yaku.push('平和');
    }

    // 役牌（ヤクハイ）
    const yakuhai = this.checkYakuhai(decomposition.melds);
    yaku.push(...yakuhai);

    return yaku;
  }

  // 一盃口チェック
  private checkIpeko(melds: any[]): boolean {
    // 同じ順子が2組あるかチェック
    const sequenceCount = new Map<string, number>();
    
    for (const meld of melds) {
      if (meld.type === 'sequence') {
        const key = `${meld.suit}_${meld.start}`;
        sequenceCount.set(key, (sequenceCount.get(key) || 0) + 1);
      }
    }
    
    return Array.from(sequenceCount.values()).some(count => count >= 2);
  }

  // 断幺九チェック
  private checkTanyao(hand: Tile[]): boolean {
    // 幺九牌がないかチェック
    return !hand.some(tile => {
      if (tile.suit === 'wind' || tile.suit === 'dragon') {
        return true; // 字牌は幺九牌
      }
      
      if (typeof tile.value === 'number') {
        return tile.value === 1 || tile.value === 9; // 1, 9は幺九牌
      }
      
      return false;
    });
  }

  // 平和チェック
  private checkPinfu(decomposition: any): boolean {
    // 簡易実装: 常にfalse
    return false;
  }

  // 役牌チェック
  private checkYakuhai(melds: any[]): string[] {
    const yakuhai: string[] = [];
    
    for (const meld of melds) {
      if (meld.type === 'triplet' || meld.type === 'kan') {
        if (meld.suit === 'dragon') {
          yakuhai.push('役牌（三元牌）');
        } else if (meld.suit === 'wind') {
          // 場風、自風による判定が必要
          yakuhai.push('役牌（風牌）');
        }
      }
    }
    
    return yakuhai;
  }

  // 翻数を計算
  private calculateHan(yaku: string[]): number {
    // 簡易実装: 役の数×1翻
    return yaku.length;
  }

  // 符を計算
  private calculateFu(
    hand: Tile[],
    winningTile: Tile,
    isTsumo: boolean,
    decomposition: any
  ): number {
    let fu = 20; // 基本符

    // 門前ロンは+10符
    if (!isTsumo) {
      fu += 10;
    }

    // ツモは+2符
    if (isTsumo) {
      fu += 2;
    }

    // 雀頭が役牌なら+2符
    const head = decomposition.pair;
    if (head && (head.suit === 'dragon' || head.suit === 'wind')) {
      fu += 2;
    }

    // 面子による符計算
    for (const meld of decomposition.melds) {
      if (meld.type === 'triplet') {
        // 中張牌の暗刻は+4符、明刻は+2符
        // 幺九牌の暗刻は+8符、明刻は+4符
        fu += meld.isOpen ? 2 : 4;
        if (meld.suit === 'dragon' || meld.suit === 'wind' ||
            (typeof meld.value === 'number' && (meld.value === 1 || meld.value === 9))) {
          fu += meld.isOpen ? 4 : 8;
        }
      } else if (meld.type === 'kan') {
        // 槓子はさらに符が増える
        fu += meld.isOpen ? 8 : 16;
      }
    }

    // 待ちの種類による符
    // 辺張、嵌張、単騎待ちは+2符

    // 切り上げ
    fu = Math.ceil(fu / 10) * 10;
    
    return fu;
  }

  // 点数計算
  public calculateScore(
    han: number,
    fu: number,
    isDealer: boolean,
    isTsumo: boolean
  ): {
    total: number;
    payment: number[];
  } {
    // 基本点計算
    let basePoints = fu * Math.pow(2, han + 2);
    
    // 満貫以上の場合
    if (han >= 13) {
      basePoints = 8000; // 役満
    } else if (han >= 11) {
      basePoints = 6000; // 三倍満
    } else if (han >= 8) {
      basePoints = 4000; // 倍満
    } else if (han >= 6) {
      basePoints = 3000; // 跳満
    } else if (han >= 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70)) {
      basePoints = 2000; // 満貫
    }

    // 親と子で計算が異なる
    if (isDealer) {
      if (isTsumo) {
        // 親のツモ: 子から各2倍
        const fromEach = Math.ceil(basePoints * 2 / 100) * 100;
        return {
          total: fromEach * 3,
          payment: [0, fromEach, fromEach, fromEach],
        };
      } else {
        // 親のロン: 6倍
        const total = Math.ceil(basePoints * 6 / 100) * 100;
        return {
          total,
          payment: [total, 0, 0, 0],
        };
      }
    } else {
      if (isTsumo) {
        // 子のツモ: 親から2倍、子から1倍
        const fromParent = Math.ceil(basePoints * 2 / 100) * 100;
        const fromChild = Math.ceil(basePoints / 100) * 100;
        return {
          total: fromParent + fromChild * 2,
          payment: [fromParent, fromChild, fromChild, 0],
        };
      } else {
        // 子のロン: 4倍
        const total = Math.ceil(basePoints * 4 / 100) * 100;
        return {
          total,
          payment: [total, 0, 0, 0],
        };
      }
    }
  }
}
