import React, { useState, useEffect } from 'react';
import { TileEfficiency, SuggestedAction } from '../../types/game.types';
import { Tile } from '../game/Tile';
import './RealTimeAnalyzer.css';

interface Props {
  currentHand: TileType[];
  efficiencies?: TileEfficiency[];
  suggestions?: SuggestedAction[];
  onTileSelect?: (tile: TileType) => void;
}

export const RealTimeAnalyzer: React.FC<Props> = ({
  currentHand,
  efficiencies = [],
  suggestions = [],
  onTileSelect
}) => {
  const [selectedTile, setSelectedTile] = useState<TileType | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'efficiency' | 'danger' | 'suggestion'>('efficiency');

  // 牌をクリックした時の分析表示
  const handleTileClick = (tile: TileType) => {
    setSelectedTile(tile);
    if (onTileSelect) onTileSelect(tile);
  };

  // 選択された牌の詳細分析
  const selectedTileAnalysis = efficiencies.find(e => e.tile === selectedTile);

  return (
    <div className="real-time-analyzer">
      {/* 分析モード切り替え */}
      <div className="analyzer-mode-selector">
        <button 
          className={analysisMode === 'efficiency' ? 'active' : ''}
          onClick={() => setAnalysisMode('efficiency')}
        >
          🎯 牌効率
        </button>
        <button 
          className={analysisMode === 'danger' ? 'active' : ''}
          onClick={() => setAnalysisMode('danger')}
        >
          ⚠️ 危険度
        </button>
        <button 
          className={analysisMode === 'suggestion' ? 'active' : ''}
          onClick={() => setAnalysisMode('suggestion')}
        >
          🤖 AI提案
        </button>
      </div>

      {/* 手牌表示（効率スコア付き） */}
      <div className="hand-with-analysis">
        <h4>現在の手牌分析</h4>
        <div className="hand-tiles">
          {currentHand.map((tile, index) => {
            const eff = efficiencies.find(e => e.tile === tile);
            const score = eff?.efficiencyScore || 50;
            
            // スコアに応じた色クラス
            const scoreClass = score >= 70 ? 'high' : 
                              score >= 40 ? 'medium' : 'low';
            
            return (
              <div 
                key={index}
                className={`tile-with-score ${selectedTile === tile ? 'selected' : ''}`}
                onClick={() => handleTileClick(tile)}
              >
                <Tile tile={tile} size="small" />
                <div className={`efficiency-badge ${scoreClass}`}>
                  {score}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 詳細分析パネル */}
      {selectedTile && selectedTileAnalysis && (
        <div className="detailed-analysis">
          <h4>📊 「{selectedTile}」の詳細分析</h4>
          
          {analysisMode === 'efficiency' && (
            <div className="efficiency-details">
              <div className="metric">
                <span className="label">牌効率スコア</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${selectedTileAnalysis.efficiencyScore}%` }}
                  ></div>
                </div>
                <span className="value">{selectedTileAnalysis.efficiencyScore}/100</span>
              </div>
              
              <div className="metric">
                <span className="label">可能な面子構成</span>
                <span className="value">{selectedTileAnalysis.possibleMelds} 通り</span>
              </div>
              
              <div className="metric">
                <span className="label">待ち改善度</span>
                <span className="value">{selectedTileAnalysis.waitImprovement}%</span>
              </div>
            </div>
          )}

          {analysisMode === 'danger' && selectedTileAnalysis.dangerLevel && (
            <div className="danger-details">
              <div className="metric">
                <span className="label">放銃危険度</span>
                <div className="danger-bar">
                  <div 
                    className={`danger-fill level-${Math.ceil(selectedTileAnalysis.dangerLevel / 25)}`}
                    style={{ width: `${selectedTileAnalysis.dangerLevel}%` }}
                  ></div>
                </div>
                <span className="value">{selectedTileAnalysis.dangerLevel}%</span>
              </div>
              
              <div className="warning-tip">
                {selectedTileAnalysis.dangerLevel > 60 && (
                  <p>⚠️ 危険！この牌は高確率で放銃する可能性があります</p>
                )}
                {selectedTileAnalysis.dangerLevel > 30 && selectedTileAnalysis.dangerLevel <= 60 && (
                  <p>⚠️ 注意！他家の待ち牌になっている可能性があります</p>
                )}
                {selectedTileAnalysis.dangerLevel <= 30 && (
                  <p>✅ 比較的安全な牌です</p>
                )}
              </div>
            </div>
          )}

          {analysisMode === 'suggestion' && suggestions.length > 0 && (
            <div className="suggestion-details">
              <h5>AIが提案する最適手:</h5>
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <div 
                  key={index}
                  className={`suggestion-item ${index === 0 ? 'best' : ''}`}
                >
                  <div className="suggestion-rank">#{index + 1}</div>
                  <div className="suggestion-action">
                    <strong>{suggestion.type === 'discard' ? '切る' : 
                            suggestion.type === 'chii' ? 'チー' : 'ポン'}</strong>
                    <Tile tile={suggestion.tile} size="small" />
                  </div>
                  <div className="suggestion-reason">
                    {suggestion.reason}
                  </div>
                  <div className="suggestion-value">
                    期待値: +{suggestion.expectedValue}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
