## Context

当前 `Tile.vue` 为静止方块定义 `.tier-*` 渐变底与一组 `box-shadow`；当 `sliding` 为真时追加 `.is-moving`，替换为另一套 `filter`、`box-shadow` 与 inset 高光。网格位置过渡使用 `animMs`，而 `filter`/`box-shadow` 使用 `transitionDuration` 中的 260ms，两套时长与两套几何不一致时，易出现「起步像换皮」「停顿时闪一下」的问题。

## Goals / Non-Goals

**Goals:**

- 方块在本体位移动画的全过程中，与静止态共享同一视觉语义（同款投影层级与渐变底色逻辑），消灭「静止一套 / 移动另一套」的割裂感。
- 若仍需运动感，仅用不改变基底投影体系的手段（例如轻微透明度、外层 glow、或与基底一致的叠加层）表达。

**Non-Goals:**

- 不改变 2048 规则、格子尺寸或动画时长数值的产品决策（除非为消除闪烁所必需的毫秒级对齐）。
- 不重做粒子、拖尾等棋盘级特效（除非确认与方块层级样式耦合）。

## Decisions

1. **单基底投影 + tier 渐变**：静止与滑动共用 `.tier-*` 与 `.tile` 的基础 `box-shadow`（以及一致的圆角与边框盒模型）；移除或弱化 `.is-moving` 中对 `box-shadow` / `filter` 的全量替换式覆盖。
2. **可选运动反馈**：若保留「移动中」提示，优先采用 `opacity`、`outline`/`box-shadow` 的增量叠加（同一光源方向）、或对伪元素层的动画，避免第二套 inset/外投影几何。
3. **过渡对齐**：若仍过渡 `filter`/`box-shadow`，使参与过渡的属性列表与位移阶段的感知一致——要么不在位移窗格内切换基底投影，要么让过渡时长与 `animMs` 对齐且起点终点一致。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 去掉强烈 `.is-moving` 反差后运动感略弱 | 依赖棋盘粒子/拖尾承担动感；或对方块仅用短暂 pulse |
| 浏览器合成层差异导致仍有轻微闪烁 | 在 WebKit/Safari 与 Chromium 各测一局；必要时 `will-change` 仅限动画属性 |

## Migration Plan

无需数据迁移；发布后为即时生效的前端样式更新。

## Open Questions

- 是否在移除两套投影后仍需单独的「合并瞬间」强调（若需要，应由合并逻辑单独 class 处理，而非与 `sliding` 共用一套皮肤）。
