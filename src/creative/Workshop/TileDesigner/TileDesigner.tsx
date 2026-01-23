import React, { useState, useRef, useEffect } from 'react';
import { TileDesign, TileDesignPreset, TilePart } from '../../../types/creative.types';
import { CanvasEditor } from './CanvasEditor';
import { TilePartLibrary } from './TilePartLibrary';
import { ColorPicker } from './ColorPicker';
import { EffectManager } from './EffectManager';
import { PresetManager } from './PresetManager';
import { ShareManager } from './ShareManager';
import './TileDesigner.css';

export const TileDesigner: React.FC = () => {
  const [currentDesign, setCurrentDesign] = useState<TileDesign>({
    id: '',
    name: '新しいデザイン',
    author: 'あなた',
    createdAt: Date.now(),
    baseColor: '#2c3e50',
    pattern: 'none',
    texture: 'smooth',
    numberStyle: 'classic',
    decoration: 'none',
    glowEffect: {
      enabled: true,
      color: '#3498db',
      intensity: 0.5,
      animation: 'pulse'
    },
    border: {
      style: 'simple',
      color: '#ecf0f1',
      width: 2
    },
    parts: [],
    preview: ''
  });

  const [activeTab, setActiveTab] = useState<'design' | 'parts' | 'effects' | 'presets' | 'share'>('design');
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // デザインのプレビューを更新
  const updatePreview = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景を描画
    drawTileBackground(ctx, currentDesign);
    
    // 牌の数字/記号を描画
    drawTileSymbol(ctx, currentDesign);
    
    // 装飾を描画
    drawDecorations(ctx, currentDesign);
    
    // エフェクトを適用
    applyEffects(ctx, currentDesign);

    // プレビュー画像を保存
    const previewUrl = canvas.toDataURL('image/png');
    setCurrentDesign(prev => ({ ...prev, preview: previewUrl }));
  };

  // 背景描画
  const drawTileBackground = (ctx: CanvasRenderingContext2D, design: TileDesign) => {
    const { width, height } = ctx.canvas;
    
    // ベースカラー
    ctx.fillStyle = design.baseColor;
    ctx.fillRect(0, 0, width, height);

    // パターン
    if (design.pattern !== 'none') {
      drawPattern(ctx, design.pattern, width, height);
    }

    // テクスチャ
    if (design.texture !== 'smooth') {
      applyTexture(ctx, design.texture, width, height);
    }

    // ボーダー
    if (design.border.style !== 'none') {
      drawBorder(ctx, design.border, width, height);
    }
  };

  // デザインをエクスポート
  const exportDesign = async () => {
    setIsExporting(true);
    
    try {
      // 画像としてエクスポート
      if (canvasRef.current) {
        const imageUrl = canvasRef.current.toDataURL('image/png', 1.0);
        
        // ダウンロードリンクを作成
        const link = document.createElement('a');
        link.download = `${currentDesign.name}_${Date.now()}.png`;
        link.href = imageUrl;
        link.click();
      }

      // デザインデータを保存
      const designData = {
        ...currentDesign,
        exportedAt: Date.now()
      };

      // IndexedDBに保存
      await saveDesignToStorage(designData);
      
      console.log('デザインをエクスポートしました:', designData);
      
    } catch (error) {
      console.error('エクスポートエラー:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // パーツライブラリから追加
  const addPartFromLibrary = (part: TilePart) => {
    setCurrentDesign(prev => ({
      ...prev,
      parts: [...prev.parts, { ...part, id: `part_${Date.now()}` }]
    }));
  };

  // プリセットを適用
  const applyPreset = (preset: TileDesignPreset) => {
    setCurrentDesign({
      ...currentDesign,
      ...preset.settings,
      name: `${preset.name} (カスタマイズ)`
    });
  };

  // デザインを共有
  const shareDesign = async () => {
    try {
      // 共有用の短縮URLを生成
      const shareData = {
        design: currentDesign,
        shareCode: generateShareCode(),
        url: await generateShareUrl(),
        timestamp: Date.now()
      };

      // クリップボードにコピー
      await navigator.clipboard.writeText(shareData.url);
      
      alert('共有URLをコピーしました！');
      
    } catch (error) {
      console.error('共有エラー:', error);
    }
  };

  useEffect(() => {
    updatePreview();
  }, [currentDesign]);

  return (
    <div className="tile-designer">
      <div className="designer-header">
        <h2>🀄 幽玄牌デザイナー</h2>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={exportDesign}
            disabled={isExporting}
          >
            {isExporting ? 'エクスポート中...' : 'デザインを保存'}
          </button>
          <button 
            className="btn-secondary"
            onClick={shareDesign}
          >
            🔗 共有
          </button>
        </div>
      </div>

      <div className="designer-container">
        {/* 左ペイン: プレビュー */}
        <div className="preview-pane">
          <div className="preview-container">
            <canvas
              ref={canvasRef}
              width={200}
              height={300}
              className="tile-preview-canvas"
            />
            <div className="preview-controls">
              <div className="preview-scale">
                <button onClick={() => zoomPreview(-0.1)}>-</button>
                <span>100%</span>
                <button onClick={() => zoomPreview(0.1)}>+</button>
              </div>
              <div className="preview-rotation">
                <button onClick={() => rotatePreview(-15)}>↺</button>
                <button onClick={() => rotatePreview(15)}>↻</button>
              </div>
            </div>
          </div>

          <div className="design-info">
            <input
              type="text"
              value={currentDesign.name}
              onChange={(e) => setCurrentDesign(prev => ({ 
                ...prev, 
                name: e.target.value 
              }))}
              className="design-name-input"
              placeholder="デザイン名を入力"
            />
            <div className="design-stats">
              <span>パーツ数: {currentDesign.parts.length}</span>
              <span>最終更新: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* 右ペイン: 編集ツール */}
        <div className="editor-pane">
          <div className="editor-tabs">
            <button
              className={`tab-button ${activeTab === 'design' ? 'active' : ''}`}
              onClick={() => setActiveTab('design')}
            >
              🎨 基本デザイン
            </button>
            <button
              className={`tab-button ${activeTab === 'parts' ? 'active' : ''}`}
              onClick={() => setActiveTab('parts')}
            >
              📦 パーツライブラリ
            </button>
            <button
              className={`tab-button ${activeTab === 'effects' ? 'active' : ''}`}
              onClick={() => setActiveTab('effects')}
            >
              ✨ エフェクト
            </button>
            <button
              className={`tab-button ${activeTab === 'presets' ? 'active' : ''}`}
              onClick={() => setActiveTab('presets')}
            >
              📁 プリセット
            </button>
            <button
              className={`tab-button ${activeTab === 'share' ? 'active' : ''}`}
              onClick={() => setActiveTab('share')}
            >
              🌐 共有
            </button>
          </div>

          <div className="editor-content">
            {activeTab === 'design' && (
              <div className="design-tools">
                <div className="tool-section">
                  <h4>基本色</h4>
                  <ColorPicker
                    color={currentDesign.baseColor}
                    onChange={(color) => setCurrentDesign(prev => ({ 
                      ...prev, 
                      baseColor: color 
                    }))}
                    presetColors={[
                      '#2c3e50', '#34495e', '#1a237e',
                      '#311b92', '#004d40', '#1b5e20',
                      '#bf360c', '#4a148c', '#006064'
                    ]}
                  />
                </div>

                <div className="tool-section">
                  <h4>パターン</h4>
                  <div className="pattern-grid">
                    {['none', 'wave', 'sakura', 'bamboo', 'cloud', 'wave'].map(pattern => (
                      <button
                        key={pattern}
                        className={`pattern-option ${currentDesign.pattern === pattern ? 'selected' : ''}`}
                        onClick={() => setCurrentDesign(prev => ({ 
                          ...prev, 
                          pattern 
                        }))}
                        style={{ backgroundImage: `url(/patterns/${pattern}.png)` }}
                        title={pattern}
                      />
                    ))}
                  </div>
                </div>

                <div className="tool-section">
                  <h4>数字スタイル</h4>
                  <div className="style-grid">
                    {['classic', 'modern', 'elegant', 'bold', 'minimal'].map(style => (
                      <button
                        key={style}
                        className={`style-option ${currentDesign.numberStyle === style ? 'selected' : ''}`}
                        onClick={() => setCurrentDesign(prev => ({ 
                          ...prev, 
                          numberStyle: style 
                        }))}
                      >
                        {style === 'classic' ? '萬' : 
                         style === 'modern' ? 'M' : 
                         style === 'elegant' ? '萬' : 
                         style === 'bold' ? '万' : 'M'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'parts' && (
              <TilePartLibrary
                onSelectPart={addPartFromLibrary}
                currentParts={currentDesign.parts}
              />
            )}

            {activeTab === 'effects' && (
              <EffectManager
                effects={currentDesign.glowEffect}
                onChange={(effects) => setCurrentDesign(prev => ({ 
                  ...prev, 
                  glowEffect: effects 
                }))}
              />
            )}

            {activeTab === 'presets' && (
              <PresetManager
                onApplyPreset={applyPreset}
                currentDesign={currentDesign}
              />
            )}

            {activeTab === 'share' && (
              <ShareManager
                design={currentDesign}
                onShare={shareDesign}
              />
            )}
          </div>
        </div>
      </div>

      {/* 履歴/元に戻すツールバー */}
      <div className="designer-footer">
        <div className="history-controls">
          <button className="btn-icon" title="元に戻す">↶</button>
          <button className="btn-icon" title="やり直し">↷</button>
          <span className="history-status">
            変更履歴: {history.length}件
          </span>
        </div>
        
        <div className="quick-actions">
          <button 
            className="btn-secondary"
            onClick={() => setCurrentDesign(createDefaultDesign())}
          >
            リセット
          </button>
          <button 
            className="btn-primary"
            onClick={updatePreview}
          >
            プレビュー更新
          </button>
        </div>
      </div>
    </div>
  );
};

// ユーティリティ関数
const createDefaultDesign = (): TileDesign => ({
  id: `design_${Date.now()}`,
  name: '新しいデザイン',
  author: 'あなた',
  createdAt: Date.now(),
  baseColor: '#2c3e50',
  pattern: 'none',
  texture: 'smooth',
  numberStyle: 'classic',
  decoration: 'none',
  glowEffect: {
    enabled: true,
    color: '#3498db',
    intensity: 0.5,
    animation: 'pulse'
  },
  border: {
    style: 'simple',
    color: '#ecf0f1',
    width: 2
  },
  parts: [],
  preview: ''
});

const generateShareCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
};

const saveDesignToStorage = async (design: TileDesign): Promise<void> => {
  // IndexedDBに保存する実装
  const db = await openDesignDatabase();
  const transaction = db.transaction(['designs'], 'readwrite');
  const store = transaction.objectStore('designs');
  await store.put(design);
};
