import React, { useState } from 'react';
import { MainMenu } from '@/components/menu/MainMenu';
import { AvatarCustomizer } from '@/components/avatar/AvatarCustomizer';
import { LeagueLadder } from '@/components/league/LeagueLadder';
import { Leaderboard } from '@/components/league/Leaderboard';
import { TournamentLobby } from '@/components/tournament/TournamentLobby';
import { BracketView } from '@/components/tournament/BracketView';
import { SpectateLobby } from '@/components/spectate/SpectateLobby';
import { SpectatorView } from '@/components/spectate/SpectatorView';
import { MatchmakingLobby } from '@/components/matchmaking/MatchmakingLobby';

type AppView = 
  | 'main-menu'
  | 'avatar-customizer'
  | 'league-ladder'
  | 'leaderboard'
  | 'tournament-lobby'
  | 'bracket-view'
  | 'spectate-lobby'
  | 'spectator-view'
  | 'matchmaking-lobby';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('main-menu');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
  const navigateTo = (view: AppView) => {
    setCurrentView(view);
  };
  
  const renderCurrentView = () => {
    switch (currentView) {
      case 'main-menu':
        return (
          <MainMenu
            onAvatarCustomize={() => navigateTo('avatar-customizer')}
            onLeagueView={() => navigateTo('league-ladder')}
            onTournamentView={() => navigateTo('tournament-lobby')}
            onSpectateView={() => navigateTo('spectate-lobby')}
            onMatchmakingView={() => navigateTo('matchmaking-lobby')}
          />
        );
      
      case 'avatar-customizer':
        return <AvatarCustomizer onBack={() => navigateTo('main-menu')} />;
      
      case 'league-ladder':
        return (
          <>
            <LeagueLadder />
            <Leaderboard />
            <button onClick={() => navigateTo('main-menu')}>戻る</button>
          </>
        );
      
      case 'tournament-lobby':
        return selectedTournamentId ? (
          <BracketView 
            tournamentId={selectedTournamentId} 
            onBack={() => setSelectedTournamentId(null)}
          />
        ) : (
          <TournamentLobby 
            onSelectTournament={(id) => {
              setSelectedTournamentId(id);
              navigateTo('bracket-view');
            }}
            onBack={() => navigateTo('main-menu')}
          />
        );
      
      case 'spectate-lobby':
        return selectedGameId ? (
          <SpectatorView 
            gameId={selectedGameId}
            onExit={() => setSelectedGameId(null)}
          />
        ) : (
          <SpectateLobby 
            onSelectGame={(id) => {
              setSelectedGameId(id);
              navigateTo('spectator-view');
            }}
            onBack={() => navigateTo('main-menu')}
          />
        );
      
      case 'matchmaking-lobby':
        return <MatchmakingLobby onBack={() => navigateTo('main-menu')} />;
      
      default:
        return <MainMenu />;
    }
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>幽玄奇談</h1>
        {currentView !== 'main-menu' && (
          <button 
            onClick={() => navigateTo('main-menu')}
            className="back-button"
          >
            ← メインメニューに戻る
          </button>
        )}
      </header>
      
      <main className="app-main">
        {renderCurrentView()}
      </main>
      
      <footer className="app-footer">
        <p>© 2025 幽玄奇談 - 幽玄・幻想・和風モダン麻雀</p>
      </footer>
    </div>
  );
}

export default App;
