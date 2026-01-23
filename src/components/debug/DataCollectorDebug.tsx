import React, { useState, useEffect } from 'react';
import { StorageManager } from '../../utils/StorageManager';

export const DataCollectorDebug: React.FC = () => {
  const [recordCount, setRecordCount] = useState(0);
  const [lastGame, setLastGame] = useState<any>(null);
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    const manager = new StorageManager();
    await manager.init();
    const games = await manager.getRecentGames(1);
    setRecordCount(games.length);
    if (games.length > 0) setLastGame(games[0]);
  };
  
  const clearData = () => {
    localStorage.removeItem('yugen_kitan_game_records');
    indexedDB.deleteDatabase('YugenKitanDB');
    setRecordCount(0);
    setLastGame(null);
  };
  
  return (
    <div className="debug-panel">
      <h3>📊 データ収集デバッグ</h3>
      <p>保存された対戦記録: <strong>{recordCount}</strong> 件</p>
      
      {lastGame && (
        <div className="last-game-info">
          <h4>直近の対戦:</h4>
          <p>ID: {lastGame.gameId}</p>
          <p>日時: {new Date(lastGame.startTime).toLocaleString()}</p>
          <p>モード: {lastGame.gameMode}</p>
          <p>行動数: {lastGame.actions?.length || 0}</p>
        </div>
      )}
      
      <button onClick={loadStats}>統計を更新</button>
      <button onClick={clearData} className="danger">データを消去</button>
    </div>
  );
};
