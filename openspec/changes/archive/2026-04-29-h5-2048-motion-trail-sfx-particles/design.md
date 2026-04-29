## Context

仓库为 Vite + Vue 2048：`Tile` 使用 Grid 行列过渡实现位移，`ANIM_MS` 约 220ms；`FxCanvas` 负责 shimmer 随机粒子与合并 burst，尚无沿滑动方向的轨迹绘制与摩擦语义粒子；无音频管线。

## Goals / Non-Goals

**Goals:**

- 位移过渡采用**非线性缓动**，视觉上呈现加速→减速。
- **Canvas（或等价层）**绘制沿四向、贴合方块运动的拖尾。
- **摩擦碎屑**：滑动周期内在路径邻域发射浅色小颗粒 / 短线条，区别于合并 burst。
- **音效**：移动、合并、失败、新纪录；静态资源相对路径；解锁策略符合浏览器策略。

**Non-Goals:**

- 不改变核心网格逻辑与胜负判定。
- 不引入后端/CDN；第三方音效托管可选但默认离线打包。

## Decisions

1. **缓动**：在 `Tile.vue`（或 Board 注入 CSS 变量）将 `transition-timing-function` 从近似匀速改为 **cubic-bezier 缓入缓出**（具体数值以实现微调为准）；与 `ANIM_MS` 同长，避免与逻辑 `setTimeout` 脱拍（若脱拍则同时调整常量或改用 `transitionend`）。
2. **拖尾**：在 `FxCanvas` 增加**第二条渲染通道**或数据结构：接收本 tick 的移动中瓦片屏幕位置、**滑动方向向量**与 `animMs`，用短寿命分段或带状 alpha 梯度沿反向拖出；每轮 `moving` 结束清空 trail 缓冲。
3. **摩擦粒子**：滑动阶段在移动瓦片底边「与格线接触」一侧按方向 spawn 小颗粒，速度沿滑动反向微弹、寿命短；与 `shimmerTick` 并发但限流；合并仍用既有 burst。
4. **音效**：采用 **`HTMLAudioElement` 或 Web Audio `AudioBuffer`（`import` 静态资源 URL）**；集中 `useAudio2048()` 封装 `playMove|playMerge|playGameOver|playNewBest`，在 `executeMove` / 合并结算 / `lost` / `best` 更新处分发；首次用户手势后 `unlock`。
5. **新纪录 vs 失败同帧**：若本步同时 `best` 更新与 `game over`，优先播**新纪录**再或短叠失败 — 在实现中二选一并写入代码注释（任务单中明确一种顺序）。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| iOS 自动播放静默 | 首次 tap 后再 `resume`/`play`；无音不抛错 |
| Canvas 过载 | 粒子 cap、拖尾点数上限 |
| 资源体积 | 使用短片段、压缩格式、并型只选 1～2 种容器格式 |

## Migration Plan

新增资源文件需加入 `git`；`README` 可补一句音效与相对路径自检。无数据迁移。

## Open Questions

- 音效资源采用现成 CC0 素材或生成占位 beep —— 任务阶段用可替换占位文件即可。
