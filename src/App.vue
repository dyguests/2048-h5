<script setup lang="ts">
import Board from './components/Board.vue';
import { useGame2048 } from './composables/useGame2048';
import { useKeyboard } from './composables/useKeyboard';
import { useSwipe } from './composables/useSwipe';

const {
  score,
  best,
  lost,
  winBanner,
  moving,
  tilesVm,
  executeMove,
  newGame,
  continueAfterWin,
  lastMergeCells,
  lastDirection,
  mergePulseIds,
  clearMergePulse,
  unlockAudio,
  ANIM_MS,
} = useGame2048();

useKeyboard(executeMove);
const swipe = useSwipe(executeMove);
</script>

<template>
  <div class="app-shell" @pointerdown.once="unlockAudio">
    <header class="hud">
      <div>
        <p class="title">可爱 2048</p>
        <p class="sub">滑动合并方块；合成 2048 后仍可继续</p>
      </div>

      <div class="scores">
        <div class="pill">
          <span class="muted">分数</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="pill">
          <span class="muted">最佳</span>
          <strong>{{ best }}</strong>
        </div>
        <button type="button" class="pill btn" @click="newGame">重开</button>
      </div>
    </header>

    <section class="center">
      <Board
        :tiles="tilesVm"
        :anim-ms="ANIM_MS"
        :sliding="moving"
        :merges="moving ? lastMergeCells : []"
        :direction="lastDirection"
        :merge-pulse-ids="mergePulseIds"
        :clear-merge-pulse="clearMergePulse"
        v-bind="swipe"
      />
    </section>

    <div v-if="winBanner" class="overlay soft">
      <p>做得好！已经出现了 2048～</p>
      <button type="button" class="pill btn" @click="continueAfterWin">
        继续玩
      </button>
    </div>

    <div v-if="lost" class="overlay">
      <p>棋盘满啦，无法再移动</p>
      <button type="button" class="pill btn" @click="newGame">再来一局</button>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100dvh;
  padding: max(14px, env(safe-area-inset-top))
    clamp(14px, 6vw, 28px)
    max(20px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.hud {
  width: min(92vw, 420px);
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.title {
  margin: 0;
  font-size: clamp(22px, 6vw, 30px);
  font-weight: 800;
}

.sub {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.78;
}

.scores {
  display: flex;
  gap: 10px;
  align-items: center;
}

.pill {
  min-width: 84px;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow:
    0 4px 0 rgba(200, 150, 255, 0.18),
    0 14px 32px rgba(160, 100, 200, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pill.btn {
  border: none;
  cursor: pointer;
  justify-content: center;
  font: inherit;
  font-weight: 700;
}

.muted {
  font-size: 12px;
  opacity: 0.55;
}

.pill strong {
  font-size: 18px;
}

.center {
  width: min(92vw, 420px);
  display: grid;
  place-items: center;
}

.overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 14px;
  backdrop-filter: blur(6px);
  background: rgba(40, 10, 50, 0.35);
  color: white;
  z-index: 10;
}

.overlay.soft {
  background: rgba(80, 20, 60, 0.22);
}

.overlay p {
  font-size: 18px;
  margin: 0;
}
</style>
