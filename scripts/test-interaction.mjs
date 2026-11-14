/**
 * Headless interaction-contract smoke tests.
 * A minimal DOM/canvas fake exercises the real inline application, without npm dependencies.
 * This is not a replacement for cross-browser visual testing.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(js,'inline app script found');

function createApp(query=''){
  const elements=new Map(), captures=new Set(), keyboard=new Map(), canvasEvents=new Map();
  const classNames=new Map();
  let copied='', draws=0, nextFrame=null;
  function element(id){
    if(elements.has(id)) return elements.get(id);
    const classes=new Set();
    const attrs=new Map();
    classNames.set(id,classes);
    const el={
      id, style:{}, dataset:{}, textContent:'', value:'', innerHTML:'',
      classList:{
        add(k){classes.add(k)},remove(k){classes.delete(k)},
        contains(k){return classes.has(k)},
        toggle(k){if(classes.has(k)){classes.delete(k);return false} classes.add(k);return true}
      },
      setAttribute(k,v){attrs.set(k,String(v))},
      getAttribute(k){return attrs.get(k)},
      addEventListener(k,fn){(id==='c'?canvasEvents:keyboard).set(id+':'+k,fn)},
      setPointerCapture(id){captures.add(id)},
      hasPointerCapture(id){return captures.has(id)},
      releasePointerCapture(id){captures.delete(id)},
      getContext(){return ctx},
      closest(){return null}
    };
    elements.set(id,el);
    return el;
  }
  const ctx=new Proxy({
    measureText(ch){return {width:[...ch].length*6}},
    beginPath(){draws++}
  },{
    get(target,key){
      if(key in target) return target[key];
      if(['moveTo','lineTo','arc','fillRect','strokeRect','translate'].includes(key)){
        return (...args)=>{
          assert.ok(args.every(Number.isFinite),'non-finite canvas coordinate in '+String(key));
        };
      }
      return ()=>{};
    },
    set(target,key,val){target[key]=val;return true}
  });
  const toggles=['hidden','grid','auto','xray','sectionOn','paused'].map((k,i)=>{
    const t=element('toggle'+i);t.dataset.k=k;return t;
  });
  const document={
    documentElement:{dataset:{theme:'paper'}},
    hidden:false, body:{insertAdjacentHTML(){}},
    getElementById:element,
    querySelector(){return element('meta-theme')},
    querySelectorAll(){return toggles}
  };
  const window={
    innerWidth:390,innerHeight:844,devicePixelRatio:1,
    matchMedia(){return {matches:false}},
    addEventListener(type,fn){keyboard.set(type,fn)},
    prompt(){return null},
    document
  };
  const location={
    href:'https://example.test/structural-study/'+query,
    search:query
  };
  const navigator={clipboard:{async writeText(s){copied=s}}};
  const sandbox={document,window,location,navigator,URL,URLSearchParams,
    getComputedStyle(){return {getPropertyValue(){return '#777'}}},
    requestAnimationFrame(fn){nextFrame=fn},
    setTimeout(){}, console
  };
  vm.runInNewContext(js,sandbox,{filename:'index.html:inline',timeout:3000});
  const fire=(type,data)=>{const fn=canvasEvents.get('c:'+type);assert.ok(fn,'canvas event '+type);fn({button:0,pointerType:'touch',...data})};
  const click=id=>{const cb=keyboard.get(id+':click');assert.ok(cb,id+' click registered');return cb()};
  return {api:window.__STRUCTURE__,element,fire,click,keyboard,classes:classNames,
    copied:()=>copied,draws:()=>draws,document,
    frame(now){assert.ok(nextFrame,'animation frame scheduled');nextFrame(now)}};
}

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<0.0001,actual+' ≉ '+expected);

{
  const app=createApp('?zoom=NaN&yaw=Infinity&part=missing&intro=0');
  const st=app.api.state;
  near(st.zoom,1);
  near(st.yaw,-0.62);
  assert.equal(st.selected,null);
  assert.equal(app.element('fold').getAttribute('aria-expanded'),'false');
  console.log('PASS invalid URL values and initial compact panel');
}
{
  const app=createApp('?intro=0');
  const initialYaw=app.api.state.yaw;
  app.fire('pointerdown',{pointerId:1,clientX:100,clientY:100});
  app.fire('pointermove',{pointerId:1,clientX:120,clientY:105});
  assert.ok(app.api.state.yaw>initialYaw,'single touch rotates');
  app.fire('pointerdown',{pointerId:2,clientX:250,clientY:105});
  app.fire('pointermove',{pointerId:2,clientX:300,clientY:105});
  assert.ok(app.api.state.zoom>1.3 && app.api.state.zoom<1.5,'two touch pinch zooms');
  assert.equal(+app.element('zoom').value,Math.round(app.api.state.zoom*100));
  app.fire('pointercancel',{pointerId:2,clientX:300,clientY:105});
  app.fire('pointerup',{pointerId:1,clientX:120,clientY:105});
  assert.equal(app.api.state.dragging,false,'pointer cancellation cleans up drag');
  app.fire('pointerdown',{pointerId:3,clientX:100,clientY:100});
  app.fire('pointerup',{pointerId:3,clientX:100,clientY:100});
  assert.equal(app.api.state.dragging,false,'next touch gesture still works');
  console.log('PASS touch drag, pinch zoom, cancellation, next gesture');
}
{
  const app=createApp('?intro=0');
  app.api.set({themeIdx:2,zoom:1.55,explode:.4,selected:'R-04'});
  const link=new URL(app.api.shareUrl());
  assert.equal(link.searchParams.get('theme'),'cyan');
  assert.equal(link.searchParams.get('zoom'),'155');
  assert.equal(link.searchParams.get('explode'),'40');
  assert.equal(link.searchParams.get('part'),'R-04');
  assert.equal(app.element('btnTheme').textContent,'CYANO');
  assert.equal(+app.element('zoom').value,155);
  await app.click('btnShare');
  assert.equal(app.copied(),app.api.shareUrl());
  assert.equal(app.element('a11yStatus').textContent,'当前视角链接已复制');
  console.log('PASS shareable view and accessibility announcement');
}
{
  const app=createApp('?zoom=Infinity&explode=NaN&pitch=NaN&intro=0');
  // An actual draw with the built-in Canvas API fake checks more than JS syntax.
  // Motion starts at zero while geometry must always stay finite.
  const frame=app.api.state;
  assert.ok(Number.isFinite(frame.yaw) && Number.isFinite(frame.pitch));
  assert.equal(frame.explode,0);
  assert.equal(frame.zoom,1);
  app.frame(16);
  assert.ok(app.draws()>20,'Canvas actually renders finite geometry');
  console.log('PASS draw input guard and finite Canvas geometry');
}
console.log('\n4/4 interaction test groups passed');
