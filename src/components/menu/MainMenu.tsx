import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './MainMenu.css';

interface MainMenuProps {
  onModeSelect: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onModeSelect, onSettings, onQuit }) => {
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const menuItems = [
    { id: 'start', label: '対戦開始', icon: '⚔️', action: onModeSelect },
    { id: 'settings', label: '設定', icon: '⚙️', action: onSettings },
    { id: 'quit', label: '終了', icon: '🚪', action: onQuit },
  ];

  return (
    <div className="main-menu">
      {/* タイトル */}
      <motion.div
        className="title-section"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <h1 className="game-title">
          <span className="title-kanji">幽玄奇談</span>
          <span className="title-sub">Yūgen Kitan</span>
        </h1>
        <p className="game-tagline">幻想的な麻雀の世界へようこそ</p>
      </motion.div>

      {/* メニューアイテム */}
      <div className="menu-items">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            className={`menu-button ${isHovered === item.id ? 'hovered' : ''}`}
            onClick={item.action}
            onMouseEnter={() => setIsHovered(item.id)}
            onMouseLeave={() => setIsHovered(null)}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            <div className="menu-hover-effect" />
          </motion.button>
        ))}
      </div>

      {/* フッター */}
      <motion.div
        className="menu-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <p className="version-info">Version 0.1.0 - 幽玄奇談</p>
        <p className="copyright">© 2024 幻想麻雀プロジェクト</p>
      </motion.div>
    </div>
  );
};

export default MainMenu;
