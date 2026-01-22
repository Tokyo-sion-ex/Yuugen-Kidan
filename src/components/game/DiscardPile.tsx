import React, { useMemo } from 'react';
import { Tile as TileType } from '../../types/game.types';
import Tile from './Tile';
import './DiscardPile.css';

interface DiscardPileProps {
  discards: TileType[];
  position: 'north' | 'south' | 'east' | 'west';
}

const DiscardPile: React.FC<DiscardPileProps> = ({ discards, position }) => {
  const organizedDiscards = useMemo(() => {
    // 捨て牌を6列×n行に整理
    const cols = 6;
    const rows = Math.ceil(discards.length / cols);
    const organized: TileType[][] = [];
    
    for (let row = 0; row < rows; row++) {
      const rowTiles: TileType[] = [];
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index < discards.length) {
          rowTiles.push(discards[index]);
        }
      }
      if (rowTiles.length > 0) {
        organized.push(rowTiles);
      }
    }
    
    return organized;
  }, [discards]);

  const getPositionClass = () => {
    switch (position) {
      case 'north': return 'discard-north';
      case 'south': return 'discard-south';
      case 'east': return 'discard-east';
      case 'west': return 'discard-west';
      default: return '';
    }
  };

  if (discards.length === 0) {
    return (
      <div className={`discard-pile empty ${getPositionClass()}`}>
        <div className="empty-placeholder">
          <span className="placeholder-text">捨て牌なし</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`discard-pile ${getPositionClass()}`}>
      <div className="discard-grid">
        {organizedDiscards.map((row, rowIndex) => (
          <div key={rowIndex} className="discard-row">
            {row.map((tile, colIndex) => (
              <div key={`${tile.id}_${colIndex}`} className="discard-tile-wrapper">
                <Tile
                  tile={tile}
                  isDiscard={true}
                  isHighlighted={colIndex === row.length - 1} // 最新の捨て牌をハイライト
                />
                {/* 最新の捨て牌にインジケーター */}
                {colIndex === row.length - 1 && (
                  <div className="latest-indicator">
                    <div className="indicator-dot"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* 捨て牌カウント */}
      <div className="discard-count">
        <span className="count-number">{discards.length}</span>
        <span className="count-label">捨て牌</span>
      </div>
    </div>
  );
};

export default DiscardPile;
