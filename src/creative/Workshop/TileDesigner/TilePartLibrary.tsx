import React, { useState, useEffect } from 'react';
import { TilePart, TilePartCategory } from '../../../types/creative.types';

interface TilePartLibraryProps {
  onSelectPart: (part: TilePart) => void;
  currentParts: TilePart[];
}

export const TilePartLibrary: React.FC<TilePartLibraryProps> = ({
  onSelectPart,
  currentParts
}) => {
  const [categories, setCategories] = useState<TilePartCategory[]>([
    {
      id: 'seasonal',
      name: '季節',
      icon: '🌸',
      parts: [
        {
          id: 'sakura',
          name: '桜の花びら',
          category: 'seasonal',
          type: 'decoration',
          svg: '<path d="M..."/>',
          color: '#ffb7c5',
          size: { width: 20, height: 20 },
          position: { x: 10, y: 10 },
          rotation: 0,
          opacity: 0.8
        },
        // 他の季節パーツ...
      ]
    },
    {
      id: 'traditional',
      name: '伝統文様',
      icon: '🎴',
      parts: [
        {
          id: 'seigaiha',
          name: '青海波',
          category: 'traditional',
          type: 'pattern',
          svg: '<path d="M..."/>',
          color: '#4a90e2',
          size: { width: 100, height: 100 },
          position: { x: 0, y: 0 },
          rotation: 0,
          opacity: 0.3
        }
      ]
    },
    {
      id: 'elements',
      name: '自然元素',
      icon: '🌿',
      parts: []
    },
    {
      id: 'fantasy',
      name: '幻想',
      icon: '✨',
      parts: []
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('seasonal');
  const [searchQuery, setSearchQuery] = useState('');
  const [userParts, setUserParts] = useState<TilePart[]>([]);

  // フィルタリングされたパーツ
  const filteredParts = categories
    .find(cat => cat.id === selectedCategory)
    ?.parts.filter(part => 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.category.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // ユーザー作成パーツを読み込み
  useEffect(() => {
    loadUserParts();
  }, []);

  const loadUserParts = async () => {
    try {
      // IndexedDBからユーザーパーツを読み込み
      const savedParts = await getUserPartsFromStorage();
      setUserParts(savedParts);
    } catch (error) {
      console.error('パーツ読み込みエラー:', error);
    }
  };

  const handlePartSelect = (part: TilePart) => {
    // 新しいIDを割り当ててコピーを作成
    const newPart = {
      ...part,
      id: `${part.id}_${Date.now()}`,
      position: {
        x: Math.random() * 150,
        y: Math.random() * 250
      }
    };
    onSelectPart(newPart);
  };

  const uploadCustomPart = async (file: File) => {
    try {
      // SVGファイルを読み込み
      const svgText = await file.text();
      
      const newPart: TilePart = {
        id: `custom_${Date.now()}`,
        name: file.name.replace('.svg', ''),
        category: 'custom',
        type: 'decoration',
        svg: svgText,
        color: '#ffffff',
        size: { width: 50, height: 50 },
        position: { x: 0, y: 0 },
        rotation: 0,
        opacity: 1,
        isCustom: true,
        fileSize: file.size
      };

      // 保存
      await saveUserPart(newPart);
      setUserParts(prev => [...prev, newPart]);
      
      alert('カスタムパーツを追加しました！');
      
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('パーツのアップロードに失敗しました');
    }
  };

  return (
    <div className="part-library">
      <div className="library-header">
        <h3>📦 パーツライブラリ</h3>
        <div className="search-box">
          <input
            type="text"
            placeholder="パーツを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-button">🔍</button>
        </div>
      </div>

      <div className="category-tabs">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="tab-icon">{category.icon}</span>
            <span className="tab-name">{category.name}</span>
          </button>
        ))}
        
        <button
          className={`category-tab ${selectedCategory === 'custom' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('custom')}
        >
          <span className="tab-icon">🖋️</span>
          <span className="tab-name">マイパーツ</span>
        </button>
      </div>

      <div className="parts-grid">
        {selectedCategory === 'custom' ? (
          // カスタムパーツセクション
          <div className="custom-parts-section">
            <div className="upload-area">
              <label className="upload-label">
                <input
                  type="file"
                  accept=".svg,.png,.jpg"
                  onChange={(e) => e.target.files?.[0] && uploadCustomPart(e.target.files[0])}
                  hidden
                />
                <div className="upload-box">
                  <div className="upload-icon">📤</div>
                  <div className="upload-text">SVG/PNGをアップロード</div>
                  <small className="upload-hint">最大サイズ: 1MB</small>
                </div>
              </label>
            </div>

            {userParts.length > 0 ? (
              <div className="user-parts-grid">
                {userParts.map(part => (
                  <div
                    key={part.id}
                    className="part-item user-part"
                    onClick={() => handlePartSelect(part)}
                  >
                    <div 
                      className="part-preview"
                      dangerouslySetInnerHTML={{ __html: part.svg }}
                    />
                    <div className="part-info">
                      <div className="part-name">{part.name}</div>
                      {part.isCustom && (
                        <div className="part-badge">マイ</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <p>まだカスタムパーツがありません</p>
                <p className="empty-hint">SVGファイルをアップロードして始めましょう</p>
              </div>
            )}
          </div>
        ) : (
          // 通常のパーツグリッド
          <>
            {filteredParts.length > 0 ? (
              filteredParts.map(part => (
                <div
                  key={part.id}
                  className="part-item"
                  onClick={() => handlePartSelect(part)}
                  title={part.name}
                >
                  <div 
                    className="part-preview"
                    dangerouslySetInnerHTML={{ __html: part.svg }}
                  />
                  <div className="part-name">{part.name}</div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <p>該当するパーツが見つかりません</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="library-footer">
        <div className="part-count">
          {filteredParts.length} パーツ
        </div>
        <div className="current-selection">
          選択中: {currentParts.length} パーツ
        </div>
      </div>
    </div>
  );
};

// IndexedDB操作のユーティリティ
const openDesignDatabase = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TileDesignerDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('userParts')) {
        const store = db.createObjectStore('userParts', { keyPath: 'id' });
        store.createIndex('category', 'category');
        store.createIndex('createdAt', 'createdAt');
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveUserPart = async (part: TilePart): Promise<void> => {
  const db = await openDesignDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['userParts'], 'readwrite');
    const store = transaction.objectStore('userParts');
    const request = store.put({ ...part, createdAt: Date.now() });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getUserPartsFromStorage = async (): Promise<TilePart[]> => {
  const db = await openDesignDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['userParts'], 'readonly');
    const store = transaction.objectStore('userParts');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
