import React, { useState } from 'react';
import { ParticleSystem } from '../../../types/creative.types';

interface ParticleDesignerProps {
  particleSystem: ParticleSystem | undefined;
  onUpdate: (particleSystem: ParticleSystem) => void;
}

export const ParticleDesigner: React.FC<ParticleDesignerProps> = ({
  particleSystem,
  onUpdate
}) => {
  const [system, setSystem] = useState<ParticleSystem>(
    particleSystem || createDefaultParticleSystem()
  );

  const updateSystem = (updates: Partial<ParticleSystem>) => {
    const newSystem = { ...system, ...updates };
    setSystem(newSystem);
    onUpdate(newSystem);
  };

  return (
    <div className="particle-designer">
      <div className="designer-section">
        <h4>🌀 エミッター設定</h4>
        
        <div className="property-grid">
          <div className="property">
            <label>発生率 (パーティクル/秒)</label>
            <input
              type="range"
              min="1"
              max="500"
              value={system.emitter.rate}
              onChange={(e) => updateSystem({
                emitter: { ...system.emitter, rate: parseInt(e.target.value) }
              })}
            />
            <span className="value-display">{system.emitter.rate}</span>
          </div>

          <div className="property">
            <label>最大パーティクル数</label>
            <input
              type="range"
              min="10"
              max="2000"
              value={system.emitter.maxParticles}
              onChange={(e) => updateSystem({
                emitter: { ...system.emitter, maxParticles: parseInt(e.target.value) }
              })}
            />
            <span className="value-display">{system.emitter.maxParticles}</span>
          </div>

          <div className="property">
            <label>発生速度 (最小)</label>
            <input
              type="range"
              min="0"
              max="300"
              value={system.emitter.speed.min}
              onChange={(e) => updateSystem({
                emitter: { 
                  ...system.emitter, 
                  speed: { ...system.emitter.speed, min: parseInt(e.target.value) }
                }
              })}
            />
            <span className="value-display">{system.emitter.speed.min}</span>
          </div>

          <div className="property">
            <label>発生速度 (最大)</label>
            <input
              type="range"
              min="0"
              max="300"
              value={system.emitter.speed.max}
              onChange={(e) => updateSystem({
                emitter: { 
                  ...system.emitter, 
                  speed: { ...system.emitter.speed, max: parseInt(e.target.value) }
                }
              })}
            />
            <span className="value-display">{system.emitter.speed.max}</span>
          </div>
        </div>
      </div>

      <div className="designer-section">
        <h4>🎨 パーティクル設定</h4>
        
        <div className="property-grid">
          <div className="property">
            <label>形状</label>
            <select
              value={system.particles.shape}
              onChange={(e) => updateSystem({
                particles: { ...system.particles, shape: e.target.value as any }
              })}
            >
              <option value="circle">円</option>
              <option value="square">四角</option>
              <option value="star">星</option>
              <option value="triangle">三角</option>
              <option value="custom">カスタム</option>
            </select>
          </div>

          <div className="property">
            <label>開始色</label>
            <input
              type="color"
              value={system.particles.startColor}
              onChange={(e) => updateSystem({
                particles: { ...system.particles, startColor: e.target.value }
              })}
            />
          </div>

          <div className="property">
            <label>終了色</label>
            <input
              type="color"
              value={system.particles.endColor}
              onChange={(e) => updateSystem({
                particles: { ...system.particles, endColor: e.target.value }
              })}
            />
          </div>

          <div className="property">
            <label>色の変化</label>
            <input
              type="checkbox"
              checked={system.particles.colorOverLifetime}
              onChange={(e) => updateSystem({
                particles: { ...system.particles, colorOverLifetime: e.target.checked }
              })}
            />
          </div>

          <div className="property">
            <label>サイズ (最小)</label>
            <input
              type="range"
              min="1"
              max="50"
              value={system.particles.size.min}
              onChange={(e) => updateSystem({
                particles: { 
                  ...system.particles, 
                  size: { ...system.particles.size, min: parseInt(e.target.value) }
                }
              })}
            />
            <span className="value-display">{system.particles.size.min}px</span>
          </div>

          <div className="property">
            <label>サイズ (最大)</label>
            <input
              type="range"
              min="1"
              max="50"
              value={system.particles.size.max}
              onChange={(e) => updateSystem({
                particles: { 
                  ...system.particles, 
                  size: { ...system.particles.size, max: parseInt(e.target.value) }
                }
              })}
            />
            <span className="value-display">{system.particles.size.max}px</span>
          </div>

          <div className="property">
            <label>寿命 (最小)</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={system.particles.lifetime.min}
              onChange={(e) => updateSystem({
                particles: { 
                  ...system.particles, 
                  lifetime: { ...system.particles.lifetime, min: parseFloat(e.target.value) }
                }
              })}
            />
            <span className="value-display">{system.particles.lifetime.min}s</span>
          </div>

          <div className="property">
            <label>寿命 (最大)</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={system.particles.lifetime.max}
              onChange={(e) => updateSystem({
                particles: { 
                  ...system.particles, 
                  lifetime: { ...system.particles.lifetime, max: parseFloat(e.target.value) }
                }
              })}
            />
            <span className="value-display">{system.particles.lifetime.max}s</span>
          </div>

          <div className="property">
            <label>フェードアウト</label>
            <input
              type="checkbox"
              checked={system.particles.fadeOut}
              onChange={(e) => updateSystem({
                particles: { ...system.particles, fadeOut: e.target.checked }
              })}
            />
          </div>
        </div>
      </div>

      <div className="designer-section">
        <h4>🌪️ 物理挙動</h4>
        
        <div className="property-grid">
          <div className="property">
            <label>重力</label>
            <input
              type="range"
              min="0"
              max="500"
              value={system.behavior.gravity || 0}
              onChange={(e) => updateSystem({
                behavior: { ...system.behavior, gravity: parseInt(e.target.value) }
              })}
            />
            <span className="value-display">{system.behavior.gravity || 0}</span>
          </div>

          <div className="property">
            <label>風 X方向</label>
            <input
              type="range"
              min="-100"
              max="100"
              value={system.behavior.wind?.x || 0}
              onChange={(e) => updateSystem({
                behavior: { 
                  ...system.behavior, 
                  wind: { ...system.behavior.wind, x: parseInt(e.target.value) }
                }
              })}
            />
            <span className="value-display">{system.behavior.wind?.x || 0}</span>
          </div>

          <div className="property">
            <label>風 Y方向</label>
            <input
              type="range"
              min="-100"
              max="100"
              value={system.behavior.wind?.y || 0}
              onChange={(e) => updateSystem({
                behavior: { 
                  ...system.behavior, 
                  wind: { ...system.behavior.wind, y: parseInt(e.target.value) }
                }
              })}
            />
            <span className="value-display">{system.behavior.wind?.y || 0}</span>
          </div>

          <div className="property">
            <label>乱流</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={system.behavior.turbulence || 0}
              onChange={(e) => updateSystem({
                behavior: { ...system.behavior, turbulence: parseFloat(e.target.value) }
              })}
            />
            <span className="value-display">{(system.behavior.turbulence || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="designer-section">
        <h4>🔄 プレビューコントロール</h4>
        
        <div className="preview-controls-grid">
          <button className="btn-secondary" onClick={() => {
            // パラメータをリセット
            setSystem(createDefaultParticleSystem());
            onUpdate(createDefaultParticleSystem());
          }}>
            🔄 リセット
          </button>
          
          <button className="btn-secondary" onClick={() => {
            // ランダムな設定を生成
            const randomSystem = generateRandomParticleSystem();
            setSystem(randomSystem);
            onUpdate(randomSystem);
          }}>
            🎲 ランダム生成
          </button>
          
          <button className="btn-secondary" onClick={() => {
            // 現在の設定をコピー
            navigator.clipboard.writeText(JSON.stringify(system, null, 2));
            alert('設定をコピーしました！');
          }}>
            📋 設定をコピー
          </button>
        </div>
      </div>
    </div>
  );
};

const createDefaultParticleSystem = (): ParticleSystem => ({
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
});

const generateRandomParticleSystem = (): ParticleSystem => {
  const shapes: any[] = ['circle', 'square', 'star', 'triangle'];
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];
  
  return {
    emitter: {
      x: 200,
      y: 200,
      rate: Math.floor(Math.random() * 200) + 10,
      maxParticles: Math.floor(Math.random() * 1000) + 100,
      speed: {
        min: Math.floor(Math.random() * 100),
        max: Math.floor(Math.random() * 300) + 100
      }
    },
    particles: {
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: {
        min: Math.floor(Math.random() * 10) + 1,
        max: Math.floor(Math.random() * 30) + 10
      },
      startColor: colors[Math.floor(Math.random() * colors.length)],
      endColor: colors[Math.floor(Math.random() * colors.length)],
      colorOverLifetime: Math.random() > 0.5,
      lifetime: {
        min: Math.random() * 2 + 0.1,
        max: Math.random() * 3 + 1
      },
      fadeOut: Math.random() > 0.3
    },
    behavior: {
      gravity: Math.floor(Math.random() * 200),
      wind: {
        x: Math.floor(Math.random() * 200) - 100,
        y: Math.floor(Math.random() * 200) - 100
      },
      turbulence: Math.random()
    }
  };
};
