export interface AudioTrack {
  id: string;
  name: string;
  composer: string;
  duration: number; // 秒単位
  filePath: string;
  tags: string[];
  loopPoints?: {
    start: number; // ループ開始位置（秒）
    end: number;   // ループ終了位置（秒）
  };
  
  // メタデータ
  unlockCondition?: {
    type: 'achievement' | 'rank' | 'purchase' | 'event';
    requirement: string;
  };
  isUnlocked: boolean;
  isFavorite: boolean;
  playCount: number;
}

export interface SoundEffect {
  id: string;
  name: string;
  category: 'tile' | 'action' | 'ui' | 'voice' | 'environment';
  filePath: string;
  volume: number; // 0-1
  pitchRange?: [number, number]; // ピッチ変動範囲
}

export interface AudioPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: string[]; // AudioTrack IDs
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  ambientVolume: number;
  
  // 再生設定
  shuffle: boolean;
  crossfade: boolean;
  crossfadeDuration: number; // 秒単位
  
  // 状況別設定
  menuMusic: string; // プレイリストID
  gameMusic: string; // プレイリストID
  victoryMusic: string; // プレイリストID
  
  // サウンド効果
  tileSounds: boolean;
  voiceLines: boolean;
  environmentalSounds: boolean;
  
  // 高度な設定
  dynamicMusic: boolean;
  adaptiveVolume: boolean;
  spatialAudio: boolean;
}
