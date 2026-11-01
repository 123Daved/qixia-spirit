const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/photo-studio.js'),'utf8');
const renderer=source.slice(source.indexOf('const stories='),source.indexOf('\nasync function showResult()'));
const ids=['lake','stele','palace','tea','cave','stone','maple','spring'];
function harness(width,height){
 const ops=[];let canvas;
 const g={font:'10px sans-serif',fillRect(...args){ops.push({type:'rect',args})},drawImage(...args){ops.push({type:'image',args})},fillText(text,x,y,maxWidth){ops.push({type:'text',text,x,y,maxWidth,align:this.textAlign,size:parseInt(this.font.match(/(\d+)px/)[1])})},measureText(text){return {width:[...text].length*parseInt(this.font.match(/(\d+)px/)[1])}},beginPath(){},moveTo(x,y){ops.push({type:'line',x,y})},lineTo(x,y){ops.push({type:'line',x,y})},stroke(){}};
 const context={Image:class{constructor(){this.width=width;this.height=height}set src(value){queueMicrotask(()=>this.onload())}},document:{createElement(){return canvas={getContext:()=>g,toDataURL:()=> 'data:image/png;base64,test'}}}};
 vm.createContext(context);vm.runInContext(renderer+'\nglobalThis.render=buildMemoryPoster;',context);
 return {render:context.render,ops,get canvas(){return canvas}};
}
test('all eight posters retain the full image and keep every overlay outside it',async()=>{
 for(const id of ids)for(const [width,height] of [[1800,1200],[900,1600],[1600,900],[4000,200],[200,4000]]){
  const h=harness(width,height);await h.render({spot:id,image:'fixture',reference:{author:'测试',license:'CC0',source:'https://example.com/image'}});
  const draws=h.ops.filter(o=>o.type==='image');assert.equal(draws.length,1);
  const [img,x,y,w,z]=draws[0].args;assert.equal(draws[0].args.length,5,'drawImage must use the entire source, not crop coordinates');
  assert.ok(Math.abs(w/z-width/height)<1e-8,'aspect ratio preserved');
  assert.ok(x>=0&&y>=0&&x+w<=h.canvas.width&&y+z<=h.canvas.height);
  let afterImage=false;
  for(const op of h.ops){
   if(op.type==='image'){afterImage=true;continue}
   if(op.type==='rect'&&afterImage){const [rx,ry,rw,rh]=op.args;assert.ok(rx+rw<=x||rx>=x+w||ry+rh<=y||ry>=y+z,'no panel may overlap the picture')}
   if(op.type==='text'){
    assert.ok(op.y+op.size*.25<y||op.y-op.size>y+z,'text glyphs must stay outside the picture');
    assert.ok(op.y+op.size*.25<h.canvas.height);
    if(op.maxWidth===undefined){const span=[...op.text].length*op.size;assert.ok(op.align==='right'?op.x-span>=0:op.x+span<=h.canvas.width,'wrapped text fits horizontally')}
   }
   if(op.type==='line')assert.ok(op.y<y||op.y>y+z,'decoration stays outside image');
  }
 }
});
test('all eight local and cloud prompts share face protection and no-panel rules',async()=>{
 const {posterPreset}=await import('../tools/poster-prompts.mjs');
 const doc=fs.readFileSync(path.join(root,'docs/栖霞山八景打卡海报提示词.md'),'utf8');
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'cloud-backend/backend/poster-prompts.json'),'utf8')),doc);
 assert.equal((doc.match(/面部保护：/g)||[]).length,8);
 const cloudCode=fs.readFileSync(path.join(root,'cloud-backend/backend/poster.js'),'utf8').replace("import promptDocument from './poster-prompts.json';",'const promptDocument='+JSON.stringify(doc)+';');
 const cloud=await import('data:text/javascript;base64,'+Buffer.from(cloudCode).toString('base64'));
 for(const id of ids){
  const local=await posterPreset(root,id,{cards:[],photos:[]},'请做成旅行纪念海报');
  const remote=await cloud.posterPreset(id,{cards:[],photos:[]},'请做成旅行纪念海报');
  assert.equal(local.prompt,remote.prompt);
  assert.match(local.prompt,/每个人的头顶至下巴完整可见/);
  assert.match(local.prompt,/整幅图片之外单独排版/);
  assert.match(local.prompt,/面部保护：/);
  assert.doesNotMatch(local.prompt,/顶部预留宽阔标题区|左侧留出简短故事文字位置|两至三个说明文字区/);
 }
});
