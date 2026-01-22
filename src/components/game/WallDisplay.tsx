import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tile as TileType } from '../../types/game.types';
import Tile from './Tile';
import './WallDisplay.css';

interface WallDisplayProps {
  wallCount: number;
  doraIndicators: TileType[];
}

const WallDisplay: React.FC<WallDisplayProps> = ({ wallCount, doraIndicators }) => {
  const [showDora, setShowDora] = useState(false);
  const [remainingTiles, setRemainingTiles] = useState<number[]>([]);
  
  // 牌山の残り枚数に基づいてビジュアルを生成
  useEffect(() => {
    const tiles = [];
    // 最大70枚まで表示
    const displayCount = Math.min(wallCount, 70);
    for (let i = 0; i < displayCount; i++) {
      tiles.push(i);
    }
    setRemainingTiles(tiles);
  }, [wallCount]);

  const getWallStatus = () => {
    if (wallCount >= 70) return 'full';
    if (wallCount >= 35) return 'half';
    if (wallCount >= 10) return 'low';
    return 'critical';
  };

  const wallStatus = getWallStatus();
  
  const getStatusColor = () => {
    switch (wallStatus) {
      case 'full': return 'var(--yugen-spirit)';
      case 'half': return 'var(--yugen-gold)';
      case 'low': return 'var(--yuren-sakura)';
      case 'critical': return 'var(--tile-man)';
      default: return 'var(--yugen-ghost)';
    }
  };

  const getStatusText = () => {
    switch (wallStatus) {
      case 'full': return '豊富';
      case 'half': return '中盤';
      case 'low': return '残り少ない';
      case 'critical': return '山枯れ近し';
      default: return '';
    }
  };

  return (
    <div className="wall-display">
      {/* 牌山タイトル */}
      <div className="wall-header">
        <h3 className="wall-title">牌山</h3>
        <div className="wall-status" style={{ color: getStatusColor() }}>
          {getStatusText()}
        </div>
      </div>
      
      {/* 牌山ビジュアル */}
      <div className="wall-visual">
        <div className="wall-stack">
          <AnimatePresence>
            {remainingTiles.map((index) => (
              <motion.div
                key={`wall_${index}`}
                className="wall-tile-placeholder"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: index * 0.001 }}
                style={{
                  opacity: 0.3 + (index / remainingTiles.length) * 0.5,
                  transform: `translate(${Math.sin(index) * 2}px, ${Math.cos(index) * 2}px)`,
                }}
              >
                <div className="wall-tile-back"></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* 残り枚数表示 */}
        <div className="wall-count">
          <div className="count-circle">
            <span className="count-number">{wallCount}</span>
          </div>
          <span className="count-label">残り枚数</span>
        </div>
      </div>
      
      {/* ドラ表示 */}
      <div className="dora-section">
        <div className="dora-header">
          <h4 className="dora-title">
            ドラ表示牌
            <button 
              className="dora-toggle"
              onClick={() => setShowDora(!showDora)}
              title={showDora ? "隠す" : "表示"}
            >
              {showDora ? '👁️' : '👁️‍🗨️'}
            </button>
          </h4>
        </div>
        
        <AnimatePresence>
          {showDora && (
            <motion.div
              className="dora-indicators"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {doraIndicators.length > 0 ? (
                <div className="dora-tiles">
                  {doraIndicators.map((dora, index) => (
                    <motion.div
                      key={`dora_${index}`}
                      className="dora-tile-wrapper"
                      initial={{ rotateY: 90 }}
                      animate={{ rotateY: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <Tile
                        tile={dora}
                        isDora={true}
                      />
                      {index === 0 && (
                        <div className="dora-label">表ドラ</div>
                      )}
                    </motion.div>
                  ))}
                  
                  {/* 裏ドラプレースホルダー */}
                  <div className="ura-dora-placeholder">
                    <div className="ura-dora-tile">
                      <div className="tile-back"></div>
                      <div className="ura-label">裏ドラ</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-dora">
                  ドラ表示牌はまだありません
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* ドラ説明 */}
        <div className="dora-info">
          <div className="info-item">
            <span className="info-label">表ドラ:</span>
            <span className="info-value">+1飜</span>
          </div>
          <div className="info-item">
            <span className="info-label">裏ドラ:</span>
            <span className="info-value">リーチ後に公開</span>
          </div>
        </div>
      </div>
      
      {/* 山の状態インジケーター */}
      <div className="wall-progress">
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: '0%' }}
            animate={{ width: `${(wallCount / 70) * 100}%` }}
            transition={{ duration: 1 }}
            style={{ background: getStatusColor() }}
          />
        </div>
        <div className="progress-labels">
          <span className="label-start">山の頭</span>
          <span className="label-end">山枯れ</span>
        </div>
      </div>
    </div>
  );
};

export default WallDisplay;
