import { GameRecord, TurnAction, TileEfficiency, PlayerTendency, GameInsight } from '../../types/game.types';
import { GameState } from '../game/GameState';
import { TileAnalyzer } from './TileAnalyzer'; // 新しい分析クラス
import { AIPlayer } from '../players/AIPlayer';

export class AdvancedGameRecorder {
  private currentRecord: GameRecord;
  private tileAnalyzer: TileAnalyzer;
  private aiAnalyst: AIPlayer; // AIを分析専用に利用
  private realTimeInsights: GameInsight[] = [];

  constructor(gameState: GameState) {
    this.currentRecord = this.initializeRecord(gameState);
    this.tileAnalyzer = new TileAnalyzer();
    this.aiAnalyst = new AIPlayer('analyst', 0);
    this.aiAnalyst.setAnalysisMode(true); // 分析専用モード
  }

  // 行動記録 + リアルタイム分析
  logAction(action: Omit<TurnAction, 'timestamp'>): GameInsight | null {
    const gameState = this.getCurrentGameState();
    const fullAction: TurnAction = {
      ...action,
      timestamp: Date.now()
    };

    // 牌効率分析を実行
    if (action.handState && action.action === 'discard') {
      const efficiency = this.tileAnalyzer.calculateEfficiency(
        action.handState,
        gameState.doraIndicators,
        gameState.round
      );
      fullAction.handEfficiency = efficiency;
      
      // AIによる最適手分析
      const suggestions = this.aiAnalyst.analyzeOptimalMove(
        action.handState,
        gameState,
        action.playerId
      );
      fullAction.suggestedActions = suggestions;
      
      // 重要な判断ミスを検出
      const insight = this.detectKeyDecision(
        action, 
        suggestions, 
        gameState
      );
      if (insight) this.realTimeInsights.push(insight);
    }

    this.currentRecord.actions.push(fullAction);
    
    // 10ターンごとに深い分析
    if (this.currentRecord.actions.length % 10 === 0) {
      this.performDeepAnalysis();
    }
    
    return insight;
  }

  // 牌効率分析クラス
  private class TileAnalyzer {
    calculateEfficiency(
      hand: TileType[], 
      dora: TileType[], 
      round: number
    ): TileEfficiency[] {
      const results: TileEfficiency[] = [];
      
      hand.forEach(tile => {
        // シンプルな効率計算（実際はより複雑なアルゴリズム）
        const efficiency = {
          tile,
          efficiencyScore: this.calculateTileScore(tile, hand, dora),
          possibleMelds: this.countPossibleMelds(hand, tile),
          waitImprovement: this.calculateWaitImprovement(hand, tile),
          dangerLevel: this.estimateDangerLevel(tile, round)
        };
        results.push(efficiency);
      });
      
      return results.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    }
    
    private calculateTileScore(tile: TileType, hand: TileType[], dora: TileType[]): number {
      // 簡易的なスコア計算
      let score = 50; // ベーススコア
      
      // ドラ関連
      if (dora.includes(tile)) score += 20;
      
      // 孤立牌ペナルティ
      if (this.isIsolatedTile(tile, hand)) score -= 15;
      
      // 中張牌ボーナス
      if (this.isMiddleTile(tile)) score += 10;
      
      return Math.max(0, Math.min(100, score));
    }
  }

  // 重要な判断検出
  private detectKeyDecision(
    action: TurnAction, 
    suggestions: SuggestedAction[],
    gameState: GameState
  ): GameInsight | null {
    const bestSuggestion = suggestions[0];
    
    // 最適手と実際の手が大きく異なる場合
    if (bestSuggestion && action.tile !== bestSuggestion.tile) {
      const valueDiff = bestSuggestion.expectedValue - 
        (action.handEfficiency?.[0]?.efficiencyScore || 50);
      
      if (valueDiff > 20) { // 価値差が大きい
        return {
          keyTurn: this.currentRecord.actions.length,
          turningPoint: this.isTurningPoint(gameState),
          missedOpportunities: [{
            playerId: action.playerId,
            action: bestSuggestion,
            actualAction: action
          }]
        };
      }
    }
    return null;
  }
}
