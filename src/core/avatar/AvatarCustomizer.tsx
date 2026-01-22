import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarSystem, AvatarPartType, AvatarColor, PlayerAvatar } from '../../core/avatar/AvatarSystem';
import './AvatarCustomizer.css';

interface AvatarCustomizerProps {
  playerId: string;
  playerLevel: number;
  onSave: (avatar: PlayerAvatar) => void;
  onClose: () => void;
}

const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  playerId,
  playerLevel,
  onSave,
  onClose
}) => {
  const [avatarSystem] = useState(() => new AvatarSystem());
  const [currentAvatar, setCurrentAvatar] = useState<PlayerAvatar>(() => 
    avatarSystem.getPlayerAvatar(playerId)
  );
  
  const [selectedTab, setSelectedTab] = useState<AvatarPartType | 'presets' | 'colors'>('presets');
  const [customParts, setCustomParts] = useState<Partial<Record<AvatarPartType, string>>>({});
  const [customColors, setCustomColors] = useState<Partial<AvatarColor>>({});
  const [previewSize, setPreviewSize] = useState(300);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // 現在のプリセットを取得
  const currentPreset = avatarSystem['presets'].get(currentAvatar.presetId);
  
  // 利用可能なプリセットとパーツ
  const availablePresets = avatarSystem.getAvailablePresets(playerLevel);
  const availableParts = avatarSystem.getAvailableParts(playerLevel, 
    selectedTab !== 'presets' && selectedTab !== 'colors' ? { type: selectedTab } : undefined
  );
  
  // 色のプリセット
  const colorPresets: Array<{ name: string; colors: AvatarColor }> = [
    { name: '幽玄', colors: { primary: '#4a5568', secondary: '#718096', accent: '#d4af37' } },
    { name: '桜', colors: { primary: '#f687b3', secondary: '#fbb6ce', accent: '#f472b6' } },
    { name: '深海', colors: { primary: '#2d3748', secondary: '#4a5568', accent: '#3182ce' } },
    { name: '緑陰', colors: { primary: '#2f855a', secondary: '#48bb78', accent: '#38a169' } },
    { name: '炎', colors: { primary: '#c53030', secondary: '#fc8181', accent: '#e53e3e' } },
    { name: '紫電', colors: { primary: '#6b46c1', secondary: '#9f7aea', accent: '#805ad5' } }
  ];
  
  // アバターSVGの生成
  const generateAvatarSVG = useCallback(() => {
    const mergedParts = { ...currentPreset?.parts, ...customParts };
    const mergedColors = { ...currentPreset?.colors, ...customColors };
    
    return avatarSystem.generateAvatarSVG({
      ...currentAvatar,
      customParts: mergedParts,
      customColors: mergedColors
    }, previewSize);
  }, [currentAvatar, currentPreset, customParts, customColors, previewSize, avatarSystem]);
  
  // プリセットの選択
  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = availablePresets.find(p => p.id === presetId);
    if (!preset) return;
    
    setCurrentAvatar(prev => ({ ...prev, presetId }));
    setCustomParts({});
    setCustomColors({});
  }, [availablePresets]);
  
  // パーツの選択
  const handlePartSelect = useCallback((partId: string, type: AvatarPartType) => {
    setCustomParts(prev => ({
      ...prev,
      [type]: partId
    }));
  }, []);
  
  // 色の選択
  const handleColorSelect = useCallback((colorType: keyof AvatarColor, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorType]: value
    }));
  }, []);
  
  // プリセット色の適用
  const handleColorPresetSelect = useCallback((colors: AvatarColor) => {
    setCustomColors(colors);
  }, []);
  
  // 保存処理
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // カスタムアバターを作成
      const updatedAvatar = avatarSystem.createCustomAvatar(
        playerId,
        customParts,
        customColors
      );
      
      // ローカルストレージに保存
      avatarSystem.saveAvatarToStorage(playerId);
      
      // 親コンポーネントに通知
      onSave(updatedAvatar);
      
      // 成功フィードバック
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('Failed to save avatar:', error);
      setIsSaving(false);
    }
  }, [playerId, customParts, customColors, avatarSystem, onSave, onClose]);
  
  // ランダムアバター生成
  const handleRandomize = useCallback(() => {
    const randomParts: Partial<Record<AvatarPartType, string>> = {};
    const randomColors: AvatarColor = {
      primary: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      secondary: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      accent: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
    };
    
    // 各タイプからランダムなパーツを選択
    const partTypes: AvatarPartType[] = ['face', 'hair', 'eyes', 'mouth', 'accessory', 'clothing', 'background'];
    partTypes.forEach(type => {
      const typeParts = availableParts.filter(p => p.type === type);
      if (typeParts.length > 0) {
        const randomPart = typeParts[Math.floor(Math.random() * typeParts.length)];
        randomParts[type] = randomPart.id;
      }
    });
    
    setCustomParts(randomParts);
    setCustomColors(randomColors);
  }, [availableParts]);
  
  // リセット
  const handleReset = useCallback(() => {
    setCustomParts({});
    setCustomColors({});
    const defaultPreset = availablePresets.find(p => p.isDefault);
    if (defaultPreset) {
      setCurrentAvatar(prev => ({ ...prev, presetId: defaultPreset.id }));
    }
  }, [availablePresets]);
  
  // 初期化
  useEffect(() => {
    // 保存されたアバターを読み込み
    const savedAvatar = avatarSystem.loadAvatarFromStorage(playerId);
    if (savedAvatar) {
      setCurrentAvatar(savedAvatar);
    }
  }, [playerId, avatarSystem]);
  
  return (
    <div className="avatar-customizer">
      {/* ヘッダー */}
      <div className="customizer-header">
        <h2 className="customizer-title">アバターカスタマイズ</h2>
        <div className="player-info">
          <span className="player-level">レベル {playerLevel}</span>
          <span className="unlocked-count">
            {currentAvatar.unlockedParts.size}パーツ解除済み
          </span>
        </div>
      </div>
      
      <div className="customizer-content">
        {/* 左側：プレビュー */}
        <div className="preview-section">
          <div className="avatar-preview">
            <div 
              className="avatar-svg-container"
              dangerouslySetInnerHTML={{ __html: generateAvatarSVG() }}
            />
          </div>
          
          <div className="preview-controls">
            <div className="size-control">
              <label>サイズ:</label>
              <input
                type="range"
                min="100"
                max="500"
                value={previewSize}
                onChange={(e) => setPreviewSize(parseInt(e.target.value))}
              />
              <span>{previewSize}px</span>
            </div>
            
            <div className="animation-control">
              <label>アニメーション:</label>
              <select 
                value={currentAvatar.selectedAnimation}
                onChange={(e) => setCurrentAvatar(prev => ({ 
                  ...prev, 
                  selectedAnimation: e.target.value 
                }))}
              >
                <option value="idle">通常</option>
                <option value="happy">喜び</option>
                <option value="excited">興奮</option>
                <option value="serious">真剣</option>
              </select>
            </div>
          </div>
          
          <div className="quick-actions">
            <button className="action-button randomize" onClick={handleRandomize}>
              🎲 ランダム生成
            </button>
            <button className="action-button reset" onClick={handleReset}>
              ↩️ リセット
            </button>
          </div>
        </div>
        
        {/* 右側：カスタマイズパネル */}
        <div className="customization-panel">
          {/* タブ */}
          <div className="customization-tabs">
            <button
              className={`tab-button ${selectedTab === 'presets' ? 'active' : ''}`}
              onClick={() => setSelectedTab('presets')}
            >
              🎨 プリセット
            </button>
            
            {(['face', 'hair', 'eyes', 'mouth', 'accessory', 'clothing', 'background'] as AvatarPartType[]).map(type => (
              <button
                key={type}
                className={`tab-button ${selectedTab === type ? 'active' : ''}`}
                onClick={() => setSelectedTab(type)}
              >
                {{
                  face: '😀',
                  hair: '💇',
                  eyes: '👀',
                  mouth: '👄',
                  accessory: '👓',
                  clothing: '👕',
                  background: '🖼️'
                }[type]} {{
                  face: '顔',
                  hair: '髪',
                  eyes: '目',
                  mouth: '口',
                  accessory: 'アクセサリー',
                  clothing: '服装',
                  background: '背景'
                }[type]}
              </button>
            ))}
            
            <button
              className={`tab-button ${selectedTab === 'colors' ? 'active' : ''}`}
              onClick={() => setSelectedTab('colors')}
            >
              🎨 カラー
            </button>
          </div>
          
          {/* タブコンテンツ */}
          <div className="tab-content">
            <AnimatePresence mode="wait">
              {selectedTab === 'presets' && (
                <motion.div
                  key="presets"
                  className="presets-grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {availablePresets.map(preset => (
                    <div
                      key={preset.id}
                      className={`preset-card ${preset.id === currentAvatar.presetId ? 'selected' : ''}`}
                      onClick={() => handlePresetSelect(preset.id)}
                    >
                      <div className="preset-preview">
                        <div 
                          className="preset-svg"
                          dangerouslySetInnerHTML={{ 
                            __html: avatarSystem.generateAvatarSVG({
                              ...currentAvatar,
                              presetId: preset.id
                            }, 80)
                          }}
                        />
                      </div>
                      <div className="preset-info">
                        <h4 className="preset-name">{preset.name}</h4>
                        <p className="preset-description">{preset.description}</p>
                        {!currentAvatar.unlockedPresets.has(preset.id) && !preset.isDefault && (
                          <div className="preset-locked">
                            <span className="lock-icon">🔒</span>
                            レベルアップで解除
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
              
              {(selectedTab !== 'presets' && selectedTab !== 'colors') && (
                <motion.div
                  key={selectedTab}
                  className="parts-grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {availableParts
                    .filter(part => part.type === selectedTab)
                    .map(part => {
                      const isSelected = customParts[selectedTab] === part.id || 
                        (!customParts[selectedTab] && currentPreset?.parts[selectedTab] === part.id);
                      const isUnlocked = currentAvatar.unlockedParts.has(part.id);
                      
                      return (
                        <div
                          key={part.id}
                          className={`part-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`}
                          onClick={() => isUnlocked && handlePartSelect(part.id, selectedTab)}
                          title={part.name}
                        >
                          <div className="part-preview">
                            {part.assetUrl ? (
                              <img 
                                src={part.assetUrl} 
                                alt={part.name}
                                className="part-image"
                              />
                            ) : (
                              <div className="part-placeholder">
                                {part.name}
                              </div>
                            )}
                          </div>
                          <div className="part-info">
                            <div className="part-name">{part.name}</div>
                            <div className="part-meta">
                              <span className={`rarity rarity-${part.rarity}`}>
                                {{
                                  common: 'コモン',
                                  rare: 'レア',
                                  epic: 'エピック',
                                  legendary: 'レジェンダリー'
                                }[part.rarity]}
                              </span>
                              <span className="part-level">Lv.{part.unlockLevel}</span>
                            </div>
                            {!isUnlocked && (
                              <div className="part-locked">
                                レベル{part.unlockLevel}で解除
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </motion.div>
              )}
              
              {selectedTab === 'colors' && (
                <motion.div
                  key="colors"
                  className="colors-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="color-presets">
                    <h4 className="section-title">カラープリセット</h4>
                    <div className="preset-colors-grid">
                      {colorPresets.map((preset, index) => (
                        <button
                          key={index}
                          className="color-preset-button"
                          onClick={() => handleColorPresetSelect(preset.colors)}
                          style={{
                            background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.secondary})`
                          }}
                          title={preset.name}
                        >
                          <span className="preset-name">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="custom-colors">
                    <h4 className="section-title">カスタムカラー</h4>
                    <div className="color-pickers">
                      {(['primary', 'secondary', 'accent'] as const).map(colorType => (
                        <div key={colorType} className="color-picker-group">
                          <label className="color-label">
                            {{ primary: 'メイン', secondary: 'サブ', accent: 'アクセント' }[colorType]}
                          </label>
                          <div className="color-inputs">
                            <input
                              type="color"
                              value={customColors[colorType] || currentPreset?.colors[colorType] || '#000000'}
                              onChange={(e) => handleColorSelect(colorType, e.target.value)}
                              className="color-picker"
                            />
                            <input
                              type="text"
                              value={customColors[colorType] || currentPreset?.colors[colorType] || ''}
                              onChange={(e) => handleColorSelect(colorType, e.target.value)}
                              className="color-text"
                              placeholder="#000000"
                            />
                          </div>
                          <div 
                            className="color-preview"
                            style={{ 
                              backgroundColor: customColors[colorType] || currentPreset?.colors[colorType] || '#000000'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="advanced-settings">
                    <button
                      className="advanced-toggle"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      {showAdvanced ? '▼' : '▶'} 詳細設定
                    </button>
                    
                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          className="advanced-content"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="gradient-settings">
                            <h5>グラデーション設定</h5>
                            <div className="gradient-controls">
                              <label>
                                <input type="checkbox" defaultChecked />
                                グラデーションを有効化
                              </label>
                              <label>
                                <input type="range" min="0" max="360" defaultValue="135" />
                                グラデーション角度
                              </label>
                            </div>
                          </div>
                          
                          <div className="effect-settings">
                            <h5>エフェクト設定</h5>
                            <div className="effect-controls">
                              <label>
                                <input type="checkbox" defaultChecked />
                                光る効果
                              </label>
                              <label>
                                <input type="checkbox" />
                                影を付ける
                              </label>
                              <label>
                                <input type="range" min="0" max="100" defaultValue="30" />
                                透明度
                              </label>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* バッジ表示 */}
          <div className="avatar-badges">
            <h4 className="badges-title">獲得バッジ</h4>
            <div className="badges-list">
              {avatarSystem.getAvatarBadges(currentAvatar).map(badge => (
                <div key={badge.id} className="badge-item" title={badge.description}>
                  <span className="badge-icon">{badge.icon}</span>
                  <span className="badge-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* フッター */}
      <div className="customizer-footer">
        <div className="footer-info">
          <div className="current-preset">
            現在: <strong>{currentPreset?.name || 'カスタム'}</strong>
          </div>
          <div className="save-status">
            {Object.keys(customParts).length > 0 || Object.keys(customColors).length > 0
              ? '変更があります'
              : '変更なし'
            }
          </div>
        </div>
        
        <div className="footer-actions">
          <button className="cancel-button" onClick={onClose}>
            キャンセル
          </button>
          <button 
            className={`save-button ${isSaving ? 'saving' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="saving-spinner"></span>
                保存中...
              </>
            ) : (
              'アバターを保存'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCustomizer;
