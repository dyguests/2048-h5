# 方块滑动与静止样式统一 — 设计说明

**关联变更：** `openspec/changes/fix-tile-move-style-consistency/`  
**决策日期：** 2026-04-28  
**状态：** 已与产品确认（选项 A：合并反馈仅依赖棋盘粒子 / 拖尾；方块本体不设单独合并态）。

---

## 1. 背景与问题

`Tile.vue` 在静止时使用 `.tile` 与 `.tier-*` 的渐变及一组 `box-shadow`。`sliding === true` 时追加 `.is-moving`，将 `filter`、`box-shadow` 整体替换为另一套几何与 inset，且内联过渡里网格位移使用 `animMs`，`filter`/`box-shadow` 使用 260ms。结果是移动开始或结束瞬间容易出现「换皮」或闪烁，与可爱风棋盘的一体感不符。

---

## 2. 目标与非目标

**目标**

- 方块在位移动画全过程中与静止停在格子上时共用**同一套** tier 渐变与基底投影（同 OpenSpec ADDED Requirement「方块滑动与静止外观一致」）。
- 消除因 `.is-moving` 引入的第二套本体外观。

**非目标**

- 不在方块层增加「合并瞬间」专属皮肤（选项 A）；合并反馈继续由 `FxCanvas` 粒子等承担。
- 不改变 2048 规则、`animMs` 数值等产品约定；除非为移除多余过渡属性而顺带简化内联 `transition`。

---

## 3. 方案结论（brainstorming）

在三种取向中采纳 **方案 1**：去掉 `.is-moving` 对本体滤镜与投影的替换；动感由既有棋盘特效负责。

---

## 4. 组件与行为

### 4.1 `src/components/Tile.vue`

- **样式：** 删除 `.is-moving.tile` 规则块（或等价地不再应用会产生第二套投影/滤镜的类）。
- **模板：** 不再将 `sliding` 映射为换肤类名 `is-moving`；根节点可保留 **数据属性**（例如 `data-sliding`）以便调试或后续脚本，不改变视觉。
- **内联过渡：** `transitionProperty` / `transitionDuration` / `transitionTimingFunction` 仅服务于网格行列过渡（`grid-row-start`、`grid-column-start`），移除对 `filter`、`box-shadow` 的过渡项，避免与位移节拍错拍。

### 4.2 其它文件

- **`Board.vue` / `App.vue`：** 仍可传入 `sliding`；无需为视觉一致性必改调用处。
- **`FxCanvas.vue`：** 继续使用 `sliding` / `merges`；行为不变。

---

## 5. 验收

对齐 `openspec/changes/fix-tile-move-style-consistency/specs/h5-2048-game/spec.md`：

- 位移动画全程：移动中方块与同分档静止方块在配色分档与投影体系上一致。
- 动画开始与结束瞬间：无整格投影/渐变被另一套规则替换导致的跳变。

人工：至少完成一次有效滑动与一次多格滑动，目视确认无起步「换皮」与停顿闪烁。

自动化：`npm run test`（引擎与 Vitest）通过作为回归门禁。

---

## 6. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 方块自身动感减弱 | 依赖粒子与拖尾；符合选项 A |
| 移除过渡属性后仍有合成层差异 | 若出现异常再在 WebKit/Chromium 对比一轮 |
