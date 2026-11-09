---
name: orthographic-blueprint
description: 将结构、机械或数据主体做成工程制图纸风格的交互式单文件可视化时应使用本技能。适用于需要正交投影线稿、可见与隐藏与中心线三线型、引线编号与尺寸标注、爆炸拆解与剖切扫描、PAPER 与 INK 与 CYANOTYPE 三主题、纯 Canvas 2D 零依赖 HTML 页面的请求。触发词包括工程制图风格、蓝图、蓝晒、blueprint、正交线稿、结构图、图纸风、线框机械感、hacktron 风格可视化。
agent_created: true
---

# 正交工程制图风格可视化

## 概述

把任意主体（机械装配体、建筑构件、数据结构、抽象几何）渲染成一张「可以拖着看的工程图纸」：正交投影的墨色线稿、制图三线型、引线编号、尺寸标注、标题栏、纸感底色，配上视差与拆解交互。产出物是**一个 HTML 文件、零外部请求、双击即可运行**，不需要 Three.js 或任何构建工具。

风格源自 `structural-study` 项目（受 hacktron.ai 工程制图标注启发，几何与实现为原创）。完整的配色、线型、排版与交互数值见 `references/design-language.md`；数学与实现细节、踩过的坑见 `references/implementation.md`。

## 何时使用

- 用户要求「用这种图纸/蓝图风格做一个 X」「工程制图风可视化」「正交线稿结构图」「蓝晒风格交互图」
- 需要把复杂结构讲清楚，且希望有零件编号、规格、尺寸、剖切、爆炸视图等制图语义
- 需要单文件交付、可嵌入、可离线、可分享 URL 状态、可直接发布到静态托管

不适用：需要真实光照与材质的产品渲染、需要透视纵深的空间漫游、常规业务后台 UI、位图主导的页面。

## 设计契约（八条不可破规则）

1. **只用正交投影**：`proj(p) = [cx + p[0]*S, cy - p[1]*S, p[2]]`，绝不除以 z。立体感来自三轴旋转与运动视差，不来自透视除法。
2. **制图三线型**：可见轮廓实线、隐藏轮廓虚线 `[4,4]`、中心线与装配引导线点划线 `[12,4,2,4]`。禁止用 `wireframe: true` 冒充线稿。
3. **纸色擦除做遮挡**：环带等实体以 `fill('evenodd')` 填纸色，按中心深度用画家算法排序，近处实体擦掉远处线条；用旋转后的 z 判定前后半段可见性。
4. **固定四层绘制顺序**：图纸底纹（网格、图框、页眉、印章）→ 结构线稿 → 标注层（引线、尺寸、剖切、实时读数、标题栏）→ DOM 控制台。
5. **三主题由 CSS 变量驱动**：`:root` / `[data-theme="ink"]` / `[data-theme="cyan"]` 各定义 `--bg --ink --surface --faint --grid --hidden --accent --panel --line --soft`，绘制前用 `getComputedStyle` 读入颜色对象，同步更新 `meta[name=theme-color]`。
6. **单文件零依赖**：一个内联 `<script>`、无 `<link rel=stylesheet>`、无外部 src/href、无 fetch、无 iframe、无字体文件；体积控制在 100 KB 内。
7. **交互参数集中在 `CFG`**，几何参数集中在 `PARTS`；主题切换、拖拽惯性、滚轮、键盘、URL 状态、`PNG` 导出、调试 API 全部内置。
8. **图纸必须有语义**：零件编号 `R-01`、尺寸 `Ø 480.00 ±0.05`、比例 `SCALE 1:1`、投影方式 `PROJ. ORTHOGRAPHIC`、状态 `ASSEMBLED / EXPLODED`、坐标与角度读数、标题栏与图号。没有这些就只是线框图，不是工程图。

## 工作流

### 第 1 步：确定主体与零件表

先把主体拆成 3–6 个可命名的零件，为每个零件给出 `id`、`name`、`kind`、几何参数（半径/带宽/倾角/厚度）、爆炸方向 `boom` 与 6 条规格文本。主体可以是环、球、棱柱、桁架、分层数据流——只要能参数化即可。避免一开始就写渲染代码。

### 第 2 步：从模板生成骨架

```bash
node scripts/scaffold.mjs --out ./drawing.html \
  --title "STRUCTURE 02" --subject "TRUSS ASSEMBLY" --code "02"
```

脚本复制 `assets/drawing-template.html` 并替换占位符，默认不覆盖已有文件（`--force` 才覆盖）。模板已经包含全部设计契约：三主题、正交投影、三线型、纸色遮挡、网格与图框、引线标注、实时读数、标题栏、拖拽视差、惯性、滚轮拆解、爆炸/剖切、PNG 导出、URL 状态、reduced-motion、后台停绘、调试 API。

### 第 3 步：替换几何与文案

定位模板中的 `// REPLACE: GEOMETRY` 与 `PARTS` 数组：改写 `buildPart()` 生成 `{ fill, solid, hidden, bold, faint, marks, center, pick }` 图元，其余绘制层保持不动。文案改 `TITLE` / `SUBJECT` / `SHEET` 与尺寸标注。严格遵守 `references/design-language.md` 的线宽、字距与配色数值，不要把纸色换成纯白、不要引入渐变或阴影。

### 第 4 步：自检

```bash
node scripts/check-drawing.mjs ./drawing.html
```

校验单文件约束、内联 JS 语法、三主题、投影公式、三线型、遮挡、降级、控制台与调试 API，并扫描疑似密钥。失败必须修到全绿再继续。

### 第 5 步：视觉验证（不可跳过）

用无头 Chrome 至少截取默认态、深色主题、爆炸/选中态三张图，并注入 `window.onerror` 探测运行时错误：

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$CHROME" --headless=new --no-sandbox --disable-gpu --no-proxy-server \
  --hide-scrollbars --window-size=1440,900 --virtual-time-budget=3000 \
  --screenshot=shot-paper.png "file:///abs/path/drawing.html?intro=0&auto=0"
```

逐张检查：文字是否被控制台遮住、引线是否穿过标签、角度弧是否为完整空圆、入场动画是否卡在半途、零件是否完整显影。发现布局问题改标注排版，不要靠调颜色掩盖。

### 第 6 步：交付

交付单个 HTML，并给出可分享的 URL 状态示例（`?theme=cyan&explode=45&part=R-03`）。若需发布，静态托管直接放文件即可；若接入 GitHub Pages，构建目录加 `.nojekyll`。

## 资源清单

| 路径 | 用途 |
|---|---|
| `references/design-language.md` | 完整视觉规范：配色表、线型表、图层顺序、标注排版、动效数值、响应式与反模式。**定制造型前必读** |
| `references/implementation.md` | 数学与实现要点：旋转矩阵、深度判据、evenodd 擦除、剖切求交、字宽缓存、入场动画双进度、无头验证命令、常见坑 |
| `assets/drawing-template.html` | 可直接运行的单文件模板，所有设计契约已实现 |
| `scripts/scaffold.mjs` | 从模板生成新项目（零依赖 Node） |
| `scripts/check-drawing.mjs` | 成品自检（零依赖 Node） |
| `scripts/install.mjs` | 把本技能安装到用户级或项目级 skills 目录 |

## 定制点速查

| 想改什么 | 改哪里 |
|---|---|
| 视差幅度、拖拽灵敏度、惯性、入场时长 | `CFG` |
| 零件几何、倾角、规格文本 | `PARTS` 与 `buildPart()` |
| 三主题配色 | `<style>` 的 CSS 变量 |
| 图框、页眉、印章、网格 | `drawPaper()` |
| 引线、尺寸线、角度扇形 | `drawLeaders()` / `drawDimensions()` |
| 标题栏与实时读数 | `drawHUD()` |
| 交互开关 | 控制台 DOM 与 `st` 状态对象 |

## 验收清单

- 单文件、零外部请求、`file://` 双击可运行
- 三主题均可切换，颜色同步浏览器地址栏
- 拖拽带惯性、鼠标移动有视差、滚轮可拆解、点击可拾取零件
- 隐藏虚线与中心线点划线可辨、近处实体正确遮挡远处线条
- 每个零件有编号引线、规格与尺寸标注，标题栏完整
- `prefers-reduced-motion`、后台标签页停绘、无 Canvas 2D 降级、`<noscript>` 齐备
- `PNG` 导出包含完整图纸；URL 参数可复现指定视角
- 自检全绿、无头截图三态无遮挡无缺线、0 运行时错误

## 反模式

不要引入 Three.js / WebGL / glb 模型；不要用透视相机或「近粗远细」；不要用渐变、投影、发光、霓虹、圆角卡片、无衬线大标题；不要用外部字体或图标库；不要把所有参数硬编码进绘制循环；不要用 rAF 时间戳单独驱动入场动画；不要省略图纸语义只画一个线框球。
