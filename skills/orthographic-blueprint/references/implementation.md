# 实现参考 — 从数学到交付

配合 `SKILL.md` 与 `design-language.md` 使用。所有代码片段来自 `structural-study/index.html` 与技能模板，仅用 Canvas 2D 与原生 DOM API。

## 1. 正交投影与三轴旋转

```js
function rot(p, y, pi, ro){
  const cy=Math.cos(y), sy=Math.sin(y), cp=Math.cos(pi), sp=Math.sin(pi), cr=Math.cos(ro), sr=Math.sin(ro);
  const x1 = p[0]*cy + p[2]*sy, z1 = -p[0]*sy + p[2]*cy;
  const y2 = p[1]*cp - z1*sp, z2 = p[1]*sp + z1*cp;
  return [x1*cr - y2*sr, x1*sr + y2*cr, z2];  // z 不随 roll 改变 → z 即相机深度
}
const proj = p => [cx + p[0]*S, cy - p[1]*S, p[2]];  // 无透视除法
```

要点：roll 只在屏幕平面内旋转，不改变 z，因此 `p[2]` 可直接当作深度与可见性判据。相机在 +z，z>0 为朝向相机的一侧。`S` 是像素/单位比例，`cx/cy` 是图纸中心。

变换顺序始终是「模型自转 → 零件倾角 → 爆炸位移 → 全局 yaw/pitch/roll → proj」。把零件自身的变换封装成闭包 `T(localPoint)`，避免每帧重复推导矩阵。

## 2. 每帧图元协议

`buildPart(P, idx, now, boomAdd)` 返回：

```js
{ P, alpha, depth, fill, hidden:[], solid:[], bold:[], faint:[], marks:[], center, pick:[] }
```

- 线段统一为 `[x1,y1,x2,y2]` CSS 像素数组，便于分组批绘、拾取与剖切求交。
- `fill` 为 `[外轮廓点集, 内轮廓点集]`，用 `poly()` + `fill('evenodd')` 画环形实体。
- `depth` 取零件中心投影后的 z，用于画家算法排序（升序/降序需与实际遮挡方向一致，先画远的）。
- `pick` 收集所有可点击线段，点击时用点到线段的距离 `distToSeg()` 与 `CFG.pickRadius` 判定。
- 显隐判据：`(prevZ + curZ)/2 > 0` 判可见，否则进 `hidden`；环带用 `(outer[k][2]+outer[k+1][2])/2 >= centerZ` 判前半段。

## 3. 纸色擦除遮挡（关键技巧）

```js
function drawPrim(pr){
  if(pr.fill && !st.xray){
    ctx.beginPath(); poly(pr.fill[0]); poly(pr.fill[1].slice().reverse());
    ctx.fillStyle = C.surface; ctx.fill('evenodd');   // 用纸色盖住后方线条
  }
  strokeGroup(pr.hidden, C.hidden, .85, [4,4]);
  strokeGroup(pr.faint,  C.faint,  .8);
  strokeGroup(pr.solid,  C.ink,  1.05);
  strokeGroup(pr.bold,   C.ink,  1.55);
}
```

原理：不是做深度缓冲，而是按中心深度排序后，用不透明的纸色填充近处实体，把已绘制的远处线条擦掉，再画自己的轮廓。优点是零依赖、无 WebGL；缺点是必须保证排序正确，且 `X-RAY` 开关要能跳过填充以看穿内部。

`strokeGroup()` 把同类线段合并到一个 `beginPath()` 里一次 `stroke()`，是 60fps 的关键；不要逐条 `stroke()`。

## 4. 剖切扫描

```js
for(const pr of prims) for(const g of [pr.solid, pr.bold, pr.hidden]) for(const s of g){
  if((s[1]-sy)*(s[3]-sy) < 0){
    const t = (sy - s[1]) / (s[3] - s[1]);
    hits.push(s[0] + (s[2]-s[0])*t);
  }
}
hits.sort((a,b)=>a-b);  // 去重：相邻 < 7px 视为同一交点
```

扫描线是水平点划线 `[9,4,2,4]`，交点画 8px 短竖线，标签底板用 `--bg` 擦出后写 `SECTION A-A`，两端标 `A`。

## 5. 文字与性能

`spaced(str,x,y,sp,size,color,align)` 逐字符绘制以模拟工程图字距。字宽缓存：

```js
const charWidthCache = new Map();
function charW(ch, font){
  const key = font + '|' + ch;
  let w = charWidthCache.get(key);
  if(w === undefined){ ctx.font = font; w = ctx.measureText(ch).width; charWidthCache.set(key, w); }
  return w;
}
```

每帧数百次 `measureText` 会明显掉帧，缓存后基本零成本。其它性能约束：`DPR` 上限 2；`document.hidden` 直接跳过 `draw()`；`requestAnimationFrame` 只在可见时推进。

## 6. 入场动画：墙钟 + 帧计数双进度

```js
const wall  = st.t0 < 0 ? 1 : clamp((Date.now() - st.t0)/CFG.introMs, 0, 1);
const frame = clamp(frameCount / CFG.introFrames, 0, 1);
const intro = Math.max(wall, frame);
const ease  = 1 - Math.pow(1-intro, 3);
const boomAdd = (1-ease)*0.92;                       // 从爆炸位合拢
pr.alpha = clamp((intro*1.45 - i*0.13)/0.42, 0, 1); // 逐件显影
```

**踩过的坑**：最初只用 rAF 时间戳 `now` 计时，在无头 Chrome 与后台标签页里动画卡在半途，截图只剩淡线、零件不完整。改用 `Date.now()` 墙钟 + 帧计数取大值后，任何环境都能在有限帧内完成合拢。`?intro=0` 时把 `st.t0` 设为 `-1e9` 直接跳到终态，方便截图。

## 7. 状态、主题与 URL

- `st` 集中所有可变状态：`yaw/pitch/roll`、`velY/velP` 惯性、`parX/parY` 视差、`explode/spin/zoom/section`、`hidden/grid/auto/xray/sectionOn/paused`、`selected/themeIdx`、`t0`。
- `readTheme()` 用 `getComputedStyle(document.documentElement).getPropertyValue('--'+k)` 把 10 个 CSS 变量读进 `C` 对象，切主题后必须重新调用；同时更新 `meta[name=theme-color]`。
- `applyQuery()` 在初始化末尾解析 `URLSearchParams`，覆盖默认状态，随后 `syncToggles()` + `updateSpec()` 同步 UI。参数：`theme/explode/section/zoom/yaw/pitch/part/xray/auto/intro`。
- `window.__DRAWING__`（项目里是 `__STRUCTURE__`）暴露 `state` / `set()` / `parts` / `reset()` / `cycleTheme()` / `exportPNG()`，便于自动化与二次集成。

## 8. 导出与降级

```js
function savePNG(){
  const a = document.createElement('a');
  a.download = 'drawing.png';
  try { a.href = cv.toBlob ? URL.createObjectURL(...) : cv.toDataURL('image/png'); }
  catch { a.href = cv.toDataURL('image/png'); }   // 大画布或跨域时的降级
  a.click();
}
```

降级链：无 Canvas 2D → 插入 `.fallback` 提示；无 JS → `<noscript>`；`prefers-reduced-motion` → 关闭自转与入场；后台标签页 → 停绘。导出的是**整张图纸**（含图框、标注、标题栏），因为一切都画在同一张 canvas 上。

## 9. 无头验证命令（Windows / Git Bash）

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
FILE="file:///D:/path/drawing.html"
"$CHROME" --headless=new --no-sandbox --disable-gpu --no-proxy-server \
  --hide-scrollbars --window-size=1440,900 --virtual-time-budget=3000 \
  --screenshot=shot-paper.png "$FILE?intro=0&auto=0"
```

运行时错误探测：复制一份 HTML，在 `<script>` 前注入

```html
<script>window.addEventListener("error",e=>{document.title="JSERROR: "+e.message});</script>
```

再用 `--dump-dom` 抓 `<title>`。注意：注入后会有两个 `<script>`，只用于临时副本，不要污染交付文件。

其它环境坑：`curl` 访问 localhost 需 `--noproxy '*'`（全局代理会劫持本地请求）；Windows 下 `.bat` 必须纯 ASCII + CRLF；批量改文件用 `open(path,'w',newline='')` 保留 LF。

## 10. 常见缺陷与修法

| 现象 | 原因 | 修法 |
|---|---|---|
| 右侧零件标签被控制台遮住 | 标签 x 贴着窗口右缘 | 桌面端右侧标签收在 `W-300`，移动端上移并限制 `cap` |
| 角度指示画成空整圆 | `ctx.arc(...,0,end)` 没有闭合扇形 | `moveTo(圆心)` + `arc` + `closePath()`，负角用 `anticlockwise` |
| 爆炸层次读不出来 | 只沿法向平移 | 叠加竖直分层 `-(idx-2)*boom*0.78` 与回位引导点划线 |
| 入场动画卡在半途 | rAF 时间戳在后台/无头不推进 | 墙钟 + 帧计数取大值 |
| 引线穿过文字 | 先画引线后写字 | 先用 `--bg` 擦标签底板，再画引线，最后写字 |
| 每帧掉帧 | 逐条 stroke、重复 measureText | `strokeGroup()` 合批 + 字宽 Map 缓存 |
| `file://` 下场景空白 | 用了 ES module / fetch / importmap | 保持单文件内联脚本、零外部请求 |
| 提交后 Pages 未更新 | workflow 只复制了 index.html | 构建步骤把新增页面/目录一并复制进 `_site/` |
