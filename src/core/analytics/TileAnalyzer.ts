import { TileType, TileEfficiency, TileDetail } from '../../types/game.types';

export class TileAnalyzer {
  private tileDatabase: Map<TileType, TileDetail>;
  
  constructor() {
    this.tileDatabase = this.initializeTileDatabase();
  }
  
  // 牌データベースの初期化
  private initializeTileDatabase(): Map<TileType, TileDetail> {
    const tiles = new Map<TileType, TileDetail>();
    
    // 萬子 (1-9)
    for (let i = 1; i <= 9; i++) {
      const tile: TileType = `m${i}`;
      tiles.set(tile, {
        type: tile,
        name: `${i}萬`,
        category: 'manzu',
        number: i,
        isYaochu: i === 1 || i === 9
      });
    }
    
    // 筒子 (1-9)
    for (let i = 1; i <= 9; i++) {
      const tile: TileType = `p${i}`;
      tiles.set(tile, {
        type: tile,
        name: `${i}筒`,
        category: 'pinzu',
        number: i,
        isYaochu: i === 1 || i === 9
      });
    }
    
    // 索子 (1-9)
    for (let i = 1; i <= 9; i++) {
      const tile: TileType = `s${i}`;
      tiles.set(tile, {
        type: tile,
        name: `${i}索`,
        category: 'souzu',
        number: i,
        isYaochu: i === 1 || i === 9
      });
    }
    
    // 風牌
    const winds = [
      { type: 'ton', name: '東', wind: 'east' },
      { type: 'nan', name: '南', wind: 'south' },
      { type: 'sha', name: '西', wind: 'west' },
      { type: 'pei', name: '北', wind: 'north' }
    ];
    
    winds.forEach(wind => {
      tiles.set(wind.type, {
        type: wind.type,
        name: wind.name,
        category: 'jihai',
        isYaochu: true,
        isWind: wind.wind as any
      });
    });
    
    // 三元牌
    const dragons = [
      { type: 'haku', name: '白', dragon: 'haku' },
      { type: 'hatsu', name: '發', dragon: 'hatsu' },
      { type: 'chun', name: '中', dragon: 'chun' }
    ];
    
    dragons.forEach(dragon => {
      tiles.set(dragon.type, {
        type: dragon.type,
        name: dragon.name,
        category: 'jihai',
        isYaochu: true,
        isDragon: dragon.dragon as any
      });
    });
    
    return tiles;
  }
  
  // 牌効率の計算（メイン関数）
  calculateEfficiency(
    hand: TileType[],
    doraIndicators: TileType[],
    round: number,
    playerWind: string,
    roundWind: string,
    discardHistory: TileType[] = []
  ): TileEfficiency[] {
    const results: TileEfficiency[] = [];
    
    // 手牌を数牌と字牌に分類
    const numberedTiles = hand.filter(tile => {
      const detail = this.tileDatabase.get(tile);
      return detail && detail.number !== undefined;
    });
    
    const honorTiles = hand.filter(tile => {
      const detail = this.tileDatabase.get(tile);
      return detail && detail.category === 'jihai';
    });
    
    // 各牌の効率を計算
    for (const tile of hand) {
      const detail = this.tileDatabase.get(tile);
      if (!detail) continue;
      
      let efficiencyScore = 50; // 基本スコア
      const reasons: string[] = [];
      
      // 1. ドラ関連の評価
      const doraValue = this.evaluateDoraValue(tile, doraIndicators);
      efficiencyScore += doraValue.score;
      if (doraValue.reason) reasons.push(doraValue.reason);
      
      // 2. 孤立度の評価（数牌のみ）
      if (detail.number !== undefined) {
        const isolationScore = this.evaluateIsolation(tile, numberedTiles);
        efficiencyScore += isolationScore.score;
        if (isolationScore.reason) reasons.push(isolationScore.reason);
      }
      
      // 3. 中張牌の評価
      if (detail.number && detail.number >= 3 && detail.number <= 7) {
        efficiencyScore += 10;
        reasons.push('中張牌は組み合わせの幅が広い');
      }
      
      // 4. 字牌の評価
      if (detail.category === 'jihai') {
        const honorScore = this.evaluateHonorTile(tile, playerWind, roundWind, hand);
        efficiencyScore += honorScore.score;
        if (honorScore.reason) reasons.push(honorScore.reason);
      }
      
      // 5. 危険度の評価（捨て牌履歴から）
      const dangerLevel = this.calculateDangerLevel(tile, discardHistory, round);
      
      // 6. 可能な面子構成の計算
      const possibleMelds = this.countPossibleMelds(tile, numberedTiles);
      
      // 7. 待ち改善度の計算
      const waitImprovement = this.calculateWaitImprovement(tile, numberedTiles);
      
      // スコアのクリッピング
      efficiencyScore = Math.max(0, Math.min(100, efficiencyScore));
      
      // 捨てる優先度の判定
      let discardPriority: 'high' | 'medium' | 'low';
      if (efficiencyScore < 30) {
        discardPriority = 'high';
      } else if (efficiencyScore < 60) {
        discardPriority = 'medium';
      } else {
        discardPriority = 'low';
      }
      
      results.push({
        tile,
        efficiencyScore: Math.round(efficiencyScore),
        possibleMelds,
        waitImprovement,
        dangerLevel,
        discardPriority,
        reasons
      });
    }
    
    // 効率スコアでソート
    return results.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  }
  
  // ドラ関連の評価
  private evaluateDoraValue(tile: TileType, doraIndicators: TileType[]): 
    { score: number; reason?: string } {
    
    let score = 0;
    let reason = '';
    
    // 表示ドラのチェック
    for (const dora of doraIndicators) {
      if (this.isDoraTile(tile, dora)) {
        score += 25;
        reason = 'ドラ牌です';
      }
    }
    
    // ドラ周辺牌の評価（ドラの±1）
    for (const dora of doraIndicators) {
      const doraDetail = this.tileDatabase.get(dora);
      const tileDetail = this.tileDatabase.get(tile);
      
      if (doraDetail?.number && tileDetail?.number) {
        const diff = Math.abs(doraDetail.number - tileDetail.number);
        if (diff === 1) {
          score += 5;
          reason = 'ドラの隣牌';
        } else if (diff === 2) {
          score += 2;
          reason = 'ドラの近い牌';
        }
      }
    }
    
    return { score, reason: reason || undefined };
  }
  
  // ドラ牌か判定
  private isDoraTile(tile: TileType, doraIndicator: TileType): boolean {
    const tileDetail = this.tileDatabase.get(tile);
    const doraDetail = this.tileDatabase.get(doraIndicator);
    
    if (!tileDetail || !doraDetail) return false;
    
    // 数牌の場合
    if (tileDetail.number && doraDetail.number) {
      if (tileDetail.category === doraDetail.category) {
        // 通常のドラ（次の数字）
        let nextNumber = doraDetail.number + 1;
        if (nextNumber > 9) nextNumber = 1;
        
        if (tileDetail.number === nextNumber) {
          return true;
        }
        
        // 赤ドラの考慮（必要に応じて）
      }
    }
    
    // 字牌の場合
    if (tileDetail.category === 'jihai' && doraDetail.category === 'jihai') {
      const order = ['ton', 'nan', 'sha', 'pei', 'haku', 'hatsu', 'chun'];
      const doraIndex = order.indexOf(doraIndicator);
      if (doraIndex !== -1) {
        const nextIndex = (doraIndex + 1) % order.length;
        return tile === order[nextIndex];
      }
    }
    
    return false;
  }
  
  // 孤立度の評価
  private evaluateIsolation(tile: TileType, numberedTiles: TileType[]): 
    { score: number; reason?: string } {
    
    const tileDetail = this.tileDatabase.get(tile);
    if (!tileDetail?.number) return { score: 0 };
    
    const number = tileDetail.number;
    const category = tileDetail.category;
    
    // 同じ種類の牌をフィルタリング
    const sameCategoryTiles = numberedTiles.filter(t => {
      const detail = this.tileDatabase.get(t);
      return detail?.category === category;
    });
    
    // 近い牌の存在チェック（±2以内）
    let hasNeighbor = false;
    for (const otherTile of sameCategoryTiles) {
      if (otherTile === tile) continue;
      
      const otherDetail = this.tileDatabase.get(otherTile);
      if (otherDetail?.number) {
        const diff = Math.abs(number - otherDetail.number);
        if (diff <= 2) {
          hasNeighbor = true;
          break;
        }
      }
    }
    
    if (!hasNeighbor) {
      return { 
        score: -20, 
        reason: '孤立した牌（近くに繋がる牌がない）' 
      };
    }
    
    // 1枚だけ離れている牌（浮き牌）のチェック
    let floatingPenalty = 0;
    const sameNumberCount = sameCategoryTiles.filter(t => {
      const detail = this.tileDatabase.get(t);
      return detail?.number === number;
    }).length;
    
    if (sameNumberCount === 1) {
      // 同じ数字の牌が他にない
      floatingPenalty -= 5;
    }
    
    return { 
      score: floatingPenalty, 
      reason: floatingPenalty < 0 ? '浮き牌（対子になりにくい）' : undefined 
    };
  }
  
  // 字牌の評価
  private evaluateHonorTile(
    tile: TileType, 
    playerWind: string, 
    roundWind: string,
    hand: TileType[]
  ): { score: number; reason?: string } {
    
    const tileDetail = this.tileDatabase.get(tile);
    if (!tileDetail) return { score: 0 };
    
    let score = 0;
    const reasons: string[] = [];
    
    // 自風・場風のチェック
    if (tileDetail.isWind) {
      if (tileDetail.isWind === playerWind) {
        score += 15;
        reasons.push('自風牌');
      }
      if (tileDetail.isWind === roundWind) {
        score += 10;
        reasons.push('場風牌');
      }
    }
    
    // 三元牌
    if (tileDetail.isDragon) {
      score += 10;
      reasons.push('三元牌');
    }
    
    // 対子・暗刻の可能性
    const sameTileCount = hand.filter(t => t === tile).length;
    if (sameTileCount >= 2) {
      score += 5 * (sameTileCount - 1);
      reasons.push(`同じ字牌が${sameTileCount}枚ある`);
    }
    
    // 字牌は基本的に早めに切りたい（ただし役牌は例外）
    if (score === 0) {
      score = -10;
      reasons.push('役のない字牌');
    }
    
    return { 
      score, 
      reason: reasons.join('、') || undefined 
    };
  }
  
  // 危険度の計算
  private calculateDangerLevel(
    tile: TileType, 
    discardHistory: TileType[], 
    round: number
  ): number {
    
    // 簡易的な危険度計算
    const tileDetail = this.tileDatabase.get(tile);
    if (!tileDetail) return 0;
    
    let danger = 0;
    
    // 1. 場に捨てられていない牌は危険
    const hasBeenDiscarded = discardHistory.includes(tile);
    if (!hasBeenDiscarded) {
      danger += 30;
    }
    
    // 2. 中張牌の危険度（特に5）
    if (tileDetail.number === 5) {
      danger += 15;
    } else if (tileDetail.number && tileDetail.number >= 4 && tileDetail.number <= 6) {
      danger += 10;
    }
    
    // 3. 後半戦になるほど危険度上昇
    danger += Math.min(30, round * 3);
    
    // 4. 字牌は序盤以外は比較的安全
    if (tileDetail.category === 'jihai' && round > 6) {
      danger -= 20;
    }
    
    // 5. 19牌は序盤は危険、終盤は安全
    if (tileDetail.isYaochu) {
      if (round <= 6) {
        danger += 15;
      } else {
        danger -= 10;
      }
    }
    
    return Math.max(0, Math.min(100, danger));
  }
  
  // 可能な面子構成の計算
  private countPossibleMelds(tile: TileType, numberedTiles: TileType[]): number {
    const tileDetail = this.tileDatabase.get(tile);
    if (!tileDetail?.number) return 0;
    
    const number = tileDetail.number;
    const category = tileDetail.category;
    
    // 同じ種類の牌を抽出
    const sameCategory = numberedTiles.filter(t => {
      const detail = this.tileDatabase.get(t);
      return detail?.category === category;
    });
    
    let meldCount = 0;
    
    // 刻子（同じ牌）の可能性
    const sameNumberCount = sameCategory.filter(t => {
      const detail = this.tileDatabase.get(t);
      return detail?.number === number;
    }).length;
    
    if (sameNumberCount >= 2) { // 対子があれば刻子の可能性
      meldCount += 1;
    }
    
    // 順子の可能性
    const numbers = sameCategory
      .map(t => this.tileDatabase.get(t)?.number)
      .filter((n): n is number => n !== undefined)
      .sort((a, b) => a - b);
    
    // 前後の数字をチェック
    const hasPrev1 = numbers.includes(number - 1);
    const hasPrev2 = numbers.includes(number - 2);
    const hasNext1 = numbers.includes(number + 1);
    const hasNext2 = numbers.includes(number + 2);
    
    // 順子のパターン
    if (hasPrev1 && hasPrev2) meldCount += 1; // n-2, n-1, n
    if (hasPrev1 && hasNext1) meldCount += 1; // n-1, n, n+1
    if (hasNext1 && hasNext2) meldCount += 1; // n, n+1, n+2
    
    return meldCount;
  }
  
  // 待ち改善度の計算
  private calculateWaitImprovement(tile: TileType, numberedTiles: TileType[]): number {
    // この牌を切った場合の待ちの広さの変化を計算
    // 簡易版：この牌がどの程度待ちを狭めているか
    
    const tileDetail = this.tileDatabase.get(tile);
    if (!tileDetail?.number) return 50; // 字牌はデフォルト値
    
    // 実際の実装ではもっと複雑な計算が必要
    // ここでは簡易的な評価
    
    if (tileDetail.isYaochu) {
      return 30; // 19牌・字牌は待ちを狭めがち
    }
    
    if (tileDetail.number >= 3 && tileDetail.number <= 7) {
      return 70; // 中張牌は待ちを広げやすい
    }
    
    return 50; // 28牌は中間
  }
  
  // 高度な分析：手牌全体の評価
  analyzeCompleteHand(
    hand: TileType[],
    doraIndicators: TileType[],
    round: number
  ): {
    overallEfficiency: number;
    tenpaiProbability: number;
    suggestedDiscards: TileType[];
    handType: 'ready' | 'one_away' | 'two_away' | 'far';
  } {
    const efficiencies = this.calculateEfficiency(
      hand, 
      doraIndicators, 
      round, 
      'east', 
      'east',
      []
    );
    
    const overallEfficiency = efficiencies.reduce(
      (sum, eff) => sum + eff.efficiencyScore, 
      0
    ) / efficiencies.length;
    
    // テンパイ確率の簡易計算
    let tenpaiProbability = 0;
    if (hand.length === 13) {
      // シャンテン数に基づく簡易計算
      const shanten = this.calculateShanten(hand);
      tenpaiProbability = Math.max(0, 100 - (shanten * 25));
    }
    
    // 捨てるべき牌（効率スコアが低い順）
    const suggestedDiscards = efficiencies
      .sort((a, b) => a.efficiencyScore - b.efficiencyScore)
      .slice(0, 3)
      .map(eff => eff.tile);
    
    // 手牌の状態分類
    const uniqueTiles = new Set(hand);
    let handType: 'ready' | 'one_away' | 'two_away' | 'far';
    
    if (tenpaiProbability >= 80) {
      handType = 'ready';
    } else if (tenpaiProbability >= 50) {
      handType = 'one_away';
    } else if (tenpaiProbability >= 20) {
      handType = 'two_away';
    } else {
      handType = 'far';
    }
    
    return {
      overallEfficiency: Math.round(overallEfficiency),
      tenpaiProbability: Math.round(tenpaiProbability),
      suggestedDiscards,
      handType
    };
  }
  
  // シャンテン数の計算（簡易版）
  private calculateShanten(hand: TileType[]): number {
    // 実際のシャンテン計算は複雑なので簡易版
    // 完全な実装には別のアルゴリズムが必要
    
    // ここでは牌の種類の多さから簡易評価
    const uniqueCount = new Set(hand).size;
    const pairCount = this.countPairs(hand);
    
    // 簡易的なシャンテン計算
    let shanten = 8; // 最大シャンテン
    
    // 対子があるとシャンテンが減る
    shanten -= pairCount;
    
    // 牌の種類が少ない（＝面子が作りやすい）
    if (uniqueCount < 9) {
      shanten -= 2;
    } else if (uniqueCount < 11) {
      shanten -= 1;
    }
    
    return Math.max(0, shanten);
  }
  
  private countPairs(hand: TileType[]): number {
    const counts = new Map<TileType, number>();
    
    for (const tile of hand) {
      counts.set(tile, (counts.get(tile) || 0) + 1);
    }
    
    let pairCount = 0;
    for (const count of counts.values()) {
      if (count >= 2) {
        pairCount++;
      }
    }
    
    return pairCount;
  }
  
  // デバッグ用：牌の情報を表示
  getTileInfo(tile: TileType): TileDetail | undefined {
    return this.tileDatabase.get(tile);
  }
  
  // 牌のリストを分類して表示
  categorizeTiles(tiles: TileType[]): {
    manzu: TileType[];
    pinzu: TileType[];
    souzu: TileType[];
    winds: TileType[];
    dragons: TileType[];
  } {
    return {
      manzu: tiles.filter(t => this.tileDatabase.get(t)?.category === 'manzu'),
      pinzu: tiles.filter(t => this.tileDatabase.get(t)?.category === 'pinzu'),
      souzu: tiles.filter(t => this.tileDatabase.get(t)?.category === 'souzu'),
      winds: tiles.filter(t => {
        const detail = this.tileDatabase.get(t);
        return detail?.category === 'jihai' && detail.isWind;
      }),
      dragons: tiles.filter(t => {
        const detail = this.tileDatabase.get(t);
        return detail?.category === 'jihai' && detail.isDragon;
      })
    };
  }
}

// シングルトンインスタンス
export const tileAnalyzer = new TileAnalyzer();
