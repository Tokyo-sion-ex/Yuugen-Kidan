// src/hooks/useWebAudio.ts の簡略化
export const useWebAudio = () => {
  const [audioContext, setAudioContext] = useState<any>(null);

  const initAudio = async () => {
    if (typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const context = new AudioContext();
        setAudioContext(context);
        return context;
      }
    }
    return null;
  };

  return { initAudio, audioContext };
};
