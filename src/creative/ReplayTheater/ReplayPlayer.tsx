import React, { useRef, useEffect, useState } from 'react';
import { GameRecord, TurnAction, CameraAngle, ReplaySettings } from '../../types/game.types';
import { Tile } from '../../components/game/Tile';
import { PlayerHand } from '../../components/game/PlayerHand';
import { DiscardPile } from '../../components/game/DiscardPile';
import { ScoreBoard } from '../../components/game/ScoreBoard';
import { useReplayState } from '../../hooks/useReplayState';
import './ReplayPlayer.css';

interface ReplayPlayerProps {
  replay: GameRecord;
  currentTime: number;
  cameraAngle: CameraAngle;
  settings: ReplaySettings;
  highlightedAction: TurnAction | null;
}

export const ReplayPlayer: React.FC<ReplayPlayerProps> = ({
  replay,
  currentTime,
  cameraAngle,
  settings,
  highlightedAction
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [currentActionIndex, setCurrentActionIndex] = useState<number>(0);
  
  const replayState = useReplayState(replay);

  // 現在の時間に基づいてゲーム状態を更新
  useEffect(() => {
    const updateStateForTime = () => {
      const state = replayState.getStateAtTime(currentTime);
      setGameState(state);
      
      if (state) {
        setPlayers(state.players || []);
        
        // 現在の行動インデックスを更新
        const actionIndex = replay.actions.findIndex(
          action => action.timestamp >= currentTime
        );
        if (actionIndex !== -1) {
          setCurrentActionIndex(actionIndex);
        }
      }
    };

    updateStateForTime();
  }, [currentTime, replay, replayState]);

  // カメラアングルに基づくスタイル
  const getCameraStyle = () => {
    const styles: any = {
      transform: 'perspective(1000px)',
      transition: 'transform 0.5s ease'
    };

    switch (cameraAngle) {
      case 'overview':
        styles.transform += ' rotateX(60deg) scale(0.8)';
        break;
      case 'player_closeup':
        styles.transform += ' scale(1.2)';
        break;
      case 'tile_focus':
        styles.transform += ' scale(1.5)';
        break;
      case 'dramatic':
        styles.transform += ' rotateY(15deg) rotateX(10deg)';
        break;
      case 'celebratory':
        styles.transform += ' scale(1.1) rotateX(-10deg)';
        break;
    }

    return styles;
  };

  // 牌の効率表示
  const renderTileEfficiency = (playerId: number, tile: string) => {
    if (!settings.showTileEfficiency || !gameState) return null;

    const efficiency = gameState.tileEfficiencies?.[playerId]?.[tile];
    if (!efficiency) return null;

    const score = efficiency.efficiencyScore;
    const color = score >= 70 ? '#4caf50' : 
                  score >= 40 ? '#ff9800' : '#f44336';

    return (
      <div className="tile-efficiency-indicator" style={{ backgroundColor: color }}>
        {score}
      </div>
    );
  };

  // 危険ゾーンの表示
  const renderDangerZones = () => {
    if (!settings.showDangerZones || !gameState) return null;

    return (
      <div className="danger-zones">
        {gameState.dangerZones?.map((zone: any, index: number) => (
          <div
            key={index}
            className="danger-zone"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.radius * 2}%`,
              height: `${zone.radius * 2}%`,
              opacity: zone.intensity * 0.3
            }}
          />
        ))}
      </div>
    );
  };

  // プレイヤー思考の表示
  const renderPlayerThoughts = (playerId: number) => {
    if (!settings.showPlayerThoughts || !gameState) return null;

    const thoughts = gameState.playerThoughts?.[playerId];
    if (!thoughts) return null;

    return (
      <div className="player-thoughts">
        <div className="thought-bubble">
          {thoughts.currentThought}
        </div>
        {thoughts.considerations && (
          <div className="considerations">
            {thoughts.considerations.map((consideration: string, idx: number) => (
              <div key={idx} className="consideration">
                {consideration}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 手牌の可視化
  const renderHandVisualization = (playerId: number) => {
    if (!settings.showHandVisualization || !gameState) return null;

    const handState = gameState.hands?.[playerId];
    if (!handState) return null;

    return (
      <div className="hand-visualization">
        <div className="hand-structure">
          {handState.groups?.map((group: any, idx: number) => (
            <div key={idx} className="hand-group">
              {group.tiles.map((tile: string, tileIdx: number) => (
                <div key={tileIdx} className="hand-tile-visual">
                  <Tile tile={tile} size="small" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="hand-info">
          <div className="hand-shanten">
            シャンテン数: {handState.shanten || '?'}
          </div>
          <div className="hand-waiting">
            待ち: {handState.waitingTiles?.join(', ') || 'なし'}
          </div>
        </div>
      </div>
    );
  };

  if (!gameState) {
    return (
      <div className="replay-player loading">
        <div className="loading-spinner"></div>
        <p>リプレイを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="replay-player" ref={containerRef}>
      <div className="player-container" style={getCameraStyle()}>
        {/* 牌卓の背景 */}
        <div className="table-background">
          <div className="table-surface">
            {/* 季節の装飾 */}
            <div className="seasonal-decoration">
              {getSeasonalDecoration(gameState.season)}
            </div>
            
            {/* 中央の月 */}
            <div className="moon-decoration" />
          </div>
        </div>

        {/* メインの牌卓 */}
        <div className="mahjong-table-replay">
          {/* 北家 */}
          <div className="player-area north">
            <PlayerHand
              playerId={3}
              tiles={players[3]?.hand || []}
              isActive={currentActionIndex >= 0 && replay.actions[currentActionIndex]?.playerId === 3}
              position="north"
              isRiichi={players[3]?.isRiichi || false}
              onTileClick={() => {}}
              renderTileOverlay={(tile) => renderTileEfficiency(3, tile)}
            />
            <DiscardPile
              playerId={3}
              discards={players[3]?.discards || []}
              position="north"
            />
            {renderPlayerThoughts(3)}
            {renderHandVisualization(3)}
          </div>

          {/* 西家と東家 */}
          <div className="table-middle">
            <div className="player-area west">
              <PlayerHand
                playerId={2}
                tiles={players[2]?.hand || []}
                isActive={currentActionIndex >= 0 && replay.actions[currentActionIndex]?.playerId === 2}
                position="west"
                isRiichi={players[2]?.isRiichi || false}
                onTileClick={() => {}}
                renderTileOverlay={(tile) => renderTileEfficiency(2, tile)}
              />
              <DiscardPile
                playerId={2}
                discards={players[2]?.discards || []}
                position="west"
              />
              {renderPlayerThoughts(2)}
              {renderHandVisualization(2)}
            </div>

            <div className="table-center">
              {/* ドラ表示 */}
              <div className="dora-indicator">
                <h4>ドラ</h4>
                <div className="dora-tiles">
                  {gameState.doraIndicators?.map((tile: string, index: number) => (
                    <Tile key={index} tile={tile} size="medium" />
                  ))}
                </div>
              </div>

              {/* 牌山 */}
              <div className="wall-display">
                <div className="wall-segment live">
                  <span className="wall-count">{gameState.wallRemaining || 70}</span>
                </div>
              </div>

              {/* 危険ゾーン表示 */}
              {renderDangerZones()}
            </div>

            <div className="player-area east">
              <PlayerHand
                playerId={1}
                tiles={players[1]?.hand || []}
                isActive={currentActionIndex >= 0 && replay.actions[currentActionIndex]?.playerId === 1}
                position="east"
                isRiichi={players[1]?.isRiichi || false}
                onTileClick={() => {}}
                renderTileOverlay={(tile) => renderTileEfficiency(1, tile)}
              />
              <DiscardPile
                playerId={1}
                discards={players[1]?.discards || []}
                position="east"
              />
              {renderPlayerThoughts(1)}
              {renderHandVisualization(1)}
            </div>
          </div>

          {/* 南家（メインプレイヤー） */}
          <div className="player-area south">
            <DiscardPile
              playerId={0}
              discards={players[0]?.discards || []}
              position="south"
            />
            <PlayerHand
              playerId={0}
              tiles={players[0]?.hand || []}
              isActive={currentActionIndex >= 0 && replay.actions[currentActionIndex]?.playerId === 0}
              position="south"
              isRiichi={players[0]?.isRiichi || false}
              onTileClick={() => {}}
              renderTileOverlay={(tile) => renderTileEfficiency(0, tile)}
            />
            {renderPlayerThoughts(0)}
            {renderHandVisualization(0)}
          </div>
        </div>

        {/* 点数板 */}
        <div className="score-board-replay">
          <ScoreBoard
            scores={gameState.scores || {}}
            players={replay.players}
            currentPlayer={gameState.currentPlayer || 0}
            round={gameState.round || 0}
            honba={gameState.honba || 0}
            riichiSticks={gameState.riichiSticks || 0}
          />
        </div>

        {/* 現在の行動ハイライト */}
        {highlightedAction && (
          <div className="action-highlight">
            <div className="highlight-content">
              <div className="highlight-player">
                プレイヤー {highlightedAction.playerId + 1}
              </div>
              <div className="highlight-action">
                {getActionText(highlightedAction)}
              </div>
              {highlightedAction.tile && (
                <div className="highlight-tile">
                  <Tile tile={highlightedAction.tile} size="medium" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 時間表示 */}
        <div className="time-display">
          <div className="current-time">{formatTime(currentTime)}</div>
          <div className="turn-info">
            巡目: {Math.floor(currentTime / 30)}巡目
          </div>
        </div>
      </div>
    </div>
  );
};

// ユーティリティ関数
const getSeasonalDecoration = (season?: string) => {
  switch (season) {
    case 'spring': return '🌸';
    case 'summer': return '🌿';
    case 'autumn': return '🍁';
    case 'winter': return '❄️';
    default: return '✨';
  }
};

const getActionText = (action: TurnAction): string => {
  switch (action.action) {
    case 'draw': return '牌を引く';
    case 'discard': return '牌を切る';
    case 'chii': return 'チー';
    case 'pon': return 'ポン';
    case 'kan': return 'カン';
    case 'riichi': return '立直';
    case 'win': return '和了';
    case 'tsumo': return 'ツモ';
    default: return action.action;
  }
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
