import type { Direction } from '../game/types';

const SWIPE_THRESHOLD = 30;

export function useSwipe(onDir: (d: Direction) => void): {
  onPointerdown: (ev: PointerEvent) => void;
} {
  function onPointerdown(ev: PointerEvent) {
    const sx = ev.clientX;
    const sy = ev.clientY;

    const up = (e: PointerEvent) => {
      window.removeEventListener('pointerup', up);
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD)
        return;
      if (Math.abs(dx) >= Math.abs(dy))
        onDir(dx > 0 ? 'right' : 'left');
      else onDir(dy > 0 ? 'down' : 'up');
    };

    window.addEventListener('pointerup', up);
  }

  return { onPointerdown };
}
