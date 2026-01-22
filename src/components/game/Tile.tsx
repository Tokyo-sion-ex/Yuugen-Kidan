import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tile as TileType } from '../../types/game.types';
import { TileManager } from '../../core/tiles/TileManager';
import './Tile.css';

interface TileProps {
  tile: TileType;
  isSelected?: boolean;
  isDiscard?: boolean;
  isDora?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const tileManager = new TileManager();

const Tile: React.FC<TileProps> = ({
  tile,
  isSelected = false,
  isDiscard = false,
  isDora = false,
  isHighlighted = false,
  onClick,
}) => {
  const displayName = useMemo(() => 
    tileManager.getTileDisplayName(tile), 
    [tile]
  );

  const unicodeChar = useMemo(() => 
    tileManager.getTileUnicode(tile), 
    [tile]
  );

  const tileColor = useMemo(() => {
    switch (tile.suit) {
      case 'man': return 'var(--tile-man)';
      case 'pin': return 'var(--tile-pin)';
      case 'sou': return 'var(--tile-sou)';
      case 'wind': return 'var(--tile-wind)';
      case 'dragon': return 'var(--tile-dragon)';
      default: return 'var(--yugen-moonlight)';
    }
  }, [tile.suit]);

  const getTileClassName = () => {
    return `
      tile 
      ${tile.suit} 
      ${isSelected ? 'selected' : ''} 
      ${isDiscard ? 'discard' : ''} 
      ${isDora ? 'dora' : ''}
      ${isHighlighted ? 'highlighted' : ''}
      ${tile.isRedFive ? 'red-five' : ''}
    `;
  };

  return (
    <motion.div
      className={getTileClassName()}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.1, y: -5 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        y: isSelected ? -10 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300 }}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        '--tile-color': tileColor,
      } as React.CSSProperties}
    >
      <div className="tile-inner">
        <div className="tile-face">
          {/* ユニコード文字表示（フォントがある場合） */}
          <span className="tile-unicode">{unicodeChar}</span>
          
          {/* テキスト表示（フォールバック） */}
          <span className="tile-text">{displayName}</span>
        </div>
        
        {/* 特別な状態の表示 */}
        {tile.isRedFive && (
          <div className="red-five-indicator">
            <div className="red-circle"></div>
          </div>
        )}
        
        {isDora && (
          <div className="dora-indicator">
            <div className="dora-glow"></div>
          </div>
        )}
        
        {isSelected && (
          <div className="selection-indicator"></div>
        )}
        
        {isHighlighted && (
          <div className="highlight-overlay"></div>
        )}
      </div>
    </motion.div>
  );
};

export default Tile;
