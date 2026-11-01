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
})();
