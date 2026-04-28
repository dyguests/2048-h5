<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
} from 'vue';

const props = withDefaults(
  defineProps<{
    merges: { row: number; col: number }[];
    sliding: boolean;
    animMs: number;
  }>(),
  {
    merges: () => [],
    sliding: false,
    animMs: 220,
  },
);

const wrapper = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const size = ref({ w: 300 });

const pad = 10;
const gap = 10;

function cellCenter(row: number, col: number) {
  const w = size.value.w;
  const inner = Math.max(0, w - 2 * pad - 3 * gap);
  const cell = inner / 4;
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
}

const particles: Particle[] = [];

function spawn(init: Omit<Particle, 'life'> & { life?: number }) {
  particles.push({
    ...init,
    life: init.life ?? 0,
  });
  while (particles.length > 420) particles.shift();
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

function tick() {
  if (!canvasRef.value) {
    raf = requestAnimationFrame(tick);
    return;
  }
  shimmerTick();

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

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }
    p.life++;
    p.x += p.vx + (Math.random() - 0.5) * 0.2;
    p.y += p.vy + Math.random() * 0.1;
    p.vy += 0.036;
    const t = p.life / p.maxLife;
    const alpha = Math.max(0, (1 - t) * (1 - t));
    ctx.globalAlpha = Math.min(1, alpha * 1.05);
    const grd = ctx.createRadialGradient(
      p.x,
      p.y,
      1,
      p.x,
      p.y,
      8 * (1 - t * 0.65),
    );
    grd.addColorStop(
      0,
      `hsla(${p.hue}, 95%, 80%, ${alpha})`,
    );
    grd.addColorStop(
      1,
      `hsla(${p.hue}, 90%, 60%, 0)`,
    );
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.2 * (1 - t * 0.5), 0, Math.PI * 2);
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
