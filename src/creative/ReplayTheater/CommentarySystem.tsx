import React, { useState, useEffect } from 'react';
import { TurnAction, GameInsight } from '../../types/game.types';

interface CommentarySystemProps {
  action: TurnAction | null;
  insights: GameInsight[];
  currentTime: number;
}

export const CommentarySystem: React.FC<CommentarySystemProps> = ({
  action,
  insights,
  currentTime
}) => {
  const [currentCommentary, setCurrentCommentary] = useState<string>('');
  const [commentaryHistory, setCommentaryHistory] = useState<string[]>([]);
  const [commentator, setCommentator] = useState<'ai' | 'pro'>('ai');
  const [showHistory, setShowHistory] = useState(false);

  // 行動に基づいてコメントaryを更新
  useEffect(() => {
    if (!action) return;

    const commentary = generateCommentary(action, insights, currentTime);
    setCurrentCommentary(commentary);
    
    // 履歴に追加
    setCommentaryHistory(prev => [commentary, ...prev.slice(0, 9)]);
  }, [action, insights, currentTime]);

  // コメントaryの生成
  const generateCommentary = (
    action: TurnAction, 
    insights: GameInsight[], 
    time: number
  ): string => {
    const playerName = `プレイヤー ${action.playerId + 1}`;
    const turn = Math.floor(time / 30) + 1;
    
    // 行動タイプに基づく基本コメント
    let baseComment = '';
    
    switch (action.action) {
      case 'draw':
        baseComment = `${playerName}が牌を引きました。`;
        break;
      case 'discard':
        baseComment = `${playerName}が${action.tile}を切りました。`;
        
        // 危険牌のチェック
        if (action.handEfficiency?.[0]?.dangerLevel && action.handEfficiency[0].dangerLevel > 60) {
          baseComment += ' これはかなり危険な牌かもしれません。';
        }
        break;
      case 'riichi':
        baseComment = `${playerName}が立直を宣言しました！ 緊張の一局です。`;
        break;
      case 'win':
        baseComment = `${playerName}が和了りました！ 🎉`;
        break;
      case 'chii':
        baseComment = `${playerName}がチーしました。手がまとまってきました。`;
        break;
      case 'pon':
        baseComment = `${playerName}がポンしました。強力な面子ができました。`;
        break;
      case 'kan':
        baseComment = `${playerName}がカンを宣言！ ドラが増えます。`;
        break;
      default:
        baseComment = `${playerName}の行動です。`;
    }
    
    // インサイトに基づく追加コメント
    const relevantInsights = insights.filter(
      insight => insight.keyTurn <= turn && insight.keyTurn >= turn - 2
    );
    
    if (relevantInsights.length > 0) {
      const insight = relevantInsights[0];
      if (insight.missedOpportunities) {
        baseComment += ` 実は${insight.missedOpportunities.length}つのチャンスがありました。`;
      }
      
      if (insight.significance === 'high') {
        baseComment += ' これは重要な局面です。';
      }
    }
    
    // コメンテーターのスタイルを適用
    if (commentator === 'pro') {
      baseComment = addProCommentaryFlavor(baseComment);
    } else {
      baseComment = addAICommentaryFlavor(baseComment);
    }
    
    return baseComment;
  };

  // プロコメンテーター風味
  const addProCommentaryFlavor = (comment: string): string => {
    const flavors = [
      'さあ、',
      'おっと、',
      'これは、',
      'なんと、',
      'すごい！',
      '素晴らしい！'
    ];
    
    const flavor = flavors[Math.floor(Math.random() * flavors.length)];
    return flavor + ' ' + comment;
  };

  // AIコメンテーター風味
  const addAICommentaryFlavor = (comment: string): string => {
    const analytics = [
      '分析によると、',
      '統計的に、',
      'データから見ると、',
      'AIの予測では、'
    ];
    
    const analytic = analytics[Math.floor(Math.random() * analytics.length)];
    return analytic + ' ' + comment;
  };

  // コメントaryを音声で読み上げ
  const speakCommentary = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // コメントaryを翻訳（英語）
  const translateToEnglish = async (text: string): Promise<string> => {
    try {
      // 実際の実装では翻訳APIを使用
      return text; // 簡易実装
    } catch (error) {
      console.error('翻訳エラー:', error);
      return text;
    }
  };

  return (
    <div className="commentary-system">
      <div className="commentary-header">
        <h4>💬 リアルタイム解説</h4>
        <div className="commentary-controls">
          <button
            className={`commentator-button ${commentator === 'ai' ? 'active' : ''}`}
            onClick={() => setCommentator('ai')}
          >
            🤖 AI解説
          </button>
          <button
            className={`commentator-button ${commentator === 'pro' ? 'active' : ''}`}
            onClick={() => setCommentator('pro')}
          >
            🎤 プロ解説
          </button>
          <button
            className="speak-button"
            onClick={() => speakCommentary(currentCommentary)}
            title="音声で読み上げ"
          >
            🔊
          </button>
          <button
            className="history-button"
            onClick={() => setShowHistory(!showHistory)}
            title="解説履歴"
          >
            📜
          </button>
        </div>
      </div>

      <div className="current-commentary">
        <div className="commentary-text">
          {currentCommentary || '対戦を再生してください...'}
        </div>
        
        <div className="commentary-actions">
          <button
            className="action-button"
            onClick={async () => {
              const english = await translateToEnglish(currentCommentary);
              alert(`英語訳: ${english}`);
            }}
          >
            🌐 英語に翻訳
          </button>
          
          <button
            className="action-button"
            onClick={() => {
              navigator.clipboard.writeText(currentCommentary);
              alert('解説をコピーしました！');
            }}
          >
            📋 コピー
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="commentary-history">
          <h5>解説履歴</h5>
          <div className="history-list">
            {commentaryHistory.map((comment, index) => (
              <div key={index} className="history-item">
                <div className="history-time">
                  {formatTimeForHistory(index)}
                </div>
                <div className="history-comment">
                  {comment}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="commentary-stats">
        <div className="stat-item">
          <span className="stat-label">解説数:</span>
          <span className="stat-value">{commentaryHistory.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">モード:</span>
          <span className="stat-value">
            {commentator === 'ai' ? 'AI解説' : 'プロ解説'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">インサイト:</span>
          <span className="stat-value">{insights.length}件</span>
        </div>
      </div>
    </div>
  );
};

const formatTimeForHistory = (index: number): string => {
  const minutes = Math.floor(index * 30 / 60);
  const seconds = index * 30 % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
