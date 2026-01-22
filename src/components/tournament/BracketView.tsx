import React from 'react';
import { useTournamentStore } from '@/store/tournamentStore';
import { TournamentMatch } from '@/types/tournament.types';

interface BracketViewProps {
  tournamentId: string;
}

export const BracketView: React.FC<BracketViewProps> = ({ tournamentId }) => {
  const { getTournamentBracket, tournaments } = useTournamentStore();
  
  const bracket = getTournamentBracket(tournamentId);
  const tournament = tournaments.find(t => t.id === tournamentId);
  
  if (!tournament) {
    return <div>トーナメントが見つかりません</div>;
  }
  
  const getParticipantName = (playerId: string) => {
    if (!playerId) return 'Bye';
    
    const participant = tournament.participants.find(p => p.playerId === playerId);
    return participant?.username || `Player${playerId.slice(-4)}`;
  };
  
  const calculateMatchPosition = (roundIndex: number, matchIndex: number, totalMatchesInRound: number) => {
    const roundHeight = 100; // 各ラウンドの高さ(%)
    const matchSpacing = 100 / (totalMatchesInRound + 1);
    
    const top = (matchIndex + 1) * matchSpacing;
    const left = roundIndex * 25; // 各ラウンドの左位置
    
    return {
      top: `${top}%`,
      left: `${left}%`
    };
  };
  
  const calculateConnectorPosition = (
    sourceMatch: TournamentMatch, 
    targetMatch: TournamentMatch,
    bracket: TournamentMatch[][]
  ) => {
    const sourceRoundIndex = sourceMatch.round - 1;
    const targetRoundIndex = targetMatch.round - 1;
    
    const sourceRoundMatches = bracket[sourceRoundIndex] || [];
    const targetRoundMatches = bracket[targetRoundIndex] || [];
    
    const sourceMatchIndex = sourceRoundMatches.findIndex(m => m.id === sourceMatch.id);
    const targetMatchIndex = targetRoundMatches.findIndex(m => m.id === targetMatch.id);
    
    if (sourceMatchIndex === -1 || targetMatchIndex === -1) return null;
    
    const sourcePosition = calculateMatchPosition(
      sourceRoundIndex,
      sourceMatchIndex,
      sourceRoundMatches.length
    );
    
    const targetPosition = calculateMatchPosition(
      targetRoundIndex,
      targetMatchIndex,
      targetRoundMatches.length
    );
    
    // 実際の実装ではSVGパスを計算する必要があります
    return {
      source: sourcePosition,
      target: targetPosition
    };
  };
  
  return (
    <div className="bracket-view">
      <div className="bracket-header">
        <h2>{tournament.name} - トーナメント表</h2>
        <div className="tournament-info">
          <span className="tournament-status">
            ステータス: {tournament.status}
          </span>
          <span className="current-round">
            現在のラウンド: {tournament.currentRound}
          </span>
          <span className="participant-count">
            参加者: {tournament.participants.length}人
          </span>
        </div>
      </div>
      
      <div className="bracket-container">
        {bracket.map((roundMatches, roundIndex) => (
          <div 
            key={`round-${roundIndex}`}
            className="bracket-round"
            style={{ left: `${roundIndex * 25}%` }}
          >
            <div className="round-header">
              <h3>
                {roundMatches.length === 1 ? '決勝' : 
                 roundMatches.length === 2 ? '準決勝' : 
                 roundMatches.length === 4 ? '準々決勝' :
                 `${roundIndex + 1}回戦`}
              </h3>
            </div>
            
            <div className="round-matches">
              {roundMatches.map((match, matchIndex) => {
                const isByeMatch = match.playerIds.length < 2;
                const isCompleted = match.status === 'completed';
                const isInProgress = match.status === 'in_progress';
                
                return (
                  <div
                    key={match.id}
                    className={`bracket-match ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''} ${isByeMatch ? 'bye-match' : ''}`}
                  >
                    <div className="match-header">
                      <span className="match-number">
                        マッチ #{match.matchNumber}
                      </span>
                      {isInProgress && (
                        <span className="live-badge">LIVE</span>
                      )}
                    </div>
                    
                    <div className="match-participants">
                      {match.playerIds.map((playerId, idx) => {
                        const isWinner = match.winnerId === playerId;
                        const score = match.scores[idx] || 0;
                        
                        return (
                          <div
                            key={`${match.id}-player-${idx}`}
                            className={`participant ${isWinner ? 'winner' : ''} ${!playerId ? 'empty' : ''}`}
                          >
                            <span className="player-name">
                              {getParticipantName(playerId)}
                            </span>
                            
                            {match.scores.length > 0 && (
                              <span className="player-score">
                                {score}
                              </span>
                            )}
                            
                            {isWinner && (
                              <span className="winner-indicator">✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="match-info">
                      {match.scheduledTime && (
                        <span className="scheduled-time">
                          {new Date(match.scheduledTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                      
                      {isInProgress && (
                        <button className="spectate-btn">
                          観戦
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bracket-legend">
        <div className="legend-item">
          <div className="legend-color completed" />
          <span>終了したマッチ</span>
        </div>
        <div className="legend-item">
          <div className="legend-color in-progress" />
          <span>進行中のマッチ</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bye" />
          <span>バイマッチ</span>
        </div>
      </div>
      
      {tournament.status === 'completed' && tournament.participants.length > 0 && (
        <div className="tournament-results">
          <h3>大会結果</h3>
          <div className="podium">
            {[1, 2, 3].map((position) => {
              // TODO: 実際の順位に基づいてプレイヤーを表示
              return (
                <div key={position} className={`podium-place place-${position}`}>
                  <div className="podium-stand">
                    <span className="place-number">{position}</span>
                  </div>
                  <div className="player-info">
                    <span className="player-name">プレイヤー{position}</span>
                    {tournament.prizePool?.[position - 1] && (
                      <span className="prize-amount">
                        {tournament.prizePool[position - 1]}ポイント
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
