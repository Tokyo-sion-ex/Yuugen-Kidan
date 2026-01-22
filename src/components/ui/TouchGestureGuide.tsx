import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TouchGestureGuide.css';

interface GestureDemo {
  id: string;
  title: string;
  description: string;
  gesture: 'tap' | 'doubleTap' | 'swipe' | 'longPress' | 'pinch';
  icon: string;
  exampleAction: string;
}

const TouchGestureGuide: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null);

  const gestures: GestureDemo[] = [
    {
      id: 'tap',
      title: 'シングルタップ',
      description: '牌を選択する基本操作',
      gesture: 'tap',
      icon: '👆',
      exampleAction: '牌を選択'
    },
    {
      id: 'double-tap',
      title: 'ダブルタップ',
      description: '素早く2回タップ',
      gesture: 'doubleTap',
      icon: '👆👆',
      exampleAction: '選択した牌をすぐに打牌'
    },
    {
      id: 'long-press',
      title: '長押し',
      description: '指を長く押し続ける',
      gesture: 'longPress',
      icon: '⏱️',
      exampleAction: '牌の詳細情報表示'
    },
    {
      id: 'swipe-left-right',
      title: '左右スワイプ',
      description: '指を左右にスライド',
      gesture: 'swipe',
      icon: '↔️',
      exampleAction: '捨て牌を閲覧'
    },
    {
      id: 'swipe-up-down',
      title: '上下スワイプ',
      description: '指を上下にスライド',
      gesture: 'swipe',
      icon: '↕️',
      exampleAction: 'メニュー表示/非表示'
    },
    {
      id: 'pinch',
      title: 'ピンチズーム',
      description: '2本指で拡大・縮小',
      gesture: 'pinch',
      icon: '🤏',
      exampleAction: '牌の拡大表示'
    }
  ];

  const startDemo = () => {
    setIsDemoActive(true);
    setDetectedGesture(null);
  };

  const handleGestureDetect = (gestureId: string) => {
    setDetectedGesture(gestureId);
    setTimeout(() => {
      if (currentDemo < gestures.length - 1) {
        setCurrentDemo(prev => prev + 1);
        setDetectedGesture(null);
      } else {
        setIsDemoActive(false);
        setCurrentDemo(0);
      }
    }, 1500);
  };

  return (
    <div className="touch-gesture-guide">
      <div className="guide-header">
        <h2 className="guide-title">タッチ操作ガイド</h2>
        <p className="guide-subtitle">スマートフォンでの操作方法を学びましょう</p>
      </div>

      {!isDemoActive ? (
        <div className="gesture-list">
          {gestures.map((gesture, index) => (
            <motion.div
              key={gesture.id}
              className="gesture-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                setCurrentDemo(index);
                startDemo();
              }}
            >
              <div className="gesture-icon">{gesture.icon}</div>
              <div className="gesture-info">
                <h3 className="gesture-name">{gesture.title}</h3>
                <p className="gesture-description">{gesture.description}</p>
                <div className="gesture-example">
                  <span className="example-label">例:</span>
                  <span className="example-action">{gesture.exampleAction}</span>
                </div>
              </div>
              <div className="gesture-arrow">→</div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="gesture-demo">
          <div className="demo-current">
            <div className="demo-icon">{gestures[currentDemo].icon}</div>
            <h3 className="demo-title">{gestures[currentDemo].title}</h3>
            <p className="demo-description">{gestures[currentDemo].description}</p>
            
            <div className="demo-area">
              <div className="touch-surface">
                <div className="surface-grid">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="grid-cell"></div>
                  ))}
                </div>
                
                <div className="gesture-instruction">
                  {gestures[currentDemo].gesture === 'tap' && (
                    <>
                      <div className="tap-dot"></div>
                      <p className="instruction-text">ここをタップ！</p>
                    </>
                  )}
                  
                  {gestures[currentDemo].gesture === 'doubleTap' && (
                    <>
                      <div className="double-tap-dots">
                        <div className="tap-dot"></div>
                        <div className="tap-dot"></div>
                      </div>
                      <p className="instruction-text">素早く2回タップ！</p>
                    </>
                  )}
                  
                  {gestures[currentDemo].gesture === 'longPress' && (
                    <>
                      <div className="long-press-circle">
                        <div className="press-fill"></div>
                      </div>
                      <p className="instruction-text">長く押し続けて！</p>
                    </>
                  )}
                  
                  {gestures[currentDemo].gesture === 'swipe' && (
                    <>
                      <div className="swipe-arrow">
                        <div className="arrow-line"></div>
                        <div className="arrow-head"></div>
                      </div>
                      <p className="instruction-text">矢印の方向にスワイプ！</p>
                    </>
                  )}
                  
                  {gestures[currentDemo].gesture === 'pinch' && (
                    <>
                      <div className="pinch-dots">
                        <div className="pinch-dot left"></div>
                        <div className="pinch-dot right"></div>
                      </div>
                      <p className="instruction-text">2本指でピンチ！</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {detectedGesture && (
              <motion.div
                className="detected-feedback"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
              >
                <div className="feedback-icon">🎉</div>
                <div className="feedback-text">成功！</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="demo-progress">
            <div className="progress-steps">
              {gestures.map((_, index) => (
                <div
                  key={index}
                  className={`step-dot ${index === currentDemo ? 'active' : ''}`}
                />
              ))}
            </div>
            <div className="demo-actions">
              <button
                className="demo-skip"
                onClick={() => setIsDemoActive(false)}
              >
                スキップ
              </button>
              <button
                className="demo-next"
                onClick={() => {
                  if (currentDemo < gestures.length - 1) {
                    setCurrentDemo(prev => prev + 1);
                  } else {
                    setIsDemoActive(false);
                  }
                }}
              >
                {currentDemo < gestures.length - 1 ? '次へ' : '完了'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="guide-footer">
        <div className="quick-tips">
          <h4>クイックヒント</h4>
          <ul className="tips-list">
            <li>📱 横向きでより大きな画面でプレイできます</li>
            <li>👆 牌をスワイプして素早く打牌できます</li>
            <li>⚡ ダブルタップでよく使う操作を素早く実行</li>
            <li>🔧 設定でタッチ感度を調整できます</li>
          </ul>
        </div>
        
        <button className="close-guide">
          ガイドを閉じる
        </button>
      </div>
    </div>
  );
};

export default TouchGestureGuide;
