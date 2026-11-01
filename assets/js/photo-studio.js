/* 照片提问与后台生成旅行纪念海报 */
(()=>{const q=window.qixia;if(!q)return;const style=document.createElement('style');style.textContent=`
.photo-overlay{position:fixed;inset:0;z-index:48;background:#20362dc9;display:grid;place-items:center;padding:16px}.photo-overlay[hidden]{display:none}.photo-sheet{position:relative;width:min(640px,100%);max-height:92dvh;overflow:auto;background:#faf8f1;border-radius:18px;padding:23px;box-shadow:0 20px 80px #182d2544}.photo-sheet h2{font:23px var(--serif);margin:0 40px 7px 0}.photo-sheet p{font-size:12px;line-height:1.7;color:#76857a}.photo-close{position:absolute;right:17px;top:14px;width:38px;height:38px;border-radius:50%;font-size:24px;background:#edf0e8}.photo-preview{height:180px;background:#ecf0e5;border:1px dashed #b9c9b7;border-radius:12px;display:grid;place-items:center;overflow:hidden;margin:14px 0}.photo-preview img{width:100%;height:100%;object-fit:contain}.photo-select{border-radius:20px;background:#e1ece1;padding:10px 16px}.photo-prompt{display:block;width:100%;min-height:75px;border:1px solid #d8dfd3;border-radius:10px;padding:11px;background:white;resize:vertical}.photo-actions{display:flex;gap:8px;margin-top:13px;flex-wrap:wrap}.photo-actions button,.photo-save{background:#335949;color:white;border-radius:9px;padding:11px 15px}.photo-actions button:last-child{background:#b8634d}.photo-actions button:disabled{opacity:.45}.photo-status{min-height:1em}.photo-job{position:fixed;z-index:30;right:18px;top:110px;background:#345b4b;color:#fff;border-radius:22px;padding:11px 15px;box-shadow:0 5px 18px #283b2c44}.photo-job[hidden]{display:none}.photo-result{width:100%;display:block;border-radius:10px;margin:12px 0}.photo-save{display:inline-block;text-decoration:none}.photo-sheet .photo-privacy{font-size:10px}
.photo-sources{display:flex;gap:10px;flex-wrap:wrap}.photo-sources button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 16px;border:1px solid #d8e2d4;border-radius:24px;background:#e5eee2;color:#244b3d;font:inherit;font-size:13px;cursor:pointer}.photo-sources button[aria-pressed=true]{background:#345b4b;color:#fffdf6;border-color:#345b4b}.photo-sources svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.photo-preview video{display:block;width:100%;height:100%;object-fit:contain}.photo-preview.camera-live{background:#253d32;color:#f9f6ee;border-style:solid;border-color:#405d4c}.photo-camera-actions{display:flex;align-items:center;gap:10px;margin-top:12px}.photo-camera-actions[hidden]{display:none}.photo-camera-actions button{min-height:42px;padding:10px 18px;border-radius:24px;cursor:pointer;font-size:13px}.photo-shutter{background:#b8634d;color:#fffdf7}.photo-shutter span{font-size:17px;margin-right:5px}.photo-camera-cancel{background:#eeeade;color:#536958}.photo-camera-actions button:disabled,.photo-sources button:disabled{opacity:.5;cursor:default}.photo-sheet .photo-camera-note{font-size:11px;min-height:1.7em;margin:10px 0 16px}.photo-sheet button:focus-visible{outline:2px solid #b8634d;outline-offset:3px}
@media(max-width:700px){.photo-job{top:auto;bottom:155px;right:14px}.photo-sheet{padding:20px}.photo-preview{height:150px}}
`;document.head.append(style);
const root=document.createElement('div');root.className='photo-overlay';root.hidden=true;root.innerHTML=`<section class="photo-sheet" role="dialog" aria-modal="true" aria-labelledby="photo-title"><button class="photo-close" aria-label="关闭">×</button><div class="photo-content"></div></section>`;document.body.append(root);const content=root.querySelector('.photo-content');const badge=document.createElement('button');badge.className='photo-job';badge.hidden=true;badge.setAttribute('aria-live','polite');document.body.append(badge);let place=null,photo=null,task=null,pollTimer=null;
function shrink(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const k=Math.min(1,1200/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',.78))};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('图片无法读取'))};img.src=url})}
let cameraStream=null,cameraTicket=0,viewTicket=0,lastFocus=null,cancelCameraView=null;
function stopCamera(){
 cameraTicket++;
 const stream=cameraStream;cameraStream=null;
 stream?.getTracks().forEach(track=>track.stop());
 const video=content.querySelector('video');if(video){video.pause();video.srcObject=null}
}
function close(){
 stopCamera();viewTicket++;cancelCameraView=null;root.hidden=true;
 if(lastFocus?.isConnected&&!root.contains(lastFocus))lastFocus.focus({preventScroll:true});
}
function show(){
 stopCamera();const view=++viewTicket;root.hidden=false;
 content.innerHTML=`<h2 id="photo-title">照片里的栖霞</h2><p>用摄像头拍一张，或上传已有照片，留下你的山中时刻。</p>
 <div class="photo-preview"><span>拍摄或上传后在这里预览</span></div>
 <div class="photo-sources" role="group" aria-label="选择照片来源">
 <button type="button" class="photo-camera" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="4"/></svg><span>摄像头拍照</span></button>
 <button type="button" class="photo-select" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m3 17 5-5 4 4 3-3 6 6"/></svg><span>上传图片</span></button>
 </div><input type="file" accept="image/*" hidden>
 <div class="photo-camera-actions" hidden><button type="button" class="photo-shutter" disabled><span aria-hidden="true">●</span> 拍一张</button><button type="button" class="photo-camera-cancel">取消拍照</button></div>
 <p class="photo-camera-note" role="status" aria-live="polite">首次拍照需允许浏览器使用摄像头；拍摄后可重拍。</p>
 <p>想问什么，或想把海报做成什么样？</p><textarea class="photo-prompt" maxlength="300" placeholder="例如：这张照片里有什么？帮我做一张温暖的秋日旅行海报"></textarea>
 <div class="photo-actions"><button data-action="question" disabled>带着照片提问</button><button data-action="poster" disabled>生成纪念海报</button></div>
 <p class="photo-status" role="status"></p><p class="photo-privacy">摄像头预览和拍摄仅在本机进行；点击提问或生成后，照片和文字才会发送至服务处理。${window.QIXIA_CLOUD_API?'海报结果可在云端取回，约 30 分钟后失效。':'海报任务暂存在服务内存中，约 30 分钟后失效。'}生成期间可返回游览，完成后会在页面提醒。</p>`;
 const input=content.querySelector('input'),preview=content.querySelector('.photo-preview'),question=content.querySelector('[data-action=question]'),poster=content.querySelector('[data-action=poster]'),camera=content.querySelector('.photo-camera'),upload=content.querySelector('.photo-select'),capture=content.querySelector('.photo-shutter'),cameraActions=content.querySelector('.photo-camera-actions'),cameraNote=content.querySelector('.photo-camera-note'),status=content.querySelector('.photo-status');
 let choosing=false,submitting=false,selection=0,video=null;
 const current=()=>view===viewTicket&&!root.hidden;
 const sync=()=>{question.disabled=poster.disabled=!photo||choosing||submitting;camera.disabled=upload.disabled=submitting};
 const mode=value=>{camera.setAttribute('aria-pressed',String(value==='camera'));upload.setAttribute('aria-pressed',String(value==='upload'))};
 function previewPhoto(){
  preview.replaceChildren();preview.classList.remove('camera-live');cameraActions.hidden=true;capture.disabled=true;
  if(photo){const img=document.createElement('img');img.src=photo;img.alt='待使用的旅行照片';preview.append(img)}else preview.textContent='拍摄或上传后在这里预览';
 }
 function cancelCamera(message='已关闭摄像头，可重新拍摄或上传图片。'){
  selection++;stopCamera();choosing=false;video=null;previewPhoto();cameraNote.textContent=message;sync();
 }
 cancelCameraView=()=>{if(choosing||cameraStream)cancelCamera('已暂停摄像头，点击“摄像头拍照”可继续。')};
 camera.onclick=async()=>{
  if(submitting)return;
  selection++;stopCamera();const ticket=cameraTicket;choosing=true;mode('camera');sync();status.textContent='';
  preview.replaceChildren();preview.classList.add('camera-live');preview.textContent='正在开启摄像头…';cameraActions.hidden=false;capture.disabled=true;
  cameraNote.textContent='请在浏览器提示中允许使用摄像头。';
  try{
   if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Object.assign(new Error(),{name:'InsecureContextError'});
   const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});
   if(!current()||ticket!==cameraTicket){stream.getTracks().forEach(track=>track.stop());return}
   cameraStream=stream;video=document.createElement('video');video.autoplay=true;video.muted=true;video.playsInline=true;video.setAttribute('aria-label','摄像头实时预览');preview.replaceChildren(video);
   const activeVideo=video;
   const ready=()=>{if(current()&&ticket===cameraTicket&&activeVideo.videoWidth>0&&activeVideo.readyState>=2){capture.disabled=false;cameraNote.textContent='调整好画面，点击“拍一张”；拍摄后摄像头会自动关闭。'}};
   activeVideo.addEventListener('loadeddata',ready);activeVideo.addEventListener('canplay',ready);activeVideo.srcObject=stream;
   stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{if(current()&&ticket===cameraTicket)cancelCamera('摄像头已断开，可重新开启或上传图片。')},{once:true}));
   await activeVideo.play();if(!current()||ticket!==cameraTicket)return;ready();
  }catch(error){
   if(!current()||ticket!==cameraTicket)return;
   const messages={NotAllowedError:'未获得摄像头权限。请在地址栏的站点权限中允许摄像头，或选择“上传图片”。',SecurityError:'浏览器未允许访问摄像头，请检查站点权限，或选择“上传图片”。',NotFoundError:'未检测到摄像头。请连接摄像头，或选择“上传图片”。',NotReadableError:'摄像头可能正被其他应用占用，请关闭占用后重试，或上传图片。',OverconstrainedError:'当前摄像头无法使用，请更换设备或上传图片。',InsecureContextError:'请通过 localhost 或 HTTPS 打开页面以使用摄像头；也可以上传图片。'};
   cancelCamera(messages[error.name]||'摄像头暂时无法开启，请重试或选择“上传图片”。');
  }
 };
 content.querySelector('.photo-camera-cancel').onclick=()=>{cancelCamera();camera.focus()};
 capture.onclick=()=>{
  if(!current()||!video||capture.disabled)return;
  try{
   const width=video.videoWidth,height=video.videoHeight;if(!width||!height)throw Error('画面尚未准备好，请稍候再拍。');
   const scale=Math.min(1,1200/Math.max(width,height)),canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
   canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
   const snapshot=canvas.toDataURL('image/jpeg',.78);if(!snapshot.startsWith('data:image/jpeg'))throw Error('拍摄失败，请重试。');
   photo=snapshot;cancelCamera('拍摄完成。你可以重新拍摄，或使用这张照片提问、生成海报。');camera.querySelector('span').textContent='重新拍摄';camera.focus();
  }catch(error){cameraNote.textContent=error.message||'拍摄失败，请重试。'}
 };
 upload.onclick=()=>{if(submitting)return;cancelCamera('选择本机图片，上传前可先预览。');mode('upload');input.value='';input.click()};
 input.onchange=async()=>{
  const file=input.files[0];if(!file)return;const attempt=++selection;choosing=true;sync();status.textContent='正在读取照片…';
  try{const image=await shrink(file);if(!current()||attempt!==selection)return;photo=image;previewPhoto();cameraNote.textContent='图片已准备好，可用于提问或生成海报。';status.textContent=''}
  catch{if(current()&&attempt===selection){previewPhoto();status.textContent='图片无法读取，请换一张 JPG、PNG 或 WebP 图片。'}}
  finally{if(current()&&attempt===selection){choosing=false;sync()}}
 };
 question.onclick=()=>{
  if(!photo||choosing||submitting)return;
  const text=content.querySelector('textarea').value.trim()||'请根据照片和知识库，介绍画面里值得关注的内容。',image=photo;
  if(!window.sendPhotoQuestion){status.textContent='对话暂不可用，请重试。';return}close();window.sendPhotoQuestion(text,image);
 };
 poster.onclick=async()=>{
  if(!photo||choosing||submitting)return;
  submitting=true;sync();status.textContent='正在提交海报任务…';
  const body={id:place.id,image:photo,prompt:content.querySelector('textarea').value.trim()};
  try{
   const r=await fetch('/api/poster',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),j=await r.json();if(!r.ok)throw Error(j.error||'提交失败');
   task={id:j.id,status:'pending'};try{localStorage.setItem('qixia-poster-job',j.id)}catch{}
   badge.hidden=false;badge.textContent='海报生成中 · 可继续游览';
   if(current()){status.textContent='海报正在生成，你可以关闭此窗口继续游览。';photo=null}
   startPoll();
  }catch(error){if(current())status.textContent=error.message||'提交失败，请重试。'}
  finally{if(current()){submitting=false;sync()}}
 };
 root.querySelector('.photo-close').focus();
}
window.addEventListener('pagehide',()=>{cancelCameraView?.();stopCamera()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelCameraView?.()});
const stories={
 lake:{title:'明镜湖',card:'place-320113-mingjinghu',text:'湖中有亭，曲桥与岸相连。把步子放慢，看山色与桥影映入水面。',hint:'这一站，留住湖光与自己的旅行时刻。'},
 stele:{title:'明征君碑',card:'place-320113-mingzhengjunbei',text:'明征君碑是与明僧绍相关的古碑。站在碑前，看看石刻如何把山中的历史留给后来人。',hint:'这一站，让石上的文字陪你读一段旧事。'},
 palace:{title:'乾隆行宫遗址',card:'place-320113-qianlongxinggong',text:'知识库记载，清代曾在栖霞山建行宫，后来毁于咸丰时期。今天可以从遗址线索想象曾经的山中行旅。',hint:'这一站，循着遗址寻找时间的痕迹。'},
 tea:{title:'山中茶文化',card:'place-320113-qixiashan',text:'在栖霞的山水之间，留一点时间歇脚。茶文化点是数字演绎，借一盏茶，记住此刻的山中慢时光。',hint:'这一站，给自己一段从容的停留。'},
 cave:{title:'千佛岩',card:'place-320113-qianfoyan',text:'千佛岩依山崖开凿，石窟与山体相连。沿着允许参观的区域，观察岩壁和龛像的细节。',hint:'这一站，和山里的石刻相遇。'},
 stone:{title:'青锋剑石',card:'place-320113-qixiashan',text:'沿着山路看一看岩石的纹理与光影。一块石头，也可以成为记住这次旅途的线索。',hint:'这一站，记下一处山石的模样。'},
 maple:{title:'红叶谷',card:'place-320113-qixiashan',text:'知识库介绍，红叶谷有成片的枫叶，也有其他树木。不同季节和天气里，山林会呈现不同的颜色。',hint:'这一站，把山林的颜色留在行记里。'},
 spring:{title:'栖霞山 · 山泉意境',card:'place-320113-qixiashan',text:'栖霞泉是产品中的虚拟意境，借水声与山林邀请你慢下来。这张行记记录的是一次想象中的相逢。',hint:'这一站，听听想象中的山水。'}
};
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('图片加载失败'));im.src=src})}
function cover(ctx,img,x,y,w,h){const ratio=Math.max(w/img.width,h/img.height),sw=w/ratio,sh=h/ratio;ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h)}
function wrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines=5){let line='',count=0;for(const ch of text){if(ctx.measureText(line+ch).width>maxWidth&&line){ctx.fillText(line,x,y+count*lineHeight);line=ch;if(++count>=maxLines)return}else line+=ch}if(line&&count<maxLines)ctx.fillText(line,x,y+count*lineHeight)}
const headlines={lake:'把湖光留在这一页',stele:'一块碑，留住山中旧事',palace:'旧址上的山风',tea:'把山里的时间泡慢',cave:'石头藏着慢时光',stone:'山石有自己的时间',maple:'把一段秋色带回去',spring:'听山水说一段悄悄话'};
async function buildMemoryPoster(job){
 const data=stories[job.spot]||stories.lake,art=await loadImage(job.image);const c=document.createElement('canvas');c.width=1800;c.height=1200;const g=c.getContext('2d');cover(g,art,0,0,1800,1200);
 // 文字由系统排版，避免模型生成错字；不重加照片拼贴区。
 g.fillStyle='rgba(249,244,228,.96)';g.fillRect(0,0,1800,202);g.fillStyle='#335747';g.font='bold 27px sans-serif';g.fillText('栖 霞 有 灵   ·   山 中 行 记',55,49);g.fillStyle='#b95239';g.font='bold 72px "Songti SC", "Microsoft YaHei", serif';g.fillText(headlines[job.spot]||headlines.lake,55,140,1280);g.fillStyle='#36594b';g.font='28px "Songti SC", serif';g.textAlign='right';g.fillText('栖霞山 · 到此一游',1740,146);g.textAlign='left';g.strokeStyle='#a5644e';g.lineWidth=3;g.beginPath();g.moveTo(55,175);g.lineTo(1745,175);g.stroke();
 g.fillStyle='rgba(250,246,233,.94)';g.fillRect(35,245,465,350);g.fillStyle='#b9573e';g.font='bold 34px "Songti SC", serif';g.fillText(data.title,60,300,400);g.fillStyle='#345346';g.font='27px "Songti SC", "Microsoft YaHei", serif';wrapped(g,data.text,60,350,410,43,4);g.fillStyle='#6c7e6c';g.font='24px "Songti SC", serif';wrapped(g,data.hint,60,535,410,34,2);
 g.fillStyle='rgba(248,244,231,.95)';g.fillRect(0,1100,1800,100);g.fillStyle='#3e5c4e';g.font='23px sans-serif';g.fillText('景点资料：qixia.winnielyu.com  ·  画面为 AI 艺术想象',45,1137,1700);g.font='18px sans-serif';if(job.reference){const credit='景点参考照片：'+(job.reference.author||'作者未注明')+' / '+(job.reference.license||'许可见原图')+' · '+(job.reference.source||'');g.fillText(credit,45,1171,1710)}return c.toDataURL('image/png');
}
async function showResult(){stopCamera();viewTicket++;cancelCameraView=null;if(root.hidden)lastFocus=document.activeElement;root.hidden=false;if(task?.status==='done'){content.innerHTML='<h2 id="photo-title">你的栖霞山中行记</h2><p>正在排版照片、景点资料与故事…</p><div class="photo-render" role="status"></div>';try{const poster=await buildMemoryPoster(task);content.innerHTML='<h2 id="photo-title">你的栖霞山中行记</h2><p>你的旅行故事已排成一张景点纪念海报。</p><img class="photo-result" alt="栖霞山旅行故事海报"><a class="photo-save" download="栖霞山到此一游.png">保存完整海报</a><p class="photo-privacy">海报中的旅行画面为 AI 艺术想象。</p>';content.querySelector('img').src=poster;content.querySelector('a').href=poster}catch(e){content.querySelector('.photo-render').textContent='海报排版暂时失败，请稍后重新点击查看。';console.error('海报排版失败',e)}}else{content.innerHTML='<h2 id="photo-title">旅行海报</h2><p class="photo-status"></p>';content.querySelector('.photo-status').textContent=task?.status==='error'?(task.error||'生成失败，请重新尝试。'):'海报正在生成，你可以继续游览。'}}
async function poll(){if(!task?.id)return;try{const r=await fetch('/api/poster?id='+encodeURIComponent(task.id),{cache:'no-store'}),j=await r.json();if(!r.ok)throw Error(j.error||'任务已失效');task={...task,...j};if(j.status==='pending'){pollTimer=setTimeout(poll,3000);return}if(j.status==='done'){badge.textContent='海报已生成 · 点击查看';q.toast('你的旅行海报已生成，点击右侧提醒查看');if(document.hidden&&window.Notification?.permission==='granted')new Notification('栖霞有灵',{body:'你的旅行海报已生成，回到页面查看。'})}else badge.textContent='海报生成失败 · 点击查看'}catch(e){task.status='error';task.error=e.message;badge.textContent='海报暂不可用 · 点击查看'}if(task.status==='error')try{localStorage.removeItem('qixia-poster-job')}catch{}}
function startPoll(){clearTimeout(pollTimer);pollTimer=setTimeout(poll,1000)}
badge.onclick=showResult;root.querySelector('.photo-close').onclick=close;root.onclick=e=>{if(e.target===root)close()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden)close()});window.qixiaPhoto={open(p){if(root.hidden)lastFocus=document.activeElement;place=p;photo=null;show()}};try{const id=localStorage.getItem('qixia-poster-job');if(id){task={id,status:'pending'};badge.hidden=false;badge.textContent='正在查看海报进度';startPoll()}}catch{}
})();
