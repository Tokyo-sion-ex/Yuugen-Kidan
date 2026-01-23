import React, { useState, useEffect, useCallback } from 'react';
import { 
  TileType, 
  TileEfficiency, 
  SuggestedAction,
  AnalysisSettings 
} from '../../types/game.types';
import { Tile } from '../game/Tile';
import { tileAnalyzer } from '../../core/analytics/TileAnalyzer';
import { aiAnalyzer } from '../../core/analytics/AIAnalyzer';
import { storageManager } from '../../utils/AdvancedStorageManager';
import './RealTimeAnalyzer.css';

interface RealTimeAnalyzerProps {
  currentHand: TileType[];
  discards: TileType[];
  doraIndicators: TileType[];
  round: number;
  playerWind: string;
  roundWind: string;
  playerId: number;
  scores: { [key: number]: number };
  riichis: number[];
  onTileSelect?: (tile: TileType, action?: SuggestedAction) => void;
  onSuggestionAccept?: (suggestion: SuggestedAction) => void;
  enabled?: boolean;
}

export const RealTimeAnalyzer: React.FC<RealTimeAnalyzerProps> = ({
  currentHand,
  discards,
  doraIndicators,
  round,
  playerWind,
  roundWind,
  playerId,
  scores,
  riichis,
  onTileSelect,
  onSuggestionAccept,
  enabled = true
}) => {
  const [selectedTile, setSelectedTile] = useState<TileType | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'efficiency' | 'danger' | 'suggestion' | 'strategy'>('efficiency');
  const [efficiencies, setEfficiencies] = useState<TileEfficiency[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedAction[]>([]);
  const [settings, setSettings] = useState<AnalysisSettings>({
    enabled: true,
    realTimeSuggestions: true,
    showEfficiencyScores: true,
    dangerWarnings: true,
    postGameAnalysis: true,
    difficulty: 'intermediate',
    focusAreas: ['efficiency', 'defense']
  });
  const [situation, setSituation] = useState<{
    type: string;
    strategy: string;
    riskTolerance: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [handAnalysis, setHandAnalysis] = useState<{
    overallEfficiency: number;
    tenpaiProbability: number;
    handType: string;
    suggestedDiscards: TileType[];
  } | null>(null);

  // 分析設定を読み込み
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await storageManager.getAnalysisSettings();
        setSettings(savedSettings);
      } catch (error) {
        console.error('Failed to load analysis settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // 手牌が変わったら分析を実行
  useEffect(() => {
    if (!enabled || !settings.enabled || currentHand.length === 0) return;
    
    const analyzeHand = async () => {
      setIsLoading(true);
      
      try {
        // 牌効率の計算
        const newEfficiencies = tileAnalyzer.calculateEfficiency(
          currentHand,
          doraIndicators,
          round,
          playerWind,
          roundWind,
          discards
        );
        setEfficiencies(newEfficiencies);
        
        // AI提案の取得
        if (settings.realTimeSuggestions) {
          const context = {
            round,
            honba: 0,
            riichiSticks: 0,
            riichis,
            doraIndicators,
            wallTilesRemaining: 70,
            deadWallTilesRemaining: 14,
            playerWind: { [playerId]: playerWind },
            roundWind,
            scores
          };
          
          const newSuggestions = aiAnalyzer.suggestOptimalActions(
            playerId,
            currentHand,
            discards,
            context
          );
          setSuggestions(newSuggestions);
        }
        
        // 手牌全体の分析
        const analysis = tileAnalyzer.analyzeCompleteHand(
          currentHand,
          doraIndicators,
          round
        );
        setHandAnalysis({
          ...analysis,
          handType: this.translateHandType(analysis.handType)
        });
        
        // 局面評価
        const situationAnalysis = aiAnalyzer.evaluateSituation(
          playerId,
          scores,
          round,
          riichis
        );
        setSituation({
          type: this.translateSituation(situationAnalysis.situation),
          strategy: this.translateStrategy(situationAnalysis.recommendedStrategy),
          riskTolerance: situationAnalysis.riskTolerance
        });
        
      } catch (error) {
        console.error('Analysis failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // デバウンスで分析実行（手牌変更が頻繁にあるため）
    const timeoutId = setTimeout(analyzeHand, 300);
    return () => clearTimeout(timeoutId);
  }, [
    currentHand, 
    doraIndicators, 
    round, 
    enabled, 
    settings.enabled,
    settings.realTimeSuggestions
  ]);

  // 牌を選択したときの処理
  const handleTileClick = useCallback((tile: TileType) => {
    setSelectedTile(tile === selectedTile ? null : tile);
    
    if (onTileSelect) {
      const relatedSuggestion = suggestions.find(s => s.tile === tile);
      onTileSelect(tile, relatedSuggestion);
    }
  }, [selectedTile, suggestions, onTileSelect]);

  // 提案を受け入れたときの処理
  const handleAcceptSuggestion = useCallback((suggestion: SuggestedAction) => {
    if (onSuggestionAccept) {
      onSuggestionAccept(suggestion);
    }
    
    // フィードバックを記録（学習用）
    storageManager.setCache(
      `suggestion_feedback_${Date.now()}`,
      {
        suggestion,
        accepted: true,
        timestamp: Date.now(),
        context: { round, playerWind, scores }
      },
      86400000 // 24時間
    ).catch(console.error);
  }, [onSuggestionAccept, round, playerWind, scores]);

  // 選択された牌の詳細分析
  const selectedTileAnalysis = selectedTile 
    ? efficiencies.find(e => e.tile === selectedTile)
    : null;

  // 分析モードを切り替え
  const handleModeChange = (mode: 'efficiency' | 'danger' | 'suggestion' | 'strategy') => {
    setAnalysisMode(mode);
    setSelectedTile(null); // モード変更時に選択を解除
  };

  // 設定を保存
  const saveSettings = async (newSettings: Partial<AnalysisSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      await storageManager.saveAnalysisSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // 翻訳ヘルパー関数
  const translateHandType = (type: string): string => {
    switch (type) {
      case 'ready': return '聴牌';
      case 'one_away': return '一向聴';
      case 'two_away': return '二向聴';
      case 'far': return '戦略構築中';
      default: return type;
    }
  };

  const translateSituation = (type: string): string => {
    switch (type) {
      case 'leading': return '優勢';
      case 'trailing': return '劣勢';
      case 'neutral': return '均衡';
      case 'danger': return '危険';
      default: return type;
    }
  };

  const translateStrategy = (strategy: string): string => {
    switch (strategy) {
      case 'aggressive': return '積極的';
      case 'defensive': return '守備的';
      case 'balanced': return 'バランス';
      default: return strategy;
    }
  };

  // 危険度の色を取得
  const getDangerColor = (level: number): string => {
    if (level >= 70) return '#f44336';
    if (level >= 50) return '#ff9800';
    if (level >= 30) return '#ffeb3b';
    return '#4caf50';
  };

  // 効率スコアの色を取得
  const getEfficiencyColor = (score: number): string => {
    if (score >= 70) return '#4caf50';
    if (score >= 50) return '#8bc34a';
    if (score >= 30) return '#ffc107';
    return '#f44336';
  };

  if (!enabled || !settings.enabled) {
    return (
      <div className="analyzer-disabled">
        <p>牌眼システムは現在無効です</p>
        <button 
          className="enable-button"
          onClick={() => saveSettings({ enabled: true })}
        >
          有効化する
        </button>
      </div>
    );
  }

  return (
    <div className="real-time-analyzer">
      {/* ヘッダーと設定 */}
      <div className="analyzer-header">
        <div className="header-title">
          <h3>🧠 幽玄牌眼システム</h3>
          <span className="status-badge">
            {isLoading ? '分析中...' : '稼働中'}
          </span>
        </div>
        
        <div className="header-controls">
          <button
            className="settings-button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="設定"
          >
            ⚙️
          </button>
          <button
            className="help-button"
            onClick={() => window.open('/guide/analyzer', '_blank')}
            title="ヘルプ"
          >
            ❓
          </button>
        </div>
      </div>

      {/* 高度な設定パネル */}
      {showAdvanced && (
        <div className="advanced-settings-panel">
          <h4>分析設定</h4>
          
          <div className="settings-group">
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.realTimeSuggestions}
                onChange={(e) => saveSettings({ realTimeSuggestions: e.target.checked })}
              />
              <span className="toggle-label">リアルタイム提案</span>
            </label>
            
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.showEfficiencyScores}
                onChange={(e) => saveSettings({ showEfficiencyScores: e.target.checked })}
              />
              <span className="toggle-label">効率スコア表示</span>
            </label>
            
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={settings.dangerWarnings}
                onChange={(e) => saveSettings({ dangerWarnings: e.target.checked })}
              />
              <span className="toggle-label">危険度警告</span>
            </label>
          </div>
          
          <div className="settings-group">
            <label className="setting-select">
              <span>難易度:</span>
              <select
                value={settings.difficulty}
                onChange={(e) => saveSettings({ 
                  difficulty: e.target.value as any 
                })}
              >
                <option value="beginner">初心者</option>
                <option value="intermediate">中級者</option>
                <option value="advanced">上級者</option>
              </select>
            </label>
          </div>
          
          <div className="settings-group">
            <span>重点エリア:</span>
            <div className="focus-areas">
              {['efficiency', 'defense', 'riichi', 'yaku'].map(area => (
                <label key={area} className="focus-area-checkbox">
                  <input
                    type="checkbox"
                    checked={settings.focusAreas.includes(area)}
                    onChange={(e) => {
                      const newAreas = e.target.checked
                        ? [...settings.focusAreas, area]
                        : settings.focusAreas.filter(a => a !== area);
                      saveSettings({ focusAreas: newAreas });
                    }}
                  />
                  <span>{this.translateFocusArea(area)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* モード選択 */}
      <div className="analyzer-mode-selector">
        <button
          className={`mode-button ${analysisMode === 'efficiency' ? 'active' : ''}`}
          onClick={() => handleModeChange('efficiency')}
          disabled={isLoading}
        >
          <span className="mode-icon">🎯</span>
          <span className="mode-label">牌効率</span>
        </button>
        
        <button
          className={`mode-button ${analysisMode === 'danger' ? 'active' : ''}`}
          onClick={() => handleModeChange('danger')}
          disabled={isLoading}
        >
          <span className="mode-icon">⚠️</span>
          <span className="mode-label">危険度</span>
        </button>
        
        <button
          className={`mode-button ${analysisMode === 'suggestion' ? 'active' : ''}`}
          onClick={() => handleModeChange('suggestion')}
          disabled={isLoading || !settings.realTimeSuggestions}
        >
          <span className="mode-icon">🤖</span>
          <span className="mode-label">AI提案</span>
        </button>
        
        <button
          className={`mode-button ${analysisMode === 'strategy' ? 'active' : ''}`}
          onClick={() => handleModeChange('strategy')}
          disabled={isLoading}
        >
          <span className="mode-icon">🗺️</span>
          <span className="mode-label">戦略</span>
        </button>
      </div>

      {/* 手牌分析表示 */}
      <div className="hand-analysis-section">
        <div className="section-header">
          <h4>現在の手牌分析</h4>
          {handAnalysis && (
            <div className="hand-summary">
              <span className="summary-item">
                全体効率: <strong>{handAnalysis.overallEfficiency}</strong>
              </span>
              <span className="summary-item">
                聴牌率: <strong>{handAnalysis.tenpaiProbability}%</strong>
              </span>
              <span className="summary-item">
                状態: <strong>{handAnalysis.handType}</strong>
              </span>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>牌を分析中...</p>
          </div>
        ) : (
          <div className="hand-tiles-grid">
            {currentHand.map((tile, index) => {
              const eff = efficiencies.find(e => e.tile === tile);
              const score = eff?.efficiencyScore || 50;
              const danger = eff?.dangerLevel || 0;
              
              return (
                <div
                  key={`${tile}-${index}`}
                  className={`tile-analysis-card ${selectedTile === tile ? 'selected' : ''}`}
                  onClick={() => handleTileClick(tile)}
                  style={{
                    borderColor: analysisMode === 'danger' 
                      ? getDangerColor(danger)
                      : getEfficiencyColor(score)
                  }}
                >
                  <div className="tile-display">
                    <Tile tile={tile} size="medium" />
                  </div>
                  
                  {settings.showEfficiencyScores && (
                    <div className="tile-metrics">
                      {analysisMode === 'efficiency' && (
                        <div className="metric efficiency-metric">
                          <div className="metric-label">効率</div>
                          <div 
                            className="metric-value"
                            style={{ color: getEfficiencyColor(score) }}
                          >
                            {score}
                          </div>
                        </div>
                      )}
                      
                      {analysisMode === 'danger' && settings.dangerWarnings && (
                        <div className="metric danger-metric">
                          <div className="metric-label">危険度</div>
                          <div 
                            className="metric-value"
                            style={{ color: getDangerColor(danger) }}
                          >
                            {danger}%
                          </div>
                        </div>
                      )}
                      
                      {analysisMode === 'suggestion' && eff && (
                        <div className="metric suggestion-metric">
                          <div className="metric-label">優先度</div>
                          <div className="metric-value priority">
                            {eff.discardPriority === 'high' ? '高' :
                             eff.discardPriority === 'medium' ? '中' : '低'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {eff?.reasons && eff.reasons.length > 0 && selectedTile === tile && (
                    <div className="tile-reasons">
                      {eff.reasons.slice(0, 2).map((reason, idx) => (
                        <div key={idx} className="reason-tag">
                          {reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 詳細分析パネル */}
      {selectedTileAnalysis && (
        <div className="detailed-analysis-panel">
          <div className="panel-header">
            <h4>
              <Tile tile={selectedTile!} size="small" />
              <span className="tile-name">
                {tileAnalyzer.getTileInfo(selectedTile!)?.name || selectedTile}
              </span>
              の詳細分析
            </h4>
            <button 
              className="close-button"
              onClick={() => setSelectedTile(null)}
            >
              ×
            </button>
          </div>
          
          <div className="analysis-content">
            {analysisMode === 'efficiency' && (
              <div className="efficiency-details">
                <div className="metric-row">
                  <div className="metric-info">
                    <span className="metric-title">牌効率スコア</span>
                    <span className="metric-description">
                      この牌の手作りやすさを0-100で評価
                    </span>
                  </div>
                  <div className="metric-visualization">
                    <div className="score-bar">
                      <div 
                        className="score-fill"
                        style={{ 
                          width: `${selectedTileAnalysis.efficiencyScore}%`,
                          backgroundColor: getEfficiencyColor(selectedTileAnalysis.efficiencyScore)
                        }}
                      ></div>
                    </div>
                    <div className="score-value">
                      {selectedTileAnalysis.efficiencyScore}/100
                    </div>
                  </div>
                </div>
                
                <div className="metric-row">
                  <div className="metric-info">
                    <span className="metric-title">可能な面子構成</span>
                    <span className="metric-description">
                      この牌を使った面子の組み合わせ数
                    </span>
                  </div>
                  <div className="metric-value-large">
                    {selectedTileAnalysis.possibleMelds} 通り
                  </div>
                </div>
                
                <div className="metric-row">
                  <div className="metric-info">
                    <span className="metric-title">待ち改善度</span>
                    <span className="metric-description">
                      この牌を切ったときの待ちの広がり
                    </span>
                  </div>
                  <div className="metric-visualization">
                    <div className="improvement-indicator">
                      <div 
                        className="improvement-fill"
                        style={{ width: `${selectedTileAnalysis.waitImprovement}%` }}
                      ></div>
                    </div>
                    <div className="score-value">
                      {selectedTileAnalysis.waitImprovement}%
                    </div>
                  </div>
                </div>
                
                {selectedTileAnalysis.reasons && selectedTileAnalysis.reasons.length > 0 && (
                  <div className="reasons-list">
                    <h5>評価理由:</h5>
                    <ul>
                      {selectedTileAnalysis.reasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {analysisMode === 'danger' && selectedTileAnalysis.dangerLevel !== undefined && (
              <div className="danger-details">
                <div className="metric-row">
                  <div className="metric-info">
                    <span className="metric-title">放銃危険度</span>
                    <span className="metric-description">
                      この牌を切ったときの放銃確率の推定値
                    </span>
                  </div>
                  <div className="metric-visualization">
                    <div className="danger-bar">
                      <div 
                        className="danger-fill"
                        style={{ 
                          width: `${selectedTileAnalysis.dangerLevel}%`,
                          backgroundColor: getDangerColor(selectedTileAnalysis.dangerLevel)
                        }}
                      ></div>
                    </div>
                    <div className="score-value">
                      {selectedTileAnalysis.dangerLevel}%
                    </div>
                  </div>
                </div>
                
                <div className="danger-assessment">
                  <h5>危険度評価:</h5>
                  {selectedTileAnalysis.dangerLevel >= 70 ? (
                    <div className="warning-high">
                      ⚠️ <strong>非常に危険！</strong>
                      <p>この牌を切ると高確率で放銃する可能性があります。</p>
                      <p>可能であれば他の牌を検討してください。</p>
                    </div>
                  ) : selectedTileAnalysis.dangerLevel >= 50 ? (
                    <div className="warning-medium">
                      ⚠️ <strong>注意が必要</strong>
                      <p>この牌は他家の待ち牌になっている可能性があります。</p>
                      <p>状況をよく確認してから切るか、安全牌を優先してください。</p>
                    </div>
                  ) : selectedTileAnalysis.dangerLevel >= 30 ? (
                    <div className="warning-low">
                      ⚠️ <strong>やや危険</strong>
                      <p>この牌にはある程度の危険が伴います。</p>
                      <p>より安全な牌があればそちらを優先しましょう。</p>
                    </div>
                  ) : (
                    <div className="warning-none">
                      ✅ <strong>比較的安全</strong>
                      <p>この牌は現状では比較的安全に切ることができます。</p>
                    </div>
                  )}
                </div>
                
                <div className="danger-context">
                  <h5>危険度の考慮要素:</h5>
                  <ul>
                    <li>ラウンド進行度: {round}巡目</li>
                    <li>立直者数: {riichis.length}人</li>
                    <li>捨て牌履歴: {discards.includes(selectedTile!) ? 'あり' : 'なし'}</li>
                  </ul>
                </div>
              </div>
            )}
            
            {analysisMode === 'suggestion' && suggestions.length > 0 && (
              <div className="suggestion-details">
                <h5>AIからの提案:</h5>
                {suggestions
                  .filter(s => s.tile === selectedTile)
                  .slice(0, 3)
                  .map((suggestion, index) => (
                    <div 
                      key={index}
                      className={`suggestion-card ${index === 0 ? 'best' : ''}`}
                    >
                      <div className="suggestion-header">
                        <span className="suggestion-rank">
                          #{index + 1} 提案
                        </span>
                        <span className="suggestion-confidence">
                          信頼度: {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                      
                      <div className="suggestion-content">
                        <div className="suggestion-action">
                          <strong>
                            {suggestion.type === 'discard' ? '切る' :
                             suggestion.type === 'pon' ? 'ポン' :
                             suggestion.type === 'chii' ? 'チー' :
                             suggestion.type === 'riichi' ? '立直' : '行動'}
                          </strong>
                          <Tile tile={suggestion.tile} size="small" />
                        </div>
                        
                        <div className="suggestion-reason">
                          {suggestion.reason}
                        </div>
                        
                        <div className="suggestion-metrics">
                          <div className="expected-value">
                            期待値: <span>+{suggestion.expectedValue}</span>
                          </div>
                          {suggestion.alternativeTiles && suggestion.alternativeTiles.length > 0 && (
                            <div className="alternatives">
                              代替候補: {suggestion.alternativeTiles.map(t => (
                                <Tile key={t} tile={t} size="tiny" />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <button
                          className="accept-suggestion-button"
                          onClick={() => handleAcceptSuggestion(suggestion)}
                        >
                          この提案を採用
                        </button>
                      </div>
                    </div>
                  ))}
                
                {suggestions.filter(s => s.tile === selectedTile).length === 0 && (
                  <div className="no-suggestions">
                    <p>この牌に対するAI提案はありません。</p>
                    <p>現在の手牌状況では最適な選択です。</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 戦略モード */}
      {analysisMode === 'strategy' && situation && (
        <div className="strategy-panel">
          <div className="situation-overview">
            <h4>現在の局面分析</h4>
            <div className="situation-cards">
              <div className="situation-card">
                <div className="card-label">状況</div>
                <div className={`card-value situation-${situation.type}`}>
                  {situation.type}
                </div>
              </div>
              
              <div className="situation-card">
                <div className="card-label">推奨戦略</div>
                <div className={`card-value strategy-${situation.strategy}`}>
                  {situation.strategy}
                </div>
              </div>
              
              <div className="situation-card">
                <div className="card-label">リスク許容度</div>
                <div className="card-value">
                  <div className="risk-meter">
                    <div 
                      className="risk-fill"
                      style={{ width: `${situation.riskTolerance}%` }}
                    ></div>
                  </div>
                  <span>{situation.riskTolerance}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="strategy-recommendations">
            <h4>戦術的アドバイス</h4>
            {situation.type === '優勢' && (
              <div className="advice leading">
                <p>✅ <strong>優勢時の戦略:</strong></p>
                <ul>
                  <li>無理な攻撃は控え、安定した手作りを心がける</li>
                  <li>安全牌を優先し、放銃リスクを最小限に</li>
                  <li>大きな手を狙わず、確実な和了を目指す</li>
                  <li>他家の動向に注意し、流局を狙っても良い</li>
                </ul>
              </div>
            )}
            
            {situation.type === '劣勢' && (
              <div className="advice trailing">
                <p>🎯 <strong>劣勢時の戦略:</strong></p>
                <ul>
                  <li>積極的に役を作り、逆転を狙う</li>
                  <li>ドラや役牌を優先的に集める</li>
                  <li>早めの立直で圧力をかける</li>
                  <li>大きな手を狙い、一発逆転を目指す</li>
                </ul>
              </div>
            )}
            
            {situation.type === '危険' && (
              <div className="advice danger">
                <p>🛡️ <strong>危険局面の戦略:</strong></p>
                <ul>
                  <li>徹底的な守備に徹する</li>
                  <li>他家の捨て牌を徹底的に読む</li>
                  <li>安全牌のみを切る（字牌、19牌）</li>
                  <li>鳴きを控え、手を閉じる</li>
                  <li>流局を最優先に考える</li>
                </ul>
              </div>
            )}
            
            {situation.type === '均衡' && (
              <div className="advice neutral">
                <p>⚖️ <strong>均衡時の戦略:</strong></p>
                <ul>
                  <li>バランスの取れた手作りを心がける</li>
                  <li>効率的な牌使いを意識する</li>
                  <li>状況に応じて攻守を使い分ける</li>
                  <li>他のプレイヤーの点数状況を把握する</li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="round-context">
            <h4>ラウンド状況</h4>
            <div className="context-info">
              <div className="context-item">
                <span className="label">現在の巡目:</span>
                <span className="value">{round}巡目</span>
              </div>
              <div className="context-item">
                <span className="label">立直者:</span>
                <span className="value">{riichis.length}人</span>
              </div>
              <div className="context-item">
                <span className="label">ドラ表示:</span>
                <span className="value">
                  {doraIndicators.map((dora, idx) => (
                    <Tile key={idx} tile={dora} size="tiny" />
                  ))}
                </span>
              </div>
              <div className="context-item">
                <span className="label">自風:</span>
                <span className="value">{playerWind}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 統計情報 */}
      {!selectedTile && analysisMode !== 'strategy' && (
        <div className="quick-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{efficiencies.length}</div>
              <div className="stat-label">分析牌数</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">
                {efficiencies.length > 0 
                  ? Math.round(efficiencies.reduce((a, b) => a + b.efficiencyScore, 0) / efficiencies.length)
                  : 0}
              </div>
              <div className="stat-label">平均効率</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">
                {suggestions.length}
              </div>
              <div className="stat-label">AI提案</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">
                {riichis.length}
              </div>
              <div className="stat-label">立直中</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ヘルパー関数の追加
RealTimeAnalyzer.prototype.translateFocusArea = function(area: string): string {
  switch (area) {
    case 'efficiency': return '牌効率';
    case 'defense': return '守備力';
    case 'riichi': return '立直判断';
    case 'yaku': return '役作り';
    default: return area;
  }
};

// エクスポート
export default RealTimeAnalyzer;
