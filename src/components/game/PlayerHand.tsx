import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tile as TileType } from '../../types/game.types';
import Tile from './Tile';
import './PlayerHand.css';

interface PlayerHandProps {
  tiles: TileType[];
  selectedTile: string | null;
  onTileSelect: (tileId: string) => void;
  isMyTurn: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  tiles,
  selectedTile,
  onTileSelect,
  isMyTurn,
}) => {
  const handleTileClick = useCallback((tileId: string) => {
    if (isMyTurn) {
      onTileSelect(tileId);
    }
  }, [isMyTurn, onTileSelect]);

  const sortedTiles = [...tiles].sort((a, b) => {
    // 牌を種類ごとにグループ化
    const suitOrder = { man: 1, pin: 2, sou: 3, wind: 4, dragon: 5 };
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    
    if (typeof a.value === 'number' && typeof b.value === 'number') {
      return a.value - b.value;
    }
    
    return 0;
  });

  return (
    <div className={`player-hand ${isMyTurn ? 'active-turn' : ''}`}>
      <div className="hand-container">
        {sortedTiles.map((tile, index) => (
          <motion.div
            key={tile.id}
            className="hand-tile-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={isMyTurn ? { y: -10 } : {}}
          >
            <Tile
              tile={tile}
              isSelected={selectedTile === tile.id}
              onClick={() => handleTileClick(tile.id)}
            />
            
            {/* 牌の上に表示するインデックス（デバッグ用） */}
            {process.env.NODE_ENV === 'development' && (
              <div className="tile-index">{index + 1}</div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* ターン表示 */}
      <div className="turn-indicator">
        {isMyTurn ? (
          <motion.div
            className="my-turn"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="indicator-dot"></span>
            <span className="indicator-text">あなたのターン</span>
          </motion.div>
        ) : (
          <div className="waiting-turn">
            <span className="indicator-text">相手のターン待ち</span>
          </div>
        )}
      </div>
      
      {/* 手牌情報 */}
      <div className="hand-info">
        <div className="hand-count">
          手牌: {tiles.length}枚
        </div>
        {selectedTile && (
          <div className="selected-info">
            選択中
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHand;
