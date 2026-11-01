import {Buffer} from 'node:buffer';
import knowledge from './knowledge.json';
import {conversation,conversationSpeech,roles} from './models.js';
import {posterPreset} from './poster.js';
const spots=new Set(Object.keys(roles).filter(x=>x!=='guide'));
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const digest=async value=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');
async function readJson(request,max=2500000){
 if(+(request.headers.get('content-length')||0)>max)throw fail('请求过大',413);
 const reader=request.body?.getReader();if(!reader)return {};let length=0,parts=[];
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw fail('请求过大',413)}parts.push(value)}
 try{return JSON.parse(Buffer.concat(parts).toString())}catch{throw fail('请求格式不正确')}
}
async function ownerHash(owner){if(typeof owner!=='string'||!/^[a-f0-9]{64}$/.test(owner))throw fail('无效的个人凭证');return digest(owner)}
function letter(row){return {id:row.id,spot:row.spot,name:row.name,note:row.note,photo:row.photo,visibility:row.visibility,status:row.status,createdAt:row.created_at}}
async function quota(env,key,max,period){
 const time=Math.floor(Date.now()/period),name=key+':'+time;
 const r=await env.DB.prepare('INSERT INTO quotas (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(name,(time+1)*period).first();
 if(r.count>max)throw fail('当前请求较多，请稍后再试。',429);
}
async function cleanup(env){
 const expired=await env.DB.prepare('SELECT id FROM poster_jobs WHERE created < ? LIMIT 20').bind(Date.now()-1800000).all();
 for(const j of expired.results){await env.BUCKET.delete(['poster/'+j.id+'/input','poster/'+j.id+'/result']);await env.DB.prepare('DELETE FROM poster_jobs WHERE id=?').bind(j.id).run()}
 await env.DB.prepare('DELETE FROM quotas WHERE expires < ?').bind(Date.now()-86400000).run();
}
async function letters(request,env,url){
 const path=url.pathname;
 if(request.method==='GET'&&path==='/api/letters'){
  const spot=url.searchParams.get('spot');if(spot&&!spots.has(spot))throw fail('景点不存在');
  const stmt=spot?env.DB.prepare("SELECT * FROM letters WHERE status='approved' AND spot=? ORDER BY created_at DESC LIMIT 200").bind(spot):env.DB.prepare("SELECT * FROM letters WHERE status='approved' ORDER BY created_at DESC LIMIT 200");
  return json({letters:(await stmt.all()).results.map(letter)});
 }
 if(request.method!=='POST')throw fail('接口不存在',404);
 const b=await readJson(request,1300000);
 if(path==='/api/letters/report'){const r=await env.DB.prepare("UPDATE letters SET status='pending' WHERE id=? AND status='approved'").bind(String(b.id||'')).run();if(!r.meta.changes)throw fail('来信不可用',404);return json({ok:true})}
 const owner=await ownerHash(b.owner);
 if(path==='/api/letters/mine')return json({letters:(await env.DB.prepare('SELECT * FROM letters WHERE owner_hash=? ORDER BY created_at DESC LIMIT 200').bind(owner).all()).results.map(letter)});
 if(path==='/api/letters/create'){
  const name=String(b.name||'').trim(),note=String(b.note||'').trim(),photo=b.photo||null;
  if(!spots.has(b.spot)||!['private','public'].includes(b.visibility)||!note||note.length>240||name.length>24)throw fail('请填写有效的景点和留言');
  if(photo){if(typeof photo!=='string'||photo.length>1200000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo))throw fail('照片格式或大小不符合要求');const bytes=Buffer.from(photo.split(',')[1],'base64');if(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw fail('照片格式不符合要求')}
  const id=crypto.randomUUID(),createdAt=new Date().toISOString(),status=b.visibility==='public'?'pending':'private';
  await env.DB.prepare('INSERT INTO letters (id,owner_hash,spot,name,note,photo,visibility,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,owner,b.spot,name||'一位旅人',note,photo,b.visibility,status,createdAt).run();return json({id,createdAt,status},201);
 }
 if(path==='/api/letters/delete'){const r=await env.DB.prepare('DELETE FROM letters WHERE id=? AND owner_hash=?').bind(String(b.id||''),owner).run();if(!r.meta.changes)throw fail('未找到来信',404);return json({ok:true})}
 if(path==='/api/letters/publish'){const r=await env.DB.prepare("UPDATE letters SET visibility='public',status='pending' WHERE id=? AND owner_hash=? AND status='private'").bind(String(b.id||''),owner).run();if(!r.meta.changes)throw fail('未找到可公开的私密来信',404);return json({ok:true,status:'pending'})}
 throw fail('接口不存在',404);
}
async function generatePoster(env,id){
 const saved=await env.BUCKET.get('poster/'+id+'/input');if(!saved)throw fail('照片已失效，请重新上传',404);
 const body=await saved.json(),match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(body.image);
 try{
  const preset=await posterPreset(body.id,knowledge,body.prompt),form=new FormData();
  form.append('model',env.IMAGE_MODEL||'gpt-image-2.5');form.append('image[]',new Blob([Buffer.from(match[2],'base64')],{type:'image/'+match[1]}),'traveller.'+(match[1]==='jpeg'?'jpg':match[1]));
  if(preset.imagePath){const r=await fetch(preset.imagePath);if(!r.ok)throw fail('景点参考图片暂时无法读取',502);form.append('image[]',await r.blob(),'scenery.'+(preset.imagePath.endsWith('.png')?'png':'jpg'))}
  form.append('size','1536x1024');form.append('prompt',preset.prompt);
  const r=await fetch(env.OPENAI_BASE_URL+'/images/edits',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY},body:form,signal:AbortSignal.timeout(240000)});
  if(!r.ok)throw fail('图片生成服务暂不可用（'+r.status+'）',502);
  const j=await r.json(),item=j.data?.[0];let data=item?.b64_json;
  if(!data&&item?.url){const u=new URL(item.url);if(u.protocol!=='https:')throw fail('图片下载地址不支持',502);const image=await fetch(u.href,{signal:AbortSignal.timeout(30000)});if(!image.ok)throw fail('图片取回失败',502);data=Buffer.from(await image.arrayBuffer()).toString('base64')}
  if(!data)throw fail('图片服务没有返回图片',502);
  await env.BUCKET.put('poster/'+id+'/result',Buffer.from(data,'base64'),{httpMetadata:{contentType:'image/png'}});
  await env.DB.prepare("UPDATE poster_jobs SET status='done',reference=? WHERE id=?").bind(JSON.stringify(preset.reference),id).run();
  return {status:'done',spot:body.id,reference:preset.reference,image:'data:image/png;base64,'+data};
 }catch(e){const error=e.name==='TimeoutError'?'生成超时，请重新尝试':e.status?e.message:'图片生成服务暂不可用，请重新尝试';await env.DB.prepare("UPDATE poster_jobs SET status='error',error=? WHERE id=?").bind(error,id).run();return {status:'error',error}}
 finally{await env.BUCKET.delete('poster/'+id+'/input')}
}
async function poster(request,env,url,ip,ctx){
 if(request.method==='POST'){
  await quota(env,'poster:'+ip,5,3600000);await quota(env,'poster-global',40,86400000);
  const b=await readJson(request,2300000),image=String(b.image||'');
  if(!spots.has(b.id))throw fail('请选择有效景点');const m=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if(!m||image.length>2200000)throw fail('请使用小于 1.6MB 的照片');const bytes=Buffer.from(m[2],'base64');if(bytes.length<100||bytes.length>1650000)throw fail('照片大小不符合要求');
  const id=crypto.randomUUID();await env.BUCKET.put('poster/'+id+'/input',JSON.stringify({id:b.id,image,prompt:String(b.prompt||'').slice(0,300)}));
  await env.DB.prepare("INSERT INTO poster_jobs(id,spot,status,created) VALUES (?,?,'pending',?)").bind(id,b.id,Date.now()).run();ctx.waitUntil(cleanup(env));return json({id,status:'pending'},202);
 }
 if(request.method!=='GET')throw fail('接口不存在',404);
 const id=url.searchParams.get('id');if(!/^[a-f0-9-]{36}$/.test(id||''))throw fail('任务不存在',404);
 const job=await env.DB.prepare('SELECT * FROM poster_jobs WHERE id=?').bind(id).first();if(!job||Date.now()-job.created>1800000){ctx.waitUntil(cleanup(env));throw fail('任务已过期或不存在',404)}
 if(job.status==='pending'){
  const claim=await env.DB.prepare("UPDATE poster_jobs SET status='running' WHERE id=? AND status='pending'").bind(id).run();
  if(claim.meta.changes){
   // Keep the polling request alive while the model works, with harmless JSON whitespace.
   // Unlike waitUntil-only jobs this is not cut short when the POST response finishes.
   const stream=new ReadableStream({start(controller){const encoder=new TextEncoder();let closed=false;const put=s=>{if(!closed)try{controller.enqueue(encoder.encode(s))}catch{closed=true}};put(' ');const heartbeat=setInterval(()=>put(' '),10000);
    const work=generatePoster(env,id).then(value=>{put(JSON.stringify(value));if(!closed)controller.close()}).catch(()=>{put(JSON.stringify({status:'error',error:'生成失败，请重新上传照片'}));if(!closed)controller.close()}).finally(()=>clearInterval(heartbeat));ctx.waitUntil(work);
   }});return new Response(stream,{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }
 }
 if(job.status==='done'){const result=await env.BUCKET.get('poster/'+id+'/result');if(!result)throw fail('海报已失效',404);return json({status:'done',spot:job.spot,reference:JSON.parse(job.reference||'null'),image:'data:image/png;base64,'+Buffer.from(await result.arrayBuffer()).toString('base64')})}
 if(job.status==='running'&&Date.now()-job.created>360000){await env.DB.prepare("UPDATE poster_jobs SET status='error',error='生成中断，请重新上传照片' WHERE id=? AND status='running'").bind(id).run();return json({status:'error',error:'生成中断，请重新上传照片'})}
 return json({status:job.status==='running'?'pending':job.status,error:job.error});
}
async function chatStream(body,request,env){
 const upstream=await conversation(body,true,request.signal,env),decoder=new TextDecoder(),encoder=new TextEncoder();let buffer='',total=0;
 const transform=new TransformStream({transform(chunk,c){buffer+=decoder.decode(chunk,{stream:true});let at;while((at=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,at).trim();buffer=buffer.slice(at+1);if(!line.startsWith('data:'))continue;const raw=line.slice(5).trim();if(raw==='[DONE]')continue;try{const part=JSON.parse(raw).choices?.[0]?.delta?.content;if(typeof part==='string'){const allowed=part.slice(0,Math.max(0,1000-total));total+=allowed.length;if(allowed)c.enqueue(encoder.encode(JSON.stringify({text:allowed})+'\n'))}}catch{}}},flush(c){c.enqueue(encoder.encode(JSON.stringify(total?{done:true}:{error:'没有收到回复，请重试'})+'\n'))}});
 return new Response(upstream.body.pipeThrough(transform),{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store, no-transform'}});
}
export async function api(request,runtime,ctx){
 const url=new URL(request.url),origin=request.headers.get('origin'),allowed=new Set(['https://123daved.github.io',url.origin]);
 const cors={'Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};if(origin&&allowed.has(origin))cors['Access-Control-Allow-Origin']=origin;
 const finish=r=>{const h=new Headers(r.headers);for(const [k,v]of Object.entries(cors))h.set(k,v);return new Response(r.body,{status:r.status,headers:h})};
 try{
  if(origin&&!allowed.has(origin))throw fail('来源不被允许',403);
  if(request.method==='OPTIONS')return finish(new Response(null,{status:204,headers:{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}}));
  const env={...runtime,OPENAI_API_KEY:runtime.QIXIA_API_KEY,OPENAI_BASE_URL:String(runtime.QIXIA_API_BASE||'').replace(/\/$/,'')};
  const path=url.pathname;
  if(request.method==='GET'&&path==='/api/ping')return finish(json({ok:true,mode:'live',version:'qixia-cloud-v1'}));
  if(request.method==='GET'&&path==='/api/knowledge')return finish(json(knowledge));
  if(request.method==='GET'&&path==='/api/fleet')return finish(json([]));
  if(path.startsWith('/api/review')||path==='/api/fleet')throw fail('司机和审核管理端仅在受保护环境开放',403);
  const ip=await digest(request.headers.get('cf-connecting-ip')||'unknown');
  if(request.method==='POST')await quota(env,'request:'+ip,120,600000);
  if(path.startsWith('/api/letters'))return finish(await letters(request,env,url));
  if(path==='/api/poster')return finish(await poster(request,env,url,ip,ctx));
  if(request.method!=='POST')throw fail('接口不存在',404);
  if(!env.OPENAI_API_KEY||!env.OPENAI_BASE_URL)throw fail('云端模型服务尚未配置',503);
  await quota(env,'ai-global',1500,86400000);
  const b=await readJson(request);
  if(path==='/api/chat-stream')return finish(await chatStream(b,request,env));
  if(path==='/api/chat')return finish(json(await conversation(b,false,request.signal,env)));
  if(path==='/api/chat-speech'||path==='/api/chat-speech-stream'){
   const streaming=path.endsWith('-stream'),out=await conversationSpeech(b,request.signal,streaming,env);
   return finish(new Response(streaming?out.body:out,{headers:{'Content-Type':streaming?'application/octet-stream':'audio/wav'}}));
  }
  if(path==='/api/look'){
   const answer=await conversation({id:'guide',text:'请用中文简短描述照片，只输出 JSON：{"point":0,"see":"12字内的可见景物","reply":"40字内回应"}。',image:b.image},false,request.signal,env);let out;try{out=JSON.parse(answer.reply.slice(answer.reply.indexOf('{'),answer.reply.lastIndexOf('}')+1))}catch{throw fail('识图服务暂不可用',502)}return finish(json({point:Math.min(3,Math.max(0,Number(out.point)||0)),see:String(out.see||'').slice(0,20),reply:String(out.reply||'').slice(0,80)}));
  }
  throw fail('接口不存在',404);
 }catch(e){return finish(json({error:e.status?e.message:e.name==='TimeoutError'?'服务响应超时，请重试':'服务暂不可用，请稍后再试'},e.status||502))}
}
