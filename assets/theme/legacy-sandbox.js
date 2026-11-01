/* The restored model shares the product header, navigation and service dock. */
(()=>{
 'use strict';
 const app=document.querySelector('#app'),modes=document.querySelector('.scene-modes'),stage=window.qixiaArtStage,q=window.qixia;
 if(!app||!modes||!stage||!q)return;
 const panel=document.createElement('section');panel.className='legacy-sandbox';panel.hidden=true;panel.setAttribute('aria-label','3D 沙盘');
 const frame=document.createElement('iframe');frame.title='栖霞山 3D 交互模型';
 const loading=document.createElement('div');loading.className='sandbox-loading';loading.textContent='正在展开 3D 山境…';loading.setAttribute('role','status');
 panel.append(frame,loading);app.append(panel);
 const tools=document.createElement('div');tools.className='sandbox-tools';tools.hidden=true;tools.innerHTML='<button data-action="in" aria-label="放大沙盘">＋</button><button data-action="out" aria-label="缩小沙盘">−</button><button data-action="reset" aria-label="重置沙盘视图">⤢</button>';app.append(tools);
 const controlsBar=document.createElement('div');controlsBar.className='sandbox-options';controlsBar.hidden=true;
 controlsBar.innerHTML='<div class="sandbox-options-row"><button data-menu="weather" aria-expanded="false" aria-controls="sandbox-options-panel">天气 · <span>读取中</span>⌄</button><button data-menu="bus" aria-expanded="false" aria-controls="sandbox-options-panel">观光车⌄</button><button data-menu="gate" aria-expanded="false" aria-controls="sandbox-options-panel">出入口⌄</button></div><section id="sandbox-options-panel" class="sandbox-options-panel" hidden></section>';app.append(controlsBar);
 const optionsPanel=controlsBar.querySelector('section'),weatherNames={clear:'晴天',partly:'多云',overcast:'阴天',rain:'下雨',fog:'薄雾',snow:'飘雪'};let activeMenu=null;
 function closeOptions(){activeMenu=null;optionsPanel.hidden=true;controlsBar.querySelectorAll('[data-menu]').forEach(b=>b.setAttribute('aria-expanded','false'))}
 function syncOptions(){
  controlsBar.querySelectorAll('button').forEach(b=>b.disabled=!model);
  if(!model)return;
  const wx=model.wx;controlsBar.querySelector('[data-menu=weather] span').textContent=wx.demo?(weatherNames[wx.demo]||'模拟')+' · 模拟':wx.ok?'实时':'默认';
  for(const key of ['bus','gate']){const on=model.$('.layers [data-l='+key+']').getAttribute('aria-pressed')==='true';controlsBar.querySelector('[data-menu='+key+']').dataset.on=String(on);optionsPanel.querySelector('[data-layer='+key+']')?.setAttribute('aria-pressed',String(on))}
  optionsPanel.querySelectorAll('[data-weather]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.weather===(wx.demo||'live'))));
 }
 function openOptions(menu){
  if(!model)return;if(activeMenu===menu){closeOptions();return}activeMenu=menu;optionsPanel.hidden=false;optionsPanel.setAttribute('aria-label',menu==='weather'?'天气设置':menu==='bus'?'观光车设置':'出入口设置');
  controlsBar.querySelectorAll('[data-menu]').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.menu===menu)));
  optionsPanel.innerHTML=menu==='weather'?'<strong>山中天气</strong><div class="sandbox-weather-grid">'+Object.entries(weatherNames).map(([key,name])=>'<button data-weather="'+key+'" aria-pressed="false">'+name+'</button>').join('')+'</div><button class="sandbox-live" data-weather="live" aria-pressed="false">跟随实时天气</button><small>模拟只改变沙盘效果，不代表现场天气。</small>':'<strong>'+(menu==='bus'?'观光车':'出入口与停车')+'</strong><button class="sandbox-layer" data-layer="'+menu+'" aria-pressed="false">'+(menu==='bus'?'显示车辆与站点':'显示出入口与停车场')+'<span aria-hidden="true"></span></button><button class="sandbox-open-detail" data-detail="'+menu+'">'+(menu==='bus'?'查看线路 · 模拟乘车':'查看出入口 · 停车信息')+' →</button><small>'+(menu==='bus'?'车辆与车次为模拟演示。':'人数与停车余位为估算。')+'</small>';
  syncOptions();
 }
 app.addEventListener('click',e=>{if(panel.hidden||!model||!e.target.closest('[data-service=bus]'))return;e.preventDefault();e.stopImmediatePropagation();q.hush();closeOptions();model.transit.openFleet()},true);
 controlsBar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!model)return;if(b.dataset.menu){openOptions(b.dataset.menu);return}if(b.dataset.weather){if(b.dataset.weather==='live'){model.wx.demo='rain';model.$('#wx-pill').click()}else model.setWeather(b.dataset.weather);syncOptions();return}if(b.dataset.layer){model.$('.layers [data-l='+b.dataset.layer+']').click();syncOptions();return}if(b.dataset.detail){closeOptions();if(b.dataset.detail==='bus')model.transit.openFleet();else model.gates.open()}});
 document.addEventListener('pointerdown',e=>{if(!controlsBar.contains(e.target))closeOptions()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeMenu){const opener=controlsBar.querySelector('[data-menu='+activeMenu+']');closeOptions();opener.focus()}});
 const style=document.createElement('style');style.textContent=`
 .legacy-sandbox{position:absolute;inset:calc(64px + env(safe-area-inset-top)) 0 195px;z-index:2;background:#eee9dc;overflow:hidden}
 .legacy-sandbox[hidden],.sandbox-tools[hidden],.sandbox-options[hidden]{display:none!important}
 .legacy-sandbox iframe{display:block;width:100%;height:100%;border:0}
 .sandbox-loading{position:absolute;inset:0;display:grid;place-items:center;background:#f5f0e5;color:#657b68;font:14px var(--serif);pointer-events:none}
 .sandbox-loading[hidden]{display:none}
 .sandbox-tools{position:absolute;right:12px;bottom:253px;transform:translateY(-42px);z-index:5;display:flex;flex-direction:column;gap:7px}
 .sandbox-tools button{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;border:1px solid #fff7e9;background:#fbf8eeeb;font:20px Georgia;color:#50644f;box-shadow:0 3px 12px #5e634212}
 .sandbox-options{position:absolute;top:calc(76px + env(safe-area-inset-top));left:12px;z-index:8;width:min(310px,calc(100% - 24px))}
 .sandbox-options-row{display:flex;gap:5px}.sandbox-options-row button{min-height:38px;flex:1;white-space:nowrap;padding:7px 9px;border:1px solid #d8ddcf;border-radius:20px;background:#faf8efee;color:#50644f;font:11px var(--serif);box-shadow:0 2px 8px #38544008}
 .sandbox-options-row button[aria-expanded=true]{background:#254d3d;color:#fff9ed;border-color:#254d3d}.sandbox-options-row button[data-on=true]:before{content:'●';font-size:7px;color:#88a17d;margin-right:4px}
 .sandbox-options-panel{margin-top:8px;padding:14px;border:1px solid #e0ddce;border-radius:16px;background:#fcf9f1fa;box-shadow:0 12px 30px #27433520;color:#385440}.sandbox-options-panel[hidden]{display:none}
 .sandbox-options-panel strong{display:block;font:15px var(--serif);margin-bottom:9px}.sandbox-options-panel small{display:block;font-size:10px;line-height:1.7;color:#7b887b;margin-top:9px}
 .sandbox-options-panel button{font-size:12px;min-height:38px;border:1px solid #dbe0d2;border-radius:10px;background:#f5f3e9;color:#50644f}.sandbox-weather-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.sandbox-options-panel [data-weather][aria-pressed=true]{background:#254d3d;color:#fff9ed;border-color:#254d3d}
 .sandbox-live,.sandbox-layer,.sandbox-open-detail{width:100%;margin-top:8px;padding:9px}.sandbox-layer{display:flex;align-items:center;justify-content:space-between}.sandbox-layer span{width:27px;height:16px;background:#c7cbbf;border-radius:10px;padding:2px}.sandbox-layer span:after{content:'';display:block;width:12px;height:12px;border-radius:50%;background:white;transition:transform .18s}.sandbox-layer[aria-pressed=true] span{background:#557b61}.sandbox-layer[aria-pressed=true] span:after{transform:translateX(11px)}
 .sandbox-options-row button:disabled{opacity:.5}.sandbox-detail-open .sandbox-options,.sandbox-detail-open .sandbox-tools,.sandbox-detail-open #app>.guide-agent-launch,.sandbox-riding .sandbox-options,.sandbox-riding .sandbox-tools,.sandbox-riding #app>.guide-agent-launch{visibility:hidden!important;pointer-events:none!important}
 .sandbox-tools button:disabled{opacity:.45;cursor:default}
 body.legacy-sandbox-open #app>#scene,body.legacy-sandbox-open #app>#labels{visibility:hidden;pointer-events:none}
 body.legacy-sandbox-open #app>.hud,body.legacy-sandbox-open #app>.compass,body.legacy-sandbox-open #app>.layers{display:none!important}
 @media(orientation:landscape) and (max-height:520px){.legacy-sandbox{top:54px;bottom:128px}.sandbox-options{top:60px;left:10px;width:290px}.sandbox-options-panel{max-height:130px;overflow:auto}.sandbox-tools{bottom:154px;transform:none;flex-direction:row}}
 `;document.head.append(style);
 let model=null,fitModel=null;
 function syncTools(){const d=model?.camera.position.distanceTo(model.controls.target);tools.querySelectorAll('button').forEach(b=>{b.disabled=!model||(b.dataset.action==='in'&&d<=model.controls.minDistance+.01)||(b.dataset.action==='out'&&d>=model.controls.maxDistance-.01)})}
 syncTools();syncOptions();
 frame.addEventListener('load',()=>{
  const win=frame.contentWindow,doc=frame.contentDocument;model=win.qixia;
  if(!model){loading.textContent='沙盘未能加载，请切回画卷后重试。';return}
  // Hide only the embedded page chrome; keep the original scene and character pins.
  const css=doc.createElement('style');css.textContent=`
   html,body{width:100%;height:100%;overflow:hidden;background:#f3f0e8}
   #app{position:relative!important;width:100%!important;height:100dvh!important;min-height:0!important;max-width:none!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}
   #app>:not(#scene):not(#labels):not(.sky):not(.grain):not(#loading):not(#panel):not(#ride-bar):not(#ride-near){display:none!important}
   body>:not(#app):not(script):not(style){display:none!important}
   #labels>:not(.spirit):not(.stop):not(.bus-tag):not(.gate-tag):not(.lot-tag){display:none!important}
   #panel{inset:0!important;width:100%!important;height:100%!important;max-height:none!important;min-height:0!important;border:0!important;border-radius:0!important;background:#faf6ed;z-index:20;padding-top:12px}
   #panel .panel-close{position:sticky;float:right;top:0;margin:0 10px -44px 0;background:#faf6ed;border-radius:50%;z-index:5}
   #ride-bar{bottom:58px!important;left:10px;right:10px}#ride-near{bottom:110px!important;max-height:65%;overflow:auto}
   #app[data-wx=clear] .sky{background:linear-gradient(#f4efdf,#ebe4d1)!important}#app[data-wx=rain] .sky,#app[data-wx=overcast] .sky{background:linear-gradient(#dce3e2,#e6e7dc)!important}#app[data-wx=snow] .sky,#app[data-wx=fog] .sky{background:linear-gradient(#e9eeee,#f3f2e9)!important}
   .sky{background:linear-gradient(180deg,#f2efe3,#e7e8db)!important}.sky svg{display:none}
  `;doc.head.append(css);
  const {T,camera,controls}=model;
  controls.enablePan=true;controls.screenSpacePanning=true;controls.panSpeed=.55;controls.minDistance=18;controls.maxDistance=100;
  // Fit the leaf and terrain to the scene viewport, independent of the old page's UI.
  fitModel=()=>{
   if(panel.hidden||!frame.clientWidth||!frame.clientHeight)return;controls.minDistance=18;controls.maxDistance=100;
   const points=[];model.world.updateMatrixWorld(true);
   model.world.traverse(o=>{const a=o.geometry?.attributes?.position;if(!o.isMesh||o.isInstancedMesh||!a||a.count<1000)return;for(let i=0;i<a.count;i+=Math.max(1,Math.floor(a.count/400))){const v=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);if(v.y<12&&v.y>-.9&&Math.abs(v.x)<14&&Math.abs(v.z)<14)points.push(v)}});
   camera.aspect=frame.clientWidth/frame.clientHeight;camera.updateProjectionMatrix();model.renderer.setSize(frame.clientWidth,frame.clientHeight);
   const target=new T.Vector3(0,1,0),direction=new T.Vector3(27.6,34,47.8).normalize(),cam=camera.clone();let distance=50;
   const bounds=()=>{cam.position.copy(target).addScaledVector(direction,distance);cam.lookAt(target);cam.updateMatrixWorld();const ps=points.map(p=>p.clone().project(cam));return {l:Math.min(...ps.map(p=>p.x)),r:Math.max(...ps.map(p=>p.x)),t:Math.max(...ps.map(p=>p.y)),b:Math.min(...ps.map(p=>p.y))}};
   if(points.length){for(let i=0;i<5;i++){const b=bounds();distance*=Math.max((b.r-b.l)/1.75,(b.t-b.b)/1.55)}const b=bounds(),half=distance*Math.tan(T.MathUtils.degToRad(cam.fov/2));target.addScaledVector(new T.Vector3(0,1,0).applyQuaternion(cam.quaternion),((b.t+b.b)/2-.08)*half);target.addScaledVector(new T.Vector3(1,0,0).applyQuaternion(cam.quaternion),(b.l+b.r)/2*half*cam.aspect)}
   model.setGoal(null);controls.autoRotate=false;controls.target.copy(target);camera.position.copy(target).addScaledVector(direction,Math.max(18,Math.min(100,distance)));controls.update();syncTools();
  };
  // Parent-owned details keep all eight characters and service flows consistent.
  doc.querySelector('#labels').addEventListener('click',e=>{const pin=e.target.closest('.spirit[data-id]');if(!pin)return;e.preventDefault();e.stopImmediatePropagation();q.select(pin.dataset.id)},true);
  controls.addEventListener('change',syncTools);
  win.addEventListener('resize',()=>win.requestAnimationFrame(fitModel));
  model.home=()=>{model.closePanel();fitModel()};doc.querySelector('#close-panel').onclick=model.home;
  model.homeView=()=>({p:camera.position.clone(),t:controls.target.clone()});
  const syncEmbedded=()=>{const visible=!panel.hidden;document.body.classList.toggle('sandbox-detail-open',visible&&doc.body.classList.contains('selected'));document.body.classList.toggle('sandbox-riding',visible&&doc.body.classList.contains('riding'));if(doc.body.classList.contains('selected')||doc.body.classList.contains('riding'))closeOptions()};
  new MutationObserver(syncEmbedded).observe(doc.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(syncOptions).observe(doc.querySelector('#wx-pill'),{childList:true,subtree:true,attributes:true,attributeFilter:['aria-label']});
  doc.addEventListener('pointerdown',closeOptions);doc.addEventListener('keydown',e=>{if(e.key==='Escape'){closeOptions();if(doc.body.classList.contains('selected'))model.home()}});
  // Keep entrance markers discoverable at the overview distance as well as close up.
  const projected=new T.Vector3();model.tickers.push(()=>{if(doc.body.classList.contains('no-bus'))for(const vehicle of model.transit?.fleet||[])vehicle.g.visible=false;for(const lot of model.gates?.lots||[])lot.mat.visible=!doc.body.classList.contains('no-gate');if(doc.body.classList.contains('selected')||doc.body.classList.contains('riding'))return;for(const item of [...(model.gates?.gates||[]),...(model.gates?.lots||[])]){projected.copy(item.w).project(camera);item.tag.classList.toggle('hidden',projected.z>1||projected.z< -1)}});
  model.hush();loading.hidden=true;fitModel();syncOptions();
 });
 tools.addEventListener('click',e=>{const action=e.target.closest('button')?.dataset.action;if(!model||!action)return;if(action==='reset'){fitModel();return}const offset=model.camera.position.clone().sub(model.controls.target),distance=Math.min(model.controls.maxDistance,Math.max(model.controls.minDistance,offset.length()*(action==='in'?.8:1.25)));model.setGoal(null);model.camera.position.copy(model.controls.target).add(offset.setLength(distance));model.controls.update();syncTools()});
 const originalSetMode=stage.setMode;
 function setMode(mode,options){
  const show=mode==='model';
  closeOptions();window.qixiaMobile?.closeMap({restoreFocus:false});q.hush();model?.hush();if(model){if(model.transit?.ride.on)model.transit.endRide(true);model.closePanel()}document.body.classList.remove('sandbox-detail-open','sandbox-riding');
  originalSetMode(mode,options);
  panel.hidden=!show;tools.hidden=!show;controlsBar.hidden=!show;document.body.classList.toggle('legacy-sandbox-open',show);
  if(show){q.controls.enabled=false;if(!frame.hasAttribute('src'))frame.src='legacy-sandbox/index.html';else requestAnimationFrame(()=>{if(!model)frame.src='legacy-sandbox/index.html';else fitModel?.()})}
  window.qixiaMobile?.syncNavigation();
 }
 stage.setMode=setMode;
 modes.querySelectorAll('[data-mode]').forEach(b=>{b.onclick=()=>setMode(b.dataset.mode)});
 window.qixiaLegacySandbox={isOpen:()=>!panel.hidden};
 setMode('art',{preserve:true});
})();
