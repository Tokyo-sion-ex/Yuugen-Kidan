import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ReplaySystem } from '../../core/replay/ReplaySystem';
import { ReplayData } from '../../core/replay/ReplaySystem';
import Tile from '../game/Tile';
import PlayerInfo from '../game/PlayerInfo';
import './ReplayViewer.css';

interface ReplayViewerProps {
  replayData: ReplayData;
  onClose: () => void;
}

const ReplayViewer: React.FC<ReplayViewerProps> = ({ replayData, onClose }) => {
  const replaySystem = useRef(new ReplaySystem());
  const [currentState, setCurrentState] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [currentAction, setCurrentAction] = useState<any>(null);
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);

  // 再生制御
  const playback = useRef<any>(null);

  useEffect(() => {
    // リプレイ再生を初期化
    playback.current = replaySystem.current.playReplay(replayData, speed);
    
    // 状態更新のリスナーを設定
    const updateInterval = setInterval(() => {
      if (playback.current && playback.current.currentAction) {
        setCurrentState(playback.current.currentAction.gameState);
        setCurrentAction(playback.current.currentAction);
        setProgress(playback.current.progress);
        setIsPlaying(playback.current.isPlaying);
        setIsPaused(playback.current.isPaused);
      }
    }, 100);

    return () => {
      clearInterval(updateInterval);
      if (playback.current) {
        playback.current.stop();
      }
    };
  }, [replayData, speed]);

  // 再生/一時停止
  const togglePlayback = () => {
    if (isPlaying && !isPaused) {
      playback.current?.pause();
    } else if (isPlaying && isPaused) {
      playback.current?.resume();
    } else {
      playback.current?.play();
    }
  };

  // 停止
  const stopPlayback = () => {
    playback.current?.stop();
    setSelectedActionIndex(0);
  };

  // シーク
  const seekToAction = (actionIndex: number) => {
    setSelectedActionIndex(actionIndex);
    playback.current?.seek(actionIndex);
  };

  // 速度変更
  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (playback.current) {
      playback.current.setSpeed(newSpeed);
    }
  };

  // 統計情報取得
  const statistics = replaySystem.current.getReplayStatistics(replayData);
  const analysis = replaySystem.current.analyzeReplay(replayData);

  // アクションタイプの日本語名
  const getActionName = (type: string): string => {
    const names: Record<string, string> = {
      draw: 'ツモ',
      discard: '打牌',
      riichi: 'リーチ',
      pon: 'ポン',
      chi: 'チー',
      kan: 'カン',
      ron: 'ロン',
      tsumo: 'ツモ和了'
    };
    return names[type] || type;
  };

  // プレイヤー名を取得
  const getPlayerName = (playerIndex: number): string => {
    return replayData.players[playerIndex]?.name || `プレイヤー${playerIndex + 1}`;
  };

  return (
    <div className="replay-viewer">
      {/* ヘッダー */}
      <div className="replay-header">
        <div className="replay-title">
          <h2>リプレイ再生</h2>
          <div className="replay-meta">
            <span className="meta-item">
              <span className="meta-label">モード:</span>
              <span className="meta-value">{replayData.gameMode}</span>
            </span>
            <span className="meta-item">
              <span className="meta-label">日時:</span>
              <span className="meta-value">
                {new Date(replayData.createdAt).toLocaleString('ja-JP')}
              </span>
            </span>
            <span className="meta-item">
              <span className="meta-label">時間:</span>
              <span className="meta-value">
                {Math.floor(replayData.duration / 1000)}秒
              </span>
            </span>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="replay-content">
        {/* メインゲームビュー */}
        <div className="game-view">
          {currentState ? (
            <>
              {/* 牌卓表示 */}
              <div className="replay-table">
                {/* プレイヤー情報 */}
                <div className="replay-players">
                  {currentState.players.map((player: any, index: number) => (
                    <div key={player.id} className="replay-player">
                      <PlayerInfo
                        player={player}
                        isCurrent={player.position === currentState.currentPlayer?.position}
                        isDealer={player.isDealer}
                      />
                    </div>
                  ))}
                </div>

                {/* 現在のアクション表示 */}
                {currentAction && (
                  <motion.div
                    className="current-action-display"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="action-icon">
                      {currentAction.type === 'riichi' && '⚡'}
                      {currentAction.type === 'ron' && '🎯'}
                      {currentAction.type === 'tsumo' && '✨'}
                      {['pon', 'chi', 'kan'].includes(currentAction.type) && '🗣️'}
                    </div>
                    <div className="action-details">
                      <div className="action-player">
                        {getPlayerName(currentAction.playerIndex)}
                      </div>
                      <div className="action-type">
                        {getActionName(currentAction.type)}
                      </div>
                      <div className="action-time">
                        {Math.floor(currentAction.timestamp / 1000)}秒
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 進行状況バー */}
                <div className="replay-progress">
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <div className="progress-time">
                    {Math.floor(currentAction?.timestamp || 0) / 1000}s / {replayData.duration / 1000}s
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>リプレイを読み込み中...</p>
            </div>
          )}
        </div>

        {/* サイドバー */}
        <div className="replay-sidebar">
          {/* コントロールパネル */}
          <div className="control-panel">
            <div className="playback-controls">
              <button
                className="control-button play-button"
                onClick={togglePlayback}
                title={isPlaying && !isPaused ? "一時停止" : "再生"}
              >
                {isPlaying && !isPaused ? '⏸️' : '▶️'}
              </button>
              <button
                className="control-button stop-button"
                onClick={stopPlayback}
                title="停止"
              >
                ⏹️
              </button>
              
              <div className="speed-controls">
                <button
                  className={`speed-button ${speed === 0.5 ? 'active' : ''}`}
                  onClick={() => changeSpeed(0.5)}
                >
                  0.5x
                </button>
                <button
                  className={`speed-button ${speed === 1 ? 'active' : ''}`}
                  onClick={() => changeSpeed(1)}
                >
                  1x
                </button>
                <button
                  className={`speed-button ${speed === 2 ? 'active' : ''}`}
                  onClick={() => changeSpeed(2)}
                >
                  2x
                </button>
                <button
                  className={`speed-button ${speed === 4 ? 'active' : ''}`}
                  onClick={() => changeSpeed(4)}
                >
                  4x
                </button>
              </div>
            </div>

            <div className="action-timeline">
              <h3 className="timeline-title">アクションタイムライン</h3>
              <div className="timeline-list">
                {replayData.actions.map((action, index) => (
                  <div
                    key={index}
                    className={`timeline-item ${index === selectedActionIndex ? 'selected' : ''}`}
                    onClick={() => seekToAction(index)}
                  >
                    <div className="timeline-time">
                      {Math.floor(action.timestamp / 1000)}s
                    </div>
                    <div className="timeline-action">
                      <span className="action-player">
                        {getPlayerName(action.playerIndex)}
                      </span>
                      <span className="action-type">
                        {getActionName(action.type)}
                      </span>
                    </div>
                    {action.tileId && (
                      <div className="timeline-tile">
                        {/* 牌の表示 */}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="statistics-panel">
            <button
              className="toggle-statistics"
              onClick={() => setShowStatistics(!showStatistics)}
            >
              {showStatistics ? '統計を隠す' : '統計を表示'} ▼
            </button>
            
            {showStatistics && (
              <div className="statistics-content">
                <div className="statistics-section">
                  <h4>基本情報</h4>
                  <div className="statistics-grid">
                    <div className="stat-item">
                      <span className="stat-label">総アクション数</span>
                      <span className="stat-value">{statistics.totalActions}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">平均思考時間</span>
                      <span className="stat-value">
                        {Math.round(statistics.averageActionTime)}ms
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">再生速度</span>
                      <span className="stat-value">{speed}x</span>
                    </div>
                  </div>
                </div>

                <div className="statistics-section">
                  <h4>アクション種類</h4>
                  <div className="action-types">
                    {Object.entries(statistics.actionTypes).map(([type, count]) => (
                      <div key={type} className="action-type-item">
                        <span className="type-name">{getActionName(type)}</span>
                        <span className="type-count">{count}回</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="statistics-section">
                  <h4>ハイライト</h4>
                  <div className="highlights-list">
                    {analysis.highlights.map((highlight, index) => (
                      <div key={index} className="highlight-item">
                        <div className="highlight-time">
                          {Math.floor(highlight.action.timestamp / 1000)}s
                        </div>
                        <div className="highlight-description">
                          {highlight.description}
                        </div>
                        <div className="highlight-importance">
                          {'★'.repeat(highlight.importance)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="statistics-section">
                  <h4>プレイヤーパフォーマンス</h4>
                  <div className="player-performance">
                    {analysis.playerPerformance.map((perf, index) => (
                      <div key={index} className="player-stats">
                        <div className="player-name">
                          {getPlayerName(perf.playerIndex)}
                        </div>
                        <div className="player-metrics">
                          <div className="metric">
                            <span className="metric-label">勝率</span>
                            <span className="metric-value">
                              {perf.winRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">得点</span>
                            <span className="metric-value">
                              {perf.averagePoints.toLocaleString()}
                            </span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">効率</span>
                            <span className="metric-value">
                              {perf.efficiency.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* エクスポート/インポート */}
          <div className="export-panel">
            <button
              className="export-button"
              onClick={() => {
                const json = replaySystem.current.exportReplay(replayData);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `replay_${replayData.id}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              📥 リプレイをエクスポート
            </button>
            
            <button
              className="share-button"
              onClick={() => {
                // シェア機能（簡易版）
                navigator.clipboard.writeText(
                  `幽玄奇談リプレイ: ${replayData.id}\n` +
                  `モード: ${replayData.gameMode}\n` +
                  `日時: ${new Date(replayData.createdAt).toLocaleString('ja-JP')}`
                ).then(() => {
                  alert('リプレイ情報をクリップボードにコピーしました');
                });
              }}
            >
              🔗 リンクをコピー
            </button>
          </div>
        </div>
      </div>

      {/* フッターコントロール */}
      <div className="replay-footer">
        <div className="footer-controls">
          <div className="time-display">
            <div className="current-time">
              {Math.floor((currentAction?.timestamp || 0) / 1000)}秒
            </div>
            <div className="time-separator">/</div>
            <div className="total-time">
              {Math.floor(replayData.duration / 1000)}秒
            </div>
          </div>

          <div className="footer-buttons">
            <button
              className="footer-button"
              onClick={() => setShowControls(!showControls)}
              title={showControls ? "コントロールを隠す" : "コントロールを表示"}
            >
              {showControls ? '👁️' : '👁️‍🗨️'}
            </button>
            
            <button
              className="footer-button screenshot-button"
              onClick={() => {
                // スクリーンショット機能
                html2canvas(document.querySelector('.game-view')!).then(canvas => {
                  const link = document.createElement('a');
                  link.download = `replay_screenshot_${Date.now()}.png`;
                  link.href = canvas.toDataURL();
                  link.click();
                });
              }}
              title="スクリーンショット"
            >
              📸
            </button>
            
            <button
              className="footer-button fullscreen-button"
              onClick={() => {
                const elem = document.querySelector('.replay-viewer');
                if (elem?.requestFullscreen) {
                  elem.requestFullscreen();
                }
              }}
              title="全画面表示"
            >
              ⛶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplayViewer;
