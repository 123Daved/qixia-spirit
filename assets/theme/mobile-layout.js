/* Phone layout for the whole app, with an optional immersive map. */
(()=>{
 document.body.classList.add('phone-app');
 const css=document.createElement('link');css.rel='stylesheet';css.href='assets/theme/mobile-layout.css';document.head.append(css);
 const q=window.qixia;if(!q)return;
 const stage=document.querySelector('.painted-stage'),modes=document.querySelector('.scene-modes');if(!stage||!modes)return;
 const expand=document.createElement('button');expand.type='button';expand.className='mobile-map-expand';expand.textContent='全屏地图';expand.setAttribute('aria-label','全屏查看山境地图');expand.setAttribute('aria-pressed','false');modes.append(expand);
 const exit=document.createElement('button');exit.type='button';exit.className='mobile-map-exit';exit.textContent='收起地图 ×';exit.setAttribute('aria-label','退出全屏地图');document.body.append(exit);
 const hint=document.createElement('span');hint.className='mobile-map-tip';hint.textContent='双指缩放 · 居中铺满 · 支持横屏';document.body.append(hint);
 let focusBefore=null;
 function syncNavigation(){const active=document.body.classList.contains('map-expanded')?'map':window.qixiaArtStage?.isArtView()?'art':'model';modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String((b===expand?'map':b.dataset.mode)===active)))}
 function closeMap({restoreFocus=true}={}){if(!document.body.classList.contains('map-expanded'))return;document.body.classList.remove('map-expanded');syncNavigation();window.qixiaArtStage?.relayout?.();if(restoreFocus)focusBefore?.focus({preventScroll:true})}
 function openMap(){focusBefore=document.activeElement;q.closePanel();q.hush();if(!window.qixiaArtStage?.isArtView())window.qixiaArtStage?.setMode('art');document.body.classList.add('map-expanded');syncNavigation();window.qixiaArtStage?.relayout?.();exit.focus({preventScroll:true})}
 expand.onclick=()=>document.body.classList.contains('map-expanded')?closeMap():openMap();exit.onclick=()=>closeMap();
 modes.addEventListener('click',e=>{if(e.target.closest('[data-mode]'))closeMap({restoreFocus:false})});
 const previous=q.hooks.beforeSelect;q.hooks.beforeSelect=(...args)=>{closeMap({restoreFocus:false});previous?.(...args)};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMap()});
 const resize=new ResizeObserver(()=>window.qixiaArtStage?.relayout?.());resize.observe(stage);
 css.addEventListener('load',()=>{window.qixiaArtStage?.relayout?.();window.dispatchEvent(new Event('resize'))});
 window.qixiaMobile={openMap,closeMap,syncNavigation};syncNavigation();
})();
