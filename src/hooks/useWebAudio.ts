import { useState, useRef, useCallback } from 'react';
import { InstrumentType, NoteParams } from '../types/creative.types';

export const useWebAudio = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const oscillators = useRef<Map<string, OscillatorNode>>(new Map());
  const gainNodes = useRef<Map<string, GainNode>>(new Map());
  const effects = useRef<Map<string, AudioNode[]>>(new Map());

  // オーディオコンテキストの初期化
  const initAudio = useCallback(async (): Promise<AudioContext> => {
    if (audioContext && audioContext.state !== 'closed') {
      return audioContext;
    }

    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);
      setIsInitialized(true);
      
      // ユーザージェスチャーでオーディオを再開（必要に応じて）
      if (context.state === 'suspended') {
        await context.resume();
      }
      
      return context;
    } catch (error) {
      console.error('AudioContext initialization failed:', error);
      throw error;
    }
  }, [audioContext]);

  // 楽器の作成
  const createInstrument = useCallback((type: InstrumentType): AudioNode => {
    if (!audioContext) {
      throw new Error('AudioContext not initialized');
    }

    switch (type) {
      case 'koto':
        return createKotoInstrument(audioContext);
      case 'shakuhachi':
        return createShakuhachiInstrument(audioContext);
      case 'taiko':
        return createTaikoInstrument(audioContext);
      default:
        return createDefaultInstrument(audioContext);
    }
  }, [audioContext]);

  // ノートの再生
  const playNote = useCallback((params: NoteParams) => {
    if (!audioContext) {
      console.warn('AudioContext not ready');
      return;
    }

    const { instrument, note, duration, volume = 0.7, effects: effectParams = [] } = params;
    
    try {
      // 基本のオシレーターを作成
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // 楽器タイプに応じて波形を設定
      switch (instrument) {
        case 'koto':
          oscillator.type = 'sine';
          break;
        case 'shakuhachi':
          oscillator.type = 'triangle';
          break;
        case 'taiko':
          oscillator.type = 'sawtooth';
          break;
        default:
          oscillator.type = 'sine';
      }

      // ノートの周波数を設定（MIDIノート番号から）
      const frequency = midiNoteToFrequency(parseNoteToMidi(note));
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      // 音量エンベロープ
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      // エフェクトチェーンを構築
      let lastNode: AudioNode = gainNode;
      
      effectParams.forEach(effect => {
        const effectNode = createEffectNode(audioContext, effect);
        lastNode.connect(effectNode);
        lastNode = effectNode;
      });
      
      // 最終的に出力に接続
      lastNode.connect(audioContext.destination);
      
      // オシレーターをゲインノードに接続
      oscillator.connect(gainNode);
      
      // 再生開始と停止をスケジュール
      oscillator.start(now);
      oscillator.stop(now + duration);
      
      // リソース管理用に保存
      const noteId = `${note}_${Date.now()}`;
      oscillators.current.set(noteId, oscillator);
      gainNodes.current.set(noteId, gainNode);
      
      // ノート終了後にクリーンアップ
      setTimeout(() => {
        oscillators.current.delete(noteId);
        gainNodes.current.delete(noteId);
      }, (duration + 0.1) * 1000);
      
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }, [audioContext]);

  // すべての音を停止
  const stopAllNotes = useCallback(() => {
    oscillators.current.forEach(oscillator => {
      try {
        oscillator.stop();
      } catch (error) {
        // すでに停止している場合は無視
      }
    });
    
    oscillators.current.clear();
    gainNodes.current.clear();
  }, []);

  // エフェクトノードの作成
  const createEffectNode = (context: AudioContext, effect: any): AudioNode => {
    switch (effect.type) {
      case 'reverb':
        const convolver = context.createConvolver();
        // インパルスレスポンスのロード（簡易リバーブ）
        // 実際の実装ではインパルスレスポンスファイルをロード
        return convolver;
        
      case 'delay':
        const delay = context.createDelay();
        delay.delayTime.value = effect.delayTime || 0.3;
        
        const feedback = context.createGain();
        feedback.gain.value = effect.feedback || 0.5;
        
        delay.connect(feedback);
        feedback.connect(delay);
        
        const delayGain = context.createGain();
        delay.connect(delayGain);
        
        return delayGain;
        
      case 'filter':
        const filter = context.createBiquadFilter();
        filter.type = effect.filterType || 'lowpass';
        filter.frequency.value = effect.frequency || 1000;
        filter.Q.value = effect.Q || 1;
        return filter;
        
      default:
        return context.createGain();
    }
  };

  return {
    audioContext,
    isInitialized,
    initAudio,
    createInstrument,
    playNote,
    stopAllNotes
  };
};

// ユーティリティ関数
const parseNoteToMidi = (note: string): number => {
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60; // デフォルトで中央のC
  
  const [, pitch, octave] = match;
  return noteMap[pitch] + (parseInt(octave) + 1) * 12;
};

const midiNoteToFrequency = (midiNote: number): number => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

// 楽器ごとの作成関数
const createKotoInstrument = (context: AudioContext): AudioNode => {
  // 琴の音色を作成（FM合成を使用）
  const carrier = context.createOscillator();
  carrier.type = 'sine';
  
  const modulator = context.createOscillator();
  modulator.type = 'sine';
  modulator.frequency.value = 220;
  
  const modulationIndex = context.createGain();
  modulationIndex.gain.value = 100;
  
  const gain = context.createGain();
  gain.gain.value = 0.3;
  
  // FM合成の接続
  modulator.connect(modulationIndex);
  modulationIndex.connect(carrier.frequency);
  carrier.connect(gain);
  
  return gain;
};

const createShakuhachiInstrument = (context: AudioContext): AudioNode => {
  // 尺八の音色を作成（ノイズとフィルタの組み合わせ）
  const noise = context.createBufferSource();
  const bufferSize = context.sampleRate * 2;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  noise.buffer = buffer;
  noise.loop = true;
  
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 880;
  filter.Q.value = 10;
  
  const gain = context.createGain();
  gain.gain.value = 0.2;
  
  noise.connect(filter);
  filter.connect(gain);
  
  return gain;
};

const createTaikoInstrument = (context: AudioContext): AudioNode => {
  // 太鼓の音色を作成（低周波のオシレーターとエンベロープ）
  const oscillator = context.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 100;
  
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;
  filter.Q.value = 5;
  
  const gain = context.createGain();
  const now = context.currentTime;
  
  // 太鼓の減衰エンベロープ
  gain.gain.setValueAtTime(1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
  
  oscillator.connect(filter);
  filter.connect(gain);
  
  return gain;
};

const createDefaultInstrument = (context: AudioContext): AudioNode => {
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  
  const gain = context.createGain();
  gain.gain.value = 0.5;
  
  oscillator.connect(gain);
  
  return gain;
};
