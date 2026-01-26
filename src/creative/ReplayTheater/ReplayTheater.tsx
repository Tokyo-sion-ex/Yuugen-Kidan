import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  GameRecord, 
  TurnAction, 
  GameInsight,
  ReplaySettings,
  CameraAngle,
  Commentary
} from '../../types/game.types';
import { ReplayPlayer } from './ReplayPlayer';
import { CameraDirector } from './CameraDirector';
import { CommentarySystem } from './CommentarySystem';
import { StatisticsOverlay } from './StatisticsOverlay';
import { HighlightEditor } from './HighlightEditor';
import { ExportManager } from './ExportManager';
import { ReplayLibrary } from './ReplayLibrary';
import { useReplayEngine } from '../../hooks/useReplayEngine';
import './ReplayTheater.css';

interface ReplayTheaterProps {
  replay?: GameRecord;
  onClose?: () => void;
  onShare?: (replay: GameRecord) => void;
}

export const ReplayTheater: React.FC<ReplayTheaterProps> = ({
  replay: initialReplay,
  onClose,
  onShare
}) => {
  const [currentReplay, setCurrentReplay] = useState<GameRecord | null>(initialReplay || null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('overview');
  const [showCommentary, setShowCommentary] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [highlightedAction, setHighlightedAction] = useState<TurnAction | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<GameInsight[]>([]);
  const [replaySettings, setReplaySettings] = useState<ReplaySettings>({
    showTileEfficiency: true,
    showDangerZones: true,
    showPlayerThoughts: true,
    highlightKeyTurns: true,
    autoSlowMotion: false,
    showHandVisualization: true
  });

  const replayEngine = useReplayEngine();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // リプレイの読み込み
  useEffect(() => {
    if (currentReplay) {
      replayEngine.loadReplay(currentReplay);
      analyzeReplay(currentReplay);
    }
  }, [currentReplay]);

  // 再生/停止の制御
  const togglePlayback = useCallback(() => {
    if (!currentReplay) return;

    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [currentReplay, isPlaying]);

  const startPlayback = () => {
    if (!currentReplay) return;

    setIsPlaying(true);
    lastTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      if (!isPlaying) return;

      const delta = (currentTime - lastTimeRef.current) * playbackSpeed / 1000;
      lastTimeRef.current = currentTime;

      const newTime = Math.min(currentTime + delta, currentReplay.duration);
      setCurrentTime(newTime);

      // 現在の行動を特定
      const currentAction = getActionAtTime(newTime);
      if (currentAction && currentAction !== highlightedAction) {
        setHighlightedAction(currentAction);
        onActionChange(currentAction);
      }

      // 重要なターンでスローモーション
      if (replaySettings.autoSlowMotion && isKeyTurn(newTime)) {
        setPlaybackSpeed(0.5);
      }

      if (newTime < currentReplay.duration) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        stopPlayback();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    cancelAnimationFrame(animationFrameRef.current);
  };

  // 時間を指定してジャンプ
  const seekToTime = useCallback((time: number) => {
    setCurrentTime(time);
    stopPlayback();
    
    const action = getActionAtTime(time);
    if (action) {
      setHighlightedAction(action);
      onActionChange(action);
    }
  }, [currentReplay]);

  // リプレイの分析
  const analyzeReplay = async (replay: GameRecord) => {
    const insights = await replayEngine.analyzeReplay(replay);
    setSelectedInsights(insights);
  };

  // 行動変化時の処理
  const onActionChange = (action: TurnAction) => {
    // カメラアングルの自動調整
    adjustCameraForAction(action);
    
    // コメントaryの更新
    updateCommentary(action);
    
    // 統計情報の更新
    updateStatistics(action);
  };

  // カメラアングルの調整
  const adjustCameraForAction = (action: TurnAction) => {
    switch (action.action) {
      case 'riichi':
        setCameraAngle('player_closeup');
        break;
      case 'win':
        setCameraAngle('celebratory');
        break;
      case 'discard':
        if (action.tile && isDangerousTile(action.tile)) {
          setCameraAngle('tile_focus');
        }
        break;
      default:
        if (replaySettings.highlightKeyTurns && isKeyTurn(action.turnNumber)) {
          setCameraAngle('dramatic');
        }
    }
  };

  // ハイライトの作成
  const createHighlight = useCallback((startTime: number, endTime: number) => {
    if (!currentReplay) return null;

    const highlight = {
      id: `highlight_${Date.now()}`,
      replayId: currentReplay.gameId,
      startTime,
      endTime,
      title: `ハイライト ${formatTime(startTime)} - ${formatTime(endTime)}`,
      description: getHighlightDescription(startTime, endTime),
      tags: getHighlightTags(startTime, endTime),
      thumbnail: generateHighlightThumbnail(startTime),
      createdAt: Date.now()
    };

    return highlight;
  }, [currentReplay]);

  // リプレイの共有
  const shareReplay = useCallback(async () => {
    if (!currentReplay || !onShare) return;

    try {
      // サムネイルの生成
      const thumbnail = await generateReplayThumbnail();
      
      const replayToShare = {
        ...currentReplay,
        thumbnail,
        sharedAt: Date.now()
      };

      onShare(replayToShare);
      
      alert('リプレイを共有しました！');
    } catch (error) {
      console.error('共有エラー:', error);
      alert('共有に失敗しました');
    }
  }, [currentReplay, onShare]);

  // リプレイのエクスポート
  const exportReplay = useCallback(async (format: 'video' | 'gif' | 'json') => {
    if (!currentReplay) return;

    switch (format) {
      case 'video':
        await exportAsVideo();
        break;
      case 'gif':
        await exportAsGIF();
        break;
      case 'json':
        exportAsJSON();
        break;
    }
  }, [currentReplay]);

  // リプレイライブラリから選択
  const selectReplayFromLibrary = useCallback(async (replayId: string) => {
    try {
      const replay = await loadReplayFromStorage(replayId);
      if (replay) {
        setCurrentReplay(replay);
      }
    } catch (error) {
      console.error('リプレイ読み込みエラー:', error);
    }
  }, []);

  if (!currentReplay) {
    return (
      <div className="replay-theater empty">
        <ReplayLibrary onSelectReplay={selectReplayFromLibrary} />
      </div>
    );
  }

  return (
    <div className="replay-theater" ref={containerRef}>
      {/* ヘッダー */}
      <div className="theater-header">
        <div className="header-left">
          <h2>🎬 幽玄リプレイシアター</h2>
          <div className="replay-info">
            <span className="replay-title">{currentReplay.gameId}</span>
            <span className="replay-date">
              {new Date(currentReplay.startTime).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="header-controls">
          <button className="btn-icon" onClick={togglePlayback}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="playback-speed">
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            >
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>

          <button className="btn-secondary" onClick={shareReplay}>
            🔗 共有
          </button>
          
          {onClose && (
            <button className="btn-icon" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="theater-container">
        {/* メインの再生エリア */}
        <div className="main-viewport">
          <ReplayPlayer
            replay={currentReplay}
            currentTime={currentTime}
            cameraAngle={cameraAngle}
            settings={replaySettings}
            highlightedAction={highlightedAction}
          />
          
          {/* オーバーレイ */}
          {showCommentary && (
            <div className="commentary-overlay">
              <CommentarySystem
                action={highlightedAction}
                insights={selectedInsights}
                currentTime={currentTime}
              />
            </div>
          )}
          
          {showStats && (
            <div className="stats-overlay">
              <StatisticsOverlay
                replay={currentReplay}
                currentTime={currentTime}
                currentAction={highlightedAction}
              />
            </div>
          )}
          
          {/* タイムライン */}
          <div className="timeline-container">
            <input
              type="range"
              className="timeline-slider"
              min="0"
              max={currentReplay.duration}
              value={currentTime}
              onChange={(e) => seekToTime(parseFloat(e.target.value))}
              step="0.1"
            />
            
            <div className="timeline-markers">
              {currentReplay.actions
                .filter(action => action.action === 'riichi' || action.action === 'win')
                .map((action, index) => (
                  <div
                    key={index}
                    className="timeline-marker"
                    style={{ left: `${(action.timestamp / currentReplay.duration) * 100}%` }}
                    title={action.action === 'riichi' ? '立直' : '和了'}
                    onClick={() => seekToTime(action.timestamp)}
                  >
                    {action.action === 'riichi' ? '🀄' : '🎉'}
                  </div>
                ))}
              
              {selectedInsights.map((insight, index) => (
                <div
                  key={`insight_${index}`}
                  className="timeline-insight-marker"
                  style={{ left: `${(insight.keyTurn * 2 / currentReplay.duration) * 100}%` }}
                  title="重要な局面"
                  onClick={() => seekToTime(insight.keyTurn * 2)}
                >
                    💡
                </div>
              ))}
            </div>
            
            <div className="timeline-time">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(currentReplay.duration)}</span>
            </div>
          </div>
        </div>

        {/* コントロールパネル */}
        <div className="control-panel">
          <div className="panel-section">
            <h4>🎥 カメラコントロール</h4>
            <CameraDirector
              currentAngle={cameraAngle}
              onAngleChange={setCameraAngle}
              replay={currentReplay}
              currentTime={currentTime}
            />
          </div>

          <div className="panel-section">
            <h4>⚙️ 表示設定</h4>
            <div className="settings-grid">
              {Object.entries(replaySettings).map(([key, value]) => (
                <label key={key} className="setting-toggle">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setReplaySettings(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                  />
                  <span className="toggle-label">
                    {settingLabels[key as keyof ReplaySettings]}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="display-toggle">
              <button
                className={`toggle-button ${showCommentary ? 'active' : ''}`}
                onClick={() => setShowCommentary(!showCommentary)}
              >
                💬 {showCommentary ? 'コメントary ON' : 'OFF'}
              </button>
              <button
                className={`toggle-button ${showStats ? 'active' : ''}`}
                onClick={() => setShowStats(!showStats)}
              >
                📊 {showStats ? '統計 ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div className="panel-section">
            <h4>🔍 分析インサイト</h4>
            <div className="insights-list">
              {selectedInsights.slice(0, 5).map((insight, index) => (
                <div
                  key={index}
                  className="insight-item"
                  onClick={() => seekToTime(insight.keyTurn * 2)}
                >
                  <div className="insight-turn">
                    巡目: {insight.keyTurn}
                  </div>
                  <div className="insight-description">
                    {insight.description}
                  </div>
                  <div className="insight-significance">
                    {insight.significance === 'high' ? '重要' : 
                     insight.significance === 'medium' ? '中程度' : '参考'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h4>🎯 ハイライト作成</h4>
            <HighlightEditor
              replay={currentReplay}
              currentTime={currentTime}
              onCreateHighlight={createHighlight}
            />
          </div>
        </div>
      </div>

      <div className="theater-footer">
        <div className="player-controls">
          <button 
            className="control-button"
            onClick={() => seekToTime(Math.max(0, currentTime - 5))}
          >
            ⏪ 5秒戻る
          </button>
          
          <button 
            className="control-button"
            onClick={() => seekToTime(0)}
          >
            ⏮ 最初へ
          </button>
          
          <button 
            className="control-button"
            onClick={() => seekToTime(currentReplay.duration)}
          >
            ⏭ 最後へ
          </button>
          
          <button 
            className="control-button"
            onClick={() => seekToTime(Math.min(currentReplay.duration, currentTime + 5))}
          >
            ⏩ 5秒進む
          </button>
        </div>

        <div className="export-section">
          <ExportManager
            replay={currentReplay}
            currentTime={currentTime}
            onExport={exportReplay}
          />
        </div>

        <div className="navigation-buttons">
          <button className="btn-secondary" onClick={() => setCurrentReplay(null)}>
            📁 ライブラリに戻る
          </button>
          
          <button className="btn-primary" onClick={togglePlayback}>
            {isPlaying ? '⏸️ 一時停止' : '▶️ 再生'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ユーティリティ関数
const settingLabels: Record<keyof ReplaySettings, string> = {
  showTileEfficiency: '牌効率表示',
  showDangerZones: '危険ゾーン表示',
  showPlayerThoughts: 'プレイヤー思考表示',
  highlightKeyTurns: '重要ターンハイライト',
  autoSlowMotion: '自動スローモーション',
  showHandVisualization: '手牌可視化'
};

const getActionAtTime = (time: number): TurnAction | null => {
  // 現在の時間に対応する行動を取得
  // 簡易実装
  return null;
};

const isKeyTurn = (time: number): boolean => {
  // 重要なターンかどうかを判断
  return false;
};

const isDangerousTile = (tile: string): boolean => {
  // 危険な牌かどうかを判断
  return false;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getHighlightDescription = (startTime: number, endTime: number): string => {
  const duration = endTime - startTime;
  return `${formatTime(startTime)}から${formatTime(duration)}のハイライト`;
};

const getHighlightTags = (startTime: number, endTime: number): string[] => {
  // ハイライトの内容に基づいてタグを生成
  return ['ハイライト', '対戦'];
};

const generateHighlightThumbnail = (time: number): string => {
  // サムネイルを生成
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ハイライト', canvas.width/2, canvas.height/2);
  }
  
  return canvas.toDataURL('image/png');
};

const generateReplayThumbnail = async (): Promise<string> => {
  // リプレイのサムネイルを生成
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 225;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('リプレイ', canvas.width/2, canvas.height/2);
  }
  
  return canvas.toDataURL('image/png');
};

const exportAsVideo = async () => {
  // ビデオとしてエクスポート
  alert('ビデオエクスポート機能は準備中です');
};

const exportAsGIF = async () => {
  // GIFとしてエクスポート
  alert('GIFエクスポート機能は準備中です');
};

const exportAsJSON = () => {
  // JSONとしてエクスポート
  const dataStr = JSON.stringify(currentReplay, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `${currentReplay?.gameId}.json`;
  link.click();
};

const loadReplayFromStorage = async (replayId: string): Promise<GameRecord | null> => {
  // IndexedDBからリプレイを読み込み
  const db = await openReplayDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['replays'], 'readonly');
    const store = transaction.objectStore('replays');
    const request = store.get(replayId);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const openReplayDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ReplayTheaterDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('replays')) {
        const store = db.createObjectStore('replays', { keyPath: 'gameId' });
        store.createIndex('date', 'startTime');
        store.createIndex('mode', 'gameMode');
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// コメントary更新関数
const updateCommentary = (action: TurnAction) => {
  // コメントaryを更新するロジック
};

// 統計情報更新関数
const updateStatistics = (action: TurnAction) => {
  // 統計情報を更新するロジック
};
