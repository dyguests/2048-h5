<script setup lang="ts">
import Tile from './Tile.vue';
import FxCanvas from './FxCanvas.vue';
import type { TileVM } from '../game/view';

defineProps<{
  tiles: TileVM[];
  animMs: number;
  sliding: boolean;
  merges: { row: number; col: number }[];
}>();
</script>

<template>
  <div class="surface" role="presentation" v-bind="$attrs">
    <div class="holes" aria-hidden="true">
      <div v-for="n in 16" :key="n" class="hole" />
    </div>

    <div class="tiles">
      <Tile
        v-for="t in tiles"
        :key="t.id"
        :value="t.value"
        :row="t.row"
        :col="t.col"
        :anim-ms="animMs"
        :sliding="sliding"
      />
    </div>

    <FxCanvas :merges="merges" :sliding="sliding" :anim-ms="animMs" />
  </div>
</template>

<style scoped>
.surface {
  --pad: clamp(10px, 3vw, 14px);
  --gap: clamp(10px, 3vw, 12px);
  --cell-size: calc(
    (100% - 2 * var(--pad) - 3 * var(--gap)) / 4
  );
  position: relative;
  width: min(92vw, 420px);
  aspect-ratio: 1 / 1;
  padding: var(--pad);
  border-radius: 28px;
  box-shadow:
    0 12px 32px rgba(186, 120, 255, 0.18),
    0 6px 0 rgba(255, 255, 255, 0.6) inset;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.88),
      rgba(255, 239, 250, 0.78)
    );
  touch-action: none;
  user-select: none;
}

.holes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap);
  height: 100%;
}

.hole {
  border-radius: 16px;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.4), transparent),
    rgba(214, 199, 255, 0.28);
}

.tiles {
  position: absolute;
  inset: var(--pad);
  pointer-events: none;
  --cell-size: calc((100% - 3 * var(--gap)) / 4);
}
</style>
