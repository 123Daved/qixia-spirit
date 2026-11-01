/* GPT Image artwork is a zoomable illustration. The existing WebGL scene remains
   separately available as a real freely rotatable model, not a simulated rotation. */
(()=>{
 'use strict';const q=window.qixia;if(!q)return;const {$}=q;
 const css=document.createElement('link');css.rel='stylesheet';css.href='assets/theme/painted-stage.css';document.head.append(css);
 const stage=document.createElement('section');stage.className='painted-stage';stage.setAttribute('aria-label','栖霞艺术化山境，可缩放查看；景点真实位置请打开景区地图');
 stage.innerHTML='<div class="painted-plane"><img class="painted-mountain" src="assets/theme/painted/mountain.webp" alt="枫叶托起的栖霞主题山境，山石、林木、亭阁和溪水的艺术化微缩景观" width="1122" height="1402" fetchpriority="high" draggable="false"><div class="painted-spots"></div></div>';
 const plane=stage.querySelector('.painted-plane');q.app.insertBefore(stage,$('.top'));
 const positions=[[65,61],[24,52],[32,43],[40,28],[59,13],[74,38],[78,56],[47,67]];
 q.places.forEach((p,i)=>{const b=document.createElement('button');b.className='painted-spot';b.dataset.place=p.id;b.style.left=positions[i][0]+'%';b.style.top=positions[i][1]+'%';b.textContent=String(i+1).padStart(2,'0');b.title=p.name;b.setAttribute('aria-label','打开'+p.name+' · '+p.person.split(' · ')[0]);b.onclick=()=>{if(!dragged)q.select(p.id)};stage.querySelector('.painted-spots').append(b)});
 const modes=document.createElement('div');modes.className='scene-modes';modes.setAttribute('role','group');modes.setAttribute('aria-label','山景浏览方式');modes.innerHTML='<button data-mode="art" aria-pressed="true">山境画卷</button><button data-mode="model" aria-pressed="false">3D 沙盘</button>';q.app.append(modes);
 const zoom=document.createElement('div');zoom.className='painted-tools';zoom.innerHTML='<button data-zoom="in" aria-label="放大山境">＋</button><button data-zoom="out" aria-label="缩小山境">−</button><button data-zoom="reset" aria-label="重置画卷视图">⤢</button>';q.app.append(zoom);
 let mode='art',scale=1,dragged=false,touch=null;
 // Keep the painting centered: only zoom, never translate it out of its viewport.
 function paint(){plane.style.transform=`scale(${scale})`;plane.style.setProperty('--spot-scale',String(1/scale));stage.classList.toggle('zoomed',scale>1.03);zoom.querySelector('[data-zoom=out]').disabled=scale<=1;zoom.querySelector('[data-zoom=in]').disabled=scale>=2.5}
 function reset(){scale=1;paint()}
 function changeScale(value){scale=Math.min(2.5,Math.max(1,value));paint()}
 function setMode(next,{preserve=false}={}){mode=next;document.body.classList.toggle('art-view',mode==='art');stage.hidden=mode!=='art';zoom.hidden=mode!=='art';stage.inert=mode!=='art';q.controls.enabled=mode==='model'&&!document.body.classList.contains('riding');modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('.theme-scene-note').textContent=mode==='art'?'艺术化山境 · 景点位置请查看景区地图':'拖动旋转 · 双指缩放 / 平移 · 艺术化探索沙盘';if(!preserve)q.home();if(mode==='art')reset()}
 modes.querySelectorAll('button').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
 zoom.querySelector('[data-zoom=in]').onclick=()=>changeScale(scale+.25);zoom.querySelector('[data-zoom=out]').onclick=()=>changeScale(scale-.25);zoom.querySelector('[data-zoom=reset]').onclick=reset;
 stage.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey&&Math.abs(e.deltaY)>60)return;e.preventDefault();changeScale(scale*(e.deltaY<0?1.08:.92))},{passive:false});
 const distance=ts=>Math.hypot(ts[0].clientX-ts[1].clientX,ts[0].clientY-ts[1].clientY);
 stage.addEventListener('touchstart',e=>{if(e.touches.length===2){e.preventDefault();touch={distance:distance(e.touches),scale};dragged=true}},{passive:false});
 stage.addEventListener('touchmove',e=>{if(touch&&e.touches.length===2){e.preventDefault();changeScale(touch.scale*distance(e.touches)/Math.max(1,touch.distance))}},{passive:false});
 stage.addEventListener('touchend',()=>{touch=null;setTimeout(()=>dragged=false,0)});stage.addEventListener('touchcancel',()=>{touch=null;dragged=false});
 const oldReset=$('#reset').onclick;$('#reset').onclick=()=>mode==='art'?reset():oldReset();
 const layout=()=>{if(document.body.classList.contains('exploration')){let w=stage.clientWidth,h=stage.clientHeight;if(document.body.classList.contains('phone-app')){const img=stage.querySelector('img'),ratio=img.naturalWidth&&img.naturalHeight?img.naturalWidth/img.naturalHeight:2/3;w=Math.max(w,h*ratio);h=w/ratio}plane.style.width=w+'px';plane.style.height=h+'px';paint();return}const top=$('.intro').offsetTop+$('.intro').offsetHeight+8,bottom=$('.dock').offsetTop-13;const H=Math.max(280,bottom-top);stage.style.top=top+'px';stage.style.height=H+'px';modes.style.top=(top-2)+'px';zoom.style.top=(top+51)+'px';const w=Math.min(q.app.clientWidth*1.03,H*1122/1402);plane.style.width=w+'px';plane.style.height=(w*1402/1122)+'px';paint()};
 stage.querySelector('img').addEventListener('load',layout);
 const resize=new ResizeObserver(layout);resize.observe(q.app);resize.observe($('.dock'));resize.observe($('.intro'));
 // A ride needs the original moving vehicle/camera simulation, so reveal WebGL.
 new MutationObserver(()=>{if(mode==='art'&&document.body.classList.contains('riding'))setMode('model',{preserve:true})}).observe(document.body,{attributes:true,attributeFilter:['class']});
 stage.querySelector('img').addEventListener('error',()=>{setMode('model');q.toast('山境图片暂时未加载，已切换到 3D 沙盘')},{once:true});
 window.qixiaArtStage={isArtView:()=>mode==='art',setMode,reset,relayout:layout,getView:()=>({mode,scale,x:0,y:0})};setMode('art');layout();
})();
