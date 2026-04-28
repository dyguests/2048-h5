import { onMounted, onUnmounted } from 'vue';
import type { Direction } from '../game/types';

const KEY_MAP: Partial<Record<string, Direction>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  d: 'right',
  w: 'up',
  s: 'down',
};

export function useKeyboard(onDir: (d: Direction) => void): void {
  function onKey(ev: KeyboardEvent) {
    const d = KEY_MAP[ev.key];
    if (!d) return;
    ev.preventDefault();
    onDir(d);
  }

  onMounted(() => window.addEventListener('keydown', onKey));
  onUnmounted(() => window.removeEventListener('keydown', onKey));
}
