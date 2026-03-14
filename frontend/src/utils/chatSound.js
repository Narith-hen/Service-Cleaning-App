let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  return audioContext;
};

const playTone = (frequency, durationMs, volume) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
    oscillator.disconnect();
    gainNode.disconnect();
  }, durationMs);
};

export const playChatSound = (type, enabled) => {
  if (!enabled) return;
  if (type === 'message') {
    playTone(520, 120, 0.05);
  }
  if (type === 'typing') {
    playTone(320, 80, 0.03);
  }
};
