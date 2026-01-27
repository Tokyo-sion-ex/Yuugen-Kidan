import React from 'react';
import './Tile.css';

interface TileProps {
  tile: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export const Tile: React.FC<TileProps> = ({ tile, size = 'medium', onClick }) => {
  const getTileLabel = (tile: string) => {
    if (tile.startsWith('m')) return tile.replace('m', '') + '萬';
    if (tile.startsWith('p')) return tile.replace('p', '') + '筒';
    if (tile.startsWith('s')) return tile.replace('s', '') + '索';
    
    const honorTiles: Record<string, string> = {
      'ton': '東', 'nan': '南', 'sha': '西', 'pei': '北',
      'haku': '白', 'hatsu': '發', 'chun': '中'
    };
    return honorTiles[tile] || tile;
  };

  const getTileColor = (tile: string) => {
    if (tile.startsWith('m')) return '#c62828'; // 赤
    if (tile.startsWith('p')) return '#2e7d32'; // 緑
    if (tile.startsWith('s')) return '#1565c0'; // 青
    return '#5d4037'; // 茶色（字牌）
  };

  const sizeClass = {
    small: 'tile-small',
    medium: 'tile-medium',
    large: 'tile-large'
  }[size];

  return (
    <div 
      className={`tile ${sizeClass}`}
      style={{ backgroundColor: getTileColor(tile) }}
      onClick={onClick}
    >
      <div className="tile-content">
        <span className="tile-label">{getTileLabel(tile)}</span>
      </div>
      <div className="tile-border"></div>
    </div>
  );
};
