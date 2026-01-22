import React, { useState, useEffect, useRef } from 'react';
import { GameReplay, GameSnapshot, GameAnalysis, KeyMoment } from '@/types/replay.types';
import { Button } from '@/components/ui/Button';

export const ReplayAnalyzer: React.FC = () => {
  const [currentReplay, setCurrentReplay] = useState<GameReplay | null>(null);
  const [replays, setReplays] = useState<GameReplay[]>([
    {
      id: 'replay_001',
      gameId: 'game_001',
      gameMode: '東風戦',
      players: [
        { playerId: 'p1', username: '雀士A', avatar: 'avatar_1', finalScore: 35000, position: 0, rank: '金雀' },
        { playerId: 'p2', username: '雀士B', avatar: 'avatar_2', finalScore: 28000, position: 1, rank: '銀雀' },
        { playerId: 'p3', username: '雀士C', avatar: 'avatar_3', finalScore: 21000, position: 2, rank: '銀雀' },
        { playerId: 'p4', username: '雀士D', avatar: 'avatar_4', finalScore: 16000, position: 3, rank: '銅雀' }
      ],
      startTime: new Date('2024-03-15T14:30:00'),
      endTime: new Date('2024-03-15T15:15:00'),
      duration: 2700,
      totalRounds: 4,
      snapshots: [],
      isPublic: true,
      isAnalyzed: true,
      tags: ['逆転勝利', 'リーチ', '満貫'],
      title: '逆転の東風戦',
      description: '最終局での大逆転劇',
      statistics: {
        totalActions: 128,
        averageTurnTime: 12.5,
        riichiCount: 3,
        winCount: 4,
        dealerWins: 2,
        biggestWin: 8000,
        longestHand: 18
      },
      analysis: {
        highlights: [
          {
            id: 'highlight_1',
            type: 'big_win',
            timestamp: 2400,
            playerId: 'p1',
            description: '最終局での満貫和了',
            significance: 9
          }
        ],
        playerAnalysis: [
          {
            playerId: 'p1',
            strengths: ['打牌効率が良い', '守備が堅実'],
            weaknesses: ['リーチが少ない'],
            playStyle: 'balanced',
            efficiency: 85,
            decisionAccuracy: 88,
            riskAssessment: 90
          }
        ],
        keyMoments: [],
        suggestions: [],
        aiEvaluation: {
          overallSkill: 85,
          positionalPlay: 82,
          tileEfficiency: 88,
          defense: 90,
          aggression: 75
        }
      }
    }
  ]);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'analysis' | 'stats'>('table');
  const [currentSnapshot, setCurrentSnapshot] = useState<GameSnapshot | null>(null);
  
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // サンプルのゲームスナップショットを生成
  useEffect(() => {
    if (replays.length > 0 && !currentReplay) {
      setCurrentReplay(replays[0]);
      
      // ダミーのスナップショットを生成
      const snapshots: GameSnapshot[] = [];
      for (let i = 0; i < 100; i++) {
        snapshots.push({
          timestamp: i * 30,
          round: Math.floor(i / 25) + 1,
          turn: (i % 4) + 1,
          playerStates: [],
          tableState: {
            wall: [],
            doraIndicators: [],
            roundWind: 'east',
            prevailingWind: 'east',
            remainingTiles: 70 - i
          }
        });
      }
      
      setReplays(prev => prev.map(r => 
        r.id === replays[0].id ? { ...r, snapshots } : r
      ));
    }
  }, [replays, currentReplay]);
  
  useEffect(() => {
    if (currentReplay && currentReplay.snapshots.length > 0) {
      const snapshot = currentReplay.snapshots.find(s => 
        Math.abs(s.timestamp - currentTime) < 15
      ) || currentReplay.snapshots[0];
      setCurrentSnapshot(snapshot);
    }
  }, [currentTime, currentReplay]);
  
  const startPlayback = () => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
    
    setIsPlaying(true);
    playbackIntervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= (currentReplay?.duration || 0)) {
          setIsPlaying(false);
          clearInterval(playbackIntervalRef.current!);
          return 0;
        }
        return prev + playbackSpeed;
      });
    }, 1000 / 30); // 30fps
  };
  
  const pausePlayback = () => {
    setIsPlaying(false);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
  };
  
  const seekTo = (time: number) => {
    setCurrentTime(time);
    if (isPlaying) {
      pausePlayback();
      startPlayback();
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getPlayerStats = (playerId: string) => {
    if (!currentReplay) return null;
    
    const player = currentReplay.players.find(p => p.playerId === playerId);
    const analysis = currentReplay.analysis?.playerAnalysis.find(p => p.playerId === playerId);
    
    return { player, analysis };
  };
  
  const getKeyMoments = () => {
    return currentReplay?.analysis?.keyMoments || [];
  };
  
  const renderTableView = () => (
    <div className="replay-table-view">
      <div className="table-container">
        {/* 牌卓の表示 */}
        <div className="mahjong-table">
          {currentReplay?.players.map((player, index) => {
            const stats = getPlayerStats(player.playerId);
            const isSelected = selectedPlayer === player.playerId;
            
            return (
              <div 
                key={player.playerId}
                className={`player-seat seat-${index} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedPlayer(player.playerId)}
              >
                <div className="player-info">
                  <div className="player-avatar" />
                  <div className="player-details">
                    <span className="player-name">{player.username}</span>
                    <span className="player-rank">{player.rank}</span>
                    <span className="player-score">{player.finalScore.toLocaleString()}</span>
                  </div>
                </div>
                
                {isSelected && stats?.analysis && (
                  <div className="player-stats-preview">
                    <div className="stat-item">
                      <span>効率</span>
                      <div className="stat-bar">
                        <div 
                          className="stat-fill"
                          style={{ width: `${stats.analysis.efficiency}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="table-center">
            <div className="current-round">
              第{currentSnapshot?.round || 1}局
            </div>
            <div className="remaining-tiles">
              残り: {currentSnapshot?.tableState.remainingTiles || 0}枚
            </div>
          </div>
        </div>
      </div>
      
      <div className="table-controls">
        <div className="playback-controls">
          <Button
            variant="ghost"
            onClick={() => seekTo(0)}
          >
            ⏮ 最初に
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => seekTo(Math.max(0, currentTime - 30))}
          >
            ⏪ 30秒戻る
          </Button>
          
          {isPlaying ? (
            <Button
              variant="primary"
              onClick={pausePlayback}
            >
              ⏸ 一時停止
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={startPlayback}
            >
              ▶ 再生
            </Button>
          )}
          
          <Button
            variant="ghost"
            onClick={() => seekTo(Math.min(currentReplay?.duration || 0, currentTime + 30))}
          >
            ⏩ 30秒進む
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => seekTo(currentReplay?.duration || 0)}
          >
            最後へ ⏭
          </Button>
        </div>
        
        <div className="playback-settings">
          <span>速度:</span>
          <select 
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
          >
            <option value="0.5">0.5倍</option>
            <option value="1.0">通常</option>
            <option value="2.0">2倍速</option>
            <option value="5.0">5倍速</option>
            <option value="10.0">10倍速</option>
          </select>
        </div>
      </div>
    </div>
  );
  
  const renderAnalysisView = () => {
    if (!currentReplay?.analysis) return null;
    
    return (
      <div className="analysis-view">
        <div className="analysis-header">
          <h3>AI分析結果</h3>
          <div className="overall-rating">
            <span className="rating-label">総合評価:</span>
            <span className="rating-value">
              {currentReplay.analysis.aiEvaluation.overallSkill}/100
            </span>
          </div>
        </div>
        
        <div className="skill-radar">
          <h4>スキル分析</h4>
          <div className="radar-chart">
            {/* 実際の実装ではチャートライブラリを使用 */}
            <div className="radar-metrics">
              <div className="metric">
                <span>打牌効率</span>
                <span>{currentReplay.analysis.aiEvaluation.tileEfficiency}</span>
              </div>
              <div className="metric">
                <span>守備力</span>
                <span>{currentReplay.analysis.aiEvaluation.defense}</span>
              </div>
              <div className="metric">
                <span>攻撃力</span>
                <span>{currentReplay.analysis.aiEvaluation.aggression}</span>
              </div>
              <div className="metric">
                <span>ポジションプレイ</span>
                <span>{currentReplay.analysis.aiEvaluation.positionalPlay}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="player-analysis-grid">
          <h4>プレイヤー別分析</h4>
          <div className="players-analysis">
            {currentReplay.players.map(player => {
              const analysis = currentReplay.analysis?.playerAnalysis.find(
                p => p.playerId === player.playerId
              );
              
              return (
                <div key={player.playerId} className="player-analysis-card">
                  <div className="player-header">
                    <div className="player-avatar" />
                    <div className="player-basic-info">
                      <h5>{player.username}</h5>
                      <span>{player.rank}</span>
                      <span>{player.finalScore.toLocaleString()}点</span>
                    </div>
                  </div>
                  
                  {analysis && (
                    <div className="analysis-details">
                      <div className="playstyle">
                        <span>プレイスタイル:</span>
                        <span className={`style-${analysis.playStyle}`}>
                          {analysis.playStyle === 'aggressive' ? '攻撃的' :
                           analysis.playStyle === 'defensive' ? '守備的' : 'バランス'}
                        </span>
                      </div>
                      
                      <div className="strengths">
                        <span>長所:</span>
                        <div className="strength-list">
                          {analysis.strengths.map((strength, idx) => (
                            <span key={idx} className="strength-tag">{strength}</span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="weaknesses">
                        <span>改善点:</span>
                        <div className="weakness-list">
                          {analysis.weaknesses.map((weakness, idx) => (
                            <span key={idx} className="weakness-tag">{weakness}</span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="skill-scores">
                        <div className="skill-score">
                          <span>意思決定精度</span>
                          <div className="score-bar">
                            <div 
                              className="score-fill"
                              style={{ width: `${analysis.decisionAccuracy}%` }}
                            />
                          </div>
                          <span>{analysis.decisionAccuracy}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="highlights-section">
          <h4>見どころ</h4>
          <div className="highlights-list">
            {currentReplay.analysis.highlights.map(highlight => (
              <div key={highlight.id} className="highlight-card">
                <div className="highlight-type">
                  {highlight.type === 'big_win' && '🎉 大勝ち'}
                  {highlight.type === 'comeback' && '🔄 逆転'}
                  {highlight.type === 'mistake' && '⚠️ ミス'}
                  {highlight.type === 'brilliant_move' && '✨ 妙手'}
                </div>
                <div className="highlight-content">
                  <p>{highlight.description}</p>
                  <span className="highlight-time">
                    {formatTime(highlight.timestamp)}
                  </span>
                  <Button
                    size="small"
                    onClick={() => seekTo(highlight.timestamp)}
                  >
                    この場面を見る
                  </Button>
                </div>
                <div className="highlight-significance">
                  <span>重要度:</span>
                  <div className="significance-stars">
                    {'★'.repeat(highlight.significance)}
                    {'☆'.repeat(10 - highlight.significance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderStatsView = () => {
    if (!currentReplay) return null;
    
    return (
      <div className="stats-view">
        <h3>対戦統計</h3>
        
        <div className="game-summary">
          <h4>ゲーム概要</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">ゲーム時間</span>
              <span className="summary-value">{formatTime(currentReplay.duration)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">総局数</span>
              <span className="summary-value">{currentReplay.totalRounds}局</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">総アクション数</span>
              <span className="summary-value">{currentReplay.statistics.totalActions}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">平均思考時間</span>
              <span className="summary-value">{currentReplay.statistics.averageTurnTime}秒</span>
            </div>
          </div>
        </div>
        
        <div className="advanced-stats">
          <h4>詳細統計</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <h5>リーチ統計</h5>
              <div className="stat-value-large">{currentReplay.statistics.riichiCount}</div>
              <span>リーチ回数</span>
            </div>
            
            <div className="stat-card">
              <h5>和了統計</h5>
              <div className="stat-value-large">{currentReplay.statistics.winCount}</div>
              <span>和了回数</span>
            </div>
            
            <div className="stat-card">
              <h5>最大和了</h5>
              <div className="stat-value-large">{currentReplay.statistics.biggestWin.toLocaleString()}</div>
              <span>点数</span>
            </div>
            
            <div className="stat-card">
              <h5>親の連荘</h5>
              <div className="stat-value-large">{currentReplay.statistics.dealerWins}</div>
              <span>回</span>
            </div>
          </div>
        </div>
        
        <div className="player-stats">
          <h4>プレイヤー別成績</h4>
          <div className="player-stats-table">
            <div className="table-header">
              <div className="col-player">プレイヤー</div>
              <div className="col-score">得点</div>
              <div className="col-delta">変動</div>
              <div className="col-wins">和了</div>
              <div className="col-riichi">リーチ</div>
            </div>
            
            <div className="table-body">
              {currentReplay.players.map(player => (
                <div key={player.playerId} className="player-stat-row">
                  <div className="col-player">
                    <div className="player-avatar" />
                    <span>{player.username}</span>
                  </div>
                  <div className="col-score">
                    {player.finalScore.toLocaleString()}
                  </div>
                  <div className="col-delta">
                    <span className={`delta ${player.finalScore >= 25000 ? 'positive' : 'negative'}`}>
                      {player.finalScore >= 25000 ? '+' : '-'}{Math.abs(player.finalScore - 25000).toLocaleString()}
                    </span>
                  </div>
                  <div className="col-wins">
                    {/* 実際の実装ではデータが必要 */}
                    {player.position === 0 ? '2' : '1'}
                  </div>
                  <div className="col-ri
