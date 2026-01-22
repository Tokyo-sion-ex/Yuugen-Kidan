import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

interface SoundLibrary {
  [key: string]: Howl;
}

export const useMahjongSounds = () => {
  const sounds = useRef<SoundLibrary>({});
  const [volume, setVolume] = useState(0.5);
  const [currentBGM, setCurrentBGM] = useState<string | null>(null);

  // 音声の初期化
  useEffect(() => {
    // BGM
    sounds.current.menu_bgm = new Howl({
      src: ['/assets/sounds/bgm_menu.mp3'],
      loop: true,
      volume: volume * 0.7,
      preload: true,
    });

    sounds.current.game_bgm = new Howl({
      src: ['/assets/sounds/bgm_game.mp3'],
      loop: true,
      volume: volume * 0.6,
      preload: true,
    });

    // 効果音
    sounds.current.click = new Howl({
      src: ['/assets/sounds/click.mp3'],
      volume: volume * 0.8,
      preload: true,
    });

    sounds.current.tile_draw = new Howl({
      src: ['/assets/sounds/tile_draw.mp3'],
      volume: volume * 0.7,
      preload: true,
    });

    sounds.current.tile_discard = new Howl({
      src: ['/assets/sounds/tile_discard.mp3'],
      volume: volume * 0.7,
      preload: true,
    });

    sounds.current.riichi = new Howl({
      src: ['/assets/sounds/riichi.mp3'],
      volume: volume * 1,
      preload: true,
    });

    sounds.current.win = new Howl({
      src: ['/assets/sounds/win.mp3'],
      volume: volume * 1,
      preload: true,
    });

    // クリーンアップ
    return () => {
      Object.values(sounds.current).forEach(sound => {
        sound.unload();
      });
    };
  }, []);

  // 音量変更時の処理
  useEffect(() => {
    Object.values(sounds.current).forEach(sound => {
      sound.volume(sound === sounds.current.menu_bgm || sound === sounds.current.game_bgm 
        ? volume * 0.7 
        : volume);
    });
  }, [volume]);

  const playBGM = (type: 'menu' | 'game') => {
    // 現在のBGMを停止
    if (currentBGM) {
      sounds.current[currentBGM].stop();
    }

    const bgmKey = `${type}_bgm`;
    if (sounds.current[bgmKey]) {
      sounds.current[bgmKey].play();
      setCurrentBGM(bgmKey);
    }
  };

  const stopBGM = () => {
    if (currentBGM && sounds.current[currentBGM]) {
      sounds.current[currentBGM].stop();
      setCurrentBGM(null);
    }
  };

  const playSound = (sound: string) => {
    if (sounds.current[sound]) {
      sounds.current[sound].play();
    } else {
      console.warn(`Sound not found: ${sound}`);
    }
  };

  const changeVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
  };

  const toggleMute = () => {
    if (volume > 0) {
      changeVolume(0);
    } else {
      changeVolume(0.5);
    }
  };

  return {
    playBGM,
    stopBGM,
    playSound,
    changeVolume,
    toggleMute,
    currentVolume: volume,
    isMuted: volume === 0,
  };
};
