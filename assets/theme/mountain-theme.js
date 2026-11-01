/* UI composition only: keep existing map, guide, transit and photo flows. */
(()=>{
 'use strict';
 const q=window.qixia;if(!q)return;
 const {$,T}=q;
 const svg=(body)=>`<svg viewBox="0 0 64 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
 const art=Object.fromEntries(['guide','map','bus','rest','book'].map(key=>[key,`<img class="theme-painted-icon" src="assets/theme/painted/${key}.webp" alt="" width="360" height="360" decoding="async">`]));
 $('.intro h1').innerHTML='一山八境，<br>等你<em>相逢。</em>';
 $('.intro p').innerHTML='循一缕山风，遇见山中的八位故人。<br>收藏一段属于你的栖霞记忆。';
 $('.dock-title strong').textContent='山中八位故人';
 q.app.append($('#wx-pill'));
 const actions=document.createElement('nav');actions.className='theme-services';actions.setAttribute('aria-label','游山服务');
 const services=[[$('.travel-launch'),'guide','游山指南','路线 · 景点 · 建议'],[$('.visitor-map-entry'),'map','景区地图','全景导览 · 八境分布'],[$('.bus-card'),'bus','观光车','选线 · 上车 · 下车'],[$('.rest-entry'),'rest','山麓小憩','餐饮 · 休憩 · 文创']];
 services.forEach(([el,key,title,sub])=>{if(!el)return;el.className='theme-service';el.dataset.service=key;el.innerHTML=art[key]+`<strong>${title}</strong><small>${sub}</small>`;actions.append(el)});
 const book=document.createElement('button');book.className='theme-book';book.innerHTML=art.book+'<strong>景区讲解书</strong><span>看见风景里的故事</span><b>→</b>';book.onclick=()=>window.qixiaTravel.open('book');
 $('.dock').append(book,actions);
 const names=['镜湖水灵','明僧绍','乾隆','陆羽','石窟守护灵','山石地质灵','枫叶精灵','泉灵'];
 q.places.forEach((p,i)=>{const b=$(`#destinations [data-id="${p.id}"]`);if(!b)return;
 b.innerHTML=`<span class="portrait-thumb" aria-hidden="true"></span><span class="spot-number">0${i+1}</span><strong>${names[i]}</strong>`;
 b.style.setProperty('--img',`url("${new URL(p.character,location.href).href}")`);b.style.setProperty('--pos',p.face);b.title=p.name+' · '+names[i];b.setAttribute('aria-label',`第${i+1}境 ${p.name} ${names[i]}`);
 const pin=q.pins.find(x=>x.p.id===p.id);if(pin){pin.b.querySelector('.face').dataset.number='0'+(i+1)}
 });
 $('#reset').innerHTML=svg('<path d="m9 37 15-23 10 13 8-9 13 19z"/>');
 $('#rotate').innerHTML=svg('<path d="M49 16a19 19 0 1 0 1 17M49 5v11H38"/>');
 $('#route').innerHTML=svg('<path d="M10 19V8h12m20 0h12v11M10 30v11h12m20 0h12V30"/><circle cx="32" cy="24" r="7"/>');
 const note=document.createElement('span');note.className='theme-scene-note';note.textContent='拖动旋转 · 双指缩放 / 平移 · 艺术化探索沙盘';q.app.append(note);
 for(const el of [...$('#destinations').children]){if(q.places.some(p=>p.id===el.dataset.id))continue;el.className='theme-gate-link';el.textContent='出入口与停车 ↗';el.setAttribute('aria-label','查看出入口与停车');$('.dock').append(el)}
 // Default to the eight numbered landmarks. Transport / entrances remain switchable.
 if(!localStorage.getItem('qixia-mountain-theme-seen')){
  for(const key of ['bus','gate']){const b=$(`.layers [data-l="${key}"]`);if(b?.getAttribute('aria-pressed')==='true')b.click()}
  localStorage.setItem('qixia-mountain-theme-seen','1');
 }
 q.controls.enablePan=true;q.controls.screenSpacePanning=true;q.controls.panSpeed=.55;
 q.controls.addEventListener('start',()=>q.setGoal(null));
 // Fit the actual leaf/terrain extents into the space between intro and navigation.
 window.qixiaThemeHome=()=>{
  const W=q.app.offsetWidth,H=q.app.offsetHeight;
  const top=$('.intro').offsetTop+$('.intro').offsetHeight+10,bottom=$('.dock').offsetTop-8;
  const points=[];q.world.updateMatrixWorld(true);
  q.world.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!o.geometry?.attributes.position)return;const a=o.geometry.attributes.position;
   if(a.count<1000)return;for(let i=0;i<a.count;i+=Math.max(1,Math.floor(a.count/500))){const v=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);if(v.y<12&&v.y>-.9&&Math.abs(v.x)<14&&Math.abs(v.z)<14)points.push(v)}
  });
  const target=new T.Vector3(0,1,0),dir=new T.Vector3(27.6,29,47.8).normalize(),cam=q.camera.clone();let D=30;
  const fit=()=>{cam.position.copy(target).addScaledVector(dir,D);cam.lookAt(target);cam.updateMatrixWorld();cam.updateProjectionMatrix();const ps=points.map(p=>p.clone().project(cam));return {l:Math.min(...ps.map(p=>p.x)),r:Math.max(...ps.map(p=>p.x)),t:Math.max(...ps.map(p=>p.y)),b:Math.min(...ps.map(p=>p.y))}};
  for(let n=0;n<5;n++){const b=fit(),ratio=Math.max((b.r-b.l)/1.92,(b.t-b.b)/(2*(bottom-top)/H));D*=ratio}
  const b=fit(),desired=1-(top+bottom)/H,up=new T.Vector3(0,1,0).applyQuaternion(cam.quaternion),right=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion),half=D*Math.tan(T.MathUtils.degToRad(cam.fov/2));
  target.addScaledVector(up,((b.t+b.b)/2-desired)*half);target.addScaledVector(right,(b.l+b.r)/2*half*cam.aspect);
  return {p:target.clone().addScaledVector(dir,D),t:target};
 };
 const layout=()=>q.app.style.setProperty('--theme-dock-height',$('.dock').offsetHeight+'px');
 new ResizeObserver(layout).observe($('.dock'));layout();
 requestAnimationFrame(()=>q.home());
})();
