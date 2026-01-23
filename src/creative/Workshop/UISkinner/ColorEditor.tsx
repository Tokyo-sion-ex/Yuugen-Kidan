import React, { useState } from 'react';
import { ColorScheme } from '../../../types/creative.types';
import { ChromePicker } from 'react-color';

interface ColorEditorProps {
  colors: ColorScheme;
  onUpdate: (colors: ColorScheme) => void;
}

export const ColorEditor: React.FC<ColorEditorProps> = ({
  colors,
  onUpdate
}) => {
  const [activeColor, setActiveColor] = useState<keyof ColorScheme>('primary');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempColor, setTempColor] = useState(colors[activeColor]);

  const colorLabels: Record<keyof ColorScheme, string> = {
    primary: 'プライマリー',
    secondary: 'セカンダリー',
    background: '背景',
    surface: 'サーフェス',
    text: 'テキスト',
    accent: 'アクセント',
    success: '成功',
    warning: '警告',
    error: 'エラー',
    info: '情報'
  };

  const handleColorSelect = (key: keyof ColorScheme) => {
    setActiveColor(key);
    setTempColor(colors[key]);
    setShowColorPicker(true);
  };

  const handleColorChange = (color: any) => {
    setTempColor(color.hex);
    
    // 即時更新（ライブプレビューのため）
    const updatedColors = { ...colors, [activeColor]: color.hex };
    onUpdate(updatedColors);
  };

  const handleColorPickerClose = () => {
    setShowColorPicker(false);
    // 最終的な更新
    const updatedColors = { ...colors, [activeColor]: tempColor };
    onUpdate(updatedColors);
  };

  // カラーパレットの生成
  const generatePalette = () => {
    // ベースカラーから調和したパレットを生成
    const baseColor = colors.primary;
    
    // 実際の実装ではカラーパレット生成アルゴリズムを使用
    const palette = {
      primary: baseColor,
      secondary: adjustColor(baseColor, 30),
      accent: adjustColor(baseColor, 60),
      background: darkenColor(baseColor, 80),
      surface: darkenColor(baseColor, 60)
    };
    
    onUpdate({ ...colors, ...palette });
  };

  return (
    <div className="color-editor">
      <div className="editor-section">
        <h4>🎨 カラーパレット</h4>
        
        <div className="color-palette-grid">
          {Object.entries(colorLabels).map(([key, label]) => (
            <div
              key={key}
              className="color-item"
              onClick={() => handleColorSelect(key as keyof ColorScheme)}
            >
              <div 
                className="color-preview"
                style={{ backgroundColor: colors[key as keyof ColorScheme] }}
              />
              <div className="color-info">
                <div className="color-name">{label}</div>
                <div className="color-value">{colors[key as keyof ColorScheme]}</div>
              </div>
              {activeColor === key && (
                <div className="color-active-indicator">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="editor-section">
        <h4>🎯 アクティブカラー: {colorLabels[activeColor]}</h4>
        
        <div className="active-color-editor">
          <div className="color-display">
            <div 
              className="color-preview-large"
              style={{ backgroundColor: tempColor }}
            />
            <div className="color-values">
              <div className="color-value-display">{tempColor}</div>
              <div className="color-rgb">
                RGB: {hexToRgb(tempColor).join(', ')}
              </div>
              <div className="color-hsl">
                HSL: {hexToHsl(tempColor).join(', ')}
              </div>
            </div>
          </div>

          {showColorPicker && (
            <div className="color-picker-modal">
              <div className="color-picker-backdrop" onClick={handleColorPickerClose} />
              <div className="color-picker-container">
                <ChromePicker
                  color={tempColor}
                  onChange={handleColorChange}
                  disableAlpha={true}
                />
                <div className="color-picker-actions">
                  <button onClick={handleColorPickerClose} className="btn-primary">
                    適用
                  </button>
                  <button 
                    onClick={() => {
                      setTempColor(colors[activeColor]);
                      handleColorPickerClose();
                    }}
                    className="btn-secondary"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="editor-section">
        <h4>🔄 クイックアクション</h4>
        
        <div className="color-actions-grid">
          <button className="action-button" onClick={generatePalette}>
            🎨 パレットを生成
          </button>
          
          <button className="action-button" onClick={() => {
            // 現在のパレットを保存
            const paletteName = prompt('パレット名を入力してください:');
            if (paletteName) {
              saveColorPalette(paletteName, colors);
            }
          }}>
            💾 パレットを保存
          </button>
          
          <button className="action-button" onClick={() => {
            // ランダムなパレットを生成
            const randomColors = generateRandomPalette();
            onUpdate(randomColors);
          }}>
            🎲 ランダムパレット
          </button>
          
          <button className="action-button" onClick={() => {
            // アクセシビリティチェック
            checkAccessibility(colors);
          }}>
            🔍 コントラストチェック
          </button>
        </div>
      </div>

      <div className="editor-section">
        <h4>📊 カラーコントラスト</h4>
        
        <div className="contrast-checker">
          <div className="contrast-test">
            <div 
              className="contrast-sample"
              style={{ 
                backgroundColor: colors.background,
                color: colors.text 
              }}
            >
              このテキストの視認性
            </div>
            <div className="contrast-ratio">
              コントラスト比: {calculateContrastRatio(colors.text, colors.background)}:1
            </div>
          </div>
          
          <div className="contrast-guidelines">
            <div className="guideline-item">
              <span className="guideline-label">AA (最低基準):</span>
              <span className="guideline-value">4.5:1</span>
            </div>
            <div className="guideline-item">
              <span className="guideline-label">AAA (推奨):</span>
              <span className="guideline-value">7:1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ユーティリティ関数
const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

const hexToHsl = (hex: string): [number, number, number] => {
  const [r, g, b] = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

const adjustColor = (hex: string, degrees: number): string => {
  const [h, s, l] = hexToHsl(hex);
  const newH = (h + degrees) % 360;
  return hslToHex(newH, s, l);
};

const darkenColor = (hex: string, percent: number): string => {
  const [h, s, l] = hexToHsl(hex);
  const newL = Math.max(0, l - percent);
  return hslToHex(h, s, newL);
};

const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360;
  s /= 100;
  l /= 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const generateRandomPalette = (): ColorScheme => {
  const hue = Math.floor(Math.random() * 360);
  
  return {
    primary: hslToHex(hue, 70, 50),
    secondary: hslToHex((hue + 30) % 360, 70, 50),
    background: hslToHex(hue, 10, 10),
    surface: hslToHex(hue, 15, 20),
    text: '#ffffff',
    accent: hslToHex((hue + 180) % 360, 70, 50),
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  };
};

const calculateContrastRatio = (color1: string, color2: string): number => {
  const luminance1 = calculateLuminance(color1);
  const luminance2 = calculateLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

const calculateLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  
  const sRGB = [r, g, b].map(value => {
    value /= 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  
  return sRGB[0] * 0.2126 + sRGB[1] * 0.7152 + sRGB[2] * 0.0722;
};

const saveColorPalette = (name: string, colors: ColorScheme) => {
  const palette = {
    id: `palette_${Date.now()}`,
    name,
    colors,
    createdAt: Date.now()
  };
  
  // IndexedDBに保存
  // 実際の実装ではここに保存ロジックを記述
  console.log('パレットを保存:', palette);
};

const checkAccessibility = (colors: ColorScheme) => {
  const contrastRatios = {
    textBackground: calculateContrastRatio(colors.text, colors.background),
    textSurface: calculateContrastRatio(colors.text, colors.surface),
    primaryBackground: calculateContrastRatio(colors.primary, colors.background)
  };
  
  console.log('アクセシビリティチェック:', contrastRatios);
  alert('アクセシビリティチェックを実行しました。開発者ツールのコンソールを確認してください。');
};
