/* Two scene modes share one navigation; the restored sandbox opens only on demand. */
(()=>{
 'use strict';
 const app=document.querySelector('#app'),modes=document.querySelector('.scene-modes'),stage=window.qixiaArtStage,q=window.qixia;
 if(!app||!modes||!stage||!q)return;
 const panel=document.createElement('section');panel.className='legacy-sandbox';panel.hidden=true;panel.setAttribute('aria-label','3D 沙盘');
 const frame=document.createElement('iframe');frame.title='栖霞山 3D 沙盘';frame.allow='microphone; camera; autoplay; fullscreen';frame.allowFullscreen=true;
 panel.append(frame);app.append(panel);
 const style=document.createElement('style');style.textContent=`
 .legacy-sandbox{position:absolute;inset:0 0 calc(58px + env(safe-area-inset-bottom));z-index:100;background:#f3f0e8}
 .legacy-sandbox[hidden]{display:none!important}
 .legacy-sandbox iframe{display:block;width:100%;height:100%;border:0}
 body.legacy-sandbox-open #app .scene-modes{position:absolute!important;top:auto!important;bottom:0!important;left:0!important;right:0!important;width:100%;height:calc(58px + env(safe-area-inset-bottom));padding:7px 12px calc(7px + env(safe-area-inset-bottom));margin:0;transform:none!important;z-index:101;display:flex!important;justify-content:center;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:#faf6ed;border:0;border-top:1px solid #42584b22;border-radius:0}
 body.legacy-sandbox-open #app .scene-modes button[data-mode]{display:block;min-width:120px;min-height:42px;font-size:13px;border-radius:24px}
 body.legacy-sandbox-open #app .scene-modes .mobile-map-expand{display:none}
 `;document.head.append(style);
 const originalSetMode=stage.setMode;
 function setMode(mode,options){
  const show=mode==='model';
  window.qixiaMobile?.closeMap({restoreFocus:false});
  q.hush();
  if(!show){try{frame.contentWindow?.qixia?.hush()}catch{}}
  originalSetMode(mode,options);
  panel.hidden=!show;document.body.classList.toggle('legacy-sandbox-open',show);
  if(show){q.controls.enabled=false;if(!frame.hasAttribute('src'))frame.src='legacy-sandbox/index.html'}
  modes.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 }
 stage.setMode=setMode;
 modes.querySelectorAll('[data-mode]').forEach(b=>{b.onclick=()=>setMode(b.dataset.mode)});
 window.qixiaLegacySandbox={isOpen:()=>!panel.hidden};
 // Keep the illustrated product homepage as the initial view.
 setMode('art',{preserve:true});
})();
