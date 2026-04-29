/** Browser autoplay policy: unlock once after user gesture (shared across callers). */
let unlocked = false;

function sfxUrl(file: string) {
  const base = import.meta.env.BASE_URL;
  return `${base}sfx/${file}`;
}

export function useAudio2048() {
  function unlock() {
    unlocked = true;
  }

  function play(src: string) {
    if (!unlocked || typeof Audio === 'undefined') return;
    try {
      const a = new Audio(src);
      a.volume = 0.42;
      void a.play();
    } catch {
      /* noop */
    }
  }

  return {
    unlock,
    playMove: () => play(sfxUrl('move.wav')),
    playMerge: () => play(sfxUrl('merge.wav')),
    playGameOver: () => play(sfxUrl('gameover.wav')),
    playNewBest: () => play(sfxUrl('newbest.wav')),
  };
}
