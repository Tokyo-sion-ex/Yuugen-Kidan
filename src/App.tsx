import React, { useState } from 'react';
import './App.css';
import { MahjongTable } from './components/game/MahjongTable';
import { CreativeWorkshop } from './components/creative/CreativeWorkshop';
import { ReplayTheater } from './components/creative/ReplayTheater/ReplayTheater';
import { AcademyDojo } from './components/academy/Dojo/AcademyDojo';

function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'creative' | 'replay' | 'academy'>('game');
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>🀄 幽玄奇談 - 拡張版</h1>
        <p>幻想和風麻雀ゲーム</p>
      </header>
      
      <nav className="app-nav">
        <button 
          className={`nav-button ${activeTab === 'game' ? 'active' : ''}`}
          onClick={() => setActiveTab('game')}
        >
          🎮 対戦
        </button>
        <button 
          className={`nav-button ${activeTab === 'creative' ? 'active' : ''}`}
          onClick={() => setActiveTab('creative')}
        >
          🎨 工房
        </button>
        <button 
          className={`nav-button ${activeTab === 'replay' ? 'active' : ''}`}
          onClick={() => setActiveTab('replay')}
        >
          🎬 リプレイ
        </button>
        <button 
          className={`nav-button ${activeTab === 'academy' ? 'active' : ''}`}
          onClick={() => setActiveTab('academy')}
        >
          🏫 道場
        </button>
      </nav>
      
      <main className="app-main">
        {activeTab === 'game' && <MahjongTable />}
        {activeTab === 'creative' && <CreativeWorkshop />}
        {activeTab === 'replay' && <ReplayTheater />}
        {activeTab === 'academy' && <AcademyDojo />}
      </main>
      
      <footer className="app-footer">
        <p>提供: 幽玄奇談開発グループ | 抹茶缶 | 抹茶缶Code</p>
      </footer>
    </div>
  );
}

export default App;
