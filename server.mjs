// 栖霞有灵 · 本地演示服务（零依赖，Node 18+）
// 1) 提供页面与素材；2) POST /api/look 代为调用识图模型，密钥只留在本机 .env.local，不进入页面。
// 用法：node server.mjs  然后打开 http://localhost:8787 ；同一 Wi-Fi 的手机可用终端里打印的局域网地址。
import http from 'node:http';
import https from 'node:https';
import {existsSync, readFileSync} from 'node:fs';
import {readFile, stat} from 'node:fs/promises';
import {networkInterfaces} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {loadEnv} from './tools/env.mjs';
import {library,retrieve} from './tools/kb.mjs';
import {posterPreset} from './tools/poster-prompts.mjs';
import {randomUUID} from 'node:crypto';
import {createLetter,publicLetters,myLetters,deleteLetter,publishLetter,reportLetter,pendingLetters,reviewLetter} from './tools/letters-db.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const env = await loadEnv(root);
const PORT = +(env.PORT || 8787), PAGE = '栖霞有灵_3D白模原型.html';
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.m4a': 'audio/mp4', '.json': 'application/json', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml'};

async function vision(model, prompt, image) {
  const r = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(9000),
    headers: {Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 qixia-demo'},
    body: JSON.stringify({model, max_tokens: 220, temperature: .7, messages: [{role: 'user', content: [{type: 'text', text: prompt}, {type: 'image_url', image_url: {url: image}}]}]})
  });
  if (!r.ok) throw Error(`${model} ${r.status}`);
  const text = (await r.json()).choices?.[0]?.message?.content || '';
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  return {point: Math.max(0, Math.min(3, parseInt(json.point) || 0)), see: String(json.see || '').slice(0, 20), reply: String(json.reply || '').slice(0, 80)};
}

async function look(req) {
  let body = '';
  for await (const chunk of req) { body += chunk; if (body.length > 4e6) throw Error('图片过大'); }
  const {spot, persona, points, image} = JSON.parse(body);
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image || '')) throw Error('图片格式不支持');
  const sourceContext=retrieve(await library(root),String(spot||''),'guide');
  const prompt = `你是栖霞山「${spot}」的${persona}。一位游客在这里拍了照片发给你。
请判断照片主要拍到的是下面哪一类：1=${points[0]}，2=${points[1]}，3=${points[2]}，0=都不太像。
只输出 JSON：{"point":数字,"see":"照片里看到了什么（12字内）","reply":"用你的角色口吻回应游客的一两句话（40字内）"}
要求：reply 只回应照片内容与感受，不编造历史年代与数字；照片里有人时不评价外貌；语气亲切，符合角色。涉及景区事实只可使用以下知识库资料，无法确认就不要猜测：${sourceContext||'没有匹配资料'}。`;
  // 两个快速模型同时请求，谁先返回用谁：中转线路时快时慢，并发可以削掉偶发的长尾延迟
  const t = Date.now(), models = [env.VISION_MODEL || 'gemini-2.5-flash-lite', env.VISION_FALLBACK].filter(Boolean);
  try {
    return await Promise.any(models.map(async model => ({...await vision(model, prompt, image), model, ms: Date.now() - t})));
  } catch (e) {
    console.warn('识图失败：', e.errors?.map(x => x.message).join('；') || e.message);
    throw Error('识图服务暂不可用');
  }
}

// 观光车实时定位：司机端 driver.html 每 3 秒上报，游客页每 2 秒拉取；内存保存，60 秒无更新即视为离线
const fleet = new Map();
async function readJson(req, max = 4096) { let b = ''; for await (const c of req) { b += c; if (b.length > max) throw Error('请求过大'); } return JSON.parse(b || '{}'); }
function fleetPost(r) {
  const plate = String(r.plate || '').trim().slice(0, 16), lat = +r.lat, lng = +r.lng;
  if (!plate || !(lat > 18 && lat < 54 && lng > 73 && lng < 136)) throw Error('车牌或坐标无效');
  const rec = {plate, line: String(r.line || '').slice(0, 8), lat, lng, heading: Number.isFinite(+r.heading) ? +r.heading : null, speed: Number.isFinite(+r.speed) ? +r.speed : null, acc: +r.acc || null, ts: Date.now()};
  fleet.set(plate, rec); return rec;
}

const transitContext={window:{}};vm.runInNewContext(await readFile(path.join(root,'assets/transit-config.js'),'utf8'),transitContext,{timeout:1000});
const transitData=transitContext.window.QIXIA_TRANSIT;
const transitFacts=transitData.lines.map(line=>line.name+'：'+line.stops.map(id=>transitData.stops.find(s=>s.id===id)?.name).filter(Boolean).join('、')).join('；');
const roles={guide:'小霞，栖霞山旅行助手',lake:'镜湖水灵',stele:'明僧绍的数字讲述者',palace:'乾隆数字讲述者',tea:'陆羽数字讲述者',cave:'石窟守护灵',stone:'山石地质灵',maple:'枫叶精灵',spring:'山灵'};
const roleVoices={guide:'Cherry',lake:'Serena',stele:'Kai',palace:'Dylan',tea:'Ethan',cave:'Arthur',stone:'Mochi',maple:'Bella',spring:'Li'};
async function conversation(body, streaming=false, signal){
 const id=String(body.id||'');if(!roleVoices[id])throw Error('景点不存在');
 const kb=await library(root);
 let question=String(body.text||'').trim().slice(0,600);const image=body.image;
 if(!question&&!image)throw Error('请输入问题或选择照片');
 if(image&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image))throw Error('图片格式不支持');
 const history=Array.isArray(body.history)?body.history.slice(-6).filter(x=>['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,500)})):[];
 const context=retrieve(kb,question+' '+history.filter(h=>h.role==='user').slice(-2).map(h=>h.content).join(' '),id);
 const guideContext=id==='guide'?`你是小霞，栖霞山主旅行助手，帮助游客组织全山游览，优先直接回答明确问题；仅在制定行程确实缺少信息时，追问同行人、时长或兴趣中最关键的一项。地图上的观光车线路、时刻和客流为演示或估算；凡提及线路或班次，必须明确说“地图中的演示线路”，不能宣称是官方实时信息，也不能保证班次。当前司机定位上报 ${[...fleet.values()].filter(v=>Date.now()-v.ts<60000).length} 辆；这不代表运营状态或到站时间。地图中演示线路及站点为：${transitFacts}。具体运营、票价、道路与无障碍条件请以景区现场公布为准。你不能获取游客位置，不能假装正在带路或已经操作地图。`:'你是景点角色，回答围绕当前景点。';
 const system=`${guideContext} 你是栖霞山景点的数字导览角色「${roles[id]}」。历史人物是数字演绎，不假装自己是真人。以中文自然对话，通常回答两到四句；先回应游客问题，可引导观察或追问。以下是景区知识库，历史事实只依据知识库；区分传说与事实，不确定就坦诚说明，不能编造票价路线实时信息。栖霞泉是虚拟意境。若有照片，先说能实际观察到什么，不确定不要猜测；不要评价人物外貌。只使用以下来自用户指定知识库的检索资料回答有关景区的事实；资料中的不同说法可能冲突，明确说法来自资料且不确定，无法确定的就说知识库暂未提供，不可用模型记忆补充。客流、价格、开放与交通信息可能过时，请以景区当日公告为准。资料同步时间：${kb.updatedAt}。检索资料：${context||'没有找到相关资料。'}`;
 const content=image?[{type:'text',text:question||'请看看我拍到的画面，告诉我值得注意的细节。'},{type:'image_url',image_url:{url:image}}]:question;
 const r=await fetch(`${env.OPENAI_BASE_URL}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(30000)]):AbortSignal.timeout(30000),body:JSON.stringify({model:env.VISION_MODEL||'gemini-2.5-flash-lite',stream:streaming,max_tokens:180,temperature:.5,messages:[{role:'system',content:system},...history,{role:'user',content}]})});
 if(!r.ok)throw Error('对话服务暂不可用');if(streaming){if(!r.body||!r.headers.get('content-type')?.includes('text/event-stream'))throw Error('对话流暂不可用');return r}const j=await r.json();const reply=j.choices?.[0]?.message?.content;if(typeof reply!=='string'||!reply.trim())throw Error('没有收到回复');return {reply:reply.trim().slice(0,1000)};
}
async function conversationSpeech(body,signal,stream=false){
 const voice=roleVoices[body.id],input=String(body.text||'').trim().slice(0,1000);if(!voice||!input)throw Error('语音内容无效');
 const r=await fetch(`${env.OPENAI_BASE_URL}/audio/speech`,{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(60000)]):AbortSignal.timeout(60000),body:JSON.stringify({model:env.TTS_MODEL||'qwen3-tts-flash',voice,input,response_format:'wav'})});
 if(!r.ok)throw Error('语音服务暂不可用');if(stream){if(!r.body)throw Error('语音流暂不可用');return r}const bytes=Buffer.from(await r.arrayBuffer()),at=bytes.indexOf('data',12);if(bytes.toString('ascii',0,4)==='RIFF'&&at>=0){bytes.writeUInt32LE(bytes.length-8,4);bytes.writeUInt32LE(bytes.length-at-8,at+4)}return bytes;
}

// 个人照片海报任务仅保存在服务进程内，随机任务 ID 用于游客取回结果。
const posterJobs=new Map();
async function createPoster(body){
 const id=String(body.id||''),image=String(body.image||''),note=String(body.prompt||'').slice(0,300);
 if(!roleVoices[id]||id==='guide')throw Error('请选择有效景点');
 const match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);if(!match||image.length>2200000)throw Error('请使用小于 1.6MB 的照片');
 const bytes=Buffer.from(match[2],'base64');if(bytes.length<100||bytes.length>1650000)throw Error('照片大小不符合要求');
 const jobId=randomUUID(),job={status:'pending',created:Date.now(),spot:id};posterJobs.set(jobId,job);
 (async()=>{try{
  const preset=await posterPreset(root,id,await library(root),note);job.reference=preset.reference;
  const form=new FormData();form.append('model',env.IMAGE_MODEL||'gpt-image-2.5');form.append('image[]',new Blob([bytes],{type:'image/'+match[1]}),'traveller.'+(match[1]==='jpeg'?'jpg':match[1]));
  if(preset.imagePath){const scenic=await readFile(preset.imagePath);const mime=preset.imagePath.endsWith('.png')?'image/png':'image/jpeg';form.append('image[]',new Blob([scenic],{type:mime}),'scenery.'+(mime==='image/png'?'png':'jpg'))}
  form.append('size','1536x1024');form.append('prompt',preset.prompt);
  const r=await fetch(env.OPENAI_BASE_URL+'/images/edits',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY},body:form,signal:AbortSignal.timeout(240000)});if(!r.ok)throw Error('图片生成服务暂不可用（'+r.status+'）');const json=await r.json(),item=json.data?.[0];let data=item?.b64_json;if(!data&&item?.url){const img=await fetch(item.url,{signal:AbortSignal.timeout(30000)});if(!img.ok)throw Error('图片取回失败');data=Buffer.from(await img.arrayBuffer()).toString('base64')}if(!data)throw Error('图片生成服务没有返回图片');job.image='data:image/png;base64,'+data;job.status='done';
 }catch(e){job.status='error';job.error=e.name==='TimeoutError'?'生成超时，请重试':(e.message||'生成失败，请重试')}finally{job.finished=Date.now()}})();
 return {id:jobId,status:'pending'};
}
setInterval(()=>{const now=Date.now();for(const [id,j] of posterJobs)if(now-(j.finished||j.created)>1800000)posterJobs.delete(id)},300000).unref();

const limits=new Map();
function allowAI(req){const now=Date.now(),ip=req.socket.remoteAddress||'unknown';let record=limits.get(ip);if(!record||now-record.start>600000)record={start:now,count:0};record.count++;limits.set(ip,record);if(limits.size>1000)for(const [key,value] of limits)if(now-value.start>600000)limits.delete(key);return record.count<=120}
async function handler(req, res) {
  try {
    const url=new URL(req.url,'http://localhost');
    // This backend has real API credentials; old static-demo bookmarks open live mode.
    if(req.method==='GET'&&url.searchParams.has('demo')&&(url.pathname==='/'||url.pathname.endsWith('.html'))){
      url.searchParams.delete('demo');res.writeHead(302,{'Location':url.pathname+url.search,'Cache-Control':'no-store'});return res.end();
    }
    if(url.pathname.startsWith('/api/review')){
      const ip=req.socket.remoteAddress||'';if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip)||! /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(req.headers.host||'')){res.writeHead(403);return res.end()}
      if(req.headers.origin){let o;try{o=new URL(req.headers.origin)}catch{}if(!o||o.host!==req.headers.host){res.writeHead(403);return res.end()}}
      res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
      if(req.method==='GET'&&url.pathname==='/api/review')return res.end(JSON.stringify({letters:pendingLetters()}));
      if(req.method==='POST'&&url.pathname==='/api/review'){const b=await readJson(req);if(!reviewLetter(b.id,b.decision)){res.writeHead(404);return res.end(JSON.stringify({error:'来信不在审核队列中'}))}return res.end(JSON.stringify({ok:true}))}
      res.writeHead(404);return res.end('{}');
    }
    if(url.pathname.startsWith('/api/letters')){
      const origin=req.headers.origin;if(origin){let u;try{u=new URL(origin)}catch{}if(!u||u.host!==req.headers.host){res.writeHead(403);return res.end()}}
      res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');
      if(req.method==='GET'&&url.pathname==='/api/letters')return res.end(JSON.stringify({letters:publicLetters(url.searchParams.get('spot'))}));
      if(req.method==='POST'&&url.pathname==='/api/letters/create'){if(!allowAI(req)){res.writeHead(429);return res.end(JSON.stringify({error:'操作过于频繁，请稍后再试'}))}const entry=createLetter(await readJson(req,1300000));res.writeHead(201);return res.end(JSON.stringify(entry))}
      if(req.method==='POST'&&url.pathname==='/api/letters/mine'){const b=await readJson(req);return res.end(JSON.stringify({letters:myLetters(b.owner)}))}
      if(req.method==='POST'&&url.pathname==='/api/letters/delete'){const b=await readJson(req);if(!deleteLetter(b.id,b.owner)){res.writeHead(404);return res.end(JSON.stringify({error:'未找到来信'}))}return res.end(JSON.stringify({ok:true}))}
      if(req.method==='POST'&&url.pathname==='/api/letters/publish'){const b=await readJson(req);if(!publishLetter(b.id,b.owner)){res.writeHead(404);return res.end(JSON.stringify({error:'未找到可公开的私密来信'}))}return res.end(JSON.stringify({ok:true,status:'pending'}))}
      if(req.method==='POST'&&url.pathname==='/api/letters/report'){const b=await readJson(req);if(!allowAI(req)){res.writeHead(429);return res.end(JSON.stringify({error:'操作过于频繁'}))}if(!reportLetter(b.id)){res.writeHead(404);return res.end(JSON.stringify({error:'来信不可用'}))}return res.end(JSON.stringify({ok:true}))}
      res.writeHead(404);return res.end('{}');
    }
    if(req.method==='POST'&&['/api/chat','/api/chat-stream','/api/chat-speech','/api/chat-speech-stream'].includes(req.url)&&!allowAI(req)){res.writeHead(429,{'Content-Type':'application/json; charset=utf-8'});return res.end(JSON.stringify({error:'请求过于频繁，请稍后再试'}))}
    if(url.pathname==='/api/poster'&&req.method==='POST'){
      const origin=req.headers.origin;if(origin){let u;try{u=new URL(origin)}catch{}if(!u||u.host!==req.headers.host){res.writeHead(403);return res.end()}}
      if(!allowAI(req)){res.writeHead(429);return res.end(JSON.stringify({error:'请求过于频繁，请稍后再试'}))}
      const active=[...posterJobs.values()].filter(j=>j.status==='pending').length;if(active>=4){res.writeHead(429);return res.end(JSON.stringify({error:'海报生成繁忙，请稍后再试'}))}
      const out=await createPoster(await readJson(req,2300000));res.writeHead(202,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify(out));
    }
    if(url.pathname==='/api/poster'&&req.method==='GET'){
      const job=posterJobs.get(url.searchParams.get('id'));res.writeHead(job?200:404,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify(job?{status:job.status,image:job.image,error:job.error,spot:job.spot,reference:job.reference}:{error:'任务已过期或不存在'}));
    }
    if(req.method==='POST'&&req.url==='/api/chat-stream'){
      const body=await readJson(req,2500000),controller=new AbortController();res.on('close',()=>controller.abort());
      const upstream=await conversation(body,true,controller.signal);
      res.writeHead(200,{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store, no-transform','X-Accel-Buffering':'no'});
      const decoder=new TextDecoder();let buffer='',total=0;
      try{for await(const chunk of upstream.body){buffer+=decoder.decode(chunk,{stream:true});let idx;while((idx=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,idx).trim();buffer=buffer.slice(idx+1);if(!line.startsWith('data:'))continue;const raw=line.slice(5).trim();if(raw==='[DONE]')continue;try{const event=JSON.parse(raw),part=event.choices?.[0]?.delta?.content;if(typeof part==='string'&&part){const allowed=part.slice(0,1000-total);total+=allowed.length;if(allowed)res.write(JSON.stringify({text:allowed})+'\n')}}catch{}}}res.end(JSON.stringify({done:true})+'\n')}catch{if(!res.destroyed)res.end(JSON.stringify({error:'回复中断，请重试'})+'\n')}return;
    }
    if(req.method==='POST'&&req.url==='/api/chat'){const out=await conversation(await readJson(req,2500000));res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify(out))}
    if(req.method==='POST'&&req.url==='/api/chat-speech-stream'){
      const body=await readJson(req,12000),controller=new AbortController();res.on('close',()=>controller.abort());const upstream=await conversationSpeech(body,controller.signal,true);
      res.writeHead(200,{'Content-Type':'application/octet-stream','Cache-Control':'no-store, no-transform','X-Accel-Buffering':'no'});let total=0;
      try{for await(const chunk of upstream.body){total+=chunk.length;if(total>20000000)throw Error('音频过大');if(!res.write(chunk))await new Promise((resolve,reject)=>{const drain=()=>{cleanup();resolve()},closed=()=>{cleanup();reject(Error('closed'))},cleanup=()=>{res.off('drain',drain);res.off('close',closed)};res.once('drain',drain);res.once('close',closed)})}res.end()}catch{res.destroy()}return;
    }
    if(req.method==='POST'&&req.url==='/api/chat-speech'){const body=await readJson(req,12000),controller=new AbortController();res.on('close',()=>controller.abort());const audio=await conversationSpeech(body,controller.signal);res.writeHead(200,{'Content-Type':'audio/wav','Cache-Control':'no-store'});return res.end(audio)}
    if (req.method === 'GET' && url.pathname === '/api/knowledge') {
      const kb=await library(root);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify(kb));
    }
    if (req.url === '/api/fleet') {
      if (req.method === 'POST') { const rec = fleetPost(await readJson(req)); res.writeHead(200, {'Content-Type': 'application/json'}); return res.end(JSON.stringify(rec)); }
      const live = [...fleet.values()].filter(r => Date.now() - r.ts < 60e3);
      res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}); return res.end(JSON.stringify(live));
    }
    if (req.method === 'POST' && req.url === '/api/look') {
      const out = await look(req);
      res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
      return res.end(JSON.stringify(out));
    }
    if (req.method === 'GET' && req.url === '/api/ping') { res.writeHead(200); return res.end('ok'); }
    if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || PAGE;
    const file = path.join(root, rel);
    // 不对外提供密钥文件、隐藏文件与工具脚本
    if (!file.startsWith(root + path.sep) || rel.split('/').some(p => p.startsWith('.')) || rel.startsWith('tools/') || rel.startsWith('certs/') || rel.startsWith('knowledge/') || rel.endsWith('.mjs')) { res.writeHead(404); return res.end(); }
    if (!(await stat(file)).isFile()) throw Error('not file');
    res.writeHead(200, {'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'});
    res.end(await readFile(file));
  } catch (e) {
    const api = req.url.startsWith('/api/');
    res.writeHead(api ? 502 : 404, {'Content-Type': 'application/json; charset=utf-8'});
    res.end(api ? JSON.stringify({error: e.message}) : '');
  }
}
const lan = Object.values(networkInterfaces()).flat().filter(a => a?.family === 'IPv4' && !a.internal).map(a => a.address);
const httpServer = http.createServer(handler);
httpServer.listen(PORT, env.HOST || '0.0.0.0', () => {
  console.log(`栖霞有灵已启动：http://localhost:${PORT}`);
  if(!env.HOST||env.HOST==='0.0.0.0')for (const ip of lan) console.log(`手机（同一 Wi-Fi）：http://${ip}:${PORT}`);
});
// 手机定位需要 HTTPS：先运行 sh tools/make-cert.sh 生成本机证书，司机端用 https 地址打开（首次需在手机上「继续访问」）
const KEY = path.join(root, 'certs/key.pem'), CERT = path.join(root, 'certs/cert.pem'), HTTPS_PORT = +(env.HTTPS_PORT || 8443);
if (existsSync(KEY) && existsSync(CERT)) { const httpsServer = https.createServer({key: readFileSync(KEY), cert: readFileSync(CERT)}, handler); httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  for (const ip of lan) console.log(`司机端（手机定位）：https://${ip}:${HTTPS_PORT}/driver.html`);
}); }
else console.log('提示：运行 sh tools/make-cert.sh 生成证书后，可开启 https 司机端定位。');
