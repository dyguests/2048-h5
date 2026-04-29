## 1. 逻辑与触发

- [x] 1.1 在 `useGame2048` 结算路径中识别本轮合并的幸存方块（优先使用 `mergeEvents` / `mergedCells` + `spawnTile` 后网格），生成短时 **`pulseTileIds`**（或等价集合），并在 **`ANIM_MS` 结束且 DOM 已反映新棋盘后**下一帧挂载脉冲标记
- [x] 1.2 脉冲播放完毕后清除标记（`animationend` / `transitionend` / 定时兜底），避免重复触发或泄漏状态

## 2. 视图与样式

- [x] 2.1 `Board.vue` / `Tile.vue`：向合并脉冲目标 **`Tile`** 传入布尔或一次性 token（以实现为准）
- [x] 2.2 `Tile.vue`：`transform-origin: center`；使用 **`@keyframes`** 或 **`transition`** 实现 **`scale(1) → scale(>1) → scale(1)`**，时长落在规格所述区间；不改变 tier 渐变规则下的投影「换皮」

## 3. 验收

- [x] 3.1 本地试玩：单次合并与双合并同回合均可见脉冲；静止与非合并移动方块无脉冲
- [x] 3.2 `npm run test`；`npm run build` 通过
