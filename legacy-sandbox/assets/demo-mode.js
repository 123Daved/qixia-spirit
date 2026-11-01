/* Public static demo: local journal and explicit boundaries for server-only features. */
(()=>{
 if(['localhost','127.0.0.1','::1'].includes(location.hostname)&&!new URLSearchParams(location.search).has('demo')&&!window.parent.QIXIA_STATIC_DEMO)return;
 window.QIXIA_STATIC_DEMO=true;
 const realFetch=window.fetch.bind(window),base=new URL('.',document.currentScript.src),key='qixia-public-demo-letters-v1';
 const json=(data,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}));
 const read=()=>JSON.parse(localStorage.getItem(key)||'[]');
 const write=value=>localStorage.setItem(key,JSON.stringify(value));
 window.fetch=(input,options={})=>{
  const u=new URL(typeof input==='string'?input:input.url,location.href);
  if(u.origin!==location.origin||!u.pathname.startsWith('/api/'))return realFetch(input,options);
  let body={};try{body=JSON.parse(options.body||'{}')}catch{}
  try{
   switch(u.pathname){
    case '/api/knowledge':return realFetch(new URL('../../assets/travel/book/knowledge.json',base));
    case '/api/letters':return json({letters:[]});
    case '/api/letters/mine':return json({letters:read().filter(x=>x.owner===body.owner)});
    case '/api/letters/create':{
     if(!body.note?.trim()||!body.owner)return json({error:'请先写下一句话。'},400);
     if(body.visibility==='public')return json({error:'免费演示版仅支持保存在本机，请选择“仅自己可见”。'},400);
     const item={...body,id:crypto.randomUUID(),status:'private',visibility:'private',createdAt:new Date().toISOString()};
     const list=read();list.unshift(item);write(list);return json({id:item.id,status:'private',createdAt:item.createdAt});
    }
    case '/api/letters/delete':write(read().filter(x=>!(x.id===body.id&&x.owner===body.owner)));return json({ok:true});
    case '/api/letters/publish':case '/api/letters/report':return json({error:'免费演示版不提供公开发布或跨游客共享。'},503);
    case '/api/fleet':return json({vehicles:[],demo:true});
    case '/api/ping':return Promise.resolve(new Response('static-demo'));
    default:return json({error:'这是免费演示版，未连接 AI 服务器。请使用景点故事、预录讲解和游山指南；你的问题与照片不会上传。'},503);
   }
  }catch{return json({error:'本机存储不可用或已满，请允许浏览器存储，或减少照片后重试。'},507)}
 };
 document.addEventListener('DOMContentLoaded',()=>{
  const note=document.createElement('button');note.className='demo-info-button';note.textContent='演示版说明';note.type='button';
  const dialog=document.createElement('dialog');dialog.className='demo-info';dialog.innerHTML='<h2>欢迎体验栖霞有灵</h2><p>画卷、3D 沙盘、八景故事、预录语音和游山指南可以直接体验。</p><p>山中来信仅保存在当前浏览器，清除浏览器数据后会丢失；不公开、不跨设备共享。</p><p>自由 AI 对话、图片识别、AI 海报和车辆实时定位需另行配置服务器，本演示站不提供。地图、客流和车次均为示意或估算，请以景区现场信息为准。</p><form method="dialog"><button>开始游山</button></form>';
  note.onclick=()=>dialog.showModal();document.body.append(note,dialog);
  const css=document.createElement('style');css.textContent='.demo-info-button{position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:120;padding:3px 8px;border:1px solid #87947c55;border-radius:12px;background:#faf6eded;color:#536452;font-size:9px}.demo-info{max-width:360px;width:calc(100% - 36px);padding:24px;border:1px solid #e4d9c6;border-radius:16px;background:#faf6ed;color:#314b43}.demo-info::backdrop{background:#243f3955}.demo-info p{font:13px/1.8 sans-serif}.demo-info h2{font:22px serif}.demo-info button{border:0;border-radius:20px;background:#314b43;color:white;padding:10px 18px}';document.head.append(css);
 });
})();
