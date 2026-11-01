// 从可审阅的提示词文档加载通用规则与八个景点的专属场景。
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const presets={
 lake:{section:'01 明镜湖',name:'明镜湖',card:'place-320113-mingjinghu',reference:'c3237525640.jpg'},
 stele:{section:'02 明征君碑',name:'明征君碑',card:'place-320113-mingzhengjunbei',reference:'c1cab8bc2cc.jpg'},
 palace:{section:'03 乾隆行宫遗址',name:'乾隆行宫遗址',card:'place-320113-qianlongxinggong',reference:'ccfef4cc64a.png'},
 tea:{section:'04 茶文化点',name:'茶文化点',card:null},
 cave:{section:'05 千佛岩石窟',name:'千佛岩石窟',card:'place-320113-qianfoyan',reference:'c98ba440665.jpg'},
 stone:{section:'06 青锋剑石',name:'青锋剑石',card:null},
 maple:{section:'07 红叶谷',name:'红叶谷',card:'place-320113-hongyegu'},
 spring:{section:'08 栖霞泉',name:'栖霞泉',card:null}
};
let loaded;
export async function posterPreset(root,id,kb,note=''){
 if(!presets[id])throw Error('景点不存在');
 if(!loaded){const text=await readFile(path.join(root,'docs/栖霞山八景打卡海报提示词.md'),'utf8');const common=text.match(/## 一、通用提示词[\s\S]*?```text\s*\n([\s\S]*?)\n```/);const entries=[...text.matchAll(/### ([^\n]+)\n\n```text\s*\n([\s\S]*?)\n```/g)];if(!common||entries.length!==8)throw Error('海报提示词文档格式错误');loaded={common:common[1],entries:Object.fromEntries(entries.map(x=>[x[1].split(' · ')[0],x[2]]))}}
 const preset=presets[id],card=kb.cards.find(c=>c.id===preset.card);if(!loaded.entries[preset.section])throw Error('景点专属提示词缺失');
 let fact='该入口为数字意境或没有匹配的知识卡；不要补充未确认的景点事实。';
 if(card){const facts=Array.isArray(card.facts)?card.facts.filter(f=>f.value!=null&&['A','B'].includes(f.credibility)).slice(0,8).map(f=>`${f.key}：${f.value}${f.unit||''}`).join('；'):'';fact=`${card.title}：${card.summary||''}。${facts}。资料状态：${card.status||'未标注'}；知识卡：https://qixia.winnielyu.com/place.html?id=${card.id}`}
 const reference=preset.reference?kb.photos.find(p=>p.file?.endsWith('/'+preset.reference)&&p.card===preset.card):null;
 const imagePath=reference?path.join(root,'assets/kb-photos',preset.reference):null;
 const intro=loaded.common.replace('{用户需求}',note||'无额外要求').replace('{景点名称}',preset.name).replace('{知识库检索片段及来源}',fact).replace('{参考图及其说明；没有则写“无”}',reference?`${reference.desc||reference.title}；来自知识库，照片 ${reference.author}，${reference.license}。`: '无；此景为艺术想象，不可声称为景点实景复原。');
 const composition="画面尺寸横向 3:2。第 1 张输入图是游客照片，保留人物身份和人数；如有第 2 张图片，它是景点环境参考。生成一幅连续、无文字、无拼贴的旅行场景。最高优先级：每个人的头顶至下巴完整可见，面部及头部安全空间不被任何物体遮挡，不贴边，不裁切。多人合影逐人检查；空间不足时调整站位与构图，不得省略人物或挡脸。不要绘制标题区、故事框、空白卡片、半透明面板、细节拼贴、贴纸、水印或装饰边框；不要为左上角文字留空。景点故事、标题和来源由程序在整幅图片之外单独排版。";
 return {prompt:`${intro}\n\n${loaded.entries[preset.section]}\n\n${composition}`,imagePath,reference:reference?{author:reference.author,license:reference.license,source:reference.source}:null};
}
