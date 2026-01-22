import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ActionButtons.css';

interface ActionButtonsProps {
  isMyTurn: boolean;
  canRiichi: boolean;
  selectedTile: boolean;
  onDraw: () => void;
  onDiscard: () => void;
  onRiichi: () => void;
  onRon: () => void;
  onTsumo: () => void;
  onPon: () => void;
  onChi: () => void;
  onKan: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isMyTurn,
  canRiichi,
  selectedTile,
  onDraw,
  onDiscard,
  onRiichi,
  onRon,
  onTsumo,
  onPon,
  onChi,
  onKan,
}) => {
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [showWinMenu, setShowWinMenu] = useState(false);
  const [callAvailable, setCallAvailable] = useState({
    pon: false,
    chi: false,
    kan: false,
  });
  const [winAvailable, setWinAvailable] = useState({
    ron: false,
    tsumo: false,
  });

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMyTurn) return;
      
      switch (e.key.toLowerCase()) {
        case 'd':
          if (isMyTurn) onDraw();
          break;
        case ' ':
          if (selectedTile && isMyTurn) onDiscard();
          break;
        case 'r':
          if (canRiichi && isMyTurn) onRiichi();
          break;
        case 'p':
          if (callAvailable.pon && isMyTurn) onPon();
          break;
        case 'c':
          if (callAvailable.chi && isMyTurn) onChi();
          break;
        case 'k':
          if (callAvailable.kan && isMyTurn) onKan();
          break;
        case '1':
          if (winAvailable.ron && isMyTurn) onRon();
          break;
        case '2':
          if (winAvailable.tsumo && isMyTurn) onTsumo();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isMyTurn, canRiichi, selectedTile, 
    callAvailable, winAvailable,
    onDraw, onDiscard, onRiichi, onPon, onChi, onKan, onRon, onTsumo
  ]);

  // メインボタン - ツモ
  const renderDrawButton = () => (
    <motion.button
      className={`action-button draw-button ${isMyTurn ? 'enabled' : 'disabled'}`}
      onClick={onDraw}
      disabled={!isMyTurn}
      whileHover={isMyTurn ? { scale: 1.05 } : {}}
      whileTap={isMyTurn ? { scale: 0.95 } : {}}
      title="ツモる (D)"
    >
      <span className="button-icon">🀐</span>
      <span className="button-label">ツモ</span>
      <span className="button-shortcut">D</span>
    </motion.button>
  );

  // メインボタン - 打牌
  const renderDiscardButton = () => (
    <motion.button
      className={`action-button discard-button ${selectedTile && isMyTurn ? 'enabled' : 'disabled'}`}
      onClick={onDiscard}
      disabled={!selectedTile || !isMyTurn}
      whileHover={selectedTile && isMyTurn ? { scale: 1.05 } : {}}
      whileTap={selectedTile && isMyTurn ? { scale: 0.95 } : {}}
      title="牌を打つ (スペース)"
    >
      <span className="button-icon">🎴</span>
      <span className="button-label">打牌</span>
      <span className="button-shortcut">Space</span>
    </motion.button>
  );

  // メインボタン - リーチ
  const renderRiichiButton = () => (
    <motion.button
      className={`action-button riichi-button ${canRiichi && isMyTurn ? 'enabled' : 'disabled'}`}
      onClick={onRiichi}
      disabled={!canRiichi || !isMyTurn}
      whileHover={canRiichi && isMyTurn ? { scale: 1.05 } : {}}
      whileTap={canRiichi && isMyTurn ? { scale: 0.95 } : {}}
      title="リーチ宣言 (R)"
    >
      <span className="button-icon">⚡</span>
      <span className="button-label">リーチ</span>
      <span className="button-shortcut">R</span>
      <span className="riichi-cost">-1000</span>
    </motion.button>
  );

  // サブメニュー - 鳴きボタン
  const renderCallMenu = () => (
    <>
      <motion.button
        className="menu-toggle call-menu-toggle"
        onClick={() => setShowCallMenu(!showCallMenu)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="menu-icon">🗣️</span>
        <span className="menu-label">鳴き</span>
        <span className="menu-arrow">{showCallMenu ? '▲' : '▼'}</span>
      </motion.button>

      <AnimatePresence>
        {showCallMenu && (
          <motion.div
            className="call-submenu"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
          >
            <div className="submenu-grid">
              <motion.button
                className={`submenu-button pon-button ${callAvailable.pon && isMyTurn ? 'available' : 'unavailable'}`}
                onClick={onPon}
                disabled={!callAvailable.pon || !isMyTurn}
                whileHover={callAvailable.pon && isMyTurn ? { scale: 1.05 } : {}}
                whileTap={callAvailable.pon && isMyTurn ? { scale: 0.95 } : {}}
                title="ポン (P)"
              >
                <span className="submenu-icon">🀀🀀</span>
                <span className="submenu-label">ポン</span>
                <span className="submenu-shortcut">P</span>
              </motion.button>

              <motion.button
                className={`submenu-button chi-button ${callAvailable.chi && isMyTurn ? 'available' : 'unavailable'}`}
                onClick={onChi}
                disabled={!callAvailable.chi || !isMyTurn}
                whileHover={callAvailable.chi && isMyTurn ? { scale: 1.05 } : {}}
                whileTap={callAvailable.chi && isMyTurn ? { scale: 0.95 } : {}}
                title="チー (C)"
              >
                <span className="submenu-icon">🀇🀈🀉</span>
                <span className="submenu-label">チー</span>
                <span className="submenu-shortcut">C</span>
              </motion.button>

              <motion.button
                className={`submenu-button kan-button ${callAvailable.kan && isMyTurn ? 'available' : 'unavailable'}`}
                onClick={onKan}
                disabled={!callAvailable.kan || !isMyTurn}
                whileHover={callAvailable.kan && isMyTurn ? { scale: 1.05 } : {}}
                whileTap={callAvailable.kan && isMyTurn ? { scale: 0.95 } : {}}
                title="カン (K)"
              >
                <span className="submenu-icon">🀫🀫🀫🀫</span>
                <span className="submenu-label">カン</span>
                <span className="submenu-shortcut">K</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // サブメニュー - 和了ボタン
  const renderWinMenu = () => (
    <>
      <motion.button
        className="menu-toggle win-menu-toggle"
        onClick={() => setShowWinMenu(!showWinMenu)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="menu-icon">🎉</span>
        <span className="menu-label">和了</span>
        <span className="menu-arrow">{showWinMenu ? '▲' : '▼'}</span>
      </motion.button>

      <AnimatePresence>
        {showWinMenu && (
          <motion.div
            className="win-submenu"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
          >
            <div className="submenu-grid">
              <motion.button
                className={`submenu-button ron-button ${winAvailable.ron ? 'available' : 'unavailable'}`}
                onClick={onRon}
                disabled={!winAvailable.ron}
                whileHover={winAvailable.ron ? { scale: 1.05 } : {}}
                whileTap={winAvailable.ron ? { scale: 0.95 } : {}}
                title="ロン (1)"
              >
                <span className="submenu-icon">🎯</span>
                <span className="submenu-label">ロン</span>
                <span className="submenu-shortcut">1</span>
              </motion.button>

              <motion.button
                className={`submenu-button tsumo-button ${winAvailable.tsumo && isMyTurn ? 'available' : 'unavailable'}`}
                onClick={onTsumo}
                disabled={!winAvailable.tsumo || !isMyTurn}
                whileHover={winAvailable.tsumo && isMyTurn ? { scale: 1.05 } : {}}
                whileTap={winAvailable.tsumo && isMyTurn ? { scale: 0.95 } : {}}
                title="ツモ (2)"
              >
                <span className="submenu-icon">✨</span>
                <span className="submenu-label">ツモ</span>
                <span className="submenu-shortcut">2</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <div className="action-buttons">
      {/* メインボタン行 */}
      <div className="main-buttons">
        {renderDrawButton()}
        {renderDiscardButton()}
        {renderRiichiButton()}
      </div>
      
      {/* サブメニュー行 */}
      <div className="submenu-buttons">
        {renderCallMenu()}
        {renderWinMenu()}
      </div>
      
      {/* ステータス表示 */}
      <div className="action-status">
        <AnimatePresence>
          {!isMyTurn && (
            <motion.div
              className="status-waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              🕐 相手のターンを待っています
            </motion.div>
          )}
          
          {isMyTurn && selectedTile && (
            <motion.div
              className="status-selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              ✅ 牌を選択中 - スペースで打牌
            </motion.div>
          )}
          
          {isMyTurn && !selectedTile && (
            <motion.div
              className="status-ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              🎮 あなたのターン - Dキーでツモ
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActionButtons;
