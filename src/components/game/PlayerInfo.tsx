import React, { useMemo } from 'react';
import { Player as PlayerType } from '../../types/game.types';
import './PlayerInfo.css';

interface PlayerInfoProps {
  player: PlayerType;
  isCurrent: boolean;
  isDealer: boolean;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, isCurrent, isDealer }) => {
  const windSymbol = useMemo(() => {
    const symbols = {
      east: '東',
      south: '南',
      west: '西',
      north: '北',
    };
    return symbols[player.position];
  }, [player.position]);

  const formatPoints = (points: number) => {
    return points.toLocaleString();
  };

  return (
    <div className={`player-info ${isCurrent ? 'current-player' : ''}`}>
      <div className="player-header">
        <div className="player-name-section">
          <span className="player-name">{player.name}</span>
          {isDealer && <span className="dealer-badge">親</span>}
        </div>
        <div className="player-wind">
          <span className="wind-symbol">{windSymbol}</span>
          <span className="wind-label">家</span>
        </div>
      </div>
      
      <div className="player-details">
        <div className="player-points">
          <span className="points-label">点数</span>
          <span className="points-value">{formatPoints(player.points)}</span>
        </div>
        
        {player.isRiichi && (
          <div className="riichi-indicator">
            <span className="riichi-text">リーチ中</span>
            <div className="riichi-stick"></div>
          </div>
        )}
        
        <div className="hand-count">
          手牌: {player.hand.length}枚
        </div>
      </div>
      
      {/* 現在のプレイヤー表示 */}
      {isCurrent && (
        <div className="current-turn-indicator">
          <div className="turn-glow"></div>
          <span className="turn-text">思考中...</span>
        </div>
      )}
    </div>
  );
};

export default PlayerInfo;
