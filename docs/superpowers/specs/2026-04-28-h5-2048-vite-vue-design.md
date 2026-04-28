# 可爱风 2048 H5（Vite + Vue 3）— 书面设计

> **关联 OpenSpec：** `openspec/changes/h5-2048-cute-game/`（`proposal.md`、`design.md`、`specs/h5-2048-game/spec.md`、`tasks.md`）。本文件为经确认后的 **Vue 技术侧** 细化，与 OpenSpec **行为需求**一致；若冲突以 **OpenSpec spec** 为准。

## 1. 目标与约束

- **目标**：在浏览器中可玩的 2048，**可爱**视觉；**滑动有位移动画**；动画期**闪耀粒子**；移动 tile **拖尾**；触控为主、键盘为辅；构建产物可 **zip 上传到 itch.io** 以「Run in browser」在线试玩。
- **栈**：**Vite + Vue 3 + TypeScript**（组合式 API）。
- **非目标**：后端、账号、itch 自动发布 CLI（可选后续）。

## 2. 架构总览

| 层 | 职责 |
|----|------|
| **`src/game/`** | 纯 TS：**网格、方向移动、合并、计分、随机新块、胜负**；零 Vue 依赖；**Vitest** 单测。 |
| **`src/composables/`** | `useGame2048`：编排一次滑动（调 engine → 无效则返回 → 有效则产出 **动画描述**、锁输入、等 Promise 收尾 → 应用新状态与 spawn）；`useSwipe` / `useKeyboard`：四向映射。 |
| **`src/components/`** | `Board.vue`：4×4 槽位与背景；`Tile.vue`（或列表渲染）：逻辑格 → **百分比坐标** + **`transform` 过渡**；`FxCanvas.vue`：**绝对定位、`pointer-events: none`**，粒子池 + 拖尾绘制。 |
| **根布局** | `App.vue`：顶栏分数/最佳分/重开、棋盘区域 `touch-action: none`、安全区 padding。 |

**数据流（与 OpenSpec design 一致）：** 输入方向 → engine 判断是否可动 → **不可动**：不播全量位移动画、不生成新块 → **可动**：计算下一网格与 **每块 tile 的起止格** → 并行播放 **CSS transform 动画（约 150–250ms）** + FxCanvas 粒子/拖尾 → **`transitionend` / `Promise.all` 收敛** → spawn 新块、解锁输入。

## 3. itch.io 静态发布

- **`vite.config.ts`**：`base: '/'` **不用于** itch 嵌入默认；采用 **`base: './'`**，使 `index.html` 引用的资源为相对路径。
- **产物**：`dist/index.html` + `dist/assets/*`；将整个 **`dist/` 打 zip**，在 itch 项目类型选 **HTML**，启动文件 **`index.html`**。
- **验证**：`npm run build && npx vite preview` 或静态服务器打开，确认无硬编码绝对根 URL。

## 4. 动效要点

- **可爱风**：CSS 变量（柔和背景、粉/薄荷系 tile 分级）、大圆角、`font-weight` 与浅色文字阴影保证对比度。
- **粒子**：对象池、`requestAnimationFrame`、每帧数量上限；**合并格**额外短时 burst。
- **拖尾**：移动中 tile 在 Canvas 上记录 **最近 N 个中心点**（或每 2 帧采样），画淡出折线/条带；本轮结束 **clear**。

## 5. 错误处理与测试

- **输入锁**：`isAnimating` 为真时忽略新手势。  
- **测试**：`src/game/*.test.ts` 覆盖移动、合并、spawn、game over；UI 与 Canvas 以手工 + `vite preview` 为主。

## 6. 自检（本设计稿）

- 无 TBD；与 OpenSpec **itch 静态部署**、**粒子/拖尾/动画时序** 一致。  
- 范围：单仓单页游戏，无再拆分。

---

**状态：** 已获用户「确认设计」。实现前请再扫一眼本文件与 `openspec/changes/h5-2048-cute-game/specs/h5-2048-game/spec.md`。
