## 1. 规格对齐

- [x] 1.1 对照 `openspec/changes/fix-tile-move-style-consistency/specs/h5-2048-game/spec.md` 中新增需求，确认验收口径（静止 vs 滑动全程、起止帧）

## 2. 样式与实现（Tile）

- [x] 2.1 审阅 `src/components/Tile.vue` 中 `.tile` / `.tier-*` / `.is-moving` 与内联 `transitionProperty` 的组合，按 `design.md` 将「基底」统一到单套投影与渐变
- [x] 2.2 调整或移除 `.is-moving` 中对 `filter`、`box-shadow` 的全量替换；若保留动感，仅用与基底兼容的叠加手段，并核对与 `animMs` 的过渡是否无闪跳
- [x] 2.3 在移动端与桌面各完成至少一次有效滑动与多格滑动，目视确认无「起步换皮」与「停顿闪一下」

## 3. 回归

- [x] 3.1 运行 `npm run test`（若项目含相关用例）并手动试玩合并、重开流程
