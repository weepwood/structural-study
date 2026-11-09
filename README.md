# STRUCTURE 01 — Gimbal Assembly

> 一台参数化多轴万向环装配体的交互式正交制图研究。**单文件、零依赖、纯 Canvas 2D**。

**在线预览**：<https://weepwood.github.io/structural-study/>

中心是一颗经纬线线框球，外面套三个倾角各异、反向自转的刻度环。整张「图纸」由代码逐帧绘制：正交投影、工程制图三线型、爆炸拆解、剖切扫描、引线编号、尺寸标注、标题栏与三种纸张主题。视觉语言受 hacktron.ai 的工程制图标注启发，但**几何、渲染与交互均为原创实现，不含任何第三方素材或运行时依赖**。

这套设计语言已封装为可复用的 WorkBuddy 技能包 `orthographic-blueprint`，随本项目一同发布：[在线说明与下载](https://weepwood.github.io/structural-study/skill.html) · [仓库内文档](skill.html)。

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
npm run verify         # 结构 / 语法 / 安全 / 技能包自检，无需 npm install
```

`serve.mjs` 与 `verify.mjs` 只用 Node 内置模块，**不需要安装任何依赖**。

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
│   ├── verify.mjs                    # 结构、语法、资源、密钥、技能包自检
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

## 部署

推送到 `main` 即触发 `.github/workflows/deploy-pages.yml`：先跑 `verify.mjs` 自检，再把 `index.html`、`skill.html` 与 `skills/` 复制进 `_site/`（附 `.nojekyll`），用官方 `configure-pages` / `upload-pages-artifact` / `deploy-pages` 发布。仓库 Pages 的 Build source 已设为 **GitHub Actions**（`build_type=workflow`）。也可在 Actions 页手动 `Run workflow` 重新部署。

## 许可

[MIT](LICENSE) © 2026 weepwood
