# DESIGN — Orthographic Blueprint Design System

> **版本 1.0.0 / REV A · 2026-11-10 · MIT**
> 适用项目：`structural-study`（STRUCTURE 01 · Gimbal Assembly）及其派生的图纸风格页面。
> **唯一数值来源**：[`design-system/tokens.json`](design-system/tokens.json)。本文件描述规则与理由，数值一律以令牌文件为准。

**在线设计系统**：<https://weepwood.github.io/structural-study/design-system/>

---

## 0. 这份文档是什么

一套把「工程图纸」变成界面语言的设计系统：定义纸、墨、线、字、间距、组件、动效与降级规则，并给出可直接消费的机器可读令牌。它不是风格说明散文，而是**可以执行、可以校验的契约**。

### 0.1 文档分层（避免多处改数值）

| 层 | 文件 | 职责 | 谁改它 |
|---|---|---|---|
| 总纲 | `design.md`（本文件） | 设计原则、规则、组件目录、验收与变更流程 | 设计决策变更时 |
| 数值源 | `design-system/tokens.json` | **所有颜色 / 字阶 / 线宽 / 间距 / 动效的唯一数值** | 改任何数值时 |
| 产物 | `design-system/tokens.css` | 独立样式表，供配套页面 `<link>` 引入 | **自动生成，禁止手改** |
| 产物 | `design-system/index.html` | 可视化设计系统（三主题、色板、组件、令牌表） | 仅改非生成区，生成块自动注入 |
| 实现 | `index.html` | 单文件成品，令牌以 CSS 变量内联，`CFG` 为手感参数 | 改渲染 / 交互时 |
| 可携带规范 | `skills/orthographic-blueprint/references/design-language.md` | 同一套风格随技能包分发给别的项目 | 与 tokens.json 同步更新 |

`npm run tokens` 从 JSON 重新生成两个产物；`npm run verify` 会比对生成物与数值源是否一致，不一致即失败。四层数值不允许各自漂移。

### 0.2 六条设计原则

1. **正投影，不透视**：不做透视除法，线宽不随深度变化。立体感来自姿态旋转 + 运动视差，而非近大远小。
2. **信息分层靠线型**：可见实线 / 隐藏虚线 / 中心线点划线承担三种信息层级；颜色只做点睛。
3. **纸先于屏幕**：有底色、网格、图框、裁切角标、印章、标题栏；拒绝渐变、发光、玻璃拟态、圆角大卡片。
4. **令牌即契约**：三主题结构相同、仅换变量值；任何颜色不得写死在实现里。
5. **零依赖可离线**：系统等宽字栈，无 webfont / 图标库 / CDN；成品与文档页都能以 `file://` 打开。
6. **可测量、可退化**：每个零件有编号与尺寸；无 JS / 无 Canvas / reduced-motion / 后台标签页都有明确降级路径。

### 0.3 适用场景与边界

适合：结构 / 机械 / 数据主体的交互式图解、参数化装配体、需要零件编号与尺寸标注的可视化。
不适合：内容型长文阅读、电商与营销落地页、需要真实材质与光影的产品渲染。

---

## 1. 色彩系统

### 1.1 十个语义角色

颜色永远按**角色**使用，不按色值使用。实现中通过 `readTheme()` 读取 CSS 变量并写入 Canvas 调色板 `C`，因此 CSS 与 Canvas 共用一套值。

| 变量 | 角色 | 用于 |
|---|---|---|
| `--bg` | 纸面 / 擦除底色 | 整幅背景；标题栏、标签底板、尺寸文字背后的擦除块 |
| `--ink` | 主墨线 | 可见轮廓、正文、页眉、尺寸值 |
| `--surface` | 实体面 | 环带 `fill('evenodd')` 填充，用于遮挡后方线条 |
| `--faint` | 极淡辅助 | 厚度侧边、背面刻度、120px 主网格、剖面短斜线 |
| `--grid` | 细网格 | 24px 方格纸 |
| `--hidden` | 隐藏线 | 被实体遮住的轮廓，`[4,4]` 虚线 |
| `--accent` | 强调 / 点睛 | 印章、角标、剖切、选中、实时读数、滑块拇指 |
| `--panel` | 控制台底 | 半透明浮层，配 `backdrop-filter: blur(9px)` |
| `--line` | 结构分隔 | 图框、页眉分隔、尺寸线、面板描边、卡片边框 |
| `--soft` | 次级文字 | 引线、副行规格、状态说明、脚注 |

### 1.2 三主题取值

| 变量 | PAPER 米白 | INK 墨黑 | CYANOTYPE 蓝晒 |
|---|---|---|---|
| `--bg` | `#f0ebe4` | `#171512` | `#0f2b52` |
| `--ink` | `#211e1a` | `#e9e3d8` | `#e2edf8` |
| `--surface` | `#ece6de` | `#1e1b17` | `#14325e` |
| `--faint` | `rgba(33,30,26,.13)` | `rgba(233,227,216,.14)` | `rgba(226,237,248,.16)` |
| `--grid` | `rgba(33,30,26,.055)` | `rgba(233,227,216,.06)` | `rgba(226,237,248,.075)` |
| `--hidden` | `rgba(33,30,26,.30)` | `rgba(233,227,216,.28)` | `rgba(226,237,248,.32)` |
| `--accent` | `#b23d22` | `#e87048` | `#ffcb63` |
| `--panel` | `rgba(240,235,228,.94)` | `rgba(23,21,18,.94)` | `rgba(15,43,82,.95)` |
| `--line` | `rgba(33,30,26,.30)` | `rgba(233,227,216,.30)` | `rgba(226,237,248,.32)` |
| `--soft` | `rgba(33,30,26,.55)` | `rgba(233,227,216,.58)` | `rgba(226,237,248,.62)` |

规则：

- 纸面不是纯白，墨色不是纯黑；保留低对比的暖 / 冷灰层次。
- 强调色**只用于小面积**，绝不大面积铺色或填充实体。
- 主题切换只改 `[data-theme=…]` 属性；`meta[name=theme-color]` 必须同步为当前 `--bg`。
- 三主题结构相同，仅变量换值。新增主题 = 在 `tokens.json.themes` 加一项 + 设计系统页面加一个按钮。

### 1.3 对比度（WCAG 2.1，rgba 先与 `--bg` 合成）

| 主题 | ink / bg | accent / bg | soft / bg | hidden / bg |
|---|---|---|---|---|
| PAPER | 14.00 · AAA | 4.94 · AA | 3.58 · AA 大字号 | 1.87 · 装饰 |
| INK | 14.27 · AAA | 5.94 · AA | 5.48 · AA | 2.22 · 装饰 |
| CYANOTYPE | 11.90 · AAA | 9.39 · AAA | 5.50 · AA | 2.51 · 装饰 |

**已知取舍（如实记录）**：PAPER 主题的 `--soft` 为 3.58:1，达不到正文 AA（4.5:1）。因此 `--soft` **不得承载关键操作信息**，只用于引线副行、脚注、状态说明；关键状态与读数一律用 `--ink` 或 `--accent`。`--hidden` 是装饰性隐藏线，不承担信息传达。若需要严格正文对比度，可把 PAPER 的 soft 提到 `rgba(33,30,26,.68)`（约 5.0:1），代价是图纸层次变重。

---

## 2. 排版系统

- **字族**：`ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`。只用系统等宽栈，中文随系统回退，不指定中文字族，不加载 webfont。
- **字重**：400 / 600 / 700，仅标题与规格 ID 用 600–700。
- **字距**：Canvas 文字用 `spaced()` 逐字符绘制并缓存字宽（`charWidthCache`），字距参数 `sp` 取 0.7–1.4；不依赖 `ctx.letterSpacing`。DOM 用 `letter-spacing`，面板 .06em / 面板头 .16em / 眉标 .3em。

### 2.1 字阶（px，全部小号字）

| 令牌 | 值 | 用途 | 令牌 | 值 | 用途 |
|---|---|---|---|---|---|
| `--fs-header` | 12 | 页眉主行 | `--fs-title-block` | 10 | 标题栏主行 |
| `--fs-header-sub` | 9 | 页眉副行 | `--fs-title-block-small` | 8.5 | 标题栏副行 |
| `--fs-readout` | 10 | 实时读数 | `--fs-hint` | 9.5 | 底部操作提示 |
| `--fs-readout-small` | 9 | 读数副行 | `--fs-canvas-label` | 9 | 刻度数字 |
| `--fs-dimension` | 10 | 尺寸值 | `--fs-panel` | 10 | 控制台 |
| `--fs-leader` | 9.5 | 引线主行 | `--fs-panel-small` | 9 | 控制台副行 |
| `--fs-leader-sub` | 8.5 | 引线副行 | `--fs-toggle` / `--fs-button` | 10 / 9 | 开关 / 按钮 |
| `--fs-doc-body` / `--fs-doc-heading` | 13 / 40 | 文档页正文 / 标题 | | | |

### 2.2 格式约定

全大写英文 + 数字，编号 `R-NN`，坐标补零到 4 位，角度保留一位小数：

| 场景 | 格式 |
|---|---|
| 直径 | `Ø 480.00 ±0.05` |
| 高度 | `H 480.00` |
| 角度 | `YAW θ -35.5°` |
| 坐标 | `X 0480  Y 0210` |
| 比例 | `SCALE 1:1.00` |
| 状态 | `STATE ASSEMBLED / EXPLODED 45%` |

---

## 3. 线型与图层

统一 `lineCap='butt'`、`lineJoin='round'`；不用 `shadowBlur`、渐变、按深度缩放线宽。`globalAlpha` 仅印章（.75）与十字准星（.55）可用。

### 3.1 线型表（CSS 像素）

| 令牌 | 线型 | 颜色 | 宽 | 虚线 | 用途 |
|---|---|---|---|---|---|
| `--lw-bold` | 主轮廓 | `--ink` | 1.55 / 选中 2.0 | — | 外轮廓、球体大圆 |
| `--lw-solid` | 可见结构 | `--ink` | 1.05 / 选中 1.45 | — | 内轮廓、刻度、经纬线 |
| `--lw-hidden` | 隐藏结构 | `--hidden` | 0.85 | `4,4` | 被实体遮住的轮廓 |
| `--lw-faint` | 辅助线 | `--faint` | 0.8 | — | 厚度侧边、背面刻度、剖面线 |
| `--lw-center` | 中心线 | `--faint` | 1.0 | `12,4,2,4` | 两条结构基准轴 |
| `--lw-guide` | 装配引导 | `--accent` | 0.8 | `9,4,2,4` | 爆炸视图回位点划线 |
| `--lw-section` | 剖切扫描 | `--accent` | 1.3 | `9,4,2,4` | 水平剖切线 |
| `--lw-section-hit` | 剖切交点 | `--accent` | 1.4 | — | 交点短竖标记 |
| `--lw-frame` | 图框 | `--line` | 1.0 | — | 16px 内缩矩形 |
| `--lw-corner` | 裁切角标 | `--accent` | 1.2 | — | 四角 L 形短线 |
| `--lw-dimension` | 尺寸线 | `--line` | 0.9 | — | 带实心三角箭头 |
| `--lw-leader` | 引线 | `--soft` | 0.8 | — | 三段折线 + 端点双圆点 |

选中态把整套墨线换成 `--accent`，不是加发光、不是加粗到夸张。

### 3.2 每帧绘制顺序

1. `drawPaper()` — 底色、24px 细网格 + 120px 主网格、16px 图框、四角角标、页眉与分隔线、`ORIGINAL` 印章。
2. `drawAxes()` — 两条点划线中心轴、基准地面线 + 每 13px 一条 45° 剖面短斜线、`DATUM ±0.00`。
3. `drawPrim()` × N — 按零件中心 z 排序；先 `fill('evenodd')` 填 `--surface` 做实体擦除，再 hidden → faint → solid → bold → 节点方块 → 刻度数字 → 爆炸引导线。
4. `drawSection()` — 扫描线、与线段求交、去重标记、`SECTION A-A`。
5. `drawLeaders()` / `drawDimensions()` / `drawHUD()` — 引线编号、尺寸线、角度扇形、读数、准星、标题栏。
6. DOM 控制台 — 浏览器合成层，永远在最上。

**遮挡机制**：没有深度缓冲。近处环带以纸色填充覆盖后方线条（画家算法），X-RAY 开关跳过第 3 步的填充即可看穿内部。标签必须先用 `--bg` 擦出底板再画引线，否则引线会穿过文字。

---

## 4. 空间与布局

| 值 | 令牌 | 说明 |
|---|---|---|
| 24 / 120 px | `--sp-grid` / `--sp-major-grid` | 方格纸细网格 / 主网格 |
| 16 px | `--sp-frame-inset` | 图框内缩 |
| 7 / 22 px | `--sp-corner-mark-short/long` | 四角裁切角标 |
| 30 / 36 / 50 px | `--sp-header-x/y/rule-y` | 页眉起点与分隔线 |
| 78 / 95 / 112 / 129 px | `space.readoutY` | 左上四行读数 |
| 22 / 252 px | `--sp-panel-right/bottom/width` | 控制台定位与宽度（窄屏 210px，折叠 150px） |
| 246 × 72 px | `--sp-title-block-*` | 左下标题栏，三行两列分隔 |
| 186 × 30 px | `--sp-label-plate-*` | 引线标签擦除底板 |
| 50 px | `--sp-leader-min-gap` | 同侧标签最小间距，超出下边界整组上移 |
| 300 px | `--sp-leader-right-inset` | 桌面端右侧标签避让控制台 |
| 13 px | `--sp-pick-radius` | 点击拾取半径 |
| 2 | `--sp-dpr-max` | 最大设备像素比（无单位） |

**响应式**：`DPR = min(2, devicePixelRatio)`；`baseScale = min(W/(W<720?640:1060), H/700)`；中心 `cx=W/2`、`cy = W<720 ? H*0.42 : H/2-6`。断点 mobile 720px、doc 640px。结构整体随视口缩放，标注保持固定像素字号；窄屏右侧标签 `cap = H*0.52` 并上移，控制台避让 `env(safe-area-inset-*)`。

---

## 5. 组件目录

| ID | 组件 | 状态 | 主要令牌 | 实现位置 |
|---|---|---|---|---|
| C-01 | 图纸画布 | default / dragging / selected / exploded / section | `--bg --ink --line --accent` | `index.html → draw()` |
| C-02 | 控制台 | open / folded | `--panel --line --soft` | `index.html → .panel` |
| C-03 | 参数滑块 | idle / active（2px 轨道、9×9 方拇指） | `--line --accent --soft` | `input[type=range]` |
| C-04 | 方形开关 | off / on / hover / focus | `--line --soft --accent` | `.tg` |
| C-05 | 动作按钮 | idle / hover / focus | `--line --panel --accent` | `.btns .tg` / `.btn` |
| C-06 | 规格卡 | empty / populated / selected | `--line --soft --accent` | `.spec` |
| C-07 | 引线编号 | default / selected | `--bg --soft --ink --accent` | `drawLeaders()` |
| C-08 | 标题栏 | static | `--bg --line --soft --accent` | `drawHUD()` |
| C-09 | 印章 | static（-6° ~ -10° 倾斜） | `--accent` | `drawPaper()` / `.stamp` |
| C-10 | 文档图框 | static | `--line --accent --grid` | `skill.html` / 设计系统页 `.frame` |

**通用组件规则**：1px 描边、无圆角、无投影堆叠加（仅控制台允许 `0 10px 34px rgba(0,0,0,.09)`）、hover 只换描边与文字色并 `translateY(-2px)`、focus 用 2px `--accent` 外描边。激活开关底色为 `color-mix(in srgb, var(--accent) 8%, transparent)`。

---

## 6. 交互与动效

所有手感参数集中在 `index.html` 顶部 `CFG`，与 `tokens.json.motion` 一一对应。

| 参数 | 值 | 含义 |
|---|---|---|
| `followYaw` / `followPitch` | `.16` / `.11` | 鼠标视差最大弧度 |
| `parallaxEase` | `.06` | 视差缓动 |
| `dragSpeed` | `.006` | 拖拽弧度 / 像素 |
| `inertia` | `.93` | 松手速度衰减 |
| `autoSpin` | `.0016` | 自动自转系数 |
| `introMs` / `introFrames` | `1900` / `100` | 装配合拢动画的墙钟 / 帧计数双进度 |
| `wheelExplode` / `wheelZoom` | `.0006` / `.0008` | 滚轮灵敏度 |
| `pickRadius` | `13` | 点击拾取半径 |
| `introEasing` | `1-(1-t)³` | 三次缓出 |
| `panelTransition` | `.18s` | 文档页 / 按钮过渡 |

**入场动画**：零件从爆炸位逐层合拢、按索引错开 0.13 依次显影。进度必须取 `clamp((Date.now()-t0)/introMs)` 与 `clamp(frameCount/introFrames)` 的**较大值**——只用 rAF 时间戳时，后台标签页或无头渲染会把动画卡在半途，只剩淡线。

**交互清单**：拖拽旋转（惯性）、鼠标视差、滚轮拆解、Shift+滚轮缩放、点击拾取、键盘 `T/R/F/S/H/G/空格`、四个滑块、六个开关、PNG 导出。

**URL 状态**：`theme explode section zoom yaw pitch part xray auto intro`。例 `?theme=cyan&explode=45&section=30&part=R-03`。用于分享视图，也用于自动化截图（`intro=0&auto=0` 跳过动画）。

---

## 7. 可访问性与降级

| 场景 | 处理 |
|---|---|
| Canvas 语义 | `<canvas role="img" aria-label="可交互的正交投影…">` |
| 键盘 | `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }` |
| 动效敏感 | `prefers-reduced-motion` 关闭自转与入场动画 |
| 无 JS | `<noscript>` 静态提示 |
| 无 Canvas 2D | 插入 `.fallback` 提示，不白屏 |
| 后台标签页 | `document.hidden` 时跳过绘制 |
| 性能 | `spaced()` 字宽 `Map` 缓存；DPR 上限 2 |
| 地址栏 | `meta[name=theme-color]` 随 `--bg` 同步 |
| 导出 | `toBlob` 为主、`toDataURL` 降级；按 DPR 输出高清图 |

---

## 8. 工程落地

### 8.1 文件地图

```
design.md                              # 本文件：规则与流程
design-system/
├── tokens.json                        # 唯一数值源
├── tokens.css                         # 生成物：独立样式表
└── index.html                         # 可视化设计系统（单文件零依赖）
scripts/
├── tokens.mjs                         # 生成逻辑（纯函数，供 verify 复用）
├── build-tokens.mjs                   # CLI：npm run tokens
├── verify.mjs                         # 自检（含生成物一致性）
└── serve.mjs                          # Node 内置静态服务
index.html                             # 成品：单文件，令牌内联
skill.html                             # 技能说明页
skills/orthographic-blueprint/         # 可复用技能包
.github/workflows/deploy-pages.yml     # Actions → Pages
```

### 8.2 三条命令

```bash
npm run tokens    # JSON → tokens.css + 设计系统页生成块
npm run verify    # 结构 / 语法 / 资源 / 密钥 / 技能包 / 令牌一致性自检
npm run serve     # 本地预览 http://127.0.0.1:4173/
```

全部只用 Node 内置模块，**不需要 `npm install`**。

### 8.3 零依赖契约

- 成品 `index.html`：1 个 HTML、1 段内联 `<script>`、0 个外部请求、< 100 KB、`file://` 可直接运行。
- `tokens.css` 是给**配套页面**用的；成品不引用它（内联变量），因此离线与单文件不受影响。
- 设计系统页自身也是单文件零依赖：生成块把 `tokens.css` 全文与 `TOKENS` 数据直接内联进去。

### 8.4 令牌命名规范

| 前缀 | 含义 | 单位 |
|---|---|---|
| `--bg --ink --accent …` | 语义颜色角色 | 颜色值 |
| `--fs-*` | 字阶 | px |
| `--track-*` | 字距 | px（Canvas 镜像）或 em |
| `--fw-*` | 字重 | 无单位 |
| `--lw-*` / `--dash-*` | 线宽 / 虚线序列 | 无单位数字（CSS 用 `calc(v*1px)`） |
| `--sp-*` | 空间与尺寸 | px（DPR 例外） |
| `--bp-*` | 断点 | px |
| `--mo-*` | 动效系数与时长 | 无单位 / ms / s |

命名用 kebab-case，禁止出现 `--red`、`--color-1` 这类与语义无关的名字；新增令牌必须同时写进 `tokens.json` 与本文件对应表格。

---

## 9. 变更流程与验收

### 9.1 改数值（三步）

1. 只改 `design-system/tokens.json`。
2. `npm run tokens` 重新生成 `tokens.css` 与设计系统页的生成块。
3. `npm run verify` + 三主题无头截图核对，通过后提交；`git push` 会由 Actions 自动重新部署 Pages。

若同时影响成品实现（`index.html` 里的内联 CSS 变量、`CFG`），必须两边同步，`verify.mjs` 会抽查关键值。技能包 `references/design-language.md` 中的表格也要同步，否则跨项目复用会得到旧数值。

### 9.2 版本号规则

- **PATCH**：修文案、修文档排版、加示例。
- **MINOR**：新增令牌 / 组件 / 主题，不破坏既有取值。
- **MAJOR**：改既有令牌语义、改线型体系、改投影方式。

### 9.3 交付验收清单

- [ ] `npm run verify` 全绿（含生成物一致性）
- [ ] `node --check` 成品与页面内联脚本通过
- [ ] 无头浏览器截取 PAPER / INK / CYANOTYPE 三态，注入 `window.onerror` 探测为 0 运行时错误
- [ ] 爆炸 / 剖切 / 选中高亮三态截图，标签不被控制台遮挡
- [ ] 三主题 `meta[name=theme-color]` 与 `--bg` 一致
- [ ] 成品 0 外部请求、`file://` 可运行
- [ ] `prefers-reduced-motion`、无 JS、无 Canvas 2D 三种降级路径均可见提示
- [ ] 设计系统页色板、线型样本、令牌表与 `tokens.css` 逐字一致

### 9.4 反模式

| 禁止 | 原因 |
|---|---|
| 透视相机 / 按 z 缩放线宽 | 破坏正投影语义，退化为 3D 渲染 |
| wireframe 直出、无可见隐藏层级 | 线太密，失去信息层级 |
| 渐变、发光、玻璃拟态、圆角大卡片 | 与纸面印刷质感冲突 |
| 纯白 `#fff` / 纯黑 `#000` / 高饱和霓虹 | 失去暖灰 / 蓝晒层次 |
| 大面积强调色或彩色实体填充 | 强调色只允许点睛 |
| 无编号无尺寸的「线框球」 | 只是线框图，不是工程图 |
| 外部字体、图标库、CDN | 破坏零依赖与离线运行 |
| 标签压线、引线穿过文字 | 工程图最忌阅读干扰 |
| 手改生成块 / 各处各写一份色值 | 令牌漂移，校验失效 |

---

## 10. 术语

| 术语 | 含义 |
|---|---|
| 正交投影 | 投影线互相平行，无透视除法，`proj(p) = [cx + x·S, cy − y·S, z]` |
| 三线型 | 可见实线 / 隐藏虚线 / 中心线点划线 |
| 纸色擦除 | 用 `--bg` 或 `--surface` 填充覆盖后方线条，代替深度缓冲 |
| 画家算法 | 按零件中心 z 排序后由远及近绘制 |
| 爆炸视图 | 零件沿自身法向推开 + 竖直分层，附回位引导线 |
| 剖切扫描 | 水平线与本帧线段求交，标记交点并标注 `SECTION A-A` |
| 双进度 | 入场动画取墙钟进度与帧计数进度的较大值 |

---

*Orthographic Blueprint Design System · REV A · 2026.11.10 · [MIT](LICENSE) © 2026 weepwood*
