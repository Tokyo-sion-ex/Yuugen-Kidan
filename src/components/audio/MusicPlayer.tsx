import React, { useState, useEffect, useRef } from 'react';
import { AudioTrack, AudioPlaylist, AudioSettings } from '@/types/audio.types';
import { Button } from '@/components/ui/Button';

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<AudioPlaylist | null>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState<'none' | 'one' | 'all'>('all');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [tracks, setTracks] = useState<AudioTrack[]>([
    {
      id: 'track_1',
      name: '月下の牌卓',
      composer: '幽玄音楽団',
      duration: 180,
      filePath: '/audio/music/moonlight_table.mp3',
      tags: ['和風', 'リラックス', 'メインメニュー'],
      isUnlocked: true,
      isFavorite: true,
      playCount: 42
    },
    {
      id: 'track_2',
      name: '疾風の対局',
      composer: '幽玄音楽団',
      duration: 210,
      filePath: '/audio/music/swift_match.mp3',
      tags: ['緊張感', '対戦', 'アップテンポ'],
      loopPoints: { start: 10, end: 190 },
      isUnlocked: true,
      isFavorite: false,
      playCount: 28
    },
    {
      id: 'track_3',
      name: '桜舞う季節',
      composer: '桜音響楽団',
      duration: 240,
      filePath: '/audio/music/sakura_season.mp3',
      tags: ['季節', '桜', '春'],
      unlockCondition: {
        type: 'event',
        requirement: '桜祭りイベント参加'
      },
      isUnlocked: false,
      isFavorite: false,
      playCount: 0
    }
  ]);
  
  const [playlists, setPlaylists] = useState<AudioPlaylist[]>([
    {
      id: 'playlist_1',
      name: 'デフォルトBGM',
      description: '標準のBGMプレイリスト',
      tracks: ['track_1', 'track_2'],
      isDefault: true,
      createdBy: 'system',
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'playlist_2',
      name: 'リラックスモード',
      description: '落ち着いた雰囲気の楽曲',
      tracks: ['track_1'],
      isDefault: false,
      createdBy: 'user_1',
      createdAt: new Date('2024-02-01')
    }
  ]);
  
  const [settings, setSettings] = useState<AudioSettings>({
    masterVolume: 1.0,
    musicVolume: 0.8,
    sfxVolume: 0.7,
    voiceVolume: 0.9,
    ambientVolume: 0.5,
    shuffle: false,
    crossfade: true,
    crossfadeDuration: 3,
    menuMusic: 'playlist_1',
    gameMusic: 'playlist_2',
    victoryMusic: 'track_1',
    tileSounds: true,
    voiceLines: true,
    environmentalSounds: true,
    dynamicMusic: true,
    adaptiveVolume: true,
    spatialAudio: false
  });
  
  useEffect(() => {
    // 初期トラックの設定
    if (tracks.length > 0 && !currentTrack) {
      setCurrentTrack(tracks[0]);
    }
    
    // オーディオ要素の初期化
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume * settings.masterVolume * settings.musicVolume;
    }
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume * settings.masterVolume * settings.musicVolume;
    }
  }, [volume, settings.masterVolume, settings.musicVolume]);
  
  const playTrack = (track: AudioTrack) => {
    if (!audioRef.current) return;
    
    if (currentTrack?.id !== track.id) {
      // 新しいトラックをロード
      audioRef.current.src = track.filePath;
      setCurrentTrack(track);
      
      // 再生回数を更新
      setTracks(prev => prev.map(t => 
        t.id === track.id ? { ...t, playCount: t.playCount + 1 } : t
      ));
    }
    
    audioRef.current.play();
    setIsPlaying(true);
    
    // 進捗バーの更新を開始
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration || track.duration;
        setProgress((currentTime / duration) * 100);
        
        // ループポイントの処理
        if (track.loopPoints && currentTime >= track.loopPoints.end) {
          audioRef.current.currentTime = track.loopPoints.start;
        }
      }
    }, 1000);
    
    audioRef.current.onended = () => {
      if (isRepeat === 'one') {
        // 同じ曲を繰り返し
        audioRef.current!.currentTime = 0;
        audioRef.current!.play();
      } else if (isRepeat === 'all' && currentPlaylist) {
        // 次の曲を再生
        playNextTrack();
      } else {
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    };
  };
  
  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };
  
  const playNextTrack = () => {
    if (!currentTrack || !currentPlaylist) return;
    
    const currentIndex = currentPlaylist.tracks.indexOf(currentTrack.id);
    let nextIndex;
    
    if (isShuffle) {
      // シャッフル再生
      nextIndex = Math.floor(Math.random() * currentPlaylist.tracks.length);
    } else {
      // 順番再生
      nextIndex = (currentIndex + 1) % currentPlaylist.tracks.length;
    }
    
    const nextTrackId = currentPlaylist.tracks[nextIndex];
    const nextTrack = tracks.find(t => t.id === nextTrackId);
    
    if (nextTrack) {
      playTrack(nextTrack);
    }
  };
  
  const playPreviousTrack = () => {
    if (!currentTrack || !currentPlaylist) return;
    
    const currentIndex = currentPlaylist.tracks.indexOf(currentTrack.id);
    const prevIndex = (currentIndex - 1 + currentPlaylist.tracks.length) % currentPlaylist.tracks.length;
    const prevTrackId = currentPlaylist.tracks[prevIndex];
    const prevTrack = tracks.find(t => t.id === prevTrackId);
    
    if (prevTrack) {
      playTrack(prevTrack);
    }
  };
  
  const seekTo = (percent: number) => {
    if (audioRef.current && currentTrack) {
      const duration = audioRef.current.duration || currentTrack.duration;
      audioRef.current.currentTime = (duration * percent) / 100;
      setProgress(percent);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const addToPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId && !playlist.tracks.includes(trackId)) {
        return {
          ...playlist,
          tracks: [...playlist.tracks, trackId]
        };
      }
      return playlist;
    }));
  };
  
  const removeFromPlaylist = (trackId: string, playlistId: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          tracks: playlist.tracks.filter(id => id !== trackId)
        };
      }
      return playlist;
    }));
  };
  
  const toggleFavorite = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, isFavorite: !track.isFavorite } : track
    ));
  };
  
  return (
    <div className="music-player">
      <div className="player-header">
        <h2>BGMプレイヤー</h2>
        <div className="player-mode">
          <span className="mode-label">再生モード:</span>
          <select 
            value={settings.menuMusic}
            onChange={(e) => setSettings(prev => ({ ...prev, menuMusic: e.target.value }))}
          >
            <option value="playlist_1">メインメニュー用</option>
            <option value="playlist_2">対戦中</option>
            <option value="custom">カスタム</option>
          </select>
        </div>
      </div>
      
      <div className="player-main">
        <div className="now-playing">
          <div className="track-info">
            {currentTrack ? (
              <>
                <div className="track-cover">
                  <div className="cover-image" />
                  {currentTrack.isFavorite && (
                    <div className="favorite-badge">★</div>
                  )}
                </div>
                
                <div className="track-details">
                  <h3 className="track-title">{currentTrack.name}</h3>
                  <p className="track-composer">{currentTrack.composer}</p>
                  
                  <div className="track-meta">
                    <div className="meta-item">
                      <span className="meta-label">タグ:</span>
                      <div className="tag-list">
                        {currentTrack.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="meta-item">
                      <span className="meta-label">再生回数:</span>
                      <span>{currentTrack.playCount}</span>
                    </div>
                    
                    {currentTrack.unlockCondition && (
                      <div className="meta-item">
                        <span className="meta-label">解除条件:</span>
                        <span>{currentTrack.unlockCondition.requirement}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="no-track">
                <p>再生中の楽曲がありません</p>
              </div>
            )}
          </div>
          
          <div className="player-controls">
            <div className="progress-section">
              <div className="progress-bar" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = ((e.clientX - rect.left) / rect.width) * 100;
                seekTo(percent);
              }}>
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
                <div 
                  className="progress-thumb"
                  style={{ left: `${progress}%` }}
                />
              </div>
              
              <div className="time-display">
                {currentTrack && audioRef.current ? (
                  <>
                    <span>{formatTime(audioRef.current.currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(audioRef.current.duration || currentTrack.duration)}</span>
                  </>
                ) : (
                  <span>--:-- / --:--</span>
                )}
              </div>
            </div>
            
            <div className="control-buttons">
              <Button
                variant="ghost"
                onClick={() => setIsShuffle(!isShuffle)}
                className={isShuffle ? 'active' : ''}
              >
                🔀
              </Button>
              
              <Button
                variant="ghost"
                onClick={playPreviousTrack}
                disabled={!currentTrack}
              >
                ⏮
              </Button>
              
              {isPlaying ? (
                <Button
                  variant="primary"
                  onClick={pauseTrack}
                >
                  ⏸
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => currentTrack && playTrack(currentTrack)}
                  disabled={!currentTrack}
                >
                  ▶
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={playNextTrack}
                disabled={!currentTrack}
              >
                ⏭
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setIsRepeat(
                  isRepeat === 'none' ? 'all' :
                  isRepeat === 'all' ? 'one' : 'none'
                )}
                className={isRepeat !== 'none' ? 'active' : ''}
              >
                {isRepeat === 'one' ? '🔂' : '🔁'}
              </Button>
            </div>
            
            <div className="volume-section">
              <span className="volume-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
        
        <div className="player-sidebar">
          <div className="playlist-section">
            <h3>プレイリスト</h3>
            <div className="playlist-list">
              {playlists.map(playlist => (
                <div
                  key={playlist.id}
                  className={`playlist-item ${currentPlaylist?.id === playlist.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentPlaylist(playlist);
                    const firstTrack = tracks.find(t => t.id === playlist.tracks[0]);
                    if (firstTrack) {
                      setCurrentTrack(firstTrack);
                    }
                  }}
                >
                  <span className="playlist-name">{playlist.name}</span>
                  <span className="playlist-count">{playlist.tracks.length}曲</span>
                  {playlist.isDefault && (
                    <span className="playlist-tag default">デフォルト</span>
                  )}
                </div>
              ))}
            </div>
            
            <Button size="small" variant="secondary">
              新規プレイリスト
            </Button>
          </div>
          
          <div className="settings-section">
            <h3>音声設定</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label>マスターボリューム</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.masterVolume * 100}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    masterVolume: parseInt(e.target.value) / 100 
                  }))}
                />
              </div>
              
              <div className="setting-item">
                <label>BGM音量</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.musicVolume * 100}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    musicVolume: parseInt(e.target.value) / 100 
                  }))}
                />
              </div>
              
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.tileSounds}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      tileSounds: e.target.checked 
                    }))}
                  />
                  牌の効果音
                </label>
              </div>
              
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.dynamicMusic}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      dynamicMusic: e.target.checked 
                    }))}
                  />
                  動的BGM
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="track-library">
        <h3>楽曲ライブラリ</h3>
        <div className="library-controls">
          <input
            type="text"
            placeholder="楽曲を検索..."
            className="library-search"
          />
          <select className="library-filter">
            <option value="all">すべての楽曲</option>
            <option value="unlocked">解除済み</option>
            <option value="favorites">お気に入り</option>
            <option value="by_tag">タグで絞り込み</option>
          </select>
        </div>
        
        <div className="tracks-grid">
          {tracks.map(track => (
            <div key={track.id} className="track-card">
              <div className="track-card-header">
                <div className="track-card-cover" />
                <div className="track-card-info">
                  <h4>{track.name}</h4>
                  <p>{track.composer}</p>
                  <div className="track-duration">
                    {formatTime(track.duration)}
                  </div>
                </div>
                
                <div className="track-card-actions">
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => toggleFavorite(track.id)}
                    className={track.isFavorite ? 'favorited' : ''}
                  >
                    {track.isFavorite ? '★' : '☆'}
                  </Button>
                  
                  {!track.isUnlocked ? (
                    <span className="locked-badge">🔒</span>
                  ) : (
                    <Button
                      size="small"
                      onClick={() => playTrack(track)}
                    >
                      再生
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="track-card-footer">
                <div className="track-tags">
                  {track.tags.map(tag => (
                    <span key={tag} className="tag small">{tag}</span>
                  ))}
                </div>
                
                {track.isUnlocked && currentPlaylist && (
                  <div className="playlist-actions">
                    {currentPlaylist.tracks.includes(track.id) ? (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => removeFromPlaylist(track.id, currentPlaylist.id)}
                      >
                        リストから削除
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => addToPlaylist(track.id, currentPlaylist.id)}
                      >
                        リストに追加
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
