import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameEngine } from '../../core/game/GameEngine';
import { GameMode, Tile } from '../../types/game.types';
import PlayerHand from './PlayerHand';
import DiscardPile from './DiscardPile';
import PlayerInfo from './PlayerInfo';
import WallDisplay from './WallDisplay';
import ScoreBoard from './ScoreBoard';
import ActionButtons from './ActionButtons';
import GameControls from './GameControls';
import { useMahjongSounds } from '../../hooks/useMahjongSounds';
import './MahjongTable.css';

interface MahjongTableProps {
  gameMode: GameMode;
  onExit: () => void;
}

const MahjongTable: React.FC<MahjongTableProps> = ({ gameMode, onExit }) => {
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [showScoreBoard, setShowScoreBoard] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');
  
  const { playSound, playBGM } = useMahjongSounds();

  // ゲームエンジンの初期化
  useEffect(() => {
    const engine = new GameEngine(gameMode);
    setGameEngine(engine);
    setGameInfo(engine.getGameInfo());
    playBGM('game');
    
    // AIの初期思考（開発用）
    setTimeout(() => {
      simulateAITurn();
    }, 1000);

    return () => {
      // クリーンアップ
    };
  }, [gameMode]);

  // 牌を選択
  const handleTileSelect = useCallback((tileId: string) => {
    if (!isMyTurn || !gameEngine) return;
    
    const player = gameInfo?.players[0]; // プレイヤーは東家
    const tile = player?.hand.find(t => t.id === tileId);
    
    if (tile) {
      setSelectedTile(selectedTile === tileId ? null : tileId);
      playSound('click');
    }
  }, [isMyTurn, gameEngine, gameInfo, selectedTile]);

  // 牌を打つ
  const handleDiscard = useCallback(() => {
    if (!selectedTile || !gameEngine || !isMyTurn) return;
    
    const success = gameEngine.discardTile(selectedTile);
    if (success) {
      playSound('tile_discard');
      setLastAction('打牌');
      updateGameState();
      setIsMyTurn(false);
      setSelectedTile(null);
      
      // AIのターンをシミュレート
      setTimeout(simulateAITurn, 1000);
    }
  }, [selectedTile, gameEngine, isMyTurn]);

  // ツモ（牌を引く）
  const handleDraw = useCallback(() => {
    if (!gameEngine || !isMyTurn) return;
    
    const tile = gameEngine.drawTile();
    if (tile) {
      playSound('tile_draw');
      setLastAction('ツモ');
      updateGameState();
    }
  }, [gameEngine, isMyTurn]);

  // リーチ宣言
  const handleRiichi = useCallback(() => {
    if (!gameEngine || !isMyTurn) return;
    
    const success = gameEngine.declareRiichi();
    if (success) {
      playSound('riichi');
      setLastAction('リーチ！');
      updateGameState();
    }
  }, [gameEngine, isMyTurn]);

  // ロン/ツモ宣言
  const handleWin = useCallback((type: 'ron' | 'tsumo') => {
    if (!gameEngine) return;
    
    playSound('win');
    setLastAction(type === 'ron' ? 'ロン！' : 'ツモ！');
    // ここに和了処理を実装
  }, [gameEngine]);

  // ゲーム状態を更新
  const updateGameState = useCallback(() => {
    if (!gameEngine) return;
    
    const info = gameEngine.getGameInfo();
    setGameInfo(info);
    setIsMyTurn(info.currentPlayer.position === 'east');
  }, [gameEngine]);

  // AIのターンをシミュレート（開発用）
  const simulateAITurn = useCallback(() => {
    if (!gameEngine || isMyTurn) return;
    
    // AIがランダムに牌を引いて捨てる
    setTimeout(() => {
      gameEngine.drawTile();
      updateGameState();
      
      setTimeout(() => {
        const player = gameInfo?.players[1]; // 南家
        if (player?.hand.length > 0) {
          const randomIndex = Math.floor(Math.random() * player.hand.length);
          const tileId = player.hand[randomIndex].id;
          gameEngine.discardTile(tileId);
          updateGameState();
          setIsMyTurn(true);
        }
      }, 500);
    }, 1000);
  }, [gameEngine, isMyTurn, gameInfo]);

  // ポン・チー・カンのハンドラー
  const handleCall = useCallback((type: 'pon' | 'chi' | 'kan') => {
    if (!gameEngine || !isMyTurn) return;
    
    playSound('click');
    setLastAction(type === 'pon' ? 'ポン！' : type === 'chi' ? 'チー！' : 'カン！');
    // ここに鳴き処理を実装
  }, [gameEngine, isMyTurn]);

  if (!gameEngine || !gameInfo) {
    return (
      <div className="loading-table">
        <div className="spinner"></div>
        <p>牌卓を準備中...</p>
      </div>
    );
  }

  return (
    <div className="mahjong-table-container">
      {/* 背景装飾 */}
      <div className="table-background">
        <div className="table-center">
          <div className="table-center-decoration">
            <div className="table-logo">幽玄奇談</div>
            <div className="current-round">
              {gameInfo.wind}場 {gameInfo.round}局
            </div>
          </div>
        </div>
      </div>

      {/* プレイヤー情報（4方向） */}
      <div className="player-north">
        <PlayerInfo
          player={gameInfo.players[3]} // 北家
          isCurrent={gameInfo.currentPlayer.position === 'north'}
          isDealer={gameInfo.players[3].isDealer}
        />
        <DiscardPile discards={gameInfo.players[3].discards} position="north" />
      </div>

      <div className="player-west">
        <PlayerInfo
          player={gameInfo.players[2]} // 西家
          isCurrent={gameInfo.currentPlayer.position === 'west'}
          isDealer={gameInfo.players[2].isDealer}
        />
        <DiscardPile discards={gameInfo.players[2].discards} position="west" />
      </div>

      <div className="player-east">
        <PlayerInfo
          player={gameInfo.players[0]} // 東家（プレイヤー）
          isCurrent={gameInfo.currentPlayer.position === 'east'}
          isDealer={gameInfo.players[0].isDealer}
        />
        <DiscardPile discards={gameInfo.players[0].discards} position="east" />
      </div>

      <div className="player-south">
        <PlayerInfo
          player={gameInfo.players[1]} // 南家
          isCurrent={gameInfo.currentPlayer.position === 'south'}
          isDealer={gameInfo.players[1].isDealer}
        />
        <DiscardPile discards={gameInfo.players[1].discards} position="south" />
      </div>

      {/* プレイヤーの手牌 */}
      <div className="player-hand-area">
        <PlayerHand
          tiles={gameInfo.players[0].hand}
          selectedTile={selectedTile}
          onTileSelect={handleTileSelect}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* 牌山表示 */}
      <div className="wall-display-area">
        <WallDisplay
          wallCount={gameInfo.wallCount}
          doraIndicators={gameInfo.doraIndicators}
        />
      </div>

      {/* アクションボタン */}
      <div className="action-buttons-area">
        <ActionButtons
          isMyTurn={isMyTurn}
          canRiichi={gameInfo.players[0].points >= 1000 && !gameInfo.players[0].isRiichi}
          onDraw={handleDraw}
          onDiscard={handleDiscard}
          onRiichi={handleRiichi}
          onRon={() => handleWin('ron')}
          onTsumo={() => handleWin('tsumo')}
          onPon={() => handleCall('pon')}
          onChi={() => handleCall('chi')}
          onKan={() => handleCall('kan')}
          selectedTile={selectedTile !== null}
        />
      </div>

      {/* 最終アクション表示 */}
      <AnimatePresence>
        {lastAction && (
          <motion.div
            className="last-action-display"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {lastAction}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ゲームコントロール */}
      <GameControls
        onExit={onExit}
        onShowScore={() => setShowScoreBoard(true)}
        onShowControls={() => setShowControls(true)}
        gameMode={gameMode}
      />

      {/* スコアボードモーダル */}
      <AnimatePresence>
        {showScoreBoard && (
          <div className="modal-overlay" onClick={() => setShowScoreBoard(false)}>
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <ScoreBoard
                players={gameInfo.players}
                onClose={() => setShowScoreBoard(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 操作ガイドモーダル */}
      <AnimatePresence>
        {showControls && (
          <div className="modal-overlay" onClick={() => setShowControls(false)}>
            <motion.div
              className="controls-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>操作ガイド</h3>
              <div className="controls-list">
                <div className="control-item">
                  <span className="control-key">クリック</span>
                  <span className="control-desc">牌を選択</span>
                </div>
                <div className="control-item">
                  <span className="control-key">スペース</span>
                  <span className="control-desc">選択した牌を打つ</span>
                </div>
                <div className="control-item">
                  <span className="control-key">D</span>
                  <span className="control-desc">ツモる</span>
                </div>
                <div className="control-item">
                  <span className="control-key">R</span>
                  <span className="control-desc">リーチ宣言</span>
                </div>
              </div>
              <button className="close-button" onClick={() => setShowControls(false)}>
                閉じる
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MahjongTable;

import React, { useState } from 'react';
import { RealTimeAnalyzer } from '../analytics/RealTimeAnalyzer';
import { AdvancedGameRecorder } from '../../core/analytics/AdvancedGameRecorder';

export const MahjongTable: React.FC = () => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'learning' | 'normal'>('normal');
  const [currentEfficiencies, setCurrentEfficiencies] = useState<TileEfficiency[]>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<SuggestedAction[]>([]);
  
  // ゲームレコーダーのインスタンス
  const gameRecorderRef = useRef<AdvancedGameRecorder | null>(null);
  
  // 牌を切る時の処理（拡張）
  const handleDiscard = (tile: TileType) => {
    // 元のゲームロジック
    gameEngine.discardTile(currentPlayerId, tile);
    
    // 分析データを取得
    if (gameRecorderRef.current && analysisMode === 'learning') {
      const lastAction = gameRecorderRef.current.getLastAction();
      if (lastAction?.handEfficiency) {
        setCurrentEfficiencies(lastAction.handEfficiency);
      }
      if (lastAction?.suggestedActions) {
        setCurrentSuggestions(lastAction.suggestedActions);
      }
    }
  };
  
  return (
    <div className="mahjong-table">
      {/* 既存の牌卓UI */}
      <div className="table-main">
        {/* ... 既存の牌卓コンポーネント ... */}
      </div>
      
      {/* 分析UI（トグル表示） */}
      <div className={`analysis-sidebar ${showAnalysis ? 'visible' : 'hidden'}`}>
        <div className="analysis-header">
          <h3>🧠 牌眼（ハイガン）システム</h3>
          <button onClick={() => setShowAnalysis(false)}>✕</button>
        </div>
        
        <div className="analysis-mode-selector">
          <label>
            <input
              type="radio"
              name="analysisMode"
              value="normal"
              checked={analysisMode === 'normal'}
              onChange={() => setAnalysisMode('normal')}
            />
            通常モード
          </label>
          <label>
            <input
              type="radio"
              name="analysisMode"
              value="learning"
              checked={analysisMode === 'learning'}
              onChange={() => setAnalysisMode('learning')}
            />
            学習モード（AI分析有効）
          </label>
        </div>
        
        {analysisMode === 'learning' && (
          <RealTimeAnalyzer
            currentHand={currentPlayerHand}
            efficiencies={currentEfficiencies}
            suggestions={currentSuggestions}
            onTileSelect={(tile) => {
              // 牌を選択した時のアクション（例：マーキング）
              highlightTile(tile);
            }}
          />
        )}
        
        {/* クイック分析ボタン */}
        <div className="quick-analysis">
          <button onClick={() => analyzeCurrentSituation()}>
            🔍 現在の局面を分析
          </button>
          <button onClick={() => showMissedOpportunities()}>
            💡 見逃したチャンスを表示
          </button>
        </div>
      </div>
      
      {/* 分析サイドバートグルボタン */}
      <button 
        className="analysis-toggle-button"
        onClick={() => setShowAnalysis(!showAnalysis)}
      >
        {showAnalysis ? '🧠 分析を隠す' : '🧠 分析を表示'}
      </button>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TileType, SuggestedAction } from '../../types/game.types';
import { RealTimeAnalyzer } from '../analytics/RealTimeAnalyzer';
import { AdvancedGameRecorder } from '../../core/analytics/AdvancedGameRecorder';
import { storageManager } from '../../utils/AdvancedStorageManager';
import { Tile } from './Tile';
import { PlayerHand } from './PlayerHand';
import { DiscardPile } from './DiscardPile';
import { ScoreBoard } from './ScoreBoard';
import { ActionButtons } from './ActionButtons';
import { SeasonalEffects } from '../effects/SeasonalEffects';
import './MahjongTable.css';

// 既存のコンポーネントを拡張
export const MahjongTable: React.FC = () => {
  // 既存の状態管理
  const [gameState, setGameState] = useState<any>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<number>(0);
  const [currentPlayerHand, setCurrentPlayerHand] = useState<TileType[]>([]);
  const [discards, setDiscards] = useState<TileType[]>([]);
  const [doraIndicators, setDoraIndicators] = useState<TileType[]>(['m5', 'p5', 's5']);
  const [scores, setScores] = useState<{ [key: number]: number }>({
    0: 25000,
    1: 25000,
    2: 25000,
    3: 25000
  });
  const [riichis, setRiichis] = useState<number[]>([]);
  
  // 新しい分析システムの状態管理
  const [analysisEnabled, setAnalysisEnabled] = useState<boolean>(true);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState<boolean>(true);
  const [analysisMode, setAnalysisMode] = useState<'learning' | 'normal'>('learning');
  const [gameRecorder, setGameRecorder] = useState<AdvancedGameRecorder | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  // ゲーム状態の参照（最新値を保持）
  const gameStateRef = useRef<any>(null);
  const roundRef = useRef<number>(0);
  const playerWindRef = useRef<string>('east');
  const roundWindRef = useRef<string>('east');

  // 初期化エフェクト
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // 既存のゲーム初期化
        const initialState = await initializeGameState();
        setGameState(initialState);
        gameStateRef.current = initialState;
        
        // 分析システムの初期化
        await initializeAnalytics();
        
        // プレイヤー統計の読み込み
        await loadPlayerStats();
        
        // ゲーム記録の開始
        startGameRecording(initialState);
        
        console.log('幽玄牌眼システム: 初期化完了');
      } catch (error) {
        console.error('ゲーム初期化エラー:', error);
      }
    };
    
    initializeGame();
    
    // クリーンアップ
    return () => {
      if (gameRecorder) {
        gameRecorder.finalizeGame({});
      }
    };
  }, []);

  // 分析システムの初期化
  const initializeAnalytics = async () => {
    try {
      // ストレージマネージャーの初期化
      await storageManager.initialize();
      
      // ゲームレコーダーの作成
      const recorder = new AdvancedGameRecorder({
        gameMode: 'tonpu',
        players: [
          { id: 0, name: 'Player 1', score: 25000 },
          { id: 1, name: 'Player 2', score: 25000 },
          { id: 2, name: 'Player 3', score: 25000 },
          { id: 3, name: 'Player 4', score: 25000 }
        ]
      });
      
      setGameRecorder(recorder);
      setIsRecording(true);
      
      // 設定の読み込み
      const settings = await storageManager.getAnalysisSettings();
      setAnalysisEnabled(settings.enabled);
      setAnalysisMode(settings.difficulty === 'beginner' ? 'learning' : 'normal');
      
    } catch (error) {
      console.error('分析システムの初期化に失敗:', error);
    }
  };

  // プレイヤー統計の読み込み
  const loadPlayerStats = async () => {
    try {
      const stats = await storageManager.getPlayerStats(0); // プレイヤーID 0
      setPlayerStats(stats);
    } catch (error) {
      console.warn('プレイヤー統計の読み込みに失敗:', error);
    }
  };

  // ゲーム記録の開始
  const startGameRecording = (gameState: any) => {
    if (!gameRecorder) return;
    
    // ゲーム開始を記録
    gameRecorder.initializeGame({
      ...gameState,
      startTime: Date.now()
    });
    
    console.log('ゲーム記録を開始しました');
  };

  // 牌を切る処理（拡張）
  const handleDiscard = useCallback(async (tile: TileType) => {
    if (!gameState || !gameRecorder) return;
    
    try {
      // 1. 元のゲームロジックを実行
      const discardResult = await executeDiscard(currentPlayerId, tile);
      
      // 2. 手牌を更新
      const newHand = currentPlayerHand.filter(t => t !== tile);
      setCurrentPlayerHand(newHand);
      
      // 3. 捨て牌を追加
      setDiscards(prev => [...prev, tile]);
      
      // 4. 分析システムへの記録
      if (gameRecorder && isRecording) {
        const actionRecord = {
          playerId: currentPlayerId,
          action: 'discard' as const,
          tile,
          handState: currentPlayerHand,
          context: {
            round: roundRef.current,
            honba: 0,
            riichiSticks: 0,
            riichis,
            doraIndicators,
            wallTilesRemaining: 70,
            deadWallTilesRemaining: 14,
            playerWind: { [currentPlayerId]: playerWindRef.current },
            roundWind: roundWindRef.current,
            scores
          }
        };
        
        // 行動を記録
        const insight = gameRecorder.logAction(actionRecord);
        
        // 洞察があれば保存
        if (insight) {
          setInsights(prev => [...prev, insight]);
          
          // 重要な洞察があれば通知
          if (insight.significance === 'high') {
            showInsightNotification(insight);
          }
        }
      }
      
      // 5. 次のプレイヤーへ
      const nextPlayerId = (currentPlayerId + 1) % 4;
      setCurrentPlayerId(nextPlayerId);
      
      // 6. ラウンド進行
      roundRef.current += 1;
      
      return discardResult;
      
    } catch (error) {
      console.error('牌を切る処理でエラー:', error);
      throw error;
    }
  }, [currentPlayerId, currentPlayerHand, gameRecorder, isRecording, riichis, doraIndicators, scores]);

  // 牌を引く処理（拡張）
  const handleDraw = useCallback(async () => {
    if (!gameState || !gameRecorder) return;
    
    try {
      // 1. 元のゲームロジック
      const drawnTile = await executeDraw(currentPlayerId);
      
      // 2. 手牌を更新
      setCurrentPlayerHand(prev => [...prev, drawnTile]);
      
      // 3. 分析システムへの記録
      if (gameRecorder && isRecording) {
        gameRecorder.logAction({
          playerId: currentPlayerId,
          action: 'draw' as const,
          tile: drawnTile,
          handState: currentPlayerHand,
          context: {
            round: roundRef.current,
            honba: 0,
            riichiSticks: 0,
            riichis,
            doraIndicators,
            wallTilesRemaining: 70 - roundRef.current,
            deadWallTilesRemaining: 14,
            playerWind: { [currentPlayerId]: playerWindRef.current },
            roundWind: roundWindRef.current,
            scores
          }
        });
      }
      
      return drawnTile;
      
    } catch (error) {
      console.error('牌を引く処理でエラー:', error);
      throw error;
    }
  }, [currentPlayerId, currentPlayerHand, gameRecorder, isRecording, riichis, doraIndicators, scores]);

  // 鳴きの処理（拡張）
  const handleCall = useCallback(async (callType: 'chii' | 'pon' | 'kan', tile: TileType) => {
    if (!gameState || !gameRecorder) return;
    
    try {
      // 1. 元のゲームロジック
      const callResult = await executeCall(currentPlayerId, callType, tile);
      
      // 2. 分析システムへの記録
      if (gameRecorder && isRecording) {
        gameRecorder.logAction({
          playerId: currentPlayerId,
          action: callType,
          tile,
          handState: currentPlayerHand,
          context: {
            round: roundRef.current,
            honba: 0,
            riichiSticks: 0,
            riichis,
            doraIndicators,
            wallTilesRemaining: 70 - roundRef.current,
            deadWallTilesRemaining: 14,
            playerWind: { [currentPlayerId]: playerWindRef.current },
            roundWind: roundWindRef.current,
            scores
          }
        });
      }
      
      // 3. 手牌更新（鳴いた牌を追加）
      if (callResult.success) {
        setCurrentPlayerHand(prev => [...prev, tile]);
      }
      
      return callResult;
      
    } catch (error) {
      console.error('鳴き処理でエラー:', error);
      throw error;
    }
  }, [currentPlayerId, currentPlayerHand, gameRecorder, isRecording, riichis, doraIndicators, scores]);

  // 立直の処理（拡張）
  const handleRiichi = useCallback(async (tile: TileType) => {
    if (!gameState || !gameRecorder) return;
    
    try {
      // 1. 元のゲームロジック
      const riichiResult = await executeRiichi(currentPlayerId, tile);
      
      if (riichiResult.success) {
        // 2. 立直者リストを更新
        setRiichis(prev => [...prev, currentPlayerId]);
        
        // 3. 分析システムへの記録
        if (gameRecorder && isRecording) {
          gameRecorder.logAction({
            playerId: currentPlayerId,
            action: 'riichi' as const,
            tile,
            handState: currentPlayerHand,
            context: {
              round: roundRef.current,
              honba: 0,
              riichiSticks: riichiResult.sticks,
              riichis: [...riichis, currentPlayerId],
              doraIndicators,
              wallTilesRemaining: 70 - roundRef.current,
              deadWallTilesRemaining: 14,
              playerWind: { [currentPlayerId]: playerWindRef.current },
              roundWind: roundWindRef.current,
              scores
            }
          });
        }
        
        // 4. 手牌から宣言牌を削除
        setCurrentPlayerHand(prev => prev.filter(t => t !== tile));
        
        // 5. 特別な立直エフェクト
        triggerRiichiEffect();
      }
      
      return riichiResult;
      
    } catch (error) {
      console.error('立直処理でエラー:', error);
      throw error;
    }
  }, [currentPlayerId, currentPlayerHand, gameRecorder, isRecording, riichis, doraIndicators, scores]);

  // 和了の処理（拡張）
  const handleWin = useCallback(async (winType: 'tsumo' | 'ron') => {
    if (!gameState || !gameRecorder) return;
    
    try {
      // 1. 元のゲームロジック
      const winResult = await executeWin(currentPlayerId, winType);
      
      if (winResult.success) {
        // 2. 点数を更新
        setScores(prev => ({
          ...prev,
          [currentPlayerId]: prev[currentPlayerId] + winResult.points
        }));
        
        // 3. 分析システムへの記録（ゲーム終了）
        if (gameRecorder && isRecording) {
          // 最終行動を記録
          gameRecorder.logAction({
            playerId: currentPlayerId,
            action: winType,
            handState: currentPlayerHand,
            context: {
              round: roundRef.current,
              honba: 0,
              riichiSticks: 0,
              riichis,
              doraIndicators,
              wallTilesRemaining: 70 - roundRef.current,
              deadWallTilesRemaining: 14,
              playerWind: { [currentPlayerId]: playerWindRef.current },
              roundWind: roundWindRef.current,
              scores: {
                ...scores,
                [currentPlayerId]: scores[currentPlayerId] + winResult.points
              }
            }
          });
          
          // ゲームを終了
          gameRecorder.finalizeGame({
            winner: currentPlayerId,
            winType,
            yaku: winResult.yaku.map((y: any) => ({ name: y.name, han: y.han })),
            fu: winResult.fu,
            totalHan: winResult.totalHan,
            points: winResult.points,
            limit: winResult.limit
          });
          
          setIsRecording(false);
        }
        
        // 4. 和了エフェクト
        triggerWinEffect(winResult);
        
        // 5. ゲーム終了画面への遷移
        setTimeout(() => {
          showGameResult(winResult);
        }, 2000);
      }
      
      return winResult;
      
    } catch (error) {
      console.error('和了処理でエラー:', error);
      throw error;
    }
  }, [currentPlayerId, currentPlayerHand, gameRecorder, isRecording, riichis, doraIndicators, scores]);

  // 提案を受け入れたときの処理
  const handleSuggestionAccept = useCallback((suggestion: SuggestedAction) => {
    console.log('AI提案を採用:', suggestion);
    
    // 提案タイプに応じて処理
    switch (suggestion.type) {
      case 'discard':
        handleDiscard(suggestion.tile).catch(console.error);
        break;
      case 'pon':
      case 'chii':
        handleCall(suggestion.type, suggestion.tile).catch(console.error);
        break;
      case 'riichi':
        handleRiichi(suggestion.tile).catch(console.error);
        break;
      case 'kan':
        handleCall('kan', suggestion.tile).catch(console.error);
        break;
    }
    
    // フィードバックを記録
    recordSuggestionFeedback(suggestion, true);
  }, [handleDiscard, handleCall, handleRiichi]);

  // 洞察通知の表示
  const showInsightNotification = (insight: any) => {
    // 通知UIの実装
    const notification = document.createElement('div');
    notification.className = 'insight-notification';
    notification.innerHTML = `
      <div class="insight-header">
        <span class="insight-icon">💡</span>
        <strong>重要な洞察</strong>
      </div>
      <div class="insight-content">
        <p>${insight.description}</p>
        ${insight.missedOpportunities ? `
          <div class="missed-opportunities">
            <small>見逃したチャンスがあります</small>
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 自動的に消える
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  };

  // 提案フィードバックの記録
  const recordSuggestionFeedback = async (suggestion: SuggestedAction, accepted: boolean) => {
    try {
      await storageManager.setCache(
        `suggestion_feedback_${Date.now()}`,
        {
          suggestion,
          accepted,
          timestamp: Date.now(),
          context: {
            round: roundRef.current,
            playerWind: playerWindRef.current,
            roundWind: roundWindRef.current,
            scores
          }
        },
        86400000 // 24時間保持
      );
    } catch (error) {
      console.warn('フィードバック記録に失敗:', error);
    }
  };

  // ゲーム結果の表示
  const showGameResult = (result: any) => {
    // ゲーム結果モーダルの表示
    const modal = document.createElement('div');
    modal.className = 'game-result-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>🎉 和了！</h2>
        <div class="result-details">
          <p><strong>役:</strong> ${result.yaku.map((y: any) => `${y.name} (${y.han}翻)`).join(', ')}</p>
          <p><strong>合計:</strong> ${result.totalHan}翻 ${result.fu}符</p>
          <p><strong>点数:</strong> ${result.points.toLocaleString()}点</p>
          ${result.limit ? `<p><strong>役満:</strong> ${result.limit}</p>` : ''}
        </div>
        <button class="close-modal">閉じる</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 閉じるボタンのイベント
    modal.querySelector('.close-modal')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  };

  // 立直エフェクト
  const triggerRiichiEffect = () => {
    // 立直時の特別なエフェクト
    const effect = document.createElement('div');
    effect.className = 'riichi-effect';
    effect.innerHTML = `
      <div class="riichi-text">立直！</div>
      <div class="riichi-glow"></div>
    `;
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
      if (effect.parentNode) {
        effect.parentNode.removeChild(effect);
      }
    }, 2000);
  };

  // 和了エフェクト
  const triggerWinEffect = (result: any) => {
    // 和了時の特別なエフェクト
    const effect = document.createElement('div');
    effect.className = 'win-effect';
    effect.innerHTML = `
      <div class="win-text">和了！</div>
      <div class="win-particles"></div>
    `;
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
      if (effect.parentNode) {
        effect.parentNode.removeChild(effect);
      }
    }, 3000);
  };

  // 分析パネルの表示/非表示を切り替え
  const toggleAnalysisPanel = () => {
    setShowAnalysisPanel(prev => !prev);
  };

  // 分析モードを切り替え
  const toggleAnalysisMode = () => {
    setAnalysisMode(prev => prev === 'learning' ? 'normal' : 'learning');
  };

  // ゲーム設定の表示
  const showGameSettings = () => {
    // 設定モーダルの実装
    // （簡略化のため詳細は省略）
  };

  // プレイヤー統計の表示
  const showPlayerStats = async () => {
    try {
      const stats = await storageManager.getPlayerStats(currentPlayerId);
      
      // 統計モーダルの表示
      const modal = document.createElement('div');
      modal.className = 'stats-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <h2>📊 プレイヤー統計</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${stats?.totalGames || 0}</div>
              <div class="stat-label">総対戦数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats?.totalWins || 0}</div>
              <div class="stat-label">勝利数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats?.winRate ? Math.round(stats.winRate) : 0}%</div>
              <div class="stat-label">勝率</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${stats?.averageScore ? Math.round(stats.averageScore) : 0}</div>
              <div class="stat-label">平均得点</div>
            </div>
          </div>
          <button class="close-modal">閉じる</button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.querySelector('.close-modal')?.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
    } catch (error) {
      console.error('統計の表示に失敗:', error);
    }
  };

  // ゲームの初期化（仮の実装）
  const initializeGameState = async (): Promise<any> => {
    // 実際のゲーム初期化ロジック
    return {
      id: `game_${Date.now()}`,
      mode: 'tonpu',
      players: [
        { id: 0, name: 'あなた', score: 25000, position: 'east' },
        { id: 1, name: 'AI 1', score: 25000, position: 'south' },
        { id: 2, name: 'AI 2', score: 25000, position: 'west' },
        { id: 3, name: 'AI 3', score: 25000, position: 'north' }
      ],
      round: 0,
      honba: 0,
      riichiSticks: 0,
      wall: {
        live: 70,
        dead: 14
      }
    };
  };

  // ゲームロジックの実行（仮の実装）
  const executeDiscard = async (playerId: number, tile: TileType): Promise<any> => {
    // 実際の捨て牌ロジック
    return { success: true };
  };

  const executeDraw = async (playerId: number): Promise<TileType> => {
    // 実際の引牌ロジック
    const tiles: TileType[] = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9'];
    return tiles[Math.floor(Math.random() * tiles.length)];
  };

  const executeCall = async (playerId: number, type: 'chii' | 'pon' | 'kan', tile: TileType): Promise<any> => {
    // 実際の鳴きロジック
    return { success: true, type, tile };
  };

  const executeRiichi = async (playerId: number, tile: TileType): Promise<any> => {
    // 実際の立直ロジック
    return { success: true, sticks: 1 };
  };

  const executeWin = async (playerId: number, type: 'tsumo' | 'ron'): Promise<any> => {
    // 実際の和了ロジック
    return {
      success: true,
      points: 8000,
      yaku: [{ name: '門前清自摸和', han: 1 }, { name: '断ヤオ九', han: 1 }],
      fu: 30,
      totalHan: 2,
      limit: null
    };
  };

  // ゲームが準備できていない場合
  if (!gameState) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>幽玄牌眼システムを初期化中...</p>
          <p className="loading-subtext">深遠なる分析が始まります</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mahjong-table-container">
      {/* 季節エフェクト */}
      <SeasonalEffects season="spring" />
      
      {/* 牌卓の背景 */}
      <div className="table-background">
        <div className="table-surface">
          {/* 中央の月の装飾 */}
          <div className="moon-decoration">
            <div className="moon-phase"></div>
          </div>
          
          {/* 四季の装飾 */}
          <div className="seasonal-decoration spring">🌸</div>
          <div className="seasonal-decoration summer">🌿</div>
          <div className="seasonal-decoration autumn">🍁</div>
          <div className="seasonal-decoration winter">❄️</div>
        </div>
      </div>
      
      {/* メインの牌卓 */}
      <div className="mahjong-table-main">
        {/* 北家（上） */}
        <div className="player-area north">
          <PlayerHand
            playerId={3}
            tiles={[]}
            isActive={currentPlayerId === 3}
            position="north"
            isRiichi={riichis.includes(3)}
            onTileClick={() => {}}
          />
          <DiscardPile
            playerId={3}
            discards={[]}
            position="north"
          />
        </div>
        
        {/* 西家（左）と東家（右） */}
        <div className="table-middle">
          <div className="player-area west">
            <PlayerHand
              playerId={2}
              tiles={[]}
              isActive={currentPlayerId === 2}
              position="west"
              isRiichi={riichis.includes(2)}
              onTileClick={() => {}}
            />
            <DiscardPile
              playerId={2}
              discards={[]}
              position="west"
            />
          </div>
          
          <div className="table-center">
            {/* ドラ表示 */}
            <div className="dora-indicator">
              <h4>ドラ</h4>
              <div className="dora-tiles">
                {doraIndicators.map((tile, index) => (
                  <Tile key={index} tile={tile} size="medium" />
                ))}
              </div>
            </div>
            
            {/* 牌山 */}
            <div className="wall-display">
              <div className="wall-segment live">
                <span className="wall-count">70</span>
                <div className="wall-tiles"></div>
              </div>
              <div className="wall-segment dead">
                <span className="wall-count">14</span>
                <div className="wall-tiles"></div>
              </div>
            </div>
          </div>
          
          <div className="player-area east">
            <PlayerHand
              playerId={1}
              tiles={[]}
              isActive={currentPlayerId === 1}
              position="east"
              isRiichi={riichis.includes(1)}
              onTileClick={() => {}}
            />
            <DiscardPile
              playerId={1}
              discards={[]}
              position="east"
            />
          </div>
        </div>
        
        {/* 南家（下） - プレイヤー */}
        <div className="player-area south">
          <DiscardPile
            playerId={0}
            discards={discards}
            position="south"
          />
          <PlayerHand
            playerId={0}
            tiles={currentPlayerHand}
            isActive={currentPlayerId === 0}
            position="south"
            isRiichi={riichis.includes(0)}
            onTileClick={handleDiscard}
          />
        </div>
      </div>
      
      {/* 点数板 */}
      <div className="score-board-container">
        <ScoreBoard
          scores={scores}
          players={gameState.players}
          currentPlayer={currentPlayerId}
          round={roundRef.current}
          honba={0}
          riichiSticks={0}
        />
      </div>
      
      {/* 操作ボタン */}
      <div className="action-buttons-container">
        <ActionButtons
          onDraw={handleDraw}
          onRiichi={() => {
            if (currentPlayerHand.length > 0) {
              handleRiichi(currentPlayerHand[0]).catch(console.error);
            }
          }}
          onTsumo={() => handleWin('tsumo').catch(console.error)}
          onSettings={showGameSettings}
          canDraw={true}
          canRiichi={!riichis.includes(currentPlayerId) && currentPlayerHand.length > 0}
          canTsumo={true}
        />
      </div>
      
      {/* 幽玄牌眼分析システム */}
      {analysisEnabled && (
        <div className={`analysis-system-container ${showAnalysisPanel ? 'visible' : 'hidden'}`}>
          <div className="analysis-system-header">
            <div className="analysis-title">
              <span className="analysis-icon">🧠</span>
              <h3>幽玄牌眼</h3>
              <span className="analysis-mode-badge">
                {analysisMode === 'learning' ? '学習モード' : '通常モード'}
              </span>
            </div>
            
            <div className="analysis-controls">
              <button
                className="analysis-control-btn"
                onClick={toggleAnalysisMode}
                title="モード切り替え"
              >
                {analysisMode === 'learning' ? '🎓' : '🎮'}
              </button>
              
              <button
                className="analysis-control-btn"
                onClick={showPlayerStats}
                title="統計を見る"
              >
                📊
              </button>
              
              <button
                className="analysis-control-btn"
                onClick={toggleAnalysisPanel}
                title="分析パネルを隠す"
              >
                {showAnalysisPanel ? '◀️' : '▶️'}
              </button>
            </div>
          </div>
          
          {showAnalysisPanel && (
            <div className="analysis-system-content">
              <RealTimeAnalyzer
                currentHand={currentPlayerHand}
                discards={discards}
                doraIndicators={doraIndicators}
                round={roundRef.current}
                playerWind={playerWindRef.current}
                roundWind={roundWindRef.current}
                playerId={currentPlayerId}
                scores={scores}
                riichis={riichis}
                onTileSelect={(tile, suggestion) => {
                  console.log('牌を選択:', tile, suggestion);
                  // 選択した牌をハイライト
                  highlightTile(tile);
                }}
                onSuggestionAccept={handleSuggestionAccept}
                enabled={analysisMode === 'learning'}
              />
              
              {/* 洞察の表示 */}
              {insights.length > 0 && (
                <div className="insights-panel">
                  <h4>💡 ゲームの洞察</h4>
                  <div className="insights-list">
                    {insights.slice(-3).map((insight, index) => (
                      <div key={index} className="insight-item">
                        <div className="insight-turn">
                          巡目: {insight.keyTurn}
                        </div>
                        <div className="insight-description">
                          {insight.description}
                        </div>
                        {insight.significance === 'high' && (
                          <div className="insight-significance high">
                            重要
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 記録状況 */}
              <div className="recording-status">
                <div className="status-indicator">
                  <div className={`status-dot ${isRecording ? 'recording' : 'stopped'}`}></div>
                  <span>{isRecording ? '記録中' : '停止中'}</span>
                </div>
                
                {gameRecorder && (
                  <div className="recording-info">
                    <small>
                      行動数: {gameRecorder.getActionCount()} /
                      ラウンド: {roundRef.current}
                    </small>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 分析パネルトグルボタン */}
      {analysisEnabled && !showAnalysisPanel && (
        <button
          className="analysis-toggle-button"
          onClick={toggleAnalysisPanel}
          title="分析パネルを表示"
        >
          <span className="toggle-icon">🧠</span>
          <span className="toggle-text">分析</span>
        </button>
      )}
      
      {/* 分析システムの有効/無効切り替え */}
      <div className="analysis-toggle-global">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={analysisEnabled}
            onChange={(e) => setAnalysisEnabled(e.target.checked)}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">
            幽玄牌眼システム {analysisEnabled ? 'ON' : 'OFF'}
          </span>
        </label>
      </div>
      
      {/* ゲーム情報 */}
      <div className="game-info">
        <div className="current-turn">
          <span className="turn-label">現在の手番:</span>
          <span className="turn-player">
            {gameState.players[currentPlayerId]?.name}
          </span>
        </div>
        
        <div className="round-info">
          <span className="round-label">巡目:</span>
          <span className="round-number">{roundRef.current}</span>
        </div>
      </div>
    </div>
  );
};

// スタイルの追加
const styles = `
/* 追加CSSスタイル */

.analysis-system-container {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 420px;
  background: linear-gradient(145deg, 
    rgba(26, 35, 126, 0.97) 0%,
    rgba(40, 53, 147, 0.95) 100%
  );
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(101, 87, 245, 0.3);
  box-shadow: -5px 0 30px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.analysis-system-container.hidden {
  transform: translateX(100%);
}

.analysis-system-container.visible {
  transform: translateX(0);
}

.analysis-system-header {
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analysis-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.analysis-icon {
  font-size: 1.5rem;
}

.analysis-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  background: linear-gradient(135deg, #fff 0%, #c5cae9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.analysis-mode-badge {
  background: rgba(101, 87, 245, 0.3);
  border: 1px solid rgba(101, 87, 245, 0.6);
  color: #c5cae9;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.analysis-controls {
  display: flex;
  gap: 0.5rem;
}

.analysis-control-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #c5cae9;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.analysis-control-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.analysis-system-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.insights-panel {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.insights-panel h4 {
  margin: 0 0 1rem 0;
  color: #c5cae9;
  font-size: 1rem;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.75rem;
  border-left: 3px solid #ff9800;
}

.insight-turn {
  font-size: 0.75rem;
  color: #9fa8da;
  margin-bottom: 0.25rem;
}

.insight-description {
  font-size: 0.85rem;
  color: #e8eaf6;
  line-height: 1.4;
}

.insight-significance {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.insight-significance.high {
  background: rgba(244, 67, 54, 0.2);
  color: #ef9a9a;
  border: 1px solid rgba(244, 67, 54, 0.4);
}

.recording-status {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.recording {
  background: #4caf50;
  box-shadow: 0 0 10px #4caf50;
  animation: pulse 1.5s infinite;
}

.status-dot.stopped {
  background: #f44336;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.recording-info small {
  color: #9fa8da;
  font-size: 0.8rem;
}

.analysis-toggle-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: linear-gradient(135deg, #6557f5, #9c27b0);
  border: none;
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 25px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(101, 87, 245, 0.4);
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.analysis-toggle-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(101, 87, 245, 0.6);
}

.toggle-icon {
  font-size: 1.25rem;
}

.toggle-text {
  font-weight: 600;
  font-size: 0.9rem;
}

.analysis-toggle-global {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 50px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
}

.toggle-switch input:checked + .toggle-slider {
  background: #6557f5;
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(26px);
}

.toggle-label {
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
}

.game-info {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 2rem;
  z-index: 999;
}

.current-turn, .round-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.turn-label, .round-label {
  color: #9fa8da;
  font-size: 0.9rem;
}

.turn-player, .round-number {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.turn-player {
  background: linear-gradient(135deg, #fff, #c5cae9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 通知スタイル */
.insight-notification {
  position: fixed;
  top: 80px;
  right: 20px;
  background: linear-gradient(135deg, #311b92, #4a148c);
  border-radius: 12px;
  padding: 1rem;
  border-left: 4px solid #ff9800;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  animation: slideInRight 0.3s ease, fadeOut 0.3s ease 4.7s;
  max-width: 300px;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.insight-icon {
  font-size: 1.25rem;
}

.insight-header strong {
  color: white;
  font-size: 0.95rem;
}

.insight-content p {
  margin: 0;
  color: #e8eaf6;
  font-size: 0.85rem;
  line-height: 1.4;
}

.missed-opportunities {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.missed-opportunities small {
  color: #ff9800;
  font-size: 0.8rem;
}

/* ローディング画面 */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a237e, #311b92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #6557f5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

.loading-content p {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.loading-subtext {
  font-size: 0.9rem;
  color: #c5cae9;
}

/* モーダルスタイル */
.game-result-modal,
.stats-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(10px);
}

.modal-content {
  background: linear-gradient(145deg, #1a237e, #311b92);
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  border: 1px solid rgba(101, 87, 245, 0.3);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: modalAppear 0.3s ease;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-content h2 {
  color: white;
  text-align: center;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #fff, #c5cae9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.result-details {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.result-details p {
  color: #e8eaf6;
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.result-details strong {
  color: #c5cae9;
}

.close-modal {
  background: linear-gradient(135deg, #6557f5, #9c27b0);
  border: none;
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.close-modal:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(101, 87, 245, 0.4);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #9fa8da;
  font-size: 0.9rem;
}

/* エフェクト */
.riichi-effect,
.win-effect {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}

.riichi-text,
.win-text {
  font-size: 5rem;
  font-weight: 900;
  color: white;
  text-shadow: 
    0 0 20px #ff4081,
    0 0 40px #ff4081,
    0 0 60px #ff4081;
  animation: textGlow 2s ease-out;
}

@keyframes textGlow {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(1);
  }
}

.riichi-glow,
.win-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 64, 129, 0.5), transparent 70%);
  animation: expandGlow 2s ease-out;
}

@keyframes expandGlow {
  to {
    width: 500px;
    height: 500px;
    opacity: 0;
  }
}

.win-text {
  color: #ffd600;
  text-shadow: 
    0 0 20px #ffd600,
    0 0 40px #ffd600,
    0 0 60px #ffd600;
}

/* 牌のハイライトエフェクト */
.highlighted-tile {
  animation: tileHighlight 1s ease infinite alternate;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.7));
}

@keyframes tileHighlight {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-10px);
  }
}

/* レスポンシブデザイン */
@media (max-width: 1400px) {
  .analysis-system-container {
    width: 380px;
  }
}

@media (max-width: 1200px) {
  .analysis-system-container {
    width: 350px;
  }
  
  .game-info {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
  }
}

@media (max-width: 768px) {
  .analysis-system-container {
    width: 100%;
    height: 50vh;
    bottom: 0;
    top: auto;
    transform: translateY(100%);
  }
  
  .analysis-system-container.visible {
    transform: translateY(0);
  }
  
  .analysis-toggle-button {
    bottom: calc(50vh + 20px);
  }
  
  .analysis-toggle-global {
    bottom: calc(50vh + 20px);
    left: auto;
    right: 20px;
  }
  
  .game-info {
    top: 10px;
    left: 10px;
    transform: none;
    right: 10px;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .modal-content {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .riichi-text,
  .win-text {
    font-size: 3rem;
  }
}
`;

// スタイルをドキュメントに追加
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// ヘルパー関数
function highlightTile(tile: TileType): void {
  // 牌のハイライト処理
  const tileElements = document.querySelectorAll(`[data-tile="${tile}"]`);
  tileElements.forEach((el: Element) => {
    el.classList.add('highlighted-tile');
    
    // 一定時間後にハイライトを解除
    setTimeout(() => {
      el.classList.remove('highlighted-tile');
    }, 2000);
  });
}

// エクスポート
export default MahjongTable;
