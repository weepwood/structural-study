# STRUCTURE 01 — Gimbal Assembly

> 一台参数化多轴万向环装配体的交互式正交制图研究。**单文件、零依赖、纯 Canvas 2D**。

**在线预览**：<https://weepwood.github.io/structural-study/>

中心是一颗经纬线线框球，外面套三个倾角各异、反向自转的刻度环。整张「图纸」由代码逐帧绘制：正交投影、工程制图三线型、爆炸拆解、剖切扫描、引线编号、尺寸标注、标题栏与三种纸张主题。视觉语言受 hacktron.ai 的工程制图标注启发，但**几何、渲染与交互均为原创实现，不含任何第三方素材或运行时依赖**。

这套设计语言已沉淀为完整设计系统：[design.md](design.md)（总纲）· [在线设计系统](https://weepwood.github.io/structural-study/design-system/)（三主题 / 色板 / 组件 / 令牌表）· [tokens.json](design-system/tokens.json)（机器可读唯一数值源）；并封装为可复用的 WorkBuddy 技能包 `orthographic-blueprint`：[在线说明与下载](https://weepwood.github.io/structural-study/skill.html) · [仓库内文档](skill.html)。

---

## 特性

| | |
|---|---|
| 投影 | 正交投影（无透视除法），三轴旋转 + 鼠标视差 + 拖拽惯性 |
| 线型 | 可见轮廓实线 / 隐藏虚线 / 中心线点划线，环带 `fill('evenodd')` 按深度擦除后方线条 |
| 拆解 | EXPLODE 沿零件自身法向推开 + 竖直分层，附装配引导点划线 |
| 剖切 | SECTION 扫描线对已绘制线段求交，交点标红并显示 `SECTION A-A` |
| 拾取 | 点击任意线段选中零件，高亮并展示规格（直径 / 截面 / 材质 / 轴承 / 版本） |
| 主题 | `PAPER` 米白 / `INK` 墨黑 / `CYANOTYPE` 蓝晒，同步浏览器地址栏配色 |
| 导出 | `PNG` 按钮导出含图框、标注、标题栏的完整图纸（按设备像素比高清） |
| 降级 | `prefers-reduced-motion` 关闭自动动效；后台标签页停绘；无 Canvas 2D / JS 时给出提示 |
| 体积 | 约 34 KB，1 个 HTML、1 段内联脚本、0 个外部请求 |

## 快速开始

```bash
# 方式一：直接双击 index.html（file:// 也能跑，无 CORS 限制）
# 方式二：本地静态服务
npm run serve          # http://127.0.0.1:4173/
# 方式三：校验
npm run verify         # 55 项结构 / 语法 / 安全 / 技能包 / 令牌一致性自检
# 方式四：改设计令牌后重新生成产物
npm run tokens         # tokens.json → tokens.css + 设计系统页生成块
```

`serve.mjs`、`verify.mjs` 与 `tokens.mjs` 只用 Node 内置模块，**不需要安装任何依赖**。

## 交互

| 操作 | 效果 |
|---|---|
| 拖拽 | 旋转装配体，松手带惯性 |
| 鼠标移动 | 轻微视差偏移 |
| 滚轮 | 拆解 / 装配 |
| Shift + 滚轮 | 缩放图纸 |
| 点击线段 | 选取零件，显示规格卡 |
| `T` / `R` / `F` / `S` | 切主题 / 重置 / 随机姿态 / 导出 PNG |
| `H` / `G` / 空格 | 隐藏虚线 / 网格 / 暂停 |

控制台还提供 `HIDDEN`、`GRID`、`AUTO`、`X-RAY`（关闭实体遮挡）、`SECTION`、`PAUSE` 开关与四个滑块。

## 可分享的视图状态

URL 查询参数会覆盖默认状态，可直接把某个视角发给别人：

| 参数 | 示例 | 说明 |
|---|---|---|
| `theme` | `theme=cyan` | `paper` / `ink` / `cyan` |
| `explode` | `explode=45` | 拆解程度 0–100 |
| `section` | `section=30` | 剖切线位置 -100–100 |
| `zoom` | `zoom=130` | 图纸比例 55–200 |
| `yaw` / `pitch` | `yaw=0.8&pitch=-0.2` | 弧度 |
| `part` | `part=R-03` | 预选零件 |
| `xray` | `xray=1` | 关闭实体遮挡 |
| `auto` / `intro` | `auto=0&intro=0` | 关闭自转 / 跳过入场动画（截图、测试用） |

例：<https://weepwood.github.io/structural-study/?theme=cyan&explode=45&section=30&part=R-03>

## 实现要点

1. `rot()` 做 yaw / pitch / roll 三轴旋转，`proj()` 直接把世界坐标映射到像素；旋转后的 `z` 同时充当深度与可见性判据（球后半段画虚线）。
2. 每个零件每帧生成 `{ fill, hidden, solid, bold, faint, marks }` 图元；按中心深度排序后用画家算法绘制，近处环带以纸色填充擦掉远处线条，形成实体遮挡。
3. 剖切扫描遍历本帧所有线段与水平扫描线求交，去重后画交点标记。
4. 入场动画用「墙钟时间 + 帧计数」双进度取大值，避免后台标签页或无头渲染把装配合拢卡在半途。
5. `spaced()` 逐字符绘制带字距的图纸文字，字宽结果缓存，避免每帧数百次 `measureText`。
6. 调试接口 `window.__STRUCTURE__` 暴露 `state` / `set()` / `parts` / `reset()` / `cycleTheme()` / `exportPNG()`，便于自动化与二次集成。

## 调参位置

| 想改什么 | 改哪里 |
|---|---|
| 视差幅度、拖拽灵敏度、惯性、入场时长 | `index.html` 顶部的 `CFG` 对象 |
| 零件半径、带宽、倾角、规格文本 | `PARTS` 数组 |
| 三种主题的纸色 / 墨色 / 强调色 | `<style>` 里的 CSS 变量 `--bg` / `--ink` / `--accent` 等 |
| 图框、尺寸线、标题栏文字 | `drawPaper()` / `drawDimensions()` / `drawHUD()` |

## 工程结构

```
.
├── index.html                        # 交付成品：单文件零依赖
├── design.md                         # 设计系统总纲：原则 / 令牌 / 组件 / 验收
├── design-system/
│   ├── tokens.json                   # 唯一数值源（机器可读）
│   ├── tokens.css                    # 生成物：独立样式表
│   └── index.html                    # 可视化设计系统（单文件零依赖）
├── skill.html                        # 设计技能包说明页（Pages 可访问）
├── skills/
│   ├── orthographic-blueprint.zip    # 可直接安装的技能包
│   └── orthographic-blueprint/       # 技能源码
│       ├── SKILL.md                  # 触发条件 / 设计契约 / 工作流
│       ├── references/               # 视觉规范 + 实现参考
│       ├── assets/drawing-template.html  # 完整可运行的单文件模板
│       └── scripts/                  # scaffold / check / install（零依赖）
├── package.json                      # verify / serve 脚本（无依赖）
├── scripts/
│   ├── tokens.mjs                    # 令牌生成逻辑（纯函数，verify 复用）
│   ├── build-tokens.mjs              # 重新生成 tokens.css 与页面生成块
│   ├── verify.mjs                    # 55 项自检（含生成物一致性）
│   └── serve.mjs                     # Node 内置静态服务器
├── .github/workflows/deploy-pages.yml# GitHub Actions → GitHub Pages
├── LICENSE                           # MIT
└── README.md
```

## 设计技能包（WorkBuddy Skill）

把本项目的视觉语言封装成了可复用技能 **`orthographic-blueprint`**：以后说「用这种工程图纸风格做一个 X」，就能按同一套规范生成新的交互式制图，而不是从零重写。

**在线说明与下载**：<https://weepwood.github.io/structural-study/skill.html>

| | |
|---|---|
| 技能内容 | 八条设计契约（正交投影、三线型、纸色遮挡、四层顺序、三主题、零依赖…）、六步工作流、验收清单 |
| 规范文档 | 配色 / 线宽 / 虚线 / 图层 / 标注 / 动效数值；旋转矩阵、深度判据、剖切求交、入场动画双进度与常见坑 |
| 可直接运行的模板 | `assets/drawing-template.html`，三主题、爆炸、剖切、拾取、PNG、URL 状态、降级全部内置 |
| 工具脚本 | `scaffold.mjs` 生成新作品、`check-drawing.mjs` 39 项自检、`install.mjs` 安装到技能目录 |

**安装**（任选其一）：

```bash
# A. 解压 skills/orthographic-blueprint.zip 到 ~/.workbuddy/skills/
# B. 复制到项目的 .workbuddy/skills/（随团队共享）
# C. 脚本安装，零依赖
node skills/orthographic-blueprint/scripts/install.mjs               # 用户级
node skills/orthographic-blueprint/scripts/install.mjs --project .   # 项目级
```

**使用**：

```bash
node skills/orthographic-blueprint/scripts/scaffold.mjs \
  --out ./drawing.html --title "STRUCTURE 02" --subject "TRUSS ASSEMBLY" --code 02
# 改 PARTS 与 buildPart()（模板内标有 // REPLACE: GEOMETRY）
node skills/orthographic-blueprint/scripts/check-drawing.mjs ./drawing.html
```

模板与说明页均随 Pages 发布，可在浏览器里直接体验模板、下载 ZIP 或阅读 `SKILL.md`。技能包与项目同为 MIT 许可。

## 设计系统

**在线**：<https://weepwood.github.io/structural-study/design-system/> · **总纲**：[design.md](design.md) · **数值源**：[tokens.json](design-system/tokens.json) · **样式表**：[tokens.css](design-system/tokens.css)

在线页面可直接切换 PAPER / INK / CYANOTYPE 三主题，浏览色板、字阶、12 种线型、10 个组件、间距尺、动效参数与全部 CSS 变量，点击任意色值或变量名即可复制。

| 层 | 文件 | 说明 |
|---|---|---|
| 规则 | `design.md` | 六条原则、色彩 / 排版 / 线型 / 空间 / 组件 / 动效 / 可访问性 / 变更与验收 |
| 唯一数值源 | `design-system/tokens.json` | 10 个语义颜色角色 × 3 主题、17 级字阶、12 种线型、24 项空间与 13 项动效参数 |
| 产物 | `design-system/tokens.css` | 90 个 CSS 变量，可 `<link>` 引入配套页面；成品 `index.html` 仍内联不引用 |
| 产物 | `design-system/index.html` | 单文件零依赖的可视化设计系统，生成块由脚本注入 |
| 守门 | `scripts/tokens.mjs` + `verify.mjs` | 比对生成物与数值源，并抽查成品内联色值不漂移 |

三主题对比度（WCAG 2.1）：主墨线对纸面 **11.90–14.27:1（AAA）**，强调色 **4.94–9.39:1（AA 以上）**；PAPER 的次级文字 3.58:1 仅达大字号 AA，规范中明确限制其不得承载关键信息。

**改一个颜色的正确流程**：

```bash
vim design-system/tokens.json   # 只改数值源
npm run tokens                  # 重生成 tokens.css 与页面生成块
npm run verify                  # 55 项自检，含生成物一致性
git push origin main            # Actions 自动重新部署 Pages
```

`design.md` 与技能包 `references/design-language.md` 的表格需同步更新，避免数值漂移。

## 部署

推送到 `main` 即触发 `.github/workflows/deploy-pages.yml`：先跑 `verify.mjs` 自检，再把 `index.html`、`skill.html`、`design.md`、`skills/` 与 `design-system/` 复制进 `_site/`（附 `.nojekyll`），用官方 `configure-pages` / `upload-pages-artifact` / `deploy-pages` 发布。仓库 Pages 的 Build source 已设为 **GitHub Actions**（`build_type=workflow`），`github-pages` 环境的 branch policy 允许 `main`。也可在 Actions 页手动 `Run workflow`（或 `gh workflow run deploy-pages.yml`）重新部署 —— 若某次 push 触发的 run 因平台抖动未启动 deploy 阶段，手动触发一次即可补齐。

## 许可

[MIT](LICENSE) © 2026 weepwood
