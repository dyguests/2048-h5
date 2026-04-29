# Tile 合并缩放脉冲 — 设计说明

**关联 OpenSpec：** `openspec/changes/tile-merge-scale-pop/`  
**决策：** 峰值缩放 **B 档（约 1.10～1.14）**，实现取值建议 **`scale(1.12)`** 作为关键帧顶点（可在 ±0.02 内微调观感）。

---

## 1. 目标与约束

- 合并结算后，仅在**幸存方块**上出现一次 **放大 → 回到 1** 的脉冲；不改变游戏规则与棋盘占位语义。
- **仅用 `transform`（及必要时短透明度）**，不替换 tier 渐变与基底投影（符合「方块滑动与静止外观一致」）。
- 脉冲起始于 **`ANIM_MS` 滑动动画结束之后**、`spawnTile` 后的网格已在 DOM 上反映之时。

---

## 2. 实现取向（三种 + 推荐）

| 取向 | 做法 | 优点 | 代价 |
|------|------|------|------|
| **A. CSS `@keyframes`** | `.tile.is-merge-pop { animation: merge-pop 260ms ease-out forwards }` | 一次声明、易调峰值与时间 | 需在结束时移除 class |
| **B. `transition` + 二次类切换** | 先加 `.merge-pop-start` 再下一帧 `.merge-pop-end` | 无关键帧也可 | 代码分支多，易抖 |
| **C. Vue `<Transition>`** | 包裹条件渲染 | 适合进出场 | 合并方块始终渲染，不适用 |

**推荐 A**：与现有 Vue + scoped CSS 一致；峰值 **1.12**，总时长建议 **240～280ms**（落在 OpenSpec 150～350ms）。

---

## 3. 数据流（概要）

1. `executeMove` 内保留 **`res.mergeEvents`**：对每个事件取 **`survivingId`**（引擎已与格子对齐）。
2. `await` 滑动 **`ANIM_MS`** 后执行 **`spawnTile`**、`moving = false` 等现有逻辑。
3. **`await nextTick()`** 后，将本轮 **`survivingId`** 写入 **`mergePulseIds: Ref<Set<string>>`**（或等价结构）。
4. **`Board` → `Tile`**：`:merge-pop="mergePulseIds.has(t.id)"`。
5. **`Tile`**：`transform-origin: center`；**`merge-pop` 为真**时挂载 **`is-merge-pop`**（或等价），播放关键帧；在 **`animationend`**（或对 webkit 前缀兜底）或 **`setTimeout(300ms)`** 通知父级从 Set 移除该 **id**，防止下一轮残留。

多处合并：同一 **`Set`** 含多个 **id**，各 **`Tile`** 独立播放。

---

## 4. 验收

- 单次合并、同回合双合并：幸存格均有脉冲；仅位移无合并无脉冲。
- 无明显与邻格重叠错觉（峰值遵循 B 档）。
- `npm run test`、`npm run build` 通过。
