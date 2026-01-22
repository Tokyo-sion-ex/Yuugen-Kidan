import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Player } from '../../types/game.types';
import './ScoreBoard.css';

interface ScoreBoardProps {
  players: Player[];
  onClose: () => void;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, onClose }) => {
  const [showHistory, setShowHistory] = useState(false);
  
  // プレイヤーを点数順にソート
  const rankedPlayers = useMemo(() => {
    return [...players]
      .map((player, index) => ({
        ...player,
        originalIndex: index,
      }))
      .sort((a, b) => b.points - a.points);
  }, [players]);
  
  // 風の日本語表記
  const windNames: Record<string, string> = {
    east: '東',
    south: '南',
    west: '西',
    north: '北',
  };
  
  // 順位の色
  const rankColors = [
    'var(--yuren-gold)',    // 1位
    'var(--yuren-sakura)',  // 2位
    'var(--yugen-spirit)',  // 3位
    'var(--yugen-ghost)',   // 4位
  ];
  
  // 点数をフォーマット
  const formatPoints = (points: number) => {
    return points.toLocaleString();
  };
  
  // 点数の増減を計算（仮の実装）
  const getPointChange = (player: Player) => {
    const basePoints = 25000;
    return player.points - basePoints;
  };
  
  // 順位報酬を計算（仮の実装）
  const calculateUma = (rank: number) => {
    const umaMap = [30, 10, -10, -30];
    return umaMap[rank - 1] * 1000;
  };
  
  return (
    <div className="score-board">
      {/* ヘッダー */}
      <div className="score-header">
        <h2 className="score-title">点数状況</h2>
        <div className="score-controls">
          <button 
            className="history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '現在の状況' : '対戦履歴'}
          </button>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      
      {!showHistory ? (
        /* 現在の点数状況 */
        <>
          {/* 順位表 */}
          <div className="rankings">
            {rankedPlayers.map((player, index) => {
              const rank = index + 1;
              const pointChange = getPointChange(player);
              const umaBonus = calculateUma(rank);
              
              return (
                <motion.div
                  key={player.id}
                  className={`ranking-card rank-${rank}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ borderColor: rankColors[index] }}
                >
                  <div className="rank-badge">
                    <span className="rank-number">{rank}</span>
                    <span className="rank-suffix">
                      {rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'}
                    </span>
                  </div>
                  
                  <div className="player-info">
                    <div className="player-name-section">
                      <span className="player-name">{player.name}</span>
                      <span className="player-wind">
                        {windNames[player.position]}家
                      </span>
                      {player.isDealer && (
                        <span className="dealer-indicator">親</span>
                      )}
                    </div>
                    
                    <div className="player-stats">
                      <div className="player-points">
                        <span className="points-label">現在点数</span>
                        <span className="points-value">{formatPoints(player.points)}</span>
                      </div>
                      
                      <div className="point-details">
                        <div className="point-change">
                          <span className="change-label">変動</span>
                          <span className={`change-value ${pointChange >= 0 ? 'positive' : 'negative'}`}>
                            {pointChange >= 0 ? '+' : ''}{formatPoints(pointChange)}
                          </span>
                        </div>
                        
                        <div className="uma-bonus">
                          <span className="uma-label">順位点</span>
                          <span className="uma-value">{umaBonus >= 0 ? '+' : ''}{umaBonus}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* リーチ棒表示 */}
                  {player.isRiichi && (
                    <div className="riichi-stick-display">
                      <div className="riichi-stick"></div>
                      <span className="riichi-text">リーチ中</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {/* 合計点数 */}
          <div className="total-points">
            <div className="total-header">
              <h3>合計点数</h3>
              <span className="total-sum">
                {formatPoints(players.reduce((sum, p) => sum + p.points, 0))}
              </span>
            </div>
            <div className="total-note">
              基準点: 25,000点 × 4人 = 100,000点
            </div>
          </div>
          
          {/* 順位予想 */}
          <div className="rank-prediction">
            <h3>最終順位予想</h3>
            <div className="prediction-bars">
              {rankedPlayers.map((player, index) => {
                const probability = [40, 30, 20, 10][index]; // 仮の確率
                return (
                  <div key={player.id} className="prediction-item">
                    <div className="prediction-name">
                      <span className="prediction-rank">{index + 1}位</span>
                      <span className="prediction-player">{player.name}</span>
                    </div>
                    <div className="prediction-bar">
                      <motion.div
                        className="prediction-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${probability}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 1 }}
                        style={{ background: rankColors[index] }}
                      />
                      <span className="prediction-percent">{probability}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* 対戦履歴 */
        <div className="game-history">
          <h3>対戦履歴</h3>
          <div className="history-list">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="history-item">
                <div className="history-round">
                  <span className="round-number">{index + 1}局</span>
                  <span className="round-result">東家 和了</span>
                </div>
                <div className="history-points">
                  <div className="point-change">
                    <span className="player-name">あなた</span>
                    <span className="change-value positive">+8,000</span>
                  </div>
                  <div className="point-change">
                    <span className="player-name">CPU南</span>
                    <span className="change-value negative">-4,000</span>
                  </div>
                  <div className="point-change">
                    <span className="player-name">CPU西</span>
                    <span className="change-value negative">-2,000</span>
                  </div>
                  <div className="point-change">
                    <span className="player-name">CPU北</span>
                    <span className="change-value negative">-2,000</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* フッター */}
      <div className="score-footer">
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">対戦形式:</span>
            <span className="info-value">東風戦</span>
          </div>
          <div className="info-item">
            <span className="info-label">リーチ棒:</span>
            <span className="info-value">1本 (1,000点)</span>
          </div>
        </div>
        <div className="time-stamp">
          更新: {new Date().toLocaleTimeString('ja-JP')}
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;
