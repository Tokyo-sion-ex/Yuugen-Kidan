import React, { useState, useEffect, useRef } from 'react';
import { 
  VisualEffect, 
  EffectType, 
  EffectPreset,
  ParticleSystem,
  AnimationEffect
} from '../../../types/creative.types';
import { ParticleDesigner } from './ParticleDesigner';
import { AnimationTimeline } from './AnimationTimeline';
import { ShaderEditor } from './ShaderEditor';
import { PreviewRenderer } from './PreviewRenderer';
import { PresetGallery } from './PresetGallery';
import { ExportManager } from './ExportManager';
import './EffectEditor.css';

interface EffectEditorProps {
  initialEffect?: VisualEffect;
  onEffectSave?: (effect: VisualEffect) => void;
  onEffectTest?: (effect: VisualEffect) => void;
}

export const EffectEditor: React.FC<EffectEditorProps> = ({
  initialEffect,
  onEffectSave,
  onEffectTest
}) => {
  const [currentEffect, setCurrentEffect] = useState<VisualEffect>(
    initialEffect || createDefaultEffect()
  );
  const [activeTab, setActiveTab] = useState<'particles' | 'animations' | 'shaders' | 'presets'>('particles');
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewMode, setPreviewMode] = useState<'tile' | 'table' | 'fullscreen'>('tile');
  const [performance, setPerformance] = useState({ fps: 60, particleCount: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<any[]>([]);
  const lastTimeRef = useRef<number>(0);

  // プレビューの初期化と更新
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスのクリア
    const clearCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // パーティクルシステムの更新
    const updateParticles = (deltaTime: number) => {
      if (!currentEffect.particleSystem) return;

      const { emitter, particles, behavior } = currentEffect.particleSystem;

      // 新しいパーティクルの生成
      if (isPlaying) {
        const particlesToEmit = Math.floor(emitter.rate * deltaTime);
        for (let i = 0; i < particlesToEmit; i++) {
          if (particlesRef.current.length < emitter.maxParticles) {
            particlesRef.current.push(createNewParticle(emitter, particles));
          }
        }
      }

      // パーティクルの更新
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.life -= deltaTime;
        if (particle.life <= 0) return false;

        // 物理演算
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.vx += particle.ax * deltaTime;
        particle.vy += particle.ay * deltaTime;

        // 回転
        particle.rotation += particle.rotationSpeed * deltaTime;

        // サイズの変化
        particle.size = particle.startSize * (particle.life / particle.startLife);

        // 色の変化
        const lifeRatio = particle.life / particle.startLife;
        if (particles.colorOverLifetime) {
          particle.color = interpolateColor(
            particles.startColor,
            particles.endColor,
            1 - lifeRatio
          );
        }

        // 透明度の変化
        if (particles.fadeOut) {
          particle.alpha = lifeRatio;
        }

        return true;
      });
    };

    // パーティクルの描画
    const drawParticles = () => {
      particlesRef.current.forEach(particle => {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.alpha;

        // パーティクルの形状を描画
        if (particle.shape === 'circle') {
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.shape === 'square') {
          ctx.fillStyle = particle.color;
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        } else if (particle.shape === 'star') {
          drawStar(ctx, 0, 0, particle.size / 2, 5, 0.5);
          ctx.fillStyle = particle.color;
          ctx.fill();
        }

        ctx.restore();
      });
    };

    // アニメーションループ
    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      // パフォーマンス計測
      const fps = Math.round(1 / deltaTime);
      setPerformance(prev => ({
        fps: Math.min(60, fps),
        particleCount: particlesRef.current.length
      }));

      clearCanvas();

      if (isPlaying) {
        updateParticles(deltaTime);
        drawParticles();
      } else {
        // 停止時は静止画を表示
        drawStaticPreview(ctx);
      }

      // アニメーションの継続
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      drawStaticPreview(ctx);
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, currentEffect]);

  // 新しいパーティクルの作成
  const createNewParticle = (emitter: any, particles: any) => {
    const angle = (Math.random() * Math.PI * 2);
    const speed = emitter.speed.min + Math.random() * (emitter.speed.max - emitter.speed.min);
    
    return {
      x: emitter.x,
      y: emitter.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ax: 0,
      ay: emitter.gravity || 0,
      size: particles.size.min + Math.random() * (particles.size.max - particles.size.min),
      startSize: 0,
      color: particles.startColor,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2,
      life: particles.lifetime.min + Math.random() * (particles.lifetime.max - particles.lifetime.min),
      startLife: 0,
      alpha: 1,
      shape: particles.shape
    };
  };

  // エフェクトのテスト実行
  const testEffect = () => {
    setIsPlaying(true);
    
    // パーティクルをリセット
    particlesRef.current = [];
    
    if (onEffectTest) {
      onEffectTest(currentEffect);
    }

    // 3秒後に自動停止
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };

  // エフェクトの保存
  const saveEffect = async () => {
    try {
      // サムネイルの生成
      const thumbnail = await generateThumbnail();
      
      const effectToSave = {
        ...currentEffect,
        thumbnail,
        updatedAt: Date.now()
      };

      // IndexedDBに保存
      await saveEffectToStorage(effectToSave);
      
      if (onEffectSave) {
        onEffectSave(effectToSave);
      }

      alert('エフェクトを保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  // プリセットの適用
  const applyPreset = (preset: EffectPreset) => {
    setCurrentEffect({
      ...currentEffect,
      ...preset.settings,
      name: `${preset.name} (カスタマイズ)`
    });
  };

  return (
    <div className="effect-editor">
      <div className="editor-header">
        <h2>✨ 幽玄エフェクトエディタ</h2>
        <div className="header-controls">
          <button
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸️ 停止' : '▶️ テスト'}
          </button>
          
          <div className="preview-mode-selector">
            <select
              value={previewMode}
              onChange={(e) => setPreviewMode(e.target.value as any)}
            >
              <option value="tile">牌プレビュー</option>
              <option value="table">牌卓プレビュー</option>
              <option value="fullscreen">全画面</option>
            </select>
          </div>

          <button className="btn-primary" onClick={saveEffect}>
            💾 エフェクトを保存
          </button>
        </div>
      </div>

      <div className="editor-container">
        {/* 左ペイン: プレビュー */}
        <div className="preview-pane">
          <div className="preview-container">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="effect-preview-canvas"
            />
            
            <div className="preview-controls">
              <div className="performance-stats">
                <div className="stat">
                  <span className="stat-label">FPS:</span>
                  <span className="stat-value">{performance.fps}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">パーティクル:</span>
                  <span className="stat-value">{performance.particleCount}</span>
                </div>
              </div>
              
              <div className="preview-actions">
                <button onClick={testEffect} className="test-button">
                  🎯 テスト実行
                </button>
                <button 
                  onClick={() => particlesRef.current = []}
                  className="reset-button"
                >
                  🗑️ クリア
                </button>
              </div>
            </div>
          </div>

          <div className="effect-info">
            <input
              type="text"
              value={currentEffect.name}
              onChange={(e) => setCurrentEffect(prev => ({ 
                ...prev, 
                name: e.target.value 
              }))}
              className="effect-name-input"
              placeholder="エフェクト名"
            />
            
            <div className="effect-tags">
              {currentEffect.tags?.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
              <button className="add-tag">+ タグ追加</button>
            </div>
          </div>
        </div>

        {/* 中央ペイン: エディタ */}
        <div className="editor-pane">
          <div className="editor-tabs">
            <button
              className={`tab-button ${activeTab === 'particles' ? 'active' : ''}`}
              onClick={() => setActiveTab('particles')}
            >
              ⚡ パーティクル
            </button>
            <button
              className={`tab-button ${activeTab === 'animations' ? 'active' : ''}`}
              onClick={() => setActiveTab('animations')}
            >
              🎞️ アニメーション
            </button>
            <button
              className={`tab-button ${activeTab === 'shaders' ? 'active' : ''}`}
              onClick={() => setActiveTab('shaders')}
            >
              🎨 シェーダー
            </button>
            <button
              className={`tab-button ${activeTab === 'presets' ? 'active' : ''}`}
              onClick={() => setActiveTab('presets')}
            >
              📁 プリセット
            </button>
          </div>

          <div className="editor-content">
            {activeTab === 'particles' && (
              <ParticleDesigner
                particleSystem={currentEffect.particleSystem}
                onUpdate={(particleSystem) => setCurrentEffect(prev => ({
                  ...prev,
                  particleSystem
                }))}
              />
            )}

            {activeTab === 'animations' && (
              <AnimationTimeline
                animations={currentEffect.animations}
                onUpdate={(animations) => setCurrentEffect(prev => ({
                  ...prev,
                  animations
                }))}
              />
            )}

            {activeTab === 'shaders' && (
              <ShaderEditor
                shaders={currentEffect.shaders}
                onUpdate={(shaders) => setCurrentEffect(prev => ({
                  ...prev,
                  shaders
                }))}
              />
            )}

            {activeTab === 'presets' && (
              <PresetGallery
                onPresetSelect={applyPreset}
                currentEffect={currentEffect}
              />
            )}
          </div>
        </div>

        {/* 右ペイン: プロパティとエクスポート */}
        <div className="properties-pane">
          <div className="property-section">
            <h4>⚙️ 基本設定</h4>
            
            <div className="property-group">
              <label className="property-label">
                エフェクトタイプ:
                <select
                  value={currentEffect.type}
                  onChange={(e) => setCurrentEffect(prev => ({
                    ...prev,
                    type: e.target.value as EffectType
                  }))}
                >
                  <option value="win">和了時</option>
                  <option value="riichi">立直時</option>
                  <option value="draw">牌を引いた時</option>
                  <option value="discard">牌を切った時</option>
                  <option value="general">汎用</option>
                </select>
              </label>
            </div>

            <div className="property-group">
              <label className="property-label">
                強度:
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentEffect.intensity}
                  onChange={(e) => setCurrentEffect(prev => ({
                    ...prev,
                    intensity: parseFloat(e.target.value)
                  }))}
                />
                <span className="property-value">
                  {Math.round(currentEffect.intensity * 100)}%
                </span>
              </label>
            </div>

            <div className="property-group">
              <label className="property-label">
                継続時間:
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={currentEffect.duration}
                  onChange={(e) => setCurrentEffect(prev => ({
                    ...prev,
                    duration: parseFloat(e.target.value)
                  }))}
                />
                <span className="property-value">
                  {currentEffect.duration.toFixed(1)}秒
                </span>
              </label>
            </div>

            <div className="property-group">
              <label className="property-label">
                色テーマ:
                <select
                  value={currentEffect.colorTheme}
                  onChange={(e) => setCurrentEffect(prev => ({
                    ...prev,
                    colorTheme: e.target.value
                  }))}
                >
                  <option value="warm">暖色</option>
                  <option value="cool">寒色</option>
                  <option value="gold">金色</option>
                  <option value="rainbow">虹色</option>
                  <option value="monochrome">モノクロ</option>
                </select>
              </label>
            </div>
          </div>

          <div className="property-section">
            <h4>🎯 発生条件</h4>
            
            <div className="condition-list">
              {currentEffect.conditions?.map((condition, index) => (
                <div key={index} className="condition-item">
                  <select
                    value={condition.type}
                    onChange={(e) => {
                      const newConditions = [...(currentEffect.conditions || [])];
                      newConditions[index].type = e.target.value;
                      setCurrentEffect(prev => ({ ...prev, conditions: newConditions }));
                    }}
                  >
                    <option value="always">常時</option>
                    <option value="onWin">和了時</option>
                    <option value="onRiichi">立直時</option>
                    <option value="onYakuman">役満時</option>
                    <option value="onDora">ドラ表示時</option>
                  </select>
                  
                  <button
                    className="remove-condition"
                    onClick={() => {
                      const newConditions = [...(currentEffect.conditions || [])];
                      newConditions.splice(index, 1);
                      setCurrentEffect(prev => ({ ...prev, conditions: newConditions }));
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                className="add-condition"
                onClick={() => {
                  const newConditions = [
                    ...(currentEffect.conditions || []),
                    { type: 'always', parameters: {} }
                  ];
                  setCurrentEffect(prev => ({ ...prev, conditions: newConditions }));
                }}
              >
                + 条件を追加
              </button>
            </div>
          </div>

          <ExportManager
            effect={currentEffect}
            onExport={(format) => exportEffect(format)}
          />
        </div>
      </div>

      <div className="editor-footer">
        <div className="history-navigation">
          <button className="btn-icon" title="元に戻す">↶</button>
          <button className="btn-icon" title="やり直し">↷</button>
          <span className="history-info">
            変更履歴: 10件
          </span>
        </div>

        <div className="quick-presets">
          <span className="preset-label">クイックプリセット:</span>
          {quickPresets.map(preset => (
            <button
              key={preset.id}
              className="preset-button"
              onClick={() => applyPreset(preset)}
            >
              {preset.icon} {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ユーティリティ関数
const createDefaultEffect = (): VisualEffect => ({
  id: `effect_${Date.now()}`,
  name: '新しいエフェクト',
  type: 'win',
  intensity: 0.7,
  duration: 2.0,
  colorTheme: 'gold',
  particleSystem: {
    emitter: {
      x: 200,
      y: 200,
      rate: 50,
      maxParticles: 1000,
      speed: { min: 50, max: 150 }
    },
    particles: {
      shape: 'circle',
      size: { min: 2, max: 8 },
      startColor: '#FFD700',
      endColor: '#FFA500',
      colorOverLifetime: true,
      lifetime: { min: 0.5, max: 2.0 },
      fadeOut: true
    },
    behavior: {
      gravity: 100,
      wind: { x: 0, y: 0 },
      turbulence: 0.1
    }
  },
  animations: [],
  shaders: [],
  conditions: [{ type: 'onWin', parameters: {} }],
  tags: ['和了', 'ゴールド'],
  createdAt: Date.now()
});

const quickPresets: EffectPreset[] = [
  {
    id: 'sparkle',
    name: 'きらめき',
    icon: '✨',
    settings: {
      type: 'win',
      intensity: 0.5,
      colorTheme: 'rainbow',
      particleSystem: {
        emitter: { rate: 100, maxParticles: 500 },
        particles: { shape: 'star', size: { min: 3, max: 10 } }
      }
    }
  },
  {
    id: 'explosion',
    name: '爆発',
    icon: '💥',
    settings: {
      type: 'win',
      intensity: 1.0,
      duration: 1.0,
      particleSystem: {
        emitter: { rate: 500, maxParticles: 1000 },
        particles: { shape: 'circle', size: { min: 5, max: 20 } }
      }
    }
  },
  {
    id: 'gentle_glow',
    name: '優しい輝き',
    icon: '💫',
    settings: {
      type: 'general',
      intensity: 0.3,
      duration: 3.0,
      particleSystem: {
        emitter: { rate: 20, maxParticles: 200 },
        particles: { shape: 'circle', size: { min: 1, max: 4 } }
      }
    }
  }
];

const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }

  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
};

const interpolateColor = (color1: string, color2: string, ratio: number): string => {
  const hex = (color: string) => parseInt(color.slice(1), 16);
  const r1 = (hex(color1) >> 16) & 255;
  const g1 = (hex(color1) >> 8) & 255;
  const b1 = hex(color1) & 255;
  const r2 = (hex(color2) >> 16) & 255;
  const g2 = (hex(color2) >> 8) & 255;
  const b2 = hex(color2) & 255;

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
};

const drawStaticPreview = (ctx: CanvasRenderingContext2D) => {
  const { width, height } = ctx.canvas;
  
  // グラデーション背景
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a237e');
  gradient.addColorStop(1, '#311b92');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 中央に牌のシルエット
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(width/2 - 30, height/2 - 45, 60, 90);
  
  // エフェクト名
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('エフェクトプレビュー', width/2, 30);
};

const generateThumbnail = async (): Promise<string> => {
  // キャンバスからサムネイルを生成
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    drawStaticPreview(ctx);
  }
  
  return canvas.toDataURL('image/png');
};

const saveEffectToStorage = async (effect: VisualEffect): Promise<void> => {
  // IndexedDBに保存
  const db = await openEffectsDatabase();
  const transaction = db.transaction(['effects'], 'readwrite');
  const store = transaction.objectStore('effects');
  await store.put(effect);
};

const openEffectsDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EffectsDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('effects')) {
        const store = db.createObjectStore('effects', { keyPath: 'id' });
        store.createIndex('type', 'type');
        store.createIndex('createdAt', 'createdAt');
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const exportEffect = (format: 'json' | 'image' | 'video') => {
  switch (format) {
    case 'json':
      exportAsJSON();
      break;
    case 'image':
      exportAsImage();
      break;
    case 'video':
      exportAsVideo();
      break;
  }
};

const exportAsJSON = () => {
  const dataStr = JSON.stringify(currentEffect, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `${currentEffect.name}.json`;
  link.click();
};

const exportAsImage = () => {
  if (canvasRef.current) {
    const image = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `${currentEffect.name}_preview.png`;
    link.click();
  }
};
