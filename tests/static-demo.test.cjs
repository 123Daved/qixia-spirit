const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function run(file,url,knowledgePath){
 const store=new Map();let calls=[];
 const context={URL,URLSearchParams,Response,crypto:require('node:crypto').webcrypto,location:{hostname:'123daved.github.io',origin:'https://123daved.github.io',href:url},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:{currentScript:{src:new URL('assets/demo-mode.js',url).href},addEventListener(){}},window:{fetch:async u=>{calls.push(String(u));return new Response('{}')}}};context.window.parent={};vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
 const api=async(path,data)=>(await context.window.fetch('/api/'+path,{body:JSON.stringify(data||{})}));
 assert.equal(context.window.QIXIA_STATIC_DEMO,true);
 await api('knowledge');assert.equal(calls[0],knowledgePath);
 const saved=await(await api('letters/create',{owner:'test',spot:'lake',note:'测试山中行记',visibility:'private'})).json();assert.equal(saved.status,'private');
 const mine=await(await api('letters/mine',{owner:'test'})).json();assert.equal(mine.letters.length,1);
 assert.equal((await(await api('letters/mine',{owner:'other'})).json()).letters.length,0);
 assert.equal((await api('letters/create',{owner:'test',note:'公开',visibility:'public'})).status,400);
 assert.equal((await api('letters/publish',{owner:'test',id:saved.id})).status,503);
 assert.equal((await(await api('letters')).json()).letters.length,0);
 await api('letters/delete',{owner:'test',id:saved.id});assert.equal((await(await api('letters/mine',{owner:'test'})).json()).letters.length,0);
 assert.equal((await api('chat-stream')).status,503);
 assert.equal(calls.length,1,'未向外部模型发送问题');
}
(async()=>{await run('assets/demo-mode.js','https://123daved.github.io/qixia-spirit/栖霞有灵_手机应用.html','https://123daved.github.io/qixia-spirit/assets/travel/book/knowledge.json');await run('legacy-sandbox/assets/demo-mode.js','https://123daved.github.io/qixia-spirit/legacy-sandbox/index.html','https://123daved.github.io/qixia-spirit/assets/travel/book/knowledge.json');console.log('PASS: 两种视图的知识路径、私密行记、访问隔离、删除、公开限制与模型调用限制')})().catch(e=>{console.error(e);process.exit(1)});
