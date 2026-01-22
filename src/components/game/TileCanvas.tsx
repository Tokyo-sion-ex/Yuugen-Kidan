import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tile as TileType } from '../../types/game.types';
import { TileAssetManager } from '../../core/assets/TileAssetManager';
import './TileCanvas.css';

interface TileCanvasProps {
  tile: TileType;
  width?: number;
  height?: number;
  isSelected?: boolean;
  isDiscard?: boolean;
  isDora?: boolean;
  onClick?: () => void;
  onHover?: (hovering: boolean) => void;
  animationType?: 'draw' | 'discard' | 'riichi' | 'win';
  quality?: 'low' | 'medium' | 'high';
}

const TileCanvas: React.FC<TileCanvasProps> = ({
  tile,
  width = 60,
  height = 84,
  isSelected = false,
  isDiscard = false,
  isDora = false,
  onClick,
  onHover,
  animationType,
  quality = 'medium'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGlowing, setIsGlowing] = useState(false);
  
  const assetManager = useRef(new TileAssetManager());
  const animationFrameRef = useRef<number>(0);
  const animationStartTimeRef = useRef<number>(0);
  
  // キャンバスに描画
  const drawTile = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // キャンバスをクリア
    ctx.clearRect(0, 0, width, height);
    
    try {
      // アセットマネージャーを初期化
      if (!assetManager.current) {
        assetManager.current = new TileAssetManager();
      }
      
      // アセットをロード
      await assetManager.current.initialize();
      
      // 牌画像を取得
      const tileImage = assetManager.current.getTileImage(tile);
      
      if (tileImage) {
        // 画像を描画
        ctx.drawImage(tileImage, 0, 0, width, height);
        
        // 特別な状態のオーバーレイ
        if (isSelected) {
          // 選択状態のグロー効果
          ctx.save();
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 15;
          ctx.strokeRect(1, 1, width - 2, height - 2);
          ctx.restore();
        }
        
        if (isDora) {
          // ドラの光る効果
          ctx.save();
          const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width / 2
          );
          gradient.addColorStop(0, 'rgba(255, 105, 180, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 105, 180, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
        
        if (isDiscard) {
          // 捨て牌の半透明効果
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
        
        if (isHovered && onClick) {
          // ホバー時の浮き上がり効果
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = -2;
          ctx.drawImage(tileImage, 0, -2, width, height);
          ctx.restore();
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to draw tile:', error);
      // フォールバック描画
      drawFallbackTile(ctx);
      setIsLoading(false);
    }
  }, [tile, width, height, isSelected, isDora, isDiscard, isHovered, onClick]);

  // フォールバック描画（画像がロードできない場合）
  const drawFallbackTile = useCallback((ctx: CanvasRenderingContext2D) => {
    // 背景グラデーション
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#4a5568');
    gradient.addColorStop(1, '#2d3748');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 枠線
    ctx.strokeStyle = tile.isRedFive ? '#e53e3e' : '#4a5568';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    
    // 牌の色
    let color: string;
    switch (tile.suit) {
      case 'man': color = '#e53e3e'; break;
      case 'pin': color = '#38a169'; break;
      case 'sou': color = '#3182ce'; break;
      case 'wind': color = '#9f7aea'; break;
      case 'dragon': color = '#ed8936'; break;
      default: color = '#ffffff'; break;
    }
    
    // 牌の文字
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.floor(width / 3)}px 'Noto Sans JP', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let displayText = '';
    if (tile.suit === 'wind') {
      const windChars = { east: '東', south: '南', west: '西', north: '北' };
      displayText = windChars[tile.value as keyof typeof windChars];
    } else if (tile.suit === 'dragon') {
      const dragonChars = { white: '白', green: '發', red: '中' };
      displayText = dragonChars[tile.value as keyof typeof dragonChars];
    } else {
      const suitChars = { man: '萬', pin: '筒', sou: '索' };
      displayText = `${tile.value}${suitChars[tile.suit]}`;
    }
    
    ctx.fillText(displayText, width / 2, height / 2);
    
    // 赤五の印
    if (tile.isRedFive) {
      ctx.fillStyle = '#e53e3e';
      ctx.beginPath();
      ctx.arc(width - 10, 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [tile, width, height]);

  // アニメーション処理
  const animate = useCallback((timestamp: number) => {
    if (!animationStartTimeRef.current) {
      animationStartTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - animationStartTimeRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;
    
    // アニメーションタイプに応じた処理
    switch (animationType) {
      case 'draw':
        // ツモアニメーション
        const drawProgress = Math.min(elapsed / 300, 1);
        const scale = 0.5 + drawProgress * 0.5;
        const yOffset = (1 - drawProgress) * 20;
        
        ctx.save();
        ctx.clearRect(0, 0, width, height);
        ctx.translate(width / 2, height / 2 + yOffset);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        drawTile();
        ctx.restore();
        
        if (drawProgress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        break;
        
      case 'discard':
        // 打牌アニメーション
        const discardProgress = Math.min(elapsed / 200, 1);
        const rotation = discardProgress * 360;
        
        ctx.save();
        ctx.clearRect(0, 0, width, height);
        ctx.translate(width / 2, height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-width / 2, -height / 2);
        drawTile();
        ctx.restore();
        
        if (discardProgress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        break;
        
      case 'riichi':
        // リーチアニメーション（点滅）
        const riuchiProgress = Math.min(elapsed / 1000, 1);
        const alpha = Math.abs(Math.sin(riuchiProgress * Math.PI * 4));
        
        ctx.save();
        drawTile();
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        
        if (riuchiProgress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        break;
        
      case 'win':
        // 和了アニメーション（発光）
        const winProgress = Math.min(elapsed / 1000, 1);
        const glowSize = winProgress * 20;
        
        ctx.save();
        drawTile();
        const gradient = ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, width / 2 + glowSize
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        
        if (winProgress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        break;
        
      default:
        // 通常描画
        drawTile();
        break;
    }
  }, [animationType, drawTile, width, height]);

  // イベントハンドラー
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHover?.(true);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
    onHover?.(false);
  }, [onHover]);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    if (isHovered && onClick) {
      onClick();
      // クリック効果音
      assetManager.current?.playSound('click.mp3', 0.5);
    }
  }, [isHovered, onClick]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsPressed(false);
    if (onClick) {
      onClick();
      assetManager.current?.playSound('click.mp3', 0.5);
    }
  }, [onClick]);

  // アセットマネージャーの品質設定
  useEffect(() => {
    assetManager.current?.adjustImageQuality(quality);
  }, [quality]);

  // 描画とアニメーションの開始
  useEffect(() => {
    if (animationType) {
      animationStartTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      drawTile();
    }
  }, [drawTile, animate, animationType]);

  // グロー効果のアニメーション
  useEffect(() => {
    if (isSelected || isDora) {
      const interval = setInterval(() => {
        setIsGlowing(prev => !prev);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isSelected, isDora]);

  // コンポーネントのスタイル
  const containerStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    position: 'relative',
    cursor: onClick ? 'pointer' : 'default',
    transform: isHovered && onClick ? 'translateY(-5px)' : 'translateY(0)',
    transition: 'transform 0.2s ease',
    filter: isPressed ? 'brightness(0.9)' : 'none'
  };

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
    borderRadius: '8px',
    boxShadow: isGlowing 
      ? `0 0 ${isSelected ? '20px' : '10px'} ${isSelected ? '#FFD700' : '#FF69B4'}`
      : '0 2px 4px rgba(0, 0, 0, 0.2)'
  };

  return (
    <motion.div
      ref={containerRef}
      className="tile-canvas-container"
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={canvasStyle}
      />
      
      {isLoading && (
        <div className="tile-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {/* デバッグ情報（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="tile-debug-info">
          <div className="debug-text">
            {tile.suit}_{tile.value}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TileCanvas;
