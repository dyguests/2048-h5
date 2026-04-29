<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import type { Direction } from '../game/types';
import type { TileVM } from '../game/view';

const props = withDefaults(
  defineProps<{
    merges: { row: number; col: number }[];
    sliding: boolean;
    animMs: number;
    tiles: TileVM[];
    direction: Direction | null;
  }>(),
  {
    merges: () => [],
    sliding: false,
    animMs: 220,
    tiles: () => [],
    direction: null,
  },
);

const wrapper = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const size = ref({ w: 300 });

const pad = 10;
const gap = 10;

function cellSize() {
  const w = size.value.w;
  const inner = Math.max(0, w - 2 * pad - 3 * gap);
  return inner / 4;
}

function cellCenter(row: number, col: number) {
  const cell = cellSize();
  const x = pad + gap + col * (cell + gap) + cell / 2;
  const y = pad + gap + row * (cell + gap) + cell / 2;
  return { x, y };
}

function measure() {
  const el = wrapper.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  size.value = { w: r.width };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  kind?: 'dust';
}

const particles: Particle[] = [];

/** Motion trail polyline samples per tile id */
const trailMap = new Map<string, { x: number; y: number }[]>();

function spawn(init: Omit<Particle, 'life'> & { life?: number }) {
  particles.push({
    ...init,
    life: init.life ?? 0,
  });
  while (particles.length > 480) particles.shift();
}

function burst(count: number, row: number, col: number) {
  const { x, y } = cellCenter(row, col);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 0.65 + Math.random() * 2.1;
    spawn({
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      maxLife: 36 + Math.random() * 28,
      hue: 310 + Math.random() * 55,
      life: 0,
    });
  }
}

function trailOffset(dir: Direction, cell: number) {
  const k = cell * 0.44;
  switch (dir) {
    case 'up':
      return { dx: (Math.random() - 0.5) * 5, dy: k };
    case 'down':
      return { dx: (Math.random() - 0.5) * 5, dy: -k };
    case 'left':
      return { dx: k, dy: (Math.random() - 0.5) * 5 };
    case 'right':
      return { dx: -k, dy: (Math.random() - 0.5) * 5 };
  }
}

function frictionDrift(dir: Direction) {
  const r = () => (Math.random() - 0.5) * 1.1;
  switch (dir) {
    case 'up':
      return { vx: r(), vy: 0.35 + Math.random() * 0.75 };
    case 'down':
      return { vx: r(), vy: -0.35 - Math.random() * 0.75 };
    case 'left':
      return { vx: 0.35 + Math.random() * 0.75, vy: r() };
    case 'right':
      return { vx: -0.35 - Math.random() * 0.75, vy: r() };
  }
}

function frictionSpawn() {
  if (!props.sliding || !props.direction || !props.tiles.length) return;
  const dir = props.direction;
  const cell = cellSize();
  if (!(cell > 2)) return;

  for (const t of props.tiles) {
    if (Math.random() > 0.92) continue;
    const { x, y } = cellCenter(t.row, t.col);
    const off = trailOffset(dir, cell);
    const drift = frictionDrift(dir);
    spawn({
      x: x + off.dx,
      y: y + off.dy,
      vx: drift.vx,
      vy: drift.vy,
      maxLife: 11 + Math.random() * 14,
      hue: 28 + Math.random() * 38,
      kind: 'dust',
      life: 0,
    });
  }
}

function shimmerTick() {
  if (!props.sliding) return;
  const w = size.value.w;
  if (!(w > 10)) return;
  if (Math.random() < 0.52) {
    spawn({
      x: pad + Math.random() * (w - 2 * pad),
      y: pad + Math.random() * (w - 2 * pad),
      vx: (Math.random() - 0.5) * 0.85,
      vy: (-0.8 - Math.random()),
      maxLife: 16 + Math.random() * 18,
      hue: 30 + Math.random() * 45,
      life: 0,
    });
  }
}

function updateTrails() {
  if (!props.sliding || !props.tiles.length) {
    return;
  }
  for (const t of props.tiles) {
    const { x, y } = cellCenter(t.row, t.col);
    const buf = trailMap.get(t.id) ?? [];
    buf.push({ x, y });
    if (buf.length > 18) buf.shift();
    trailMap.set(t.id, buf);
  }
}

watch(
  () => props.sliding,
  (sliding) => {
    if (!sliding) trailMap.clear();
  },
);

let mergeTimer = 0;

watch(
  () => [props.sliding, props.merges, props.animMs] as const,
  ([sliding, merges]) => {
    window.clearTimeout(mergeTimer);
    mergeTimer = 0;
    if (!sliding || !(merges as { row: number; col: number }[]).length)
      return;
    mergeTimer = window.setTimeout(() => {
      const list = merges as { row: number; col: number }[];
      for (const m of list)
        burst(15, m.row, m.col);
    }, props.animMs * 0.48);
  },
);

let active = false;
let raf = 0;

function drawTrails(ctx: CanvasRenderingContext2D) {
  if (!trailMap.size) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  trailMap.forEach((pts) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++)
      ctx.lineTo(pts[i]!.x, pts[i]!.y);
    ctx.strokeStyle = 'rgba(255, 182, 220, 0.38)';
    ctx.lineWidth = 5;
    ctx.shadowColor = 'rgba(255, 120, 200, 0.25)';
    ctx.shadowBlur = 6;
    ctx.stroke();
  });
  ctx.restore();
}

function tick() {
  if (!canvasRef.value) {
    raf = requestAnimationFrame(tick);
    return;
  }
  shimmerTick();
  frictionSpawn();
  updateTrails();

  const dpr =
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cv = canvasRef.value;
  const ctx = cv.getContext('2d');
  if (!ctx) {
    raf = requestAnimationFrame(tick);
    return;
  }

  const side = Math.max(1, size.value.w);

  cv.width = side * dpr;
  cv.height = side * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, side, side);

  drawTrails(ctx);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }
    p.life++;
    p.x += p.vx + (Math.random() - 0.5) * (p.kind === 'dust' ? 0.35 : 0.2);
    p.y += p.vy + Math.random() * (p.kind === 'dust' ? 0.06 : 0.1);
    p.vy += p.kind === 'dust' ? 0.024 : 0.036;
    const t = p.life / p.maxLife;
    const alpha = Math.max(0, (1 - t) * (1 - t));
    ctx.globalAlpha = Math.min(1, alpha * (p.kind === 'dust' ? 0.85 : 1.05));
    const rad = p.kind === 'dust' ? 2.6 : 4.2 * (1 - t * 0.5);
    const grd = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 8 * (1 - t * 0.65));
    grd.addColorStop(
      0,
      `hsla(${p.hue}, ${p.kind === 'dust' ? 72 : 95}%, ${p.kind === 'dust' ? 74 : 80}%, ${alpha})`,
    );
    grd.addColorStop(
      1,
      `hsla(${p.hue}, ${p.kind === 'dust' ? 65 : 90}%, 60%, 0)`,
    );
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  raf = window.requestAnimationFrame(tick);
}

onMounted(() => {
  measure();
  const ro = new ResizeObserver(() => measure());
  if (wrapper.value) ro.observe(wrapper.value);
  if (!active) {
    active = true;
    raf = requestAnimationFrame(tick);
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.clearTimeout(mergeTimer);
  active = false;
});
</script>

<template>
  <div ref="wrapper" class="fx-root">
    <canvas ref="canvasRef" aria-hidden="true" class="fx-canvas"></canvas>
  </div>
</template>

<style scoped>
.fx-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.fx-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
