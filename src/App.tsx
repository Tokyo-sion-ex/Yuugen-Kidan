import React, { useState, useEffect } from 'react';
import MainMenu from './components/menu/MainMenu';
import ModeSelector from './components/menu/ModeSelector';
import MahjongTable from './components/game/MahjongTable';
import LoadingScreen from './components/ui/LoadingScreen';
import SeasonalEffects from './components/effects/SeasonalEffects';
import { useMahjongSounds } from './hooks/useMahjongSounds';
import { GameMode } from './types/game.types';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'mode-select' | 'game' | 'loading'>('loading');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // サウンド初期化
  const { playBGM, stopBGM, changeVolume } = useMahjongSounds();

  // 初期化処理
  useEffect(() => {
    const initializeApp = async () => {
      // アセットのプリロード（擬似的な遅延）
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // サウンド初期化
      changeVolume(0.5);
      playBGM('menu');
      
      setIsInitialized(true);
      setCurrentScreen('menu');
    };

    initializeApp();

    // クリーンアップ
    return () => {
      stopBGM();
    };
  }, []);

  // 画面遷移ハンドラー
  const handleModeSelect = () => {
    playSound('click');
    setCurrentScreen('mode-select');
  };

  const handleBackToMenu = () => {
    playSound('click');
    setCurrentScreen('menu');
    playBGM('menu');
  };

  const handleStartGame = (mode: GameMode) => {
    playSound('start');
    setSelectedMode(mode);
    setCurrentScreen('game');
    playBGM('game');
  };

  const handleExitGame = () => {
    playSound('click');
    setCurrentScreen('menu');
    setSelectedMode(null);
    playBGM('menu');
  };

  const playSound = (sound: string) => {
    // シンプルなクリック音（後で実装）
    console.log(`Play sound: ${sound}`);
  };

  if (!isInitialized || currentScreen === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <div className="yugen-app">
      {/* 季節エフェクトの背景 */}
      <SeasonalEffects />
      
      {/* メインコンテンツ */}
      <div className="app-content">
        {currentScreen === 'menu' && (
          <MainMenu 
            onModeSelect={handleModeSelect}
            onSettings={() => console.log('Open settings')}
            onQuit={() => window.close()}
          />
        )}
        
        {currentScreen === 'mode-select' && (
          <ModeSelector 
            onSelectMode={handleStartGame}
            onBack={handleBackToMenu}
          />
        )}
        
        {currentScreen === 'game' && selectedMode && (
          <MahjongTable 
            gameMode={selectedMode}
            onExit={handleExitGame}
          />
        )}
      </div>
    </div>
  );
}

export default App;
