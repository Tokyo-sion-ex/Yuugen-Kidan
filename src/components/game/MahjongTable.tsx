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
