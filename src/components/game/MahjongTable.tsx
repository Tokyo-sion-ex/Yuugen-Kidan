import React, { useState } from 'react';
import { Tile } from './Tile';
import './MahjongTable.css';

// 牌の種類
const tileTypes = [
  'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9',
  'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9',
  's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9',
  'ton', 'nan', 'sha', 'pei', 'haku', 'hatsu', 'chun'
];

export const MahjongTable: React.FC = () => {
  const [playerHand, setPlayerHand] = useState<string[]>([
    'm1', 'm2', 'm3', 'p5', 'p5', 'p5', 's9', 'ton', 'nan', 'haku', 'haku'
  ]);
  const [discards, setDiscards] = useState<string[]>([]);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [scores, setScores] = useState([25000, 25000, 25000, 25000]);
  const [round, setRound] = useState(1);

  const handleTileClick = (tile: string) => {
    if (selectedTile === tile) {
      // 牌を切る
      setPlayerHand(prev => prev.filter(t => t !== tile));
      setDiscards(prev => [...prev, tile]);
      setSelectedTile(null);
      
      // 次のラウンドへ
      setRound(prev => prev + 1);
    } else {
      // 牌を選択
      setSelectedTile(tile);
    }
  };

  const drawTile = () => {
    const randomTile = tileTypes[Math.floor(Math.random() * tileTypes.length)];
    setPlayerHand(prev => [...prev, randomTile]);
  };

  const resetGame = () => {
    setPlayerHand([]);
    setDiscards([]);
    setSelectedTile(null);
    setRound(1);
    
    // 最初の13枚を引く
    const initialHand = [];
    for (let i = 0; i < 13; i++) {
      initialHand.push(tileTypes[Math.floor(Math.random() * tileTypes.length)]);
    }
    setPlayerHand(initialHand);
  };

  return (
    <div className="mahjong-table">
      <div className="table-header">
        <h2>幽玄牌卓</h2>
        <div className="game-info">
          <span>第{round}巡目</span>
          <span>残り: {tileTypes.length * 4 - playerHand.length - discards.length}牌</span>
        </div>
      </div>

      <div className="table-container">
        {/* 対戦相手のエリア（簡略表示） */}
        <div className="opponent-area north">
          <div className="player-info">
            <span>北家 (AI)</span>
            <span className="score">{scores[3].toLocaleString()}点</span>
          </div>
          <div className="hand-preview">
            {Array(13).fill(0).map((_, i) => (
              <div key={i} className="hidden-tile" />
            ))}
          </div>
        </div>

        <div className="opponent-area west">
          <div className="player-info">
            <span>西家 (AI)</span>
            <span className="score">{scores[2].toLocaleString()}点</span>
          </div>
        </div>

        <div className="opponent-area east">
          <div className="player-info">
            <span>東家 (AI)</span>
            <span className="score">{scores[1].toLocaleString()}点</span>
          </div>
        </div>

        {/* 中央エリア */}
        <div className="center-area">
          <div className="wall-display">
            <div className="wall-tile"></div>
            <span className="wall-count">
              {tileTypes.length * 4 - playerHand.length - discards.length}
            </span>
          </div>
          
          <div className="dora-display">
            <h4>ドラ表示</h4>
            <div className="dora-tiles">
              <Tile tile="m5" size="medium" />
              <Tile tile="p5" size="medium" />
              <Tile tile="s5" size="medium" />
            </div>
          </div>
        </div>

        {/* プレイヤーエリア */}
        <div className="player-area">
          <div className="discard-pile">
            <h4>捨て牌</h4>
            <div className="discard-tiles">
              {discards.map((tile, index) => (
                <Tile key={index} tile={tile} size="small" />
              ))}
            </div>
          </div>

          <div className="player-hand">
            <h4>あなたの手牌 ({playerHand.length}枚)</h4>
            <div className="hand-tiles">
              {playerHand.map((tile, index) => (
                <div 
                  key={index}
                  className={`tile-wrapper ${selectedTile === tile ? 'selected' : ''}`}
                  onClick={() => handleTileClick(tile)}
                >
                  <Tile tile={tile} size="large" />
                </div>
              ))}
            </div>
          </div>

          <div className="player-controls">
            <button onClick={drawTile} className="control-button">
              🀄 牌を引く
            </button>
            <button onClick={resetGame} className="control-button">
              🔄 リセット
            </button>
            <button className="control-button">
              🎯 リーチ
            </button>
            <button className="control-button">
              🎉 ツモ
            </button>
          </div>
        </div>
      </div>

      <div className="score-board">
        <h3>点数板</h3>
        <div className="score-grid">
          {scores.map((score, index) => (
            <div key={index} className="score-item">
              <span className="player-name">
                {index === 0 ? 'あなた' : `AI ${index}`}
              </span>
              <span className="player-score">
                {score.toLocaleString()}点
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
