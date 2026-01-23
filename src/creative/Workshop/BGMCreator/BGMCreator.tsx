import React, { useState, useRef, useEffect } from 'react';
import { 
  MusicTrack, 
  MusicLayer, 
  MusicPreset,
  InstrumentType,
  MusicMood 
} from '../../../types/creative.types';
import { TrackEditor } from './TrackEditor';
import { LayerMixer } from './LayerMixer';
import { InstrumentSelector } from './InstrumentSelector';
import { PatternLibrary } from './PatternLibrary';
import { MusicExporter } from './MusicExporter';
import { MoodAnalyzer } from '../../MusicAI/MoodAnalyzer';
import { useWebAudio } from '../../../hooks/useWebAudio';
import './BGMCreator.css';

export const BGMCreator: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>({
    id: '',
    name: '新しい楽曲',
    bpm: 80,
    timeSignature: '4/4',
    key: 'D minor',
    mood: 'calm' as MusicMood,
    layers: [],
    volume: 0.7,
    effects: [],
    duration: 60,
    createdAt: Date.now()
  });

  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<MusicPreset | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const { initAudio, playNote, stopAllNotes, createInstrument } = useWebAudio();
  
  const playheadRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // Web Audio APIの初期化
  useEffect(() => {
    const init = async () => {
      audioContextRef.current = await initAudio();
    };
    init();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // 再生/停止の制御
  const handlePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    if (!audioContextRef.current) return;

    setIsPlaying(true);
    const startTime = audioContextRef.current.currentTime;
    
    // 各レイヤーのノートをスケジュール
    currentTrack.layers.forEach(layer => {
      scheduleLayerNotes(layer, startTime);
    });

    // 再生ヘッドのアニメーション
    const animate = () => {
      if (!isPlaying) return;
      
      const elapsed = audioContextRef.current!.currentTime - startTime;
      setCurrentTime(elapsed % currentTrack.duration);
      
      if (elapsed < currentTrack.duration) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    stopAllNotes();
    cancelAnimationFrame(animationFrameRef.current);
  };

  // レイヤーのノートをスケジュール
  const scheduleLayerNotes = (layer: MusicLayer, startTime: number) => {
    if (!audioContextRef.current || !layer.pattern) return;

    layer.pattern.notes.forEach(note => {
      const noteTime = startTime + (note.time * 60 / currentTrack.bpm);
      const duration = (note.duration * 60 / currentTrack.bpm);
      
      setTimeout(() => {
        playNote({
          instrument: layer.instrument,
          note: note.pitch,
          duration,
          volume: layer.volume * currentTrack.volume,
          effects: layer.effects
        });
      }, noteTime * 1000);
    });
  };

  // レイヤーの追加
  const addLayer = (instrument: InstrumentType) => {
    const newLayer: MusicLayer = {
      id: `layer_${Date.now()}`,
      instrument,
      volume: 0.5,
      pan: 0,
      pattern: {
        id: 'default',
        name: '基本パターン',
        notes: generateDefaultPattern(instrument),
        length: 16
      },
      effects: [],
      muted: false,
      solo: false
    };

    setCurrentTrack(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }));
    setActiveLayer(prev => prev + 1);
  };

  // デフォルトパターンの生成
  const generateDefaultPattern = (instrument: InstrumentType) => {
    const baseNotes = instrument === 'koto' 
      ? ['D4', 'F4', 'A4', 'D5']
      : instrument === 'shakuhachi'
      ? ['F4', 'A4', 'C5', 'F5']
      : ['A3', 'C4', 'E4', 'A4'];

    return Array.from({ length: 16 }, (_, i) => ({
      id: `note_${i}`,
      pitch: baseNotes[i % baseNotes.length],
      time: i * 0.25,
      duration: 0.2,
      velocity: 0.7
    }));
  };

  // ムードに基づく自動生成
  const generateFromMood = async (mood: MusicMood) => {
    const analyzer = new MoodAnalyzer();
    const generatedTrack = await analyzer.generateTrackForMood(mood);
    
    setCurrentTrack({
      ...currentTrack,
      ...generatedTrack,
      mood
    });
  };

  // プリセットの適用
  const applyPreset = (preset: MusicPreset) => {
    setCurrentTrack({
      ...currentTrack,
      ...preset.settings,
      name: `${preset.name} (カスタマイズ)`
    });
    setSelectedPreset(preset);
  };

  // 楽曲のエクスポート
  const exportMusic = async () => {
    try {
      // Web Audio APIでレンダリング
      if (audioContextRef.current) {
        const offlineContext = new OfflineAudioContext(
          2, // ステレオ
          currentTrack.duration * 44100, // サンプル数
          44100 // サンプルレート
        );

        // 各レイヤーをオフラインで再生
        currentTrack.layers.forEach(layer => {
          if (!layer.muted) {
            renderLayer(offlineContext, layer);
          }
        });

        // レンダリング開始
        const renderedBuffer = await offlineContext.startRendering();
        
        // WAV形式でエクスポート
        const wavData = bufferToWav(renderedBuffer);
        downloadWav(wavData, `${currentTrack.name}.wav`);
      }
    } catch (error) {
      console.error('エクスポートエラー:', error);
    }
  };

  return (
    <div className="bgm-creator">
      <div className="creator-header">
        <h2>🎵 幽玄BGMコンポーザー</h2>
        <div className="header-controls">
          <button
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPause}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <div className="bpm-control">
            <label>BPM:</label>
            <input
              type="range"
              min="40"
              max="160"
              value={currentTrack.bpm}
              onChange={(e) => setCurrentTrack(prev => ({
                ...prev,
                bpm: parseInt(e.target.value)
              }))}
            />
            <span className="bpm-value">{currentTrack.bpm}</span>
          </div>

          <button className="btn-primary" onClick={exportMusic}>
            🎶 楽曲をエクスポート
          </button>
        </div>
      </div>

      <div className="creator-container">
        {/* 左ペイン: トラック情報とコントロール */}
        <div className="control-pane">
          <div className="track-info">
            <input
              type="text"
              value={currentTrack.name}
              onChange={(e) => setCurrentTrack(prev => ({ 
                ...prev, 
                name: e.target.value 
              }))}
              className="track-name-input"
              placeholder="楽曲名"
            />
            
            <div className="track-mood-selector">
              <label>ムード:</label>
              <select
                value={currentTrack.mood}
                onChange={(e) => generateFromMood(e.target.value as MusicMood)}
              >
                <option value="calm">穏やか</option>
                <option value="mysterious">神秘的</option>
                <option value="joyful">喜び</option>
                <option value="tense">緊張</option>
                <option value="epic">叙事詩的</option>
              </select>
            </div>
          </div>

          <InstrumentSelector
            onInstrumentSelect={addLayer}
            currentInstruments={currentTrack.layers.map(l => l.instrument)}
          />

          <div className="preset-section">
            <h4>📁 プリセット</h4>
            <div className="preset-grid">
              {musicPresets.map(preset => (
                <button
                  key={preset.id}
                  className={`preset-card ${selectedPreset?.id === preset.id ? 'selected' : ''}`}
                  onClick={() => applyPreset(preset)}
                >
                  <div className="preset-icon">{preset.icon}</div>
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-mood">{preset.mood}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 中央ペイン: レイヤーエディター */}
        <div className="editor-pane">
          <div className="layer-tabs">
            {currentTrack.layers.map((layer, index) => (
              <button
                key={layer.id}
                className={`layer-tab ${activeLayer === index ? 'active' : ''} ${layer.muted ? 'muted' : ''}`}
                onClick={() => setActiveLayer(index)}
              >
                <span className="layer-icon">
                  {layer.instrument === 'koto' ? '🎻' :
                   layer.instrument === 'shakuhachi' ? '🎋' :
                   layer.instrument === 'taiko' ? '🥁' : '🎵'}
                </span>
                <span className="layer-name">
                  {instrumentNames[layer.instrument]} {index + 1}
                </span>
                
                <div className="layer-controls">
                  <button
                    className="mute-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerMute(index);
                    }}
                    title={layer.muted ? 'ミュート解除' : 'ミュート'}
                  >
                    {layer.muted ? '🔇' : '🔊'}
                  </button>
                  
                  <button
                    className="solo-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerSolo(index);
                    }}
                    title={layer.solo ? 'ソロ解除' : 'ソロ'}
                  >
                    {layer.solo ? '⭐' : '☆'}
                  </button>
                </div>
              </button>
            ))}
            
            {currentTrack.layers.length === 0 && (
              <div className="empty-layers">
                <p>🎼 楽器を追加して音楽を作り始めましょう</p>
                <p className="hint">左の楽器パレットから選択してください</p>
              </div>
            )}
          </div>

          {currentTrack.layers[activeLayer] && (
            <div className="layer-editor">
              <TrackEditor
                layer={currentTrack.layers[activeLayer]}
                bpm={currentTrack.bpm}
                onUpdate={(updatedLayer) => {
                  const updatedLayers = [...currentTrack.layers];
                  updatedLayers[activeLayer] = updatedLayer;
                  setCurrentTrack(prev => ({ ...prev, layers: updatedLayers }));
                }}
              />
            </div>
          )}

          {/* 再生ヘッドとタイムライン */}
          <div className="timeline-container">
            <div className="timeline">
              <div 
                className="playhead"
                style={{ left: `${(currentTime / currentTrack.duration) * 100}%` }}
              />
              
              {/* 小節表示 */}
              {Array.from({ length: Math.ceil(currentTrack.duration / 4) }).map((_, i) => (
                <div
                  key={i}
                  className="measure-marker"
                  style={{ left: `${(i * 4 / currentTrack.duration) * 100}%` }}
                >
                  <span className="measure-number">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右ペイン: ミキサーとエフェクト */}
        <div className="mixer-pane">
          <LayerMixer
            layers={currentTrack.layers}
            masterVolume={currentTrack.volume}
            onLayerUpdate={(index, updates) => {
              const updatedLayers = [...currentTrack.layers];
              updatedLayers[index] = { ...updatedLayers[index], ...updates };
              setCurrentTrack(prev => ({ ...prev, layers: updatedLayers }));
            }}
            onMasterVolumeChange={(volume) => {
              setCurrentTrack(prev => ({ ...prev, volume }));
            }}
          />

          <PatternLibrary
            onPatternSelect={(pattern) => {
              if (currentTrack.layers[activeLayer]) {
                const updatedLayers = [...currentTrack.layers];
                updatedLayers[activeLayer].pattern = pattern;
                setCurrentTrack(prev => ({ ...prev, layers: updatedLayers }));
              }
            }}
            instrument={currentTrack.layers[activeLayer]?.instrument}
          />
        </div>
      </div>

      <div className="creator-footer">
        <div className="stats-display">
          <div className="stat-item">
            <span className="stat-label">レイヤー数:</span>
            <span className="stat-value">{currentTrack.layers.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">長さ:</span>
            <span className="stat-value">{currentTrack.duration}s</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">キー:</span>
            <span className="stat-value">{currentTrack.key}</span>
          </div>
        </div>

        <MusicExporter
          track={currentTrack}
          onExport={exportMusic}
          isPlaying={isPlaying}
        />
      </div>
    </div>
  );
};

// ユーティリティ関数
const instrumentNames: Record<InstrumentType, string> = {
  koto: '琴',
  shakuhachi: '尺八',
  taiko: '太鼓',
  shamisen: '三味線',
  shinobue: '篠笛',
  kane: '鉦',
  voice: '詠唱'
};

const musicPresets: MusicPreset[] = [
  {
    id: 'spring_garden',
    name: '春の庭',
    mood: 'calm',
    icon: '🌸',
    settings: {
      bpm: 70,
      key: 'D major',
      layers: [],
      mood: 'calm'
    }
  },
  {
    id: 'moonlight_night',
    name: '月明かりの夜',
    mood: 'mysterious',
    icon: '🌙',
    settings: {
      bpm: 60,
      key: 'F minor',
      layers: [],
      mood: 'mysterious'
    }
  },
  {
    id: 'festival',
    name: '祭りの賑わい',
    mood: 'joyful',
    icon: '🎉',
    settings: {
      bpm: 120,
      key: 'G major',
      layers: [],
      mood: 'joyful'
    }
  },
  {
    id: 'battle',
    name: '闘志',
    mood: 'tense',
    icon: '⚔️',
    settings: {
      bpm: 140,
      key: 'C minor',
      layers: [],
      mood: 'tense'
    }
  }
];

// Web Audio APIレンダリング用
const renderLayer = (context: OfflineAudioContext, layer: MusicLayer) => {
  // 実際の実装では、Web Audio APIを使って各レイヤーをレンダリング
  // ここでは簡略化のため実装を省略
};

const bufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  
  // WAVヘッダーの作成
  const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
  const view = new DataView(wavBuffer);
  
  // RIFF識別子
  writeString(view, 0, 'RIFF');
  // ファイルサイズ
  view.setUint32(4, 36 + length * numChannels * 2, true);
  // WAVE識別子
  writeString(view, 8, 'WAVE');
  // fmtチャンク
  writeString(view, 12, 'fmt ');
  // fmtチャンクのサイズ
  view.setUint32(16, 16, true);
  // フォーマットタイプ (PCM = 1)
  view.setUint16(20, 1, true);
  // チャンネル数
  view.setUint16(22, numChannels, true);
  // サンプルレート
  view.setUint32(24, sampleRate, true);
  // バイトレート
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // ブロックアラインメント
  view.setUint16(32, numChannels * 2, true);
  // ビット深度
  view.setUint16(34, 16, true);
  // data識別子
  writeString(view, 36, 'data');
  // データサイズ
  view.setUint32(40, length * numChannels * 2, true);
  
  // 音声データの書き込み
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return wavBuffer;
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const downloadWav = (wavData: ArrayBuffer, filename: string) => {
  const blob = new Blob([wavData], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// レイヤーのミュート/ソロ制御
const toggleLayerMute = (layerIndex: number) => {
  // 実装
};

const toggleLayerSolo = (layerIndex: number) => {
  // 実装
};
