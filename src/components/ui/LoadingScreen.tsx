import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState(0);
  
  const loadingMessages = [
    '牌を洗っています...',
    '席を決めています...',
    '東場の準備中...',
    '幽玄の世界へようこそ',
    '伝説の役を探して...',
    '運命の一局を紡ぎます',
  ];

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setLoadingText(loadingMessages[currentIndex]);
      currentIndex = (currentIndex + 1) % loadingMessages.length;
    }, 2000);

    // プログレスバーのシミュレーション
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-background">
        {/* 背景の装飾的な要素 */}
        <div className="loading-decoration">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="floating-tile"
              initial={{ 
                opacity: 0,
                y: -100,
                x: Math.random() * 100 - 50,
                rotate: Math.random() * 360 
              }}
              animate={{ 
                opacity: [0, 1, 0],
                y: window.innerHeight + 100,
                rotate: Math.random() * 720 + 360 
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                fontSize: `${20 + Math.random() * 30}px`,
              }}
            >
              {['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏'][Math.floor(Math.random() * 9)]}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="loading-content">
        {/* メインタイトル */}
        <motion.div
          className="loading-title"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: 'spring' }}
        >
          <h1>幽玄奇談</h1>
          <p className="loading-subtitle">Yūgen Kitan</p>
        </motion.div>

        {/* プログレスバー */}
        <div className="loading-progress-container">
          <div className="loading-progress-text">
            {loadingText}
          </div>
          
          <div className="loading-progress-bar">
            <motion.div
              className="loading-progress-fill"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <div className="loading-percentage">
            {Math.round(progress)}%
          </div>
        </div>

        {/* ヒントメッセージ */}
        <motion.div
          className="loading-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <p>ヒント: 季節によって牌卓の風景が変化します</p>
        </motion.div>

        {/* ローディングアニメーション */}
        <div className="loading-animation">
          <motion.div
            className="loading-dots"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="loading-dot"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                style={{
                  transform: `rotate(${i * 90}deg) translateY(20px)`,
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
