import { TileType, SuggestedAction, GameContext, TurnAction } from '../../types/game.types';
import { TileAnalyzer } from './TileAnalyzer';
import { AIPlayer } from '../players/AIPlayer';

export class AIAnalyzer {
  private tileAnalyzer: TileAnalyzer;
  private aiPlayer: AIPlayer;
  
  constructor() {
    this.tileAnalyzer = new TileAnalyzer();
    this.aiPlayer = new AIPlayer('analyzer', 0);
    this.aiPlayer.setAnalysisMode(true);
  }
  
  // 現在の局面での最適な行動を提案
  suggestOptimalActions(
    playerId: number,
    hand: TileType[],
    discards: TileType[],
    context: GameContext,
    lastAction?: TurnAction
  ): SuggestedAction[] {
    const suggestions: SuggestedAction[] = [];
    
    // 1. 捨て牌の提案
    const discardSuggestions = this.suggestDiscards(hand, context, discards);
    suggestions.push(...discardSuggestions);
    
    // 2. 鳴きの提案（もし可能なら）
    if (lastAction && lastAction.action === 'discard' && lastAction.playerId !== playerId) {
      const callSuggestions = this.suggestCalls(hand, lastAction.tile!, context, playerId);
      suggestions.push(...callSuggestions);
    }
    
    // 3. 立直の提案
    const riichiSuggestion = this.suggestRiichi(hand, context, playerId);
    if (riichiSuggestion) {
      suggestions.push(riichiSuggestion);
    }
    
    // 信頼度を計算してソート
    suggestions.forEach(suggestion => {
      suggestion.confidence = this.calculateConfidence(suggestion, context);
    });
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
  
  // 捨て牌の提案
  private suggestDiscards(
    hand: TileType[],
    context: GameContext,
    discards: TileType[]
  ): SuggestedAction[] {
    const efficiencies = this.tileAnalyzer.calculateEfficiency(
      hand,
      context.doraIndicators,
      context.round,
      context.playerWind[0] || 'east',
      context.roundWind,
      discards
    );
    
    // 効率スコアが低いもの（捨てる候補）を提案
    return efficiencies
      .filter(eff => eff.efficiencyScore < 60)
      .slice(0, 3)
      .map(eff => ({
        type: 'discard' as const,
        tile: eff.tile,
        reason: this.getDiscardReason(eff),
        expectedValue: this.calculateExpectedValue(eff, 'discard'),
        confidence: 0.7
      }));
  }
  
  // 鳴きの提案
  private suggestCalls(
    hand: TileType[],
    discardedTile: TileType,
    context: GameContext,
    playerId: number
  ): SuggestedAction[] {
    const suggestions: SuggestedAction[] = [];
    
    // ポンの可能性
    if (this.canPon(hand, discardedTile)) {
      suggestions.push({
        type: 'pon',
        tile: discardedTile,
        reason: this.getPonReason(hand, discardedTile, context),
        expectedValue: 15,
        confidence: 0.6
      });
    }
    
    // チーの可能性（下家の捨て牌のみ）
    // 実際にはプレイヤーの位置関係が必要
    if (this.canChii(hand, discardedTile)) {
      suggestions.push({
        type: 'chii',
        tile: discardedTile,
        reason: this.getChiiReason(hand, discardedTile, context),
        expectedValue: 10,
        confidence: 0.5
      });
    }
    
    return suggestions;
  }
  
  // 立直の提案
  private suggestRiichi(
    hand: TileType[],
    context: GameContext,
    playerId: number
  ): SuggestedAction | null {
    
    // 立直が既にかかっている場合は提案しない
    if (context.riichis.includes(playerId)) {
      return null;
    }
    
    // テンパイ判定（簡易版）
    const analysis = this.tileAnalyzer.analyzeCompleteHand(
      hand,
      context.doraIndicators,
      context.round
    );
    
    if (analysis.tenpaiProbability >= 80) {
      // 最も効率の悪い牌を立直宣言牌として提案
      const efficiencies = this.tileAnalyzer.calculateEfficiency(
        hand,
        context.doraIndicators,
        context.round,
        context.playerWind[0] || 'east',
        context.roundWind,
        []
      );
      
      const worstTile = efficiencies[efficiencies.length - 1];
      
      return {
        type: 'riichi',
        tile: worstTile.tile,
        reason: this.getRiichiReason(analysis, context),
        expectedValue: 25,
        confidence: 0.8
      };
    }
    
    return null;
  }
  
  // 捨て牌の理由を生成
  private getDiscardReason(efficiency: any): string {
    const reasons: string[] = [];
    
    if (efficiency.efficiencyScore < 30) {
      reasons.push('効率が非常に悪い');
    } else if (efficiency.efficiencyScore < 50) {
      reasons.push('効率が悪い');
    }
    
    if (efficiency.dangerLevel && efficiency.dangerLevel > 60) {
      reasons.push('放銃の危険が高い');
    }
    
    if (efficiency.possibleMelds === 0) {
      reasons.push('面子構成の可能性がない');
    }
    
    if (efficiency.discardPriority === 'high') {
      reasons.push('最優先で捨てるべき牌');
    }
    
    return reasons.length > 0 
      ? reasons.join('、') 
      : '効率を考慮した捨て牌';
  }
  
  // ポンの理由
  private getPonReason(hand: TileType[], tile: TileType, context: GameContext): string {
    const tileCount = hand.filter(t => t === tile).length;
    const reasons: string[] = [];
    
    if (tileCount >= 2) {
      reasons.push('暗刻になる');
    }
    
    // 役牌のチェック
    const tileDetail = this.tileAnalyzer.getTileInfo(tile);
    if (tileDetail?.isDragon) {
      reasons.push('三元牌で役が確定');
    } else if (tileDetail?.isWind) {
      if (tileDetail.isWind === context.playerWind[0]) {
        reasons.push('自風牌で役が確定');
      }
      if (tileDetail.isWind === context.roundWind) {
        reasons.push('場風牌で役が確定');
      }
    }
    
    return reasons.length > 0 
      ? `ポンを推奨: ${reasons.join('、')}` 
      : 'ポンで面子が完成します';
  }
  
  // チーの理由
  private getChiiReason(hand: TileType[], tile: TileType, context: GameContext): string {
    const tileDetail = this.tileAnalyzer.getTileInfo(tile);
    if (!tileDetail?.number) return 'チーで面子が完成します';
    
    const reasons: string[] = ['面子が完成する'];
    
    // ドラ周辺牌の場合
    for (const dora of context.doraIndicators) {
      const doraDetail = this.tileAnalyzer.getTileInfo(dora);
      if (doraDetail?.number && Math.abs(doraDetail.number - tileDetail.number) <= 2) {
        reasons.push('ドラに近い牌');
        break;
      }
    }
    
    return `チーを推奨: ${reasons.join('、')}`;
  }
  
  // 立直の理由
  private getRiichiReason(analysis: any, context: GameContext): string {
    const reasons: string[] = ['テンパイしている'];
    
    // ドラの数
    const doraCount = context.doraIndicators.length;
    if (doraCount >= 2) {
      reasons.push('ドラが多い');
    }
    
    // 本場が少ない（新規立直が有効）
    if (context.honba === 0) {
      reasons.push('本場が0');
    }
    
    // 点数状況（簡易的）
    const playerScore = context.scores[0] || 25000;
    if (playerScore > 30000) {
      reasons.push('点数に余裕がある');
    }
    
    return `立直を推奨: ${reasons.join('、')}`;
  }
  
  // 期待値の計算
  private calculateExpectedValue(efficiency: any, actionType: string): number {
    let baseValue = 100 - efficiency.efficiencyScore;
    
    // アクションタイプによる調整
    switch (actionType) {
      case 'discard':
        if (efficiency.dangerLevel && efficiency.dangerLevel > 70) {
          baseValue -= 30; // 危険な牌は期待値が低い
        }
        break;
      case 'pon':
        baseValue += 20;
        break;
      case 'riichi':
        baseValue += 30;
        break;
    }
    
    return Math.max(0, Math.min(100, baseValue));
  }
  
  // 信頼度の計算
  private calculateConfidence(suggestion: SuggestedAction, context: GameContext): number {
    let confidence = suggestion.confidence || 0.5;
    
    // コンテキストに基づく調整
    if (context.round > 10) {
      // 終盤は判断の信頼度が下がる
      confidence *= 0.8;
    }
    
    // 立直者がいると危険度の判断が難しくなる
    if (context.riichis.length > 0) {
      if (suggestion.type === 'discard') {
        confidence *= 0.7;
      }
    }
    
    return Math.min(0.95, confidence);
  }
  
  // ポン可能か判定
  private canPon(hand: TileType[], tile: TileType): boolean {
    const sameTileCount = hand.filter(t => t === tile).length;
    return sameTileCount >= 2;
  }
  
  // チー可能か判定（簡易版）
  private canChii(hand: TileType[], tile: TileType): boolean {
    const tileDetail = this.tileAnalyzer.getTileInfo(tile);
    if (!tileDetail?.number || tileDetail.category === 'jihai') {
      return false; // 字牌はチーできない
    }
    
    const number = tileDetail.number;
    const category = tileDetail.category;
    
    // 同じ種類の牌を抽出
    const sameCategory = hand.filter(t => {
      const detail = this.tileAnalyzer.getTileInfo(t);
      return detail?.category === category;
    });
    
    // 可能な順子のパターンをチェック
    const numbers = sameCategory
      .map(t => this.tileAnalyzer.getTileInfo(t)?.number)
      .filter((n): n is number => n !== undefined)
      .sort((a, b) => a - b);
    
    // 例：5をチーするには4と6か、3と4か、6と7が必要
    if (numbers.includes(number - 2) && numbers.includes(number - 1)) {
      return true; // 3-4-5
    }
    if (numbers.includes(number - 1) && numbers.includes(number + 1)) {
      return true; // 4-5-6
    }
    if (numbers.includes(number + 1) && numbers.includes(number + 2)) {
      return true; // 5-6-7
    }
    
    return false;
  }
  
  // 局面の評価
  evaluateSituation(
    playerId: number,
    scores: { [key: number]: number },
    round: number,
    riichis: number[]
  ): {
    situation: 'leading' | 'trailing' | 'neutral' | 'danger';
    recommendedStrategy: 'aggressive' | 'defensive' | 'balanced';
    riskTolerance: number; // 0-100
  } {
    const playerScore = scores[playerId] || 25000;
    const averageScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
    
    let situation: 'leading' | 'trailing' | 'neutral' | 'danger';
    let recommendedStrategy: 'aggressive' | 'defensive' | 'balanced';
    let riskTolerance: number;
    
    // 状況判定
    if (playerScore > averageScore * 1.2) {
      situation = 'leading';
      recommendedStrategy = 'defensive';
      riskTolerance = 20;
    } else if (playerScore < averageScore * 0.8) {
      situation = 'trailing';
      recommendedStrategy = 'aggressive';
      riskTolerance = 70;
    } else if (riichis.length > 0) {
      situation = 'danger';
      recommendedStrategy = 'defensive';
      riskTolerance = 10;
    } else {
      situation = 'neutral';
      recommendedStrategy = 'balanced';
      riskTolerance = 50;
    }
    
    // 終盤になるほど守備的に
    if (round > 8) {
      riskTolerance *= 0.7;
      if (recommendedStrategy === 'aggressive') {
        recommendedStrategy = 'balanced';
      }
    }
    
    return {
      situation,
      recommendedStrategy,
      riskTolerance: Math.round(riskTolerance)
    };
  }
}

// シングルトンインスタンス
export const aiAnalyzer = new AIAnalyzer();
