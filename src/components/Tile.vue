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

/** 与 Board 中 .holes 使用同一套 4×4 + gap 网格，避免 translate+calc 在部分浏览器下失效导致 tiles 堆叠。 */
const gridPlace = computed(() => ({
  gridRowStart: String(props.row + 1),
  gridColumnStart: String(props.col + 1),
  transitionProperty: 'grid-row-start, grid-column-start',
  transitionDuration: `${props.animMs}ms, ${props.animMs}ms`,
  transitionTimingFunction:
    'cubic-bezier(0.33, 1, 0.68, 1), cubic-bezier(0.33, 1, 0.68, 1)',
}));
</script>

<template>
  <div
    class="tile"
    :class="`tier-${tier}`"
    :data-sliding="sliding"
    :style="gridPlace"
  >
    <span>{{ value }}</span>
  </div>
</template>

<style scoped>
.tile {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  border-radius: 18px;
  display: grid;
  place-items: center;

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
</style>
