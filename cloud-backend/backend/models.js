import knowledge from './knowledge.json';
import {retrieve} from './retrieve.js';
import {Buffer} from 'node:buffer';
const transitFacts='地图中的示意线路仅供体验，实际运营以景区现场公布为准';
export const roles={guide:'小霞，栖霞山旅行助手',lake:'镜湖水灵',stele:'明僧绍的数字讲述者',palace:'乾隆数字讲述者',tea:'陆羽数字讲述者',cave:'石窟守护灵',stone:'山石地质灵',maple:'枫叶精灵',spring:'山灵'};
const roleVoices={guide:'Cherry',lake:'Serena',stele:'Kai',palace:'Dylan',tea:'Ethan',cave:'Arthur',stone:'Mochi',maple:'Bella',spring:'Li'};
export async function conversation(body, streaming=false, signal, env){
 const id=String(body.id||'');if(!roleVoices[id])throw Error('景点不存在');
 const kb=knowledge;
 let question=String(body.text||'').trim().slice(0,600);const image=body.image;
 if(!question&&!image)throw Error('请输入问题或选择照片');
 if(image&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image))throw Error('图片格式不支持');
 const history=Array.isArray(body.history)?body.history.slice(-6).filter(x=>['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,500)})):[];
 const context=retrieve(kb,question+' '+history.filter(h=>h.role==='user').slice(-2).map(h=>h.content).join(' '),id);
 const guideContext=id==='guide'?`你是小霞，栖霞山主旅行助手，帮助游客组织全山游览，优先直接回答明确问题；仅在制定行程确实缺少信息时，追问同行人、时长或兴趣中最关键的一项。地图上的观光车线路、时刻和客流为演示或估算；凡提及线路或班次，必须明确说“地图中的演示线路”，不能宣称是官方实时信息，也不能保证班次。当前司机定位上报 0 辆；这不代表运营状态或到站时间。地图中演示线路及站点为：${transitFacts}。具体运营、票价、道路与无障碍条件请以景区现场公布为准。你不能获取游客位置，不能假装正在带路或已经操作地图。`:'你是景点角色，回答围绕当前景点。';
 const system=`${guideContext} 你是栖霞山景点的数字导览角色「${roles[id]}」。历史人物是数字演绎，不假装自己是真人。以中文自然对话，通常回答两到四句；先回应游客问题，可引导观察或追问。以下是景区知识库，历史事实只依据知识库；区分传说与事实，不确定就坦诚说明，不能编造票价路线实时信息。栖霞泉是虚拟意境。若有照片，先说能实际观察到什么，不确定不要猜测；不要评价人物外貌。只使用以下来自用户指定知识库的检索资料回答有关景区的事实；资料中的不同说法可能冲突，明确说法来自资料且不确定，无法确定的就说知识库暂未提供，不可用模型记忆补充。客流、价格、开放与交通信息可能过时，请以景区当日公告为准。资料同步时间：${kb.updatedAt}。检索资料：${context||'没有找到相关资料。'}`;
 const content=image?[{type:'text',text:question||'请看看我拍到的画面，告诉我值得注意的细节。'},{type:'image_url',image_url:{url:image}}]:question;
 const r=await fetch(`${env.OPENAI_BASE_URL}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(30000)]):AbortSignal.timeout(30000),body:JSON.stringify({model:env.VISION_MODEL||'gemini-2.5-flash-lite',stream:streaming,max_tokens:180,temperature:.5,messages:[{role:'system',content:system},...history,{role:'user',content}]})});
 if(!r.ok)throw Error('对话服务暂不可用');if(streaming){if(!r.body||!r.headers.get('content-type')?.includes('text/event-stream'))throw Error('对话流暂不可用');return r}const j=await r.json();const reply=j.choices?.[0]?.message?.content;if(typeof reply!=='string'||!reply.trim())throw Error('没有收到回复');return {reply:reply.trim().slice(0,1000)};
}
export async function conversationSpeech(body,signal,stream=false,env){
 const voice=roleVoices[body.id],input=String(body.text||'').trim().slice(0,1000);if(!voice||!input)throw Error('语音内容无效');
 const r=await fetch(`${env.OPENAI_BASE_URL}/audio/speech`,{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(60000)]):AbortSignal.timeout(60000),body:JSON.stringify({model:env.TTS_MODEL||'qwen3-tts-flash',voice,input,response_format:'wav'})});
 if(!r.ok)throw Error('语音服务暂不可用');if(stream){if(!r.body)throw Error('语音流暂不可用');return r}const bytes=Buffer.from(await r.arrayBuffer()),at=bytes.indexOf('data',12);if(bytes.toString('ascii',0,4)==='RIFF'&&at>=0){bytes.writeUInt32LE(bytes.length-8,4);bytes.writeUInt32LE(bytes.length-at-8,at+4)}return bytes;
}
