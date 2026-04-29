## 1. 动画与常量

- [x] 1.1 将方块网格过渡改为非线性缓动（更新 `Tile.vue` 或 Board 样式），并与 `ANIM_MS` / `transitionend` 或现有 `setTimeout` 对齐，避免动画未完就结算
- [x] 1.2 确认 `ANIM_MS` 或文档注释与 UX 一致；必要时微调毫秒数配合新曲线（仍为 `ANIM_MS = 220`，与 `setTimeout` 一致）

## 2. FX：拖尾与摩擦粒子

- [x] 2.1 扩展 `FxCanvas.vue`（或拆模块）：接收滑动方向、动画窗口与移动中方块位置（可从 Board 测量 `getBoundingClientRect` 或在 composable 里下发归一化坐标）
- [x] 2.2 实现沿四轴向、依附方块后缘的拖尾渲染；`moving` 清除拖尾缓冲
- [x] 2.3 实现滑动阶段摩擦碎屑 spawn（限流 + 颜色与合并 burst 区分）；保留合并 burst 行为

## 3. 音效

- [x] 3.1 新增静态音频资源（短片段），放入 `public/` 或通过 `import` 保证相对 `base` 可用
- [x] 3.2 实现 `useAudio2048`（或等价）：预加载、`unlock`、封装 move / merge / gameOver / newBest；处理首帧自动播放限制
- [x] 3.3 在 `useGame2048` / `App.vue` 挂钩：有效滑动、合并、`lost`、`best` 更新；固定「新纪录 + 同时失败」优先级策略并注释

## 4. 验收与文档

- [x] 4.1 手动：`npm run dev` 验证缓动、拖尾、摩擦粒子、四类音效；`npm run build` + `npm run preview` 验证 itch 相对路径加载音频
- [x] 4.2 `npm run test` 通过；按需补充 Vitest（纯逻辑侧若无可跳过）
- [ ] 4.3 README 简短补充音效文件与静音降级说明（若尚无）
