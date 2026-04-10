/**
 * Morning Stars — Audio
 * All sounds are synthesised via the Web Audio API — no audio files required.
 * Works fully offline on Android.
 */

/**
 * Note sequences: each entry is [frequency (Hz), duration (s), gap (s)]
 * Adjust these values to change how each sound feels.
 */
const SOUND_SEQUENCES = {
  ding:    [[523, 0.12, 0.08], [659, 0.18, 0.10]],
  chime:   [[523, 0.10, 0.06], [659, 0.10, 0.06], [784, 0.10, 0.06], [1047, 0.22, 0.12]],
  fanfare: [[523, 0.10, 0.04], [659, 0.10, 0.04], [784, 0.10, 0.04],
            [1047, 0.12, 0.06], [784, 0.08, 0.04], [1047, 0.28, 0.14]],
  pop:     [[200, 0.04, 0.02], [400, 0.06, 0.04], [600, 0.08, 0.06]],
  star:    [[523, 0.08, 0.04], [784, 0.08, 0.04], [1047, 0.08, 0.04],
            [1319, 0.08, 0.04], [1047, 0.08, 0.04], [1319, 0.18, 0.10]],
};

/**
 * Plays a named alarm sound via the Web Audio API.
 * Silently does nothing if:
 *   - soundId is 'none' or falsy
 *   - the browser does not support AudioContext
 *   - the user hasn't interacted with the page yet (autoplay policy)
 */
function playAlarm(soundId) {
  if (!soundId || soundId === 'none') return;

  const sequence = SOUND_SEQUENCES[soundId];
  if (!sequence) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    let startTime = ctx.currentTime + 0.05;

    sequence.forEach(([freq, duration, gap]) => {
      const oscillator = ctx.createOscillator();
      const gainNode   = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.4, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.02);

      startTime += duration + gap;
    });
  } catch {
    // Silently ignore audio errors (e.g. autoplay blocked before user interaction)
  }
}
