## Context

合并结算后引擎已在 `mergedCells` / `mergeEvents` 中给出合并位置；`tilesVm` 刷新后幸存方块带有新值与新 id（依引擎而定）。缩放脉冲须在**合并结果已在棋盘上就位之后**触发一次，避免与整盘滑动位移过渡打架。

## Goals / Non-Goals

**Goals:**

- 幸存合并方块可见 **`transform: scale`** 从小幅放大回到 **1** 的一次性动画。
- 时长短、曲线柔和（ease-out / spring-ish cubic-bezier），不遮挡数字阅读。
- 同一回合多处合并可各自触发（每个幸存格一次）。

**Non-Goals:**

- 不改变合并逻辑、分数或粒子/SFX。
- 不把缩放做成永久「大一档」占位（必须回落到 **1**）。

## Decisions

1. **触发信号**：在 `executeMove` 结算、`spawnTile` 后的网格上，依据 **`mergeEvents` 或 `mergedCells` + `flattenGrid`** 解析每个合并幸存 **`survivingId`**（或等价 tile id），写入 **`pulseMergeIds: Set<string>`**（或短时数组 + `nextTick` 清空）；**下一帧或 RAF** 后对 Tile 挂载 **`data-merge-pop`** / class **`is-merge-pop`**。
2. **实现**：优先 **`Tile.vue`** 根节点 **`transform-origin: center`** + **`@keyframes`** 或 **`transition`** on **`transform`**；动画结束 **`transitionend`** / **`animationend`** 移除 class，防止下一跳继承。
3. **与外观一致**：仅用 **`transform`/`opacity`**，不切换 tier 渐变投影基底（符合既有「不换皮」条文）。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 与网格滑动动画重叠 | 脉冲在 **slide `ANIM_MS` 结束后**、新网格渲染后再触发 |
| 多处合并性能 | CSS 动画 GPU 友好；脉冲时长固定短小 |

## Migration Plan

无数据迁移；可选 README 一行说明合并动效。

## Open Questions

- 若同一 `id` 不存在连续合并边界情况——以实现按引擎 **`survivingId`** 为准。
