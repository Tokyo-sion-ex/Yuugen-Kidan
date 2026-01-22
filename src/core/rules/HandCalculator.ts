import { Tile, Suit, TileValue } from '../../types/game.types';

type MeldType = 'sequence' | 'triplet' | 'kan' | 'pair';
type Meld = {
  type: MeldType;
  tiles: Tile[];
  suit?: Suit;
  value?: TileValue;
  isOpen: boolean;
};

export class HandCalculator {
  private redFives: boolean;

  constructor(redFives: boolean = true) {
    this.redFives = redFives;
  }

  // 完全な和了判定
  public isValidHand(hand: Tile[], winningTile: Tile): boolean {
    const fullHand = [...hand, winningTile];
    
    // 基本チェック
    if (fullHand.length !== 14) return false;
    
    // 国士無双判定
    if (this.isKokushiMusou(fullHand)) return true;
    
    // 七対子判定
    if (this.isChiitoitsu(fullHand)) return true;
    
    // 通常手判定
    return this.isRegularHand(fullHand);
  }

  // 国士無双判定
  private isKokushiMusou(hand: Tile[]): boolean {
    const requiredTiles = [
      { suit: 'man' as Suit, value: 1 },
      { suit: 'man' as Suit, value: 9 },
      { suit: 'pin' as Suit, value: 1 },
      { suit: 'pin' as Suit, value: 9 },
      { suit: 'sou' as Suit, value: 1 },
      { suit: 'sou' as Suit, value: 9 },
      { suit: 'wind' as Suit, value: 'east' },
      { suit: 'wind' as Suit, value: 'south' },
      { suit: 'wind' as Suit, value: 'west' },
      { suit: 'wind' as Suit, value: 'north' },
      { suit: 'dragon' as Suit, value: 'white' },
      { suit: 'dragon' as Suit, value: 'green' },
      { suit: 'dragon' as Suit, value: 'red' },
    ];

    // 各幺九牌が1枚以上あるかチェック
    for (const req of requiredTiles) {
      if (!hand.some(t => t.suit === req.suit && t.value === req.value)) {
        return false;
      }
    }

    // どれか1つが対子になっている
    const tileCounts = new Map<string, number>();
    for (const tile of hand) {
      const key = `${tile.suit}_${tile.value}`;
      tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
    }

    const duplicates = Array.from(tileCounts.values())
      .filter(count => count > 1)
      .reduce((sum, count) => sum + count, 0);

    return duplicates === 2; // 1つの牌が対子
  }

  // 七対子判定
  private isChiitoitsu(hand: Tile[]): boolean {
    if (hand.length !== 14) return false;

    const tileCounts = new Map<string, number>();
    for (const tile of hand) {
      const key = `${tile.suit}_${tile.value}`;
      tileCounts.set(key, (tileCounts.get(key) || 0) + 1);
    }

    // すべての牌が対子になっているかチェック
    for (const count of tileCounts.values()) {
      if (count !== 2) return false;
    }

    return tileCounts.size === 7;
  }

  // 通常手判定
  private isRegularHand(hand: Tile[]): boolean {
    // 面子分解を試みる
    const decompositions = this.decomposeHand(hand);
    return decompositions.length > 0;
  }

  // 手牌の面子分解
  public decomposeHand(hand: Tile[]): Meld[][] {
    const sortedHand = this.sortTiles([...hand]);
    const results: Meld[][] = [];
    
    this.recursiveDecompose(sortedHand, [], results);
    return results;
  }

  // 再帰的な面子分解
  private recursiveDecompose(
    remainingTiles: Tile[],
    currentMelds: Meld[],
    results: Meld[][]
  ): void {
    if (remainingTiles.length === 0) {
      // すべての牌が面子に分解された
      if (this.isValidDecomposition(currentMelds)) {
        results.push([...currentMelds]);
      }
      return;
    }

    // 対子（雀頭）を探す（まだ雀頭がない場合）
    const hasPair = currentMelds.some(meld => meld.type === 'pair');
    if (!hasPair && remainingTiles.length >= 2) {
      for (let i = 0; i < remainingTiles.length - 1; i++) {
        if (this.isPair(remainingTiles[i], remainingTiles[i + 1])) {
          const newRemaining = [...remainingTiles];
          const pairTiles = newRemaining.splice(i, 2);
          
          this.recursiveDecompose(
            newRemaining,
            [...currentMelds, {
              type: 'pair',
              tiles: pairTiles,
              isOpen: false
            }],
            results
          );
          break; // 対子は1つだけ
        }
      }
    }

    // 順子を探す
    if (remainingTiles.length >= 3) {
      const sequence = this.findSequence(remainingTiles);
      if (sequence) {
        const newRemaining = remainingTiles.filter((tile, index) => 
          !sequence.indices.includes(index)
        );
        
        this.recursiveDecompose(
          newRemaining,
          [...currentMelds, {
            type: 'sequence',
            tiles: sequence.tiles,
            suit: sequence.tiles[0].suit,
            value: sequence.tiles[0].value as number,
            isOpen: false
          }],
          results
        );
      }
    }

    // 刻子を探す
    if (remainingTiles.length >= 3) {
      const triplet = this.findTriplet(remainingTiles);
      if (triplet) {
        const newRemaining = remainingTiles.filter((tile, index) => 
          !triplet.indices.includes(index)
        );
        
        this.recursiveDecompose(
          newRemaining,
          [...currentMelds, {
            type: 'triplet',
            tiles: triplet.tiles,
            suit: triplet.tiles[0].suit,
            value: triplet.tiles[0].value,
            isOpen: false
          }],
          results
        );
      }
    }

    // 槓子を探す
    if (remainingTiles.length >= 4) {
      const kan = this.findKan(remainingTiles);
      if (kan) {
        const newRemaining = remainingTiles.filter((tile, index) => 
          !kan.indices.includes(index)
        );
        
        this.recursiveDecompose(
          newRemaining,
          [...currentMelds, {
            type: 'kan',
            tiles: kan.tiles,
            suit: kan.tiles[0].suit,
            value: kan.tiles[0].value,
            isOpen: false
          }],
          results
        );
      }
    }
  }

  // 有効な面子分解かチェック
  private isValidDecomposition(melds: Meld[]): boolean {
    const pairCount = melds.filter(m => m.type === 'pair').length;
    const otherMeldsCount = melds.filter(m => m.type !== 'pair').length;
    
    return pairCount === 1 && otherMeldsCount === 4;
  }

  // 対子判定
  private isPair(tile1: Tile, tile2: Tile): boolean {
    return tile1.suit === tile2.suit && tile1.value === tile2.value;
  }

  // 順子探索
  private findSequence(tiles: Tile[]): { tiles: Tile[]; indices: number[] } | null {
    // 数牌のみ順子になり得る
    const numberTiles = tiles.filter(t => 
      t.suit === 'man' || t.suit === 'pin' || t.suit === 'sou'
    );
    
    for (let i = 0; i < numberTiles.length - 2; i++) {
      const tile1 = numberTiles[i];
      const tile2 = numberTiles[i + 1];
      const tile3 = numberTiles[i + 2];
      
      if (tile1.suit === tile2.suit && tile2.suit === tile3.suit) {
        const values = [tile1.value, tile2.value, tile3.value];
        if (values.every(v => typeof v === 'number')) {
          const numValues = values as number[];
          if (numValues[0] + 1 === numValues[1] && numValues[1] + 1 === numValues[2]) {
            // 元のインデックスを取得
            const indices = [i, i + 1, i + 2];
            return {
              tiles: [tile1, tile2, tile3],
              indices
            };
          }
        }
      }
    }
    
    return null;
  }

  // 刻子探索
  private findTriplet(tiles: Tile[]): { tiles: Tile[]; indices: number[] } | null {
    for (let i = 0; i < tiles.length - 2; i++) {
      if (this.isPair(tiles[i], tiles[i + 1]) && this.isPair(tiles[i], tiles[i + 2])) {
        return {
          tiles: [tiles[i], tiles[i + 1], tiles[i + 2]],
          indices: [i, i + 1, i + 2]
        };
      }
    }
    return null;
  }

  // 槓子探索
  private findKan(tiles: Tile[]): { tiles: Tile[]; indices: number[] } | null {
    for (let i = 0; i < tiles.length - 3; i++) {
      if (
        this.isPair(tiles[i], tiles[i + 1]) &&
        this.isPair(tiles[i], tiles[i + 2]) &&
        this.isPair(tiles[i], tiles[i + 3])
      ) {
        return {
          tiles: [tiles[i], tiles[i + 1], tiles[i + 2], tiles[i + 3]],
          indices: [i, i + 1, i + 2, i + 3]
        };
      }
    }
    return null;
  }

  // 役の完全判定
  public calculateYaku(
    hand: Tile[],
    winningTile: Tile,
    isTsumo: boolean,
    isRiichi: boolean,
    isIppatsu: boolean,
    isDoubleRiichi: boolean,
    doraCount: number
  ): Array<{ name: string; han: number }> {
    const yaku: Array<{ name: string; han: number }> = [];
    const fullHand = [...hand, winningTile];
    
    // 門前清自摸和
    if (isTsumo) {
      yaku.push({ name: '門前清自摸和', han: 1 });
    }
    
    // 立直
    if (isRiichi) {
      yaku.push({ name: '立直', han: 1 });
    }
    
    // 一発
    if (isIppatsu) {
      yaku.push({ name: '一発', han: 1 });
    }
    
    // ダブル立直
    if (isDoubleRiichi) {
      yaku.push({ name: 'ダブル立直', han: 2 });
    }
    
    // 断幺九
    if (this.isTanyao(fullHand)) {
      yaku.push({ name: '断幺九', han: 1 });
    }
    
    // 平和
    const pinfu = this.checkPinfu(fullHand, winningTile, isTsumo);
    if (pinfu.isValid) {
      yaku.push({ name: '平和', han: 1 });
    }
    
    // 一盃口
    if (this.isIpeko(fullHand)) {
      yaku.push({ name: '一盃口', han: 1 });
    }
    
    // 三色同順
    if (this.isSanshokuDoujun(fullHand)) {
      yaku.push({ name: '三色同順', han: isTsumo ? 2 : 1 });
    }
    
    // 一気通貫
    if (this.isIkkitsuukan(fullHand)) {
      yaku.push({ name: '一気通貫', han: isTsumo ? 2 : 1 });
    }
    
    // 混全帯幺九
    if (this.isChanta(fullHand)) {
      yaku.push({ name: '混全帯幺九', han: isTsumo ? 2 : 1 });
    }
    
    // 三暗刻
    if (this.isSanankou(fullHand)) {
      yaku.push({ name: '三暗刻', han: 2 });
    }
    
    // 三槓子
    if (this.isSankantsu(fullHand)) {
      yaku.push({ name: '三槓子', han: 2 });
    }
    
    // 対々和
    if (this.isToitoi(fullHand)) {
      yaku.push({ name: '対々和', han: 2 });
    }
    
    // 三色同刻
    if (this.isSanshokuDoukou(fullHand)) {
      yaku.push({ name: '三色同刻', han: 2 });
    }
    
    // 小三元
    if (this.isShousangen(fullHand)) {
      yaku.push({ name: '小三元', han: 2 });
    }
    
    // 混老頭
    if (this.isHonroutou(fullHand)) {
      yaku.push({ name: '混老頭', han: 2 });
    }
    
    // 七対子
    if (this.isChiitoitsu(fullHand)) {
      yaku.push({ name: '七対子', han: 2 });
    }
    
    // 純全帯幺九
    if (this.isJunchan(fullHand)) {
      yaku.push({ name: '純全帯幺九', han: isTsumo ? 3 : 2 });
    }
    
    // 混一色
    if (this.isHonitsu(fullHand)) {
      yaku.push({ name: '混一色', han: isTsumo ? 3 : 2 });
    }
    
    // 清一色
    if (this.isChinitsu(fullHand)) {
      yaku.push({ name: '清一色', han: isTsumo ? 6 : 5 });
    }
    
    // 役満
    const yakuman = this.checkYakuman(fullHand, winningTile);
    yaku.push(...yakuman);
    
    // ドラ
    if (doraCount > 0) {
      yaku.push({ name: 'ドラ', han: doraCount });
    }
    
    return yaku;
  }

  // 断幺九
  private isTanyao(hand: Tile[]): boolean {
    return !hand.some(tile => {
      if (tile.suit === 'wind' || tile.suit === 'dragon') return true;
      if (typeof tile.value === 'number') {
        return tile.value === 1 || tile.value === 9;
      }
      return false;
    });
  }

  // 平和チェック
  private checkPinfu(hand: Tile[], winningTile: Tile, isTsumo: boolean): {
    isValid: boolean;
    waitType?: string;
  } {
    // 簡易実装
    return { isValid: false };
  }

  // 一盃口
  private isIpeko(hand: Tile[]): boolean {
    const decompositions = this.decomposeHand(hand);
    for (const decomposition of decompositions) {
      const sequences = decomposition.filter(meld => meld.type === 'sequence');
      const sequenceKeys = sequences.map(seq => 
        `${seq.suit}_${seq.value}`
      );
      
      const uniqueKeys = new Set(sequenceKeys);
      if (sequenceKeys.length !== uniqueKeys.size) {
        return true; // 重複する順子がある
      }
    }
    return false;
  }

  // 三色同順
  private isSanshokuDoujun(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 一気通貫
  private isIkkitsuukan(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 混全帯幺九
  private isChanta(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 三暗刻
  private isSanankou(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 三槓子
  private isSankantsu(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 対々和
  private isToitoi(hand: Tile[]): boolean {
    const decompositions = this.decomposeHand(hand);
    for (const decomposition of decompositions) {
      const melds = decomposition.filter(meld => meld.type !== 'pair');
      const allTriplets = melds.every(meld => 
        meld.type === 'triplet' || meld.type === 'kan'
      );
      if (allTriplets) return true;
    }
    return false;
  }

  // 三色同刻
  private isSanshokuDoukou(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 小三元
  private isShousangen(hand: Tile[]): boolean {
    const dragonCounts = {
      white: 0,
      green: 0,
      red: 0,
    };
    
    for (const tile of hand) {
      if (tile.suit === 'dragon') {
        dragonCounts[tile.value as keyof typeof dragonCounts]++;
      }
    }
    
    const hasPair = Object.values(dragonCounts).some(count => count >= 2);
    const hasTwoTriplets = Object.values(dragonCounts).filter(count => count >= 3).length >= 2;
    
    return hasPair && hasTwoTriplets;
  }

  // 混老頭
  private isHonroutou(hand: Tile[]): boolean {
    return hand.every(tile => {
      if (tile.suit === 'wind' || tile.suit === 'dragon') return true;
      if (typeof tile.value === 'number') {
        return tile.value === 1 || tile.value === 9;
      }
      return false;
    });
  }

  // 純全帯幺九
  private isJunchan(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 混一色
  private isHonitsu(hand: Tile[]): boolean {
    const suits = new Set(hand.map(t => t.suit));
    const hasHonors = suits.has('wind') || suits.has('dragon');
    const hasOneSuit = suits.size === (hasHonors ? 2 : 1);
    
    return hasOneSuit && suits.size <= 2;
  }

  // 清一色
  private isChinitsu(hand: Tile[]): boolean {
    const suits = new Set(hand.map(t => t.suit));
    return suits.size === 1 && !suits.has('wind') && !suits.has('dragon');
  }

  // 役満判定
  private checkYakuman(hand: Tile[], winningTile: Tile): Array<{ name: string; han: number }> {
    const yakuman: Array<{ name: string; han: number }> = [];
    
    // 国士無双
    if (this.isKokushiMusou(hand)) {
      yakuman.push({ name: '国士無双', han: 13 });
    }
    
    // 四暗刻
    if (this.isSuuankou(hand)) {
      yakuman.push({ name: '四暗刻', han: 13 });
    }
    
    // 大三元
    if (this.isDaisangen(hand)) {
      yakuman.push({ name: '大三元', han: 13 });
    }
    
    // 四喜和
    if (this.isSuushiihou(hand)) {
      yakuman.push({ name: '大四喜', han: 13 });
    } else if (this.isShousuushi(hand)) {
      yakuman.push({ name: '小四喜', han: 13 });
    }
    
    // 字一色
    if (this.isTsuuiisou(hand)) {
      yakuman.push({ name: '字一色', han: 13 });
    }
    
    // 清老頭
    if (this.isChinroutou(hand)) {
      yakuman.push({ name: '清老頭', han: 13 });
    }
    
    // 緑一色
    if (this.isRyuuiisou(hand)) {
      yakuman.push({ name: '緑一色', han: 13 });
    }
    
    // 九蓮宝燈
    if (this.isChuurenpoutou(hand)) {
      yakuman.push({ name: '九蓮宝燈', han: 13 });
    }
    
    return yakuman;
  }

  // 四暗刻
  private isSuuankou(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 大三元
  private isDaisangen(hand: Tile[]): boolean {
    const dragonCounts = {
      white: 0,
      green: 0,
      red: 0,
    };
    
    for (const tile of hand) {
      if (tile.suit === 'dragon') {
        dragonCounts[tile.value as keyof typeof dragonCounts]++;
      }
    }
    
    return Object.values(dragonCounts).every(count => count >= 3);
  }

  // 四喜和
  private isSuushiihou(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  private isShousuushi(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 字一色
  private isTsuuiisou(hand: Tile[]): boolean {
    return hand.every(tile => tile.suit === 'wind' || tile.suit === 'dragon');
  }

  // 清老頭
  private isChinroutou(hand: Tile[]): boolean {
    return hand.every(tile => {
      if (tile.suit === 'man' || tile.suit === 'pin' || tile.suit === 'sou') {
        return tile.value === 1 || tile.value === 9;
      }
      return false;
    });
  }

  // 緑一色
  private isRyuuiisou(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 九蓮宝燈
  private isChuurenpoutou(hand: Tile[]): boolean {
    // 簡易実装
    return false;
  }

  // 牌をソート
  private sortTiles(tiles: Tile[]): Tile[] {
    return [...tiles].sort((a, b) => {
      const suitOrder = { man: 1, pin: 2, sou: 3, wind: 4, dragon: 5 };
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        return a.value - b.value;
      }
      return 0;
    });
  }

  // 待ち牌の分析
  public analyzeWait(hand: Tile[]): {
    waitTiles: Tile[];
    waitType: string;
    shanten: number;
  } {
    // シャンテン数計算
    const shanten = this.calculateShanten(hand);
    
    // 待ち牌を探す
    const waitTiles = this.findWaitTiles(hand);
    
    // 待ちの種類を判定
    const waitType = this.determineWaitType(hand, waitTiles);
    
    return {
      waitTiles,
      waitType,
      shanten
    };
  }

  // シャンテン数計算
  private calculateShanten(hand: Tile[]): number {
    // 簡易実装
    return Math.max(0, 6 - Math.floor(hand.length / 2));
  }

  // 待ち牌を探す
  private findWaitTiles(hand: Tile[]): Tile[] {
    // すべての牌を試す
    const allTiles = this.generateAllTiles();
    const waitTiles: Tile[] = [];
    
    for (const testTile of allTiles) {
      const testHand = [...hand, testTile];
      if (this.isValidHand(hand, testTile)) {
        waitTiles.push(testTile);
      }
    }
    
    return waitTiles;
  }

  // すべての牌を生成
  private generateAllTiles(): Tile[] {
    const tiles: Tile[] = [];
    
    // 萬子
    for (let value = 1; value <= 9; value++) {
      tiles.push({
        id: `man_${value}_test`,
        suit: 'man',
        value,
        isRedFive: value === 5 && this.redFives
      });
    }
    
    // 筒子
    for (let value = 1; value <= 9; value++) {
      tiles.push({
        id: `pin_${value}_test`,
        suit: 'pin',
        value,
        isRedFive: value === 5 && this.redFives
      });
    }
    
    // 索子
    for (let value = 1; value <= 9; value++) {
      tiles.push({
        id: `sou_${value}_test`,
        suit: 'sou',
        value,
        isRedFive: value === 5 && this.redFives
      });
    }
    
    // 風牌
    const winds = ['east', 'south', 'west', 'north'] as const;
    for (const wind of winds) {
      tiles.push({
        id: `wind_${wind}_test`,
        suit: 'wind',
        value: wind
      });
    }
    
    // 三元牌
    const dragons = ['white', 'green', 'red'] as const;
    for (const dragon of dragons) {
      tiles.push({
        id: `dragon_${dragon}_test`,
        suit: 'dragon',
        value: dragon
      });
    }
    
    return tiles;
  }

  // 待ちの種類を判定
  private determineWaitType(hand: Tile[], waitTiles: Tile[]): string {
    if (waitTiles.length === 0) return '聴牌していません';
    if (waitTiles.length === 1) return '単騎待ち';
    
    // 同じ種類の連続した待ちかチェック
    const suitGroups = new Map<string, Tile[]>();
    for (const tile of waitTiles) {
      const key = tile.suit;
      if (!suitGroups.has(key)) suitGroups.set(key, []);
      suitGroups.get(key)!.push(tile);
    }
    
    for (const [suit, tiles] of suitGroups) {
      if (tiles.length >= 3) {
        const values = tiles.map(t => t.value).filter((v): v is number => typeof v === 'number');
        values.sort((a, b) => a - b);
        
        // 連続しているかチェック
        let isConsecutive = true;
        for (let i = 1; i < values.length; i++) {
          if (values[i] !== values[i - 1] + 1) {
            isConsecutive = false;
            break;
          }
        }
        
        if (isConsecutive) {
          if (values.length === 3) return '両面待ち';
          if (values.length === 2) {
            if (values[0] === 1) return '辺張待ち';
            if (values[1] === 9) return '辺張待ち';
            return '嵌張待ち';
          }
        }
      }
    }
    
    return '複合待ち';
  }
}
