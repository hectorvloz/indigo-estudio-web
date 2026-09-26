/** Quiet, locally synthesized tones. Audio exists only after explicit consent. */
let context: AudioContext | undefined;
let enabled = false;
export const sound = {
  get enabled() { return enabled; },
  async toggle(value = !enabled) {
    if (!value) { enabled = false; await context?.suspend(); return false; }
    try {
      context ??= new AudioContext();
      await context.resume();
      enabled = context.state === 'running';
    } catch { enabled = false; }
    return enabled;
  },
  play(kind: 'enter' | 'menu' | 'move' = 'move') {
    if (!enabled || !context || context.state !== 'running') return;
    const notes = kind === 'enter' ? [261.63, 329.63, 392] : kind === 'menu' ? [293.66, 440] : [392];
    notes.forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      const start = context!.currentTime + index * .065;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.035, start + .02);
      gain.gain.exponentialRampToValueAtTime(.001, start + .35);
      oscillator.connect(gain); gain.connect(context!.destination);
      oscillator.start(start); oscillator.stop(start + .4);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  },
};
