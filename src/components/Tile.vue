<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: number;
  row: number;
  col: number;
  animMs: number;
  sliding: boolean;
}>();

function tierFrom(v: number) {
  if (v < 256) return 1;
  if (v < 2048) return 2;
  return 3;
}

const tier = computed(() => tierFrom(props.value));
</script>

<template>
  <div
    class="tile"
    :class="{ 'is-moving': sliding, [`tier-${tier}`]: true }"
    :style="{
      '--r': row,
      '--c': col,
      '--anim': `${animMs}ms`,
    }"
  >
    <span>{{ value }}</span>
  </div>
</template>

<style scoped>
.tile {
  width: var(--cell-size);
  height: var(--cell-size);
  border-radius: 18px;
  display: grid;
  place-items: center;

  position: absolute;
  left: 0;
  top: 0;
  transition:
    transform var(--anim) cubic-bezier(0.38, 0.93, 0.22, 1),
    filter 260ms ease,
    box-shadow 260ms ease;

  transform: translate(
    calc(var(--gap) + var(--c) * (var(--cell-size) + var(--gap))),
    calc(var(--gap) + var(--r) * (var(--cell-size) + var(--gap)))
  );

  box-shadow:
    0 6px 14px rgba(186, 90, 212, 0.25),
    0 12px 0 rgba(110, 50, 150, 0.05) inset;
}

.tile span {
  font-weight: 800;
  font-size: clamp(16px, 5.4vw, 28px);
  letter-spacing: 0.03em;
  color: rgba(67, 28, 90, 0.96);
}

.tier-1.tile {
  background: linear-gradient(155deg, #fff4ff, #ffcee8 62%, #ffe8f9);
}

.tier-2.tile {
  background: linear-gradient(155deg, #dff9ff, #b7fdf3 62%, #eaffe7);
}

.tier-3.tile {
  background: linear-gradient(155deg, #ffd8ff, #ff9be3 62%, #ffeefc);
}

.is-moving.tile {
  filter: saturate(1.12) brightness(1.05);
  box-shadow:
    12px -6px 18px rgba(255, 154, 220, 0.45),
    -10px 6px 20px rgba(255, 255, 255, 0.6),
    0 28px 0 rgba(220, 40, 150, 0.08) inset;
}
</style>
