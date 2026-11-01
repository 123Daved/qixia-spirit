const origin='https://qixia.winnielyu.com';
export function retrieve(kb,query,id){
 const defaults={lake:'明镜湖',stele:'明征君碑',palace:'乾隆行宫遗址',tea:'陆羽茶庄 白乳泉',cave:'千佛岩',stone:'天开岩',maple:'红叶谷 枫岭',spring:'栖霞山'};
 const q=String(query||'');const focus=defaults[id]||(id==='guide'&&/路线|行程|攻略|游览|怎么走|半日|一日/.test(q)?'栖霞山 明镜湖 栖霞寺 千佛岩 红叶谷':'');
 const scored=kb.cards.filter(c=>['place','event','org'].includes(c.type)).map(c=>{const words=[c.title,...(c.aliases||[])].filter(Boolean);let score=0;for(const w of words){if(q.includes(w))score+=20+w.length;if(focus.includes(w)||w.includes(focus)&&focus.length>1)score+=7;for(let i=0;i<w.length-1;i++)if(q.includes(w.slice(i,i+2)))score+=1}for(const theme of c.themes||[])if(theme.length>=2&&q.includes(theme))score+=2;return {c,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6);
 return scored.map(({c})=>{const facts=Array.isArray(c.facts)?c.facts.filter(f=>f.value!==undefined).sort((a,b)=>('ABC'.indexOf(a.credibility||'C')-'ABC'.indexOf(b.credibility||'C'))).slice(0,16).map(f=>`${f.key}：${f.value}${f.unit||''}${f.as_of?'（资料时间 '+f.as_of+'）':''} [${f.credibility||'未分级'}]${f.source?' 来源 '+f.source:''}`).join('；'):'';return `【${c.title}】${c.summary||''}\n${facts}\n知识卡：${origin}/place.html?id=${encodeURIComponent(c.id)}；状态：${c.status||'未标注'}`}).join('\n\n');
}
