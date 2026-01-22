import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SeasonalEffects.css';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
}

const SeasonalEffects: React.FC = () => {
  const [season, setSeason] = useState<Season>('spring');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentMonth, setCurrentMonth] = useState<number>(0);

  // 季節の判定
  useEffect(() => {
    const month = new Date().getMonth();
    setCurrentMonth(month);
    
    if (month >= 2 && month <= 4) setSeason('spring');
    else if (month >= 5 && month <= 7) setSeason('summer');
    else if (month >= 8 && month <= 10) setSeason('autumn');
    else setSeason('winter');
  }, []);

  // パーティクルの生成
  useEffect(() => {
    const particleCount = season === 'winter' ? 150 : season === 'autumn' ? 100 : 80;
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: season === 'spring' ? 8 + Math.random() * 12 : 4 + Math.random() * 8,
        speed: 0.5 + Math.random() * 1.5,
        rotation: Math.random() * 360,
      });
    }
    
    setParticles(newParticles);
  }, [season]);

  // パーティクルのアニメーション
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          y: (p.y + p.speed) % 100,
          x: (p.x + (season === 'spring' ? Math.sin(Date.now() / 1000 + p.id) * 0.5 : 0)) % 100,
          rotation: p.rotation + (season === 'autumn' ? 2 : 1),
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, [season]);

  const getSeasonConfig = () => {
    const configs = {
      spring: {
        color: '#f472b6', // 桜色
        particleChar: '🌸',
        bgGradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.1) 0%, rgba(76, 29, 149, 0.05) 100%)',
        name: '春',
        description: '桜舞う季節',
      },
      summer: {
        color: '#68d391', // 若竹色
        particleChar: '✨',
        bgGradient: 'linear-gradient(135deg, rgba(104, 211, 145, 0.1) 0%, rgba(26, 54, 93, 0.1) 100%)',
        name: '夏',
        description: '蛍光る夜',
      },
      autumn: {
        color: '#ed8936', // 紅葉色
        particleChar: '🍂',
        bgGradient: 'linear-gradient(135deg, rgba(237, 137, 54, 0.1) 0%, rgba(76, 29, 149, 0.1) 100%)',
        name: '秋',
        description: '紅葉散りゆく',
      },
      winter: {
        color: '#e6fffa', // 雪色
        particleChar: '❄️',
        bgGradient: 'linear-gradient(135deg, rgba(230, 255, 250, 0.1) 0%, rgba(26, 54, 93, 0.2) 100%)',
        name: '冬',
        description: '雪降る庭',
      },
    };
    
    return configs[season];
  };

  const seasonConfig = getSeasonConfig();

  return (
    <div className="seasonal-effects">
      {/* 背景グラデーション */}
      <div 
        className="season-background"
        style={{ background: seasonConfig.bgGradient }}
      />
      
      {/* パーティクル */}
      <div className="particles-container">
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="particle"
              initial={{ 
                opacity: 0,
                scale: 0,
                x: `${particle.x}vw`,
                y: `${particle.y}vh`,
              }}
              animate={{ 
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0],
                x: `${particle.x}vw`,
                y: `${particle.y}vh`,
                rotate: particle.rotation,
              }}
              transition={{
                duration: season === 'winter' ? 10 : 15,
                repeat: Infinity,
                delay: particle.id * 0.01,
              }}
              style={{
                fontSize: `${particle.size}px`,
                color: seasonConfig.color,
              }}
            >
              {seasonConfig.particleChar}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* 季節表示（開発中のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="season-indicator">
          <div className="season-badge">
            <span className="season-name">{seasonConfig.name}</span>
            <span className="season-description">{seasonConfig.description}</span>
            <div className="season-month">{currentMonth + 1}月</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonalEffects;
