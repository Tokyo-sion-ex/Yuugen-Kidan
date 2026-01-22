import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameMode } from '../../types/game.types';
import { useMahjongSounds } from '../../hooks/useMahjongSounds';
import './GameControls.css';

interface GameControlsProps {
  onExit: () => void;
  onShowScore: () => void;
  onShowControls: () => void;
  gameMode: GameMode;
}

const GameControls: React.FC<GameControlsProps> = ({
  onExit,
  onShowScore,
  onShowControls,
  gameMode,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [effectsVolume, setEffectsVolume] = useState(0.7);
  
  const { changeVolume, toggleMute, isMuted } = useMahjongSounds();

  // ゲームモードの日本語名
  const gameModeNames: Record<GameMode, string> = {
    'single-round': '一局戦',
    'east-only': '東風戦',
    'east-south': '東南戦',
    'full-game': '一荘戦',
  };

  // エスケープキーでメニューを開く
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(!isMenuOpen);
      }
      if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        setIsPaused(!isPaused);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, isPaused]);

  // 音量変更時の処理
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    changeVolume(newVolume);
  };

  const handleMusicVolumeChange = (newVolume: number) => {
    setMusicVolume(newVolume);
    // ここでBGM音量を変更するロジックを追加
  };

  const handleEffectsVolumeChange = (newVolume: number) => {
    setEffectsVolume(newVolume);
    // ここで効果音音量を変更するロジックを追加
  };

  const handleExitConfirm = () => {
    if (window.confirm('ゲームを終了しますか？\n途中経過は保存されません。')) {
      onExit();
    }
  };

  const handleQuickRestart = () => {
    if (window.confirm('同じ設定で新しい対戦を開始しますか？')) {
      window.location.reload(); // 簡易的なリスタート
    }
  };

  return (
    <>
      {/* メインコントロールボタン */}
      <div className="game-controls">
        {/* メニュートグルボタン */}
        <motion.button
          className="menu-toggle-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="メニューを開く (ESC)"
        >
          <div className="menu-icon">
            <div className="menu-line"></div>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
          </div>
          <span className="menu-label">メニュー</span>
        </motion.button>

        {/* クイックアクションボタン */}
        <div className="quick-actions">
          <motion.button
            className="quick-button score-button"
            onClick={onShowScore}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="点数板を表示"
          >
            <span className="button-icon">📊</span>
          </motion.button>

          <motion.button
            className="quick-button controls-button"
            onClick={onShowControls}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="操作ガイド"
          >
            <span className="button-icon">🎮</span>
          </motion.button>

          <motion.button
            className="quick-button sound-button"
            onClick={toggleMute}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isMuted ? "音声をオン" : "音声をオフ"}
          >
            <span className="button-icon">
              {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔈'}
            </span>
          </motion.button>

          <motion.button
            className={`quick-button pause-button ${isPaused ? 'paused' : ''}`}
            onClick={() => setIsPaused(!isPaused)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isPaused ? "ゲームを再開" : "ゲームを一時停止"}
          >
            <span className="button-icon">
              {isPaused ? '▶️' : '⏸️'}
            </span>
          </motion.button>
        </div>

        {/* ゲーム情報 */}
        <div className="game-info-display">
          <div className="info-badge mode-badge">
            <span className="info-icon">🎴</span>
            <span className="info-text">{gameModeNames[gameMode]}</span>
          </div>
          <div className="info-badge time-badge">
            <span className="info-icon">⏱️</span>
            <span className="info-text">15:23</span>
          </div>
        </div>
      </div>

      {/* メニューモーダル */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}>
            <motion.div
              className="menu-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              {/* メニューヘッダー */}
              <div className="menu-header">
                <h2 className="menu-title">ゲームメニュー</h2>
                <button
                  className="menu-close"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* メニューコンテンツ */}
              <div className="menu-content">
                <div className="menu-section">
                  <h3 className="section-title">ゲーム操作</h3>
                  <div className="menu-buttons">
                    <button
                      className="menu-item"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onShowScore();
                      }}
                    >
                      <span className="item-icon">📊</span>
                      <span className="item-label">点数板を表示</span>
                    </button>

                    <button
                      className="menu-item"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onShowControls();
                      }}
                    >
                      <span className="item-icon">🎮</span>
                      <span className="item-label">操作ガイド</span>
                    </button>

                    <button
                      className="menu-item"
                      onClick={() => setIsSettingsOpen(true)}
                    >
                      <span className="item-icon">⚙️</span>
                      <span className="item-label">設定</span>
                    </button>

                    <button
                      className="menu-item"
                      onClick={handleQuickRestart}
                    >
                      <span className="item-icon">🔄</span>
                      <span className="item-label">やり直す</span>
                    </button>
                  </div>
                </div>

                <div className="menu-section">
                  <h3 className="section-title">ゲーム情報</h3>
                  <div className="game-stats">
                    <div className="stat-item">
                      <span className="stat-label">対戦形式</span>
                      <span className="stat-value">{gameModeNames[gameMode]}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">経過時間</span>
                      <span className="stat-value">15分23秒</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">現在の局</span>
                      <span className="stat-value">東2局0本場</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">リーチ棒</span>
                      <span className="stat-value">1本</span>
                    </div>
                  </div>
                </div>

                <div className="menu-section">
                  <h3 className="section-title">システム</h3>
                  <div className="menu-buttons">
                    <button
                      className="menu-item save-button"
                      onClick={() => alert('セーブ機能は開発中です')}
                    >
                      <span className="item-icon">💾</span>
                      <span className="item-label">ゲームを保存</span>
                    </button>

                    <button
                      className="menu-item load-button"
                      onClick={() => alert('ロード機能は開発中です')}
                    >
                      <span className="item-icon">📂</span>
                      <span className="item-label">ゲームを読み込み</span>
                    </button>

                    <button
                      className="menu-item screenshot-button"
                      onClick={() => {
                        // スクリーンショット機能（簡易版）
                        html2canvas(document.body).then(canvas => {
                          const link = document.createElement('a');
                          link.download = `幽玄奇談_${new Date().toISOString()}.png`;
                          link.href = canvas.toDataURL();
                          link.click();
                        });
                      }}
                    >
                      <span className="item-icon">📸</span>
                      <span className="item-label">スクリーンショット</span>
                    </button>
                  </div>
                </div>

                <div className="menu-section danger-section">
                  <div className="menu-buttons">
                    <button
                      className="menu-item exit-button"
                      onClick={handleExitConfirm}
                    >
                      <span className="item-icon">🚪</span>
                      <span className="item-label">ゲームを終了</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* メニューフッター */}
              <div className="menu-footer">
                <div className="shortcut-info">
                  <span className="shortcut-key">ESC</span>
                  <span className="shortcut-label">メニューを開く</span>
                </div>
                <div className="shortcut-info">
                  <span className="shortcut-key">Ctrl+P</span>
                  <span className="shortcut-label">一時停止</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 設定モーダル */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="settings-overlay" onClick={() => setIsSettingsOpen(false)}>
            <motion.div
              className="settings-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="settings-header">
                <h2 className="settings-title">設定</h2>
                <button
                  className="settings-close"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="settings-content">
                {/* 音声設定 */}
                <div className="settings-section">
                  <h3 className="settings-section-title">🎵 音声設定</h3>
                  
                  <div className="setting-item">
                    <div className="setting-label">
                      <span className="label-text">マスターボリューム</span>
                      <span className="label-value">{Math.round(volume * 100)}%</span>
                    </div>
                    <div className="slider-container">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="volume-slider"
                      />
                      <div className="slider-ticks">
                        <span className="tick">0</span>
                        <span className="tick">50</span>
                        <span className="tick">100</span>
                      </div>
                    </div>
                  </div>

                  <div className="setting-item">
                    <div className="setting-label">
                      <span className="label-text">BGM音量</span>
                      <span className="label-value">{Math.round(musicVolume * 100)}%</span>
                    </div>
                    <div className="slider-container">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={musicVolume}
                        onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                        className="volume-slider"
                      />
                    </div>
                  </div>

                  <div className="setting-item">
                    <div className="setting-label">
                      <span className="label-text">効果音音量</span>
                      <span className="label-value">{Math.round(effectsVolume * 100)}%</span>
                    </div>
                    <div className="slider-container">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={effectsVolume}
                        onChange={(e) => handleEffectsVolumeChange(parseFloat(e.target.value))}
                        className="volume-slider"
                      />
                    </div>
                  </div>

                  <div className="sound-test">
                    <button
                      className="test-button"
                      onClick={() => {
                        // 効果音テスト
                        const audio = new Audio('/assets/sounds/click.mp3');
                        audio.volume = effectsVolume;
                        audio.play();
                      }}
                    >
                      効果音をテスト
                    </button>
                  </div>
                </div>

                {/* ゲーム設定 */}
                <div className="settings-section">
                  <h3 className="settings-section-title">🎮 ゲーム設定</h3>
                  
                  <div className="setting-item toggle-item">
                    <div className="toggle-label">
                      <span className="label-text">アニメーション効果</span>
                      <span className="label-description">牌の動きやエフェクトを表示</span>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item toggle-item">
                    <div className="toggle-label">
                      <span className="label-text">自動ツモ</span>
                      <span className="label-description">ターン開始時に自動で牌を引く</span>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item toggle-item">
                    <div className="toggle-label">
                      <span className="label-text">ヒント表示</span>
                      <span className="label-description">有効な手役をハイライト表示</span>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-label">
                      <span className="label-text">思考時間制限</span>
                      <span className="label-description">AIの思考時間（秒）</span>
                    </div>
                    <select className="time-select" defaultValue="5">
                      <option value="3">3秒</option>
                      <option value="5">5秒</option>
                      <option value="10">10秒</option>
                      <option value="15">15秒</option>
                      <option value="0">無制限</option>
                    </select>
                  </div>
                </div>

                {/* 表示設定 */}
                <div className="settings-section">
                  <h3 className="settings-section-title">👁️ 表示設定</h3>
                  
                  <div className="setting-item">
                    <div className="setting-label">
                      <span className="label-text">UIスケール</span>
                    </div>
                    <div className="scale-buttons">
                      <button className="scale-button">小</button>
                      <button className="scale-button active">中</button>
                      <button className="scale-button">大</button>
                    </div>
                  </div>

                  <div className="setting-item">
                    <div className="setting-label">
                      <span className="label-text">牌の表示</span>
                    </div>
                    <div className="display-options">
                      <label className="option-radio">
                        <input type="radio" name="tile-display" value="unicode" defaultChecked />
                        <span className="radio-label">ユニコード</span>
                      </label>
                      <label className="option-radio">
                        <input type="radio" name="tile-display" value="text" />
                        <span className="radio-label">テキスト</span>
                      </label>
                      <label className="option-radio">
                        <input type="radio" name="tile-display" value="image" />
                        <span className="radio-label">画像</span>
                      </label>
                    </div>
                  </div>

                  <div className="setting-item">
                    <div className="setting-label">
                      <span className="label-text">カラーテーマ</span>
                    </div>
                    <div className="theme-selector">
                      <button className="theme-button active" data-theme="yugen">
                        <div className="theme-preview yugen-theme"></div>
                        <span className="theme-name">幽玄</span>
                      </button>
                      <button className="theme-button" data-theme="light">
                        <div className="theme-preview light-theme"></div>
                        <span className="theme-name">明るい</span>
                      </button>
                      <button className="theme-button" data-theme="dark">
                        <div className="theme-preview dark-theme"></div>
                        <span className="theme-name">ダーク</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* コントロール設定 */}
                <div className="settings-section">
                  <h3 className="settings-section-title">⌨️ コントロール設定</h3>
                  
                  <div className="keybindings">
                    <div className="keybinding-item">
                      <span className="keybinding-action">ツモ</span>
                      <kbd className="keybinding-key">D</kbd>
                    </div>
                    <div className="keybinding-item">
                      <span className="keybinding-action">打牌</span>
                      <kbd className="keybinding-key">Space</kbd>
                    </div>
                    <div className="keybinding-item">
                      <span className="keybinding-action">リーチ</span>
                      <kbd className="keybinding-key">R</kbd>
                    </div>
                    <div className="keybinding-item">
                      <span className="keybinding-action">ポン</span>
                      <kbd className="keybinding-key">P</kbd>
                    </div>
                    <div className="keybinding-item">
                      <span className="keybinding-action">チー</span>
                      <kbd className="keybinding-key">C</kbd>
                    </div>
                    <div className="keybinding-item">
                      <span className="keybinding-action">カン</span>
                      <kbd className="keybinding-key">K</kbd>
                    </div>
                  </div>

                  <div className="reset-controls">
                    <button className="reset-button">
                      コントロールをデフォルトに戻す
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-footer">
                <button
                  className="settings-apply"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  設定を適用
                </button>
                <button
                  className="settings-cancel"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  キャンセル
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 一時停止表示 */}
      <AnimatePresence>
        {isPaused && (
          <div className="pause-overlay">
            <motion.div
              className="pause-modal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="pause-icon">⏸️</div>
              <h2 className="pause-title">一時停止中</h2>
              <p className="pause-message">
                ゲームが一時停止されています
              </p>
              <div className="pause-actions">
                <button
                  className="pause-resume"
                  onClick={() => setIsPaused(false)}
                >
                  ゲームを再開
                </button>
                <button
                  className="pause-menu"
                  onClick={() => {
                    setIsPaused(false);
                    setIsMenuOpen(true);
                  }}
                >
                  メニューを開く
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GameControls;
