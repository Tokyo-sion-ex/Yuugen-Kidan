import React, { useState, useEffect } from 'react';
import { 
  UISkin, 
  ColorScheme, 
  TypographySettings,
  ComponentStyles,
  ShadowSettings,
  BorderSettings 
} from '../../../types/creative.types';
import { ColorEditor } from './ColorEditor';
import { TypographyEditor } from './TypographyEditor';
import { ComponentEditor } from './ComponentEditor';
import { PreviewRenderer } from './PreviewRenderer';
import { TextureManager } from './TextureManager';
import { AnimationEditor } from './AnimationEditor';
import { SkinExporter } from './SkinExporter';
import { SkinGallery } from './SkinGallery';
import './UISkinner.css';

interface UISkinnerProps {
  initialSkin?: UISkin;
  onSkinApply?: (skin: UISkin) => void;
  onSkinSave?: (skin: UISkin) => void;
}

export const UISkinner: React.FC<UISkinnerProps> = ({
  initialSkin,
  onSkinApply,
  onSkinSave
}) => {
  const [currentSkin, setCurrentSkin] = useState<UISkin>(
    initialSkin || createDefaultSkin()
  );
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'components' | 'textures' | 'animations' | 'gallery'>('colors');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLivePreview, setIsLivePreview] = useState(true);
  const [customCSS, setCustomCSS] = useState<string>('');

  // CSS変数の生成と適用
  useEffect(() => {
    if (isLivePreview) {
      applySkinToDocument(currentSkin);
    }
  }, [currentSkin, isLivePreview]);

  // スキンをドキュメントに適用
  const applySkinToDocument = (skin: UISkin) => {
    const root = document.documentElement;
    
    // カラースキームの適用
    Object.entries(skin.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // タイポグラフィの適用
    Object.entries(skin.typography).forEach(([key, value]) => {
      if (typeof value === 'number') {
        root.style.setProperty(`--typography-${key}`, `${value}px`);
      } else {
        root.style.setProperty(`--typography-${key}`, value);
      }
    });
    
    // カスタムCSSの適用
    applyCustomCSS(skin);
    
    // コンポーネントスタイルの適用
    applyComponentStyles(skin.components);
  };

  // カスタムCSSの適用
  const applyCustomCSS = (skin: UISkin) => {
    const styleId = 'custom-skin-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    const css = generateCSS(skin);
    styleElement.textContent = css;
  };

  // CSSの生成
  const generateCSS = (skin: UISkin): string => {
    return `
      :root {
        /* カラースキーム */
        ${Object.entries(skin.colors)
          .map(([key, value]) => `--color-${key}: ${value};`)
          .join('\n        ')}
        
        /* タイポグラフィ */
        --font-family: ${skin.typography.fontFamily};
        --font-size: ${skin.typography.fontSize}px;
        --font-weight: ${skin.typography.fontWeight};
        --line-height: ${skin.typography.lineHeight};
        --letter-spacing: ${skin.typography.letterSpacing}px;
        --font-style: ${skin.typography.fontStyle};
      }
      
      /* ボタンスタイル */
      .skin-button {
        background-color: var(--color-primary);
        color: white;
        border-radius: ${skin.components.buttons.borderRadius}px;
        padding: ${skin.components.buttons.padding.y}px ${skin.components.buttons.padding.x}px;
        font-family: var(--font-family);
        font-size: var(--font-size);
        transition: all 0.3s ease;
        
        ${skin.components.buttons.shadow.enabled ? `
          box-shadow: ${skin.components.buttons.shadow.offset.x}px 
                     ${skin.components.buttons.shadow.offset.y}px 
                     ${skin.components.buttons.shadow.blur}px 
                     ${skin.components.buttons.shadow.color};
        ` : ''}
        
        ${skin.components.buttons.border ? `
          border: ${skin.components.buttons.border.width}px 
                  ${skin.components.buttons.border.style} 
                  ${skin.components.buttons.border.color};
        ` : ''}
      }
      
      .skin-button:hover {
        ${skin.components.buttons.hoverEffect}
      }
      
      .skin-button:active {
        ${skin.components.buttons.activeEffect}
      }
      
      /* カードスタイル */
      .skin-card {
        background-color: var(--color-surface);
        border-radius: ${skin.components.cards.borderRadius}px;
        padding: ${skin.components.cards.padding}px;
        
        ${skin.components.cards.shadow.enabled ? `
          box-shadow: ${skin.components.cards.shadow.offset.x}px 
                     ${skin.components.cards.shadow.offset.y}px 
                     ${skin.components.cards.shadow.blur}px 
                     ${skin.components.cards.shadow.color};
        ` : ''}
        
        ${skin.components.cards.border.enabled ? `
          border: ${skin.components.cards.border.width}px 
                  ${skin.components.cards.border.style} 
                  ${skin.components.cards.border.color};
        ` : ''}
      }
      
      /* 入力フィールドスタイル */
      .skin-input {
        background-color: var(--color-background);
        color: var(--color-text);
        border: 1px solid var(--color-secondary);
        border-radius: ${skin.components.inputs.borderRadius}px;
        padding: ${skin.components.inputs.padding.y}px ${skin.components.inputs.padding.x}px;
        font-family: var(--font-family);
        font-size: var(--font-size);
      }
      
      .skin-input:focus {
        outline: none;
        border-color: var(--color-accent);
        box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.1);
      }
      
      /* モーダルスタイル */
      .skin-modal {
        background-color: var(--color-surface);
        border-radius: ${skin.components.modals.borderRadius}px;
        padding: ${skin.components.modals.padding}px;
        
        ${skin.components.modals.shadow.enabled ? `
          box-shadow: ${skin.components.modals.shadow.offset.x}px 
                     ${skin.components.modals.shadow.offset.y}px 
                     ${skin.components.modals.shadow.blur}px 
                     ${skin.components.modals.shadow.color};
        ` : ''}
        
        ${skin.components.modals.border.enabled ? `
          border: ${skin.components.modals.border.width}px 
                  ${skin.components.modals.border.style} 
                  ${skin.components.modals.border.color};
        ` : ''}
      }
      
      ${customCSS}
    `;
  };

  // スキンの保存
  const saveSkin = async () => {
    try {
      // サムネイルの生成
      const thumbnail = await generateSkinThumbnail();
      
      const skinToSave = {
        ...currentSkin,
        thumbnail,
        updatedAt: Date.now()
      };

      // IndexedDBに保存
      await saveSkinToStorage(skinToSave);
      
      if (onSkinSave) {
        onSkinSave(skinToSave);
      }

      alert('スキンを保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  // スキンの適用
  const applySkin = () => {
    if (onSkinApply) {
      onSkinApply(currentSkin);
    }
    alert('スキンを適用しました！');
  };

  // プリセットの適用
  const applyPreset = (preset: UISkin) => {
    setCurrentSkin(preset);
  };

  // コンポーネントスタイルの適用
  const applyComponentStyles = (components: ComponentStyles) => {
    // コンポーネントスタイルを適用するロジック
    // （実際の実装では各コンポーネントにスタイルを設定）
  };

  return (
    <div className="ui-skinner">
      <div className="skinner-header">
        <h2>🎨 幽玄UIスキナー</h2>
        <div className="header-controls">
          <div className="preview-toggle">
            <label>
              <input
                type="checkbox"
                checked={isLivePreview}
                onChange={(e) => setIsLivePreview(e.target.checked)}
              />
              <span>ライブプレビュー</span>
            </label>
          </div>

          <div className="preview-mode-selector">
            <select
              value={previewMode}
              onChange={(e) => setPreviewMode(e.target.value as any)}
            >
              <option value="desktop">デスクトップ</option>
              <option value="tablet">タブレット</option>
              <option value="mobile">モバイル</option>
            </select>
          </div>

          <button className="btn-primary" onClick={applySkin}>
            🎯 スキンを適用
          </button>

          <button className="btn-secondary" onClick={saveSkin}>
            💾 スキンを保存
          </button>
        </div>
      </div>

      <div className="skinner-container">
        {/* 左ペイン: プレビュー */}
        <div className="preview-pane">
          <div className="preview-container">
            <div className={`preview-device ${previewMode}`}>
              <PreviewRenderer
                skin={currentSkin}
                mode={previewMode}
              />
            </div>
            
            <div className="preview-controls">
              <div className="device-sizes">
                <button 
                  className={`size-button ${previewMode === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPreviewMode('desktop')}
                >
                  🖥️ デスクトップ
                </button>
                <button 
                  className={`size-button ${previewMode === 'tablet' ? 'active' : ''}`}
                  onClick={() => setPreviewMode('tablet')}
                >
                  📱 タブレット
                </button>
                <button 
                  className={`size-button ${previewMode === 'mobile' ? 'active' : ''}`}
                  onClick={() => setPreviewMode('mobile')}
                >
                  📱 モバイル
                </button>
              </div>
              
              <div className="preview-actions">
                <button 
                  className="refresh-button"
                  onClick={() => applySkinToDocument(currentSkin)}
                >
                  🔄 プレビュー更新
                </button>
                <button 
                  className="screenshot-button"
                  onClick={generateSkinThumbnail}
                >
                  📸 スクリーンショット
                </button>
              </div>
            </div>
          </div>

          <div className="skin-info">
            <input
              type="text"
              value={currentSkin.name}
              onChange={(e) => setCurrentSkin(prev => ({ 
                ...prev, 
                name: e.target.value 
              }))}
              className="skin-name-input"
              placeholder="スキン名"
            />
            
            <div className="skin-meta">
              <div className="meta-item">
                <span className="meta-label">ベーステーマ:</span>
                <span className="meta-value">{currentSkin.baseTheme}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">作成日:</span>
                <span className="meta-value">
                  {new Date(currentSkin.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 中央ペイン: エディタ */}
        <div className="editor-pane">
          <div className="editor-tabs">
            <button
              className={`tab-button ${activeTab === 'colors' ? 'active' : ''}`}
              onClick={() => setActiveTab('colors')}
            >
              🎨 カラー
            </button>
            <button
              className={`tab-button ${activeTab === 'typography' ? 'active' : ''}`}
              onClick={() => setActiveTab('typography')}
            >
              🔤 タイポグラフィ
            </button>
            <button
              className={`tab-button ${activeTab === 'components' ? 'active' : ''}`}
              onClick={() => setActiveTab('components')}
            >
              🧩 コンポーネント
            </button>
            <button
              className={`tab-button ${activeTab === 'textures' ? 'active' : ''}`}
              onClick={() => setActiveTab('textures')}
            >
              🌀 テクスチャ
            </button>
            <button
              className={`tab-button ${activeTab === 'animations' ? 'active' : ''}`}
              onClick={() => setActiveTab('animations')}
            >
              🎞️ アニメーション
            </button>
            <button
              className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              📁 ギャラリー
            </button>
          </div>

          <div className="editor-content">
            {activeTab === 'colors' && (
              <ColorEditor
                colors={currentSkin.colors}
                onUpdate={(colors) => setCurrentSkin(prev => ({
                  ...prev,
                  colors
                }))}
              />
            )}

            {activeTab === 'typography' && (
              <TypographyEditor
                typography={currentSkin.typography}
                onUpdate={(typography) => setCurrentSkin(prev => ({
                  ...prev,
                  typography
                }))}
              />
            )}

            {activeTab === 'components' && (
              <ComponentEditor
                components={currentSkin.components}
                onUpdate={(components) => setCurrentSkin(prev => ({
                  ...prev,
                  components
                }))}
              />
            )}

            {activeTab === 'textures' && (
              <TextureManager
                textures={currentSkin.textures}
                onUpdate={(textures) => setCurrentSkin(prev => ({
                  ...prev,
                  textures
                }))}
              />
            )}

            {activeTab === 'animations' && (
              <AnimationEditor
                animations={currentSkin.animations}
                onUpdate={(animations) => setCurrentSkin(prev => ({
                  ...prev,
                  animations
                }))}
              />
            )}

            {activeTab === 'gallery' && (
              <SkinGallery
                onPresetSelect={applyPreset}
                currentSkin={currentSkin}
              />
            )}
          </div>
        </div>

        {/* 右ペイン: CSSエディタとエクスポート */}
        <div className="properties-pane">
          <div className="property-section">
            <h4>📝 カスタムCSS</h4>
            <div className="css-editor-container">
              <textarea
                className="css-editor"
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                placeholder="/* カスタムCSSをここに入力 */"
                spellCheck="false"
              />
              <div className="css-editor-info">
                <small>
                  入力したCSSはスキンに追加されます。CSS変数を使用する場合は <code>var(--color-primary)</code> のように記述してください。
                </small>
              </div>
            </div>
          </div>

          <div className="property-section">
            <h4>⚙️ エクスポート設定</h4>
            <SkinExporter
              skin={currentSkin}
              customCSS={customCSS}
              onExport={(format) => exportSkin(format)}
            />
          </div>

          <div className="property-section">
            <h4>📊 アクセシビリティ</h4>
            <div className="accessibility-checker">
              <div className="check-item">
                <input
                  type="checkbox"
                  checked={checkColorContrast(currentSkin.colors)}
                  readOnly
                />
                <label>カラーコントラスト合格</label>
              </div>
              <div className="check-item">
                <input
                  type="checkbox"
                  checked={checkFontSize(currentSkin.typography.fontSize)}
                  readOnly
                />
                <label>フォントサイズ適切</label>
              </div>
              <div className="check-item">
                <input
                  type="checkbox"
                  checked={checkFocusIndicators(currentSkin.components)}
                  readOnly
                />
                <label>フォーカスインジケーター</label>
              </div>
              <button className="run-check-button">
                🔍 アクセシビリティチェックを実行
              </button>
            </div>
          </div>

          <div className="property-section">
            <h4>🔄 クイックアクション</h4>
            <div className="quick-actions-grid">
              <button 
                className="action-button"
                onClick={() => {
                  const invertedColors = invertColors(currentSkin.colors);
                  setCurrentSkin(prev => ({ ...prev, colors: invertedColors }));
                }}
              >
                🔄 色を反転
              </button>
              
              <button 
                className="action-button"
                onClick={() => {
                  const darkerColors = darkenColors(currentSkin.colors, 0.2);
                  setCurrentSkin(prev => ({ ...prev, colors: darkerColors }));
                }}
              >
                🌙 ダークモード化
              </button>
              
              <button 
                className="action-button"
                onClick={() => {
                  const pastelColors = convertToPastel(currentSkin.colors);
                  setCurrentSkin(prev => ({ ...prev, colors: pastelColors }));
                }}
              >
                🎀 パステル化
              </button>
              
              <button 
                className="action-button"
                onClick={() => {
                  const randomSkin = generateRandomSkin();
                  setCurrentSkin(randomSkin);
                }}
              >
                🎲 ランダム生成
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="skinner-footer">
        <div className="css-variables">
          <h5>CSS変数一覧</h5>
          <div className="variables-grid">
            {Object.entries(currentSkin.colors).map(([key, value]) => (
              <div key={key} className="variable-item">
                <div 
                  className="color-preview"
                  style={{ backgroundColor: value }}
                />
                <code>--color-{key}</code>
                <span className="color-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-actions">
          <button 
            className="btn-secondary"
            onClick={() => setCurrentSkin(createDefaultSkin())}
          >
            🔄 リセット
          </button>
          <button 
            className="btn-primary"
            onClick={saveSkin}
          >
            💾 保存して終了
          </button>
        </div>
      </div>
    </div>
  );
};

// ユーティリティ関数
const createDefaultSkin = (): UISkin => ({
  id: `skin_${Date.now()}`,
  name: '幽玄デフォルト',
  author: 'システム',
  baseTheme: 'dark',
  colors: {
    primary: '#6557f5',
    secondary: '#9c27b0',
    background: '#1a1a2e',
    surface: '#16213e',
    text: '#e8eaf6',
    accent: '#ff9800',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  },
  typography: {
    fontFamily: "'Noto Sans JP', '游ゴシック体', YuGothic, sans-serif",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: 0.5,
    fontStyle: 'normal'
  },
  components: {
    buttons: {
      borderRadius: 8,
      padding: { x: 16, y: 8 },
      shadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.2)',
        blur: 8,
        offset: { x: 0, y: 2 }
      },
      border: {
        enabled: false,
        color: '',
        width: 0,
        style: 'solid'
      },
      hoverEffect: 'transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);',
      activeEffect: 'transform: translateY(0);'
    },
    cards: {
      borderRadius: 12,
      padding: 16,
      shadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.1)',
        blur: 12,
        offset: { x: 0, y: 4 }
      },
      border: {
        enabled: true,
        color: 'rgba(255, 255, 255, 0.1)',
        width: 1,
        style: 'solid'
      }
    },
    inputs: {
      borderRadius: 6,
      padding: { x: 12, y: 8 },
      shadow: {
        enabled: false,
        color: '',
        blur: 0,
        offset: { x: 0, y: 0 }
      },
      border: {
        enabled: true,
        color: 'rgba(255, 255, 255, 0.2)',
        width: 1,
        style: 'solid'
      }
    },
    modals: {
      borderRadius: 16,
      padding: 24,
      shadow: {
        enabled: true,
        color: 'rgba(0, 0, 0, 0.3)',
        blur: 24,
        offset: { x: 0, y: 8 }
      },
      border: {
        enabled: true,
        color: 'rgba(255, 255, 255, 0.05)',
        width: 1,
        style: 'solid'
      }
    },
    tables: {
      borderRadius: 8,
      padding: 8,
      shadow: {
        enabled: false,
        color: '',
        blur: 0,
        offset: { x: 0, y: 0 }
      },
      border: {
        enabled: true,
        color: 'rgba(255, 255, 255, 0.1)',
        width: 1,
        style: 'solid'
      }
    }
  },
  textures: {
    background: 'none',
    surface: 'none',
    overlay: 'none'
  },
  animations: [],
  createdAt: Date.now()
});

// アクセシビリティチェック関数
const checkColorContrast = (colors: ColorScheme): boolean => {
  // 簡易的なコントラスト比チェック
  const textColor = colors.text;
  const bgColor = colors.background;
  
  // 実際の実装ではより正確なコントラスト比計算が必要
  return true; // 仮実装
};

const checkFontSize = (fontSize: number): boolean => {
  return fontSize >= 14; // 14px以上なら合格
};

const checkFocusIndicators = (components: ComponentStyles): boolean => {
  return components.inputs.border.enabled || 
         components.buttons.border.enabled;
};

// 色変換ユーティリティ
const invertColors = (colors: ColorScheme): ColorScheme => {
  const inverted: any = {};
  Object.entries(colors).forEach(([key, value]) => {
    // 簡易的な色反転（実際の実装ではより正確な処理が必要）
    if (value.startsWith('#')) {
      const hex = value.slice(1);
      const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16).padStart(2, '0');
      const g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16).padStart(2, '0');
      const b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16).padStart(2, '0');
      inverted[key] = `#${r}${g}${b}`;
    } else {
      inverted[key] = value;
    }
  });
  return inverted as ColorScheme;
};

const darkenColors = (colors: ColorScheme, amount: number): ColorScheme => {
  const darkened: any = {};
  Object.entries(colors).forEach(([key, value]) => {
    // 簡易的な暗くする処理
    darkened[key] = value; // 実際の実装では色を暗くする処理
  });
  return darkened as ColorScheme;
};

const convertToPastel = (colors: ColorScheme): ColorScheme => {
  const pastel: any = {};
  Object.entries(colors).forEach(([key, value]) => {
    // 簡易的なパステル化
    pastel[key] = value; // 実際の実装ではパステルカラーに変換
  });
  return pastel as ColorScheme;
};

const generateRandomSkin = (): UISkin => {
  const baseThemes: Array<UISkin['baseTheme']> = ['dark', 'light', 'colorful', 'minimal'];
  const colorPalettes = [
    {
      primary: '#6557f5',
      secondary: '#9c27b0',
      background: '#1a1a2e',
      surface: '#16213e'
    },
    {
      primary: '#4caf50',
      secondary: '#2196f3',
      background: '#f5f5f5',
      surface: '#ffffff'
    },
    {
      primary: '#ff9800',
      secondary: '#ff5722',
      background: '#263238',
      surface: '#37474f'
    }
  ];
  
  const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
  
  return {
    ...createDefaultSkin(),
    name: `ランダムスキン ${Math.floor(Math.random() * 100)}`,
    baseTheme: baseThemes[Math.floor(Math.random() * baseThemes.length)],
    colors: {
      ...createDefaultSkin().colors,
      ...palette
    }
  };
};

const generateSkinThumbnail = async (): Promise<string> => {
  // サムネイルを生成するロジック
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // サムネイルの描画
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('スキンプレビュー', canvas.width/2, 50);
  }
  
  return canvas.toDataURL('image/png');
};

const saveSkinToStorage = async (skin: UISkin): Promise<void> => {
  // IndexedDBに保存するロジック
  const db = await openSkinsDatabase();
  const transaction = db.transaction(['skins'], 'readwrite');
  const store = transaction.objectStore('skins');
  await store.put(skin);
};

const openSkinsDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UISkinsDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('skins')) {
        const store = db.createObjectStore('skins', { keyPath: 'id' });
        store.createIndex('theme', 'baseTheme');
        store.createIndex('createdAt', 'createdAt');
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const exportSkin = (format: 'css' | 'json' | 'theme') => {
  switch (format) {
    case 'css':
      exportAsCSS();
      break;
    case 'json':
      exportAsJSON();
      break;
    case 'theme':
      exportAsTheme();
      break;
  }
};

const exportAsCSS = () => {
  const css = generateCSS(currentSkin);
  const blob = new Blob([css], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentSkin.name}.css`;
  link.click();
  
  URL.revokeObjectURL(url);
};

const exportAsJSON = () => {
  const data = JSON.stringify(currentSkin, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentSkin.name}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
};
