import { Player, Tile } from '../../types/game.types';

export class PointCalculator {
  private uma: [number, number, number, number]; // ウマ
  private oka: number; // オカ
  private startingPoints: number;

  constructor(
    startingPoints: number = 25000,
    uma: [number, number, number, number] = [20, 10, -10, -20],
    oka: number = 30000
  ) {
    this.startingPoints = startingPoints;
    this.uma = uma;
    this.oka = oka;
  }

  // ゲーム終了時の最終点数計算
  public calculateFinalScores(players: Player[]): {
    finalScores: number[];
    umaPoints: number[];
    rank: number[];
  } {
    // 現在の点数を基準に計算
    const currentScores = players.map(player => player.points);
    
    // 順位を決定
    const sortedIndices = [...players]
      .map((_, index) => index)
      .sort((a, b) => currentScores[b] - currentScores[a]);
    
    // 順位マップ
    const rank = new Array(players.length);
    sortedIndices.forEach((playerIndex, rankIndex) => {
      rank[playerIndex] = rankIndex + 1;
    });
    
    // ウマ計算
    const umaPoints = this.calculateUmaPoints(rank);
    
    // オカ計算
    const okaPoints = this.calculateOkaPoints(currentScores);
    
    // 最終点数計算
    const finalScores = currentScores.map((score, index) => {
      return score + umaPoints[index] + okaPoints[index];
    });
    
    return {
      finalScores,
      umaPoints,
      rank,
    };
  }

  // ウマポイント計算
  private calculateUmaPoints(rank: number[]): number[] {
    return rank.map(r => {
      const umaValue = this.uma[r - 1];
      return umaValue * 1000; // ウマは1000点単位
    });
  }

  // オカ計算（返し）
  private calculateOkaPoints(currentScores: number[]): number[] {
    const totalPoints = currentScores.reduce((sum, score) => sum + score, 0);
    const targetTotal = this.oka * 4; // 4人分のオカ合計
    
    if (totalPoints === targetTotal) {
      return currentScores.map(() => 0);
    }
    
    // 点数調整
    const adjustment = (targetTotal - totalPoints) / 4;
    return currentScores.map(() => adjustment);
  }

  // 和了時の点数移動
  public calculateWinPayment(
    winnerIndex: number,
    loserIndex: number | null, // nullの場合はツモ
    basePoints: number,
    isDealer: boolean
  ): {
    payments: number[];
    total: number;
  } {
    const payments = [0, 0, 0, 0];
    
    if (loserIndex === null) {
      // ツモの場合
      if (isDealer) {
        // 親のツモ
        const fromEach = Math.ceil(basePoints * 2 / 100) * 100;
        for (let i = 0; i < 4; i++) {
          if (i !== winnerIndex) {
            payments[i] = -fromEach;
          }
        }
        payments[winnerIndex] = fromEach * 3;
      } else {
        // 子のツモ
        const fromParent = Math.ceil(basePoints * 2 / 100) * 100;
        const fromChild = Math.ceil(basePoints / 100) * 100;
        
        for (let i = 0; i < 4; i++) {
          if (i === 0) {
            // 親
            payments[i] = winnerIndex === 0 ? fromParent * 3 : -fromParent;
          } else if (i !== winnerIndex) {
            // 他の子
            payments[i] = -fromChild;
          }
        }
        
        if (winnerIndex === 0) {
          payments[winnerIndex] = fromParent * 3;
        } else {
          payments[winnerIndex] = fromParent + fromChild * 2;
        }
      }
    } else {
      // ロンの場合
      const total = Math.ceil(
        basePoints * (isDealer ? 6 : 4) / 100
      ) * 100;
      
      payments[loserIndex] = -total;
      payments[winnerIndex] = total;
    }
    
    return {
      payments,
      total: Math.abs(payments[winnerIndex]),
    };
  }

  // 流局時の点数計算
  public calculateDrawScores(
    players: Player[],
    tenpaiPlayers: boolean[]
  ): {
    payments: number[];
  } {
    const payments = [0, 0, 0, 0];
    const tenpaiCount = tenpaiPlayers.filter(t => t).length;
    
    if (tenpaiCount === 0 || tenpaiCount === 4) {
      // 全員聴牌または全員不聴の場合は点移動なし
      return { payments };
    }
    
    // 聴牌者から不聴者への点移動
    const paymentPerTenpai = (3000 * tenpaiCount) / (4 - tenpaiCount);
    
    for (let i = 0; i < 4; i++) {
      if (tenpaiPlayers[i]) {
        // 聴牌者は受け取る
        payments[i] = paymentPerTenpai;
      } else {
        // 不聴者は支払う
        payments[i] = -paymentPerTenpai;
      }
    }
    
    return { payments };
  }

  // リーチ棒の分配
  public distributeRiichiSticks(
    players: Player[],
    riichiSticks: number
  ): {
    payments: number[];
  } {
    const payments = [0, 0, 0, 0];
    
    if (riichiSticks === 0) {
      return { payments };
    }
    
    // 和了者がリーチ棒を全額受け取る
    // ここでは呼び出し元で和了者を指定する必要がある
    return { payments };
  }

  // 点数表示用フォーマット
  public formatPoints(points: number): string {
    if (points >= 0) {
      return `+${points.toLocaleString()}`;
    } else {
      return points.toLocaleString();
    }
  }

  // ランキング情報を生成
  public createRankingInfo(
    players: Player[],
    finalScores: number[],
    rank: number[]
  ): Array<{
    name: string;
    rank: number;
    score: number;
    change: number;
  }> {
    return players.map((player, index) => ({
      name: player.name,
      rank: rank[index],
      score: finalScores[index],
      change: finalScores[index] - this.startingPoints,
    }));
  }
}
