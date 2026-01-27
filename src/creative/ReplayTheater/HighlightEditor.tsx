import React, { useState, useRef, useEffect } from 'react';
import { GameRecord, ReplayHighlight } from '../../types/game.types';

interface HighlightEditorProps {
  replay: GameRecord;
  currentTime: number;
  onCreateHighlight: (startTime: number, endTime: number) => ReplayHighlight | null;
}

export const HighlightEditor: React.FC<HighlightEditorProps> = ({
  replay,
  currentTime,
  onCreateHighlight
}) => {
  const [highlightStart, setHighlightStart] = useState<number | null>(null);
  const [highlightEnd, setHighlightEnd] = useState<number | null>(null);
  const [highlights, setHighlights] = useState<ReplayHighlight[]>([]);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // ハイライトの開始をマーク
  const markStart = () => {
    setHighlightStart(currentTime);
    setHighlightEnd(null);
  };

  // ハイライトの終了をマーク
  const markEnd = () => {
    if (highlightStart !== null) {
      const endTime = currentTime;
      setHighlightEnd(endTime);
      
      // プレビューの生成
      generatePreview(highlightStart, endTime);
    }
  };

  // ハイライトを作成
  const createHighlight = () => {
    if (highlightStart !== null && highlightEnd !== null) {
      const highlight = onCreateHighlight(highlightStart, highlightEnd);
      
      if (highlight) {
        // タイトルと説明を追加
        const enhancedHighlight = {
          ...highlight,
          title: editingTitle || highlight.title,
          description: editingDescription || highlight.description,
          tags: selectedTags.length > 0 ? selectedTags : highlight.tags
        };
        
        setHighlights(prev => [...prev, enhancedHighlight]);
        saveHighlight(enhancedHighlight);
        
        // リセット
        setHighlightStart(null);
        setHighlightEnd(null);
        setEditingTitle('');
        setEditingDescription('');
        setSelectedTags([]);
      }
    }
  };

  // プレビューの生成
  const generatePreview = (start: number, end: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // プレビューを描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ハイライト範囲の表示
    const startX = (start / replay.duration) * canvas.width;
    const endX = (end / replay.duration) * canvas.width;
    const width = endX - startX;
    
    ctx.fillStyle = 'rgba(101, 87, 245, 0.5)';
    ctx.fillRect(startX, 0, width, canvas.height);
    
    // 現在位置のマーカー
    const currentX = (currentTime / replay.duration) * canvas.width;
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(currentX - 2, 0, 4, canvas.height);
    
    // テキスト
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${formatTime(start)} - ${formatTime(end)}`, canvas.width/2, 20);
  };

  // ハイライトの保存
  const saveHighlight = async (highlight: ReplayHighlight) => {
    try {
      const db = await openHighlightsDatabase();
      const transaction = db.transaction(['highlights'], 'readwrite');
      const store = transaction.objectStore('highlights');
      await store.put(highlight);
      
      console.log('ハイライトを保存:', highlight);
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  // 既存のハイライトを読み込み
  useEffect(() => {
    loadHighlights();
  }, [replay.gameId]);

  const loadHighlights = async () => {
    try {
      const db = await openHighlightsDatabase();
      const transaction = db.transaction(['highlights'], 'readonly');
      const store = transaction.objectStore('highlights');
      const index = store.index('replayId');
      const request = index.getAll(replay.gameId);
      
      request.onsuccess = () => {
        setHighlights(request.result);
      };
    } catch (error) {
      console.error('読み込みエラー:', error);
    }
  };

  // プレビューの更新
  useEffect(() => {
    if (highlightStart !== null && highlightEnd !== null) {
      generatePreview(highlightStart, highlightEnd);
    }
  }, [currentTime, highlightStart, highlightEnd]);

  return (
    <div className="highlight-editor">
      <div className="editor-section">
        <h5>⏱️ ハイライト範囲の設定</h5>
        
        <div className="time-controls">
          <div className="time-input">
            <label>開始時間:</label>
            <input
              type="number"
              min="0"
              max={replay.duration}
              step="1"
              value={highlightStart !== null ? highlightStart.toFixed(1) : currentTime.toFixed(1)}
              onChange={(e) => setHighlightStart(parseFloat(e.target.value))}
            />
            <span className="time-unit">秒</span>
          </div>
          
          <div className="time-input">
            <label>終了時間:</label>
            <input
              type="number"
              min="0"
              max={replay.duration}
              step="1"
              value={highlightEnd !== null ? highlightEnd.toFixed(1) : currentTime.toFixed(1)}
              onChange={(e) => setHighlightEnd(parseFloat(e.target.value))}
            />
            <span className="time-unit">秒</span>
          </div>
        </div>
        
        <div className="mark-buttons">
          <button 
            className={`mark-button ${highlightStart !== null ? 'marked' : ''}`}
            onClick={markStart}
          >
            📍 開始をマーク
          </button>
          <button 
            className={`mark-button ${highlightEnd !== null ? 'marked' : ''}`}
            onClick={markEnd}
            disabled={highlightStart === null}
          >
            📍 終了をマーク
          </button>
        </div>
        
        <div className="duration-display">
          長さ: {highlightStart && highlightEnd 
            ? `${(highlightEnd - highlightStart).toFixed(1)}秒` 
            : '0秒'}
        </div>
      </div>

      <div className="editor-section">
        <h5>📝 ハイライト情報</h5>
        
        <div className="highlight-info">
          <div className="info-input">
            <label>タイトル:</label>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              placeholder="ハイライトのタイトル"
            />
          </div>
          
          <div className="info-input">
            <label>説明:</label>
            <textarea
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              placeholder="ハイライトの説明"
              rows={3}
            />
          </div>
          
          <div className="info-input">
            <label>タグ:</label>
            <div className="tag-selector">
              {['和了', '立直', '逆転', '危険', '驚き', '学習'].map(tag => (
                <button
                  key={tag}
                  className={`tag-button ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(prev => prev.filter(t => t !== tag));
                    } else {
                      setSelectedTags(prev => [...prev, tag]);
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="editor-section">
        <h5>👁️ プレビュー</h5>
        
        <div className="preview-container">
          <canvas
            ref={previewCanvasRef}
            width={300}
            height={100}
            className="highlight-preview-canvas"
          />
          
          <div className="preview-timeline">
            <div className="timeline-start">0:00</div>
            <div className="timeline-end">{formatTime(replay.duration)}</div>
          </div>
        </div>
        
        <button
          className="create-button"
          onClick={createHighlight}
          disabled={highlightStart === null || highlightEnd === null}
        >
          🎬 ハイライトを作成
        </button>
      </div>

      <div className="editor-section">
        <h5>📚 保存済みハイライト</h5>
        
        <div className="highlights-list">
          {highlights.length > 0 ? (
            highlights.map((highlight, index) => (
              <div key={index} className="highlight-item">
                <div className="highlight-header">
                  <div className="highlight-title">{highlight.title}</div>
                  <div className="highlight-duration">
                    {formatTime(highlight.startTime)} - {formatTime(highlight.endTime)}
                  </div>
                </div>
                <div className="highlight-description">
                  {highlight.description}
                </div>
                <div className="highlight-tags">
                  {highlight.tags?.map((tag, idx) => (
                    <span key={idx} className="highlight-tag">{tag}</span>
                  ))}
                </div>
                <div className="highlight-actions">
                  <button className="action-button">▶️ 再生</button>
                  <button className="action-button">📤 共有</button>
                  <button className="action-button">🗑️ 削除</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-highlights">
              まだハイライトがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ユーティリティ関数
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const openHighlightsDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HighlightsDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('highlights')) {
        const store = db.createObjectStore('highlights', { keyPath: 'id' });
        store.createIndex('replayId', 'replayId');
        store.createIndex('createdAt', 'createdAt');
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
