// 从公开知识库读取卡片、事实和带许可的图片；失败时保留上一次完整快照。
import {writeFile,rename} from 'node:fs/promises';
const base='https://qixia.winnielyu.com', root=process.cwd();
async function get(p){const r=await fetch(base+p,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(`${p}: ${r.status}`);return r.json()}
const [catalog,photos]=await Promise.all([get('/api/kb/cards'),get('/gallery.json')]);if(!Array.isArray(catalog.cards)||catalog.cards.length<10||!Array.isArray(photos))throw Error('知识库数据不完整');
let next=0;const details=Array(catalog.cards.length),errors=[];await Promise.all(Array.from({length:8},async()=>{while(next<catalog.cards.length){const i=next++,c=catalog.cards[i];try{details[i]=await get('/api/kb/cards/'+encodeURIComponent(c.id))}catch(e){errors.push(c.id);details[i]=c}}}));
const data={source:base,updatedAt:new Date().toISOString(),cards:details,photos,partial:errors};const target=root+'/knowledge/qixia-public.json';await writeFile(target+'.tmp',JSON.stringify(data));await rename(target+'.tmp',target);console.log(`同步完成：${details.length} 条卡片，${photos.length} 张图片，${errors.length} 条详情未获取`);
