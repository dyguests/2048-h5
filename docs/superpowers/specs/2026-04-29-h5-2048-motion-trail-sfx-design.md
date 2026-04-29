# H5 2048：位移缓动、拖尾、摩擦粒子与音效 — 设计说明

**关联 OpenSpec：** `openspec/changes/h5-2048-motion-trail-sfx-particles/`  
**决策日期：** 2026-04-29  
**Normative：** `openspec/changes/h5-2048-motion-trail-sfx-particles/specs/h5-2048-game/spec.md`

---

## 1. 目标

在不改动 2048 核心规则的前提下：

1. **位移动画**：网格过渡使用**非线性缓动**，观感上为先加速再减速（见 OpenSpec「缓动加减速感知」）。
2. **拖尾**：Canvas 层绘制**沿本次滑动轴向**、依附移动方块后方的淡出轨迹；本轮 `moving` 结束时清空。
3. **摩擦碎屑**：滑动窗口内向路径边缘 spawn **小而淡**的颗粒，与合并 burst、全局 shimmer 区分；数量上限可控。
4. **音效**：移动、合并、失败、新纪录四类短音；静态打包、`base` 相对路径可用；浏览器自动播放策略下**静默降级**。

---

## 2. 已定产品决策（brainstorming）

**同一回合结算时「刷新历史最佳」且「无路可走（失败）」：**

- **仅播放「新纪录」音效，不播放失败音效。**  
实现须在 `executeMove` 结算分支内显式分支：`newBestThisTurn && gameOverThisTurn` → `playNewBest()` **单独**，勿调用 `playGameOver()`。

其它情况下：**失败只播失败**；**仅刷新最佳但未失败**只播新纪录（若单独一步只有 best 更新）。

---

## 3. 架构与数据流

| 单元 | 职责 |
|------|------|
| **`useGame2048`** | 保持 `ANIM_MS`；在每次有效 `executeMove(dir)` 开始时记下 **`lastDirection`**（供 FX）；结算后根据 `mergedCells`、`lost`、`score` vs `best` 触发音效回调（或由 composable 内调用 `useAudio2048`）。 |
| **`Board.vue`** | 将 **`direction`**（四向枚举或向量）、`animMs`、`sliding`、`merges`、`tiles` 传给 **`FxCanvas`**；可选用 `ResizeObserver`/几何不变公式保证 Fx 与棋盘同尺度（已有 `FxCanvas` measure）。 |
| **`FxCanvas.vue`** | 现有 shimmer + merge burst；**新增**：拖尾缓冲区（按 tile id 或全局本轮采样）、摩擦粒子 spawn（仅在 `sliding` 且方向已知时）；每帧合并绘制顺序：清屏 → 拖尾 → 摩擦/shimmer → burst 粒子。 |
| **`Tile.vue`** | **收紧缓动曲线**（例如 stronger ease-in-out），保持仅过渡 `grid-row/column`，时长 `animMs`。 |
| **`useAudio2048`**（新） | `unlock()`（首次 pointerdown）、`playMove`、`playMerge`、`playGameOver`、`playNewBest`；内部 `Audio` 或预加载 URL；播放失败 catch 为空。 |

---

## 4. 音效触发映射（推荐）

| 事件 | 触发时机 |
|------|-----------|
| Move | 有效滑动开始或位移动画开始时一次（避免每格一声） |
| Merge | `mergedCells.length > 0` 且合并 burst 时刻对齐（可与现有 timeout 对齐） |
| New best | `score > prevBest` 结算瞬间 |
| Game over | `isGameOver` 置真 **且本拍未播 new-best-over-game-over** |

---

## 5. 验收

- 目视：滑动有明显加减速；拖尾沿滑动反向淡出；摩擦颗粒细碎不遮挡数字。
- 音频：`preview` 构建下四类音效可加载；DevTools 网络面板可见相对路径请求。
- 逻辑：`npm run test` 仍通过；必要时仅为 audio composable 保留纯函数测试或跳过 DOM。

---

## 6. 非目标

不重写引擎；不把音效上传 CDN；不把拖尾做成永久 Canvas 污渍。
