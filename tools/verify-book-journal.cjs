// Run with jsdom available on NODE_PATH. No live browser or network is required.
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
const snapshot=JSON.parse(fs.readFileSync(path.join(base,'assets/travel/book/knowledge.json'),'utf8'));
const source=n=>fs.readFileSync(path.join(base,'assets/js',n),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,10));
function setup(fetcher){
 const dom=new JSDOM('<!doctype html><html><head></head><body><div id="app"><button id="entry">打开</button></div></body></html>',{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.HTMLElement.prototype.scrollTo=function(o){this.scrollTop=o.top};w.HTMLElement.prototype.scrollIntoView=function(){};
 w.fetch=fetcher||(async()=>({ok:true,json:async()=>snapshot}));w.qixia={app:w.document.querySelector('#app'),reduced:true,toast:()=>{}};w.qixia.app.inert=false;
 w.eval(source('book-journal.js'));w.eval(source('travel-library.js'));
 return {w,d:w.document,dom};
}
(async()=>{
 const checks=[];const {w,d,dom}=setup();
 d.querySelector('#entry').focus();await w.qixiaTravel.open('book');await tick();
 assert.equal(d.querySelectorAll('.journal-card').length,8);checks.push('Exactly eight curated chapters');
 const titles=['明镜湖','明征君碑','乾隆行宫遗址','茶文化点','千佛岩石窟','青锋剑石','红叶谷','栖霞泉'];
 const ids=['lake','stele','palace','tea','cave','stone','maple','spring'];
 for(let i=0;i<ids.length;i++){
  d.querySelector(`.journal-card[data-chapter="${ids[i]}"]`).click();
  assert.equal(d.querySelector('#journal-detail-title').textContent,titles[i]);
  assert.equal(d.querySelectorAll('.journal-observation').length,3);
  assert.equal(d.activeElement.id,'journal-detail-title');
  const disclosure=d.querySelector('.journal-sources');disclosure.open=true;disclosure.dispatchEvent(new w.Event('toggle'));
  assert.ok(disclosure.querySelector('.journal-source-content').textContent.length>30);
  if(i<7){assert.equal(d.querySelector('.journal-next').dataset.chapter,ids[i+1]);}
  d.querySelector('[data-journal-index]').click();
  assert.equal(d.querySelectorAll('.journal-card').length,8);
  assert.equal(d.activeElement.dataset.chapter,ids[i]);
 }
 checks.push('All eight details, observation sections, sources, adjacent chapter targets, return focus');
 let search=d.querySelector('input[type=search]');search.value='千佛岩';search.dispatchEvent(new w.Event('input'));
 assert.equal(d.querySelectorAll('.journal-card').length,1);assert.equal(d.querySelector('.journal-card').dataset.chapter,'cave');
 d.querySelector('.journal-card').click();d.querySelector('[data-journal-index]').click();
 assert.equal(d.querySelector('input').value,'千佛岩');assert.equal(d.querySelectorAll('.journal-card').length,1);
 search=d.querySelector('input');search.value='<img src=x onerror=alert(1)>';search.dispatchEvent(new w.Event('input'));
 assert.ok(d.querySelector('.journal-empty'));assert.equal(d.querySelectorAll('.journal-grid img').length,0);
 d.querySelector('[data-journal-clear]').click();assert.equal(d.querySelectorAll('.journal-card').length,8);
 checks.push('Alias search, empty state, clear, search preservation, untrusted search text');
 d.querySelector('[data-chapter=lake]').click();
 for(let i=1;i<8;i++){d.querySelector('.journal-next').click();assert.equal(d.querySelector('#journal-detail-title').textContent,titles[i]);}
 d.querySelector('.journal-next').click();assert.equal(d.querySelectorAll('.journal-card').length,8);
 checks.push('Full sequential reading and final return to directory');
 d.querySelector('[data-tab=plan]').click();assert.equal(d.querySelector('.travel-overlay').dataset.view,'plan');assert.ok(d.querySelector('.editorial-map'));
 d.querySelector('[data-route]').click();assert.equal(d.querySelector('#travel-route-details').hidden,false);
 d.querySelector('[data-place="千佛岩"]').click();assert.equal(d.querySelector('#journal-detail-title').textContent,'千佛岩石窟');
 d.querySelector('[data-tab=plan]').click();d.querySelector('[data-route]').click();d.querySelector('[data-place="栖霞寺"]').click();assert.equal(d.querySelector('.travel-detail h3').textContent,'栖霞寺');
 checks.push('Original route guide, chapter links, supplemental knowledge card');
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(d.querySelector('.travel-overlay').hidden,true);assert.equal(w.qixia.app.inert,false);assert.equal(d.activeElement.id,'entry');
 checks.push('Close, app interactivity and focus restoration');
 dom.window.close();
 let resolve;const pending=setup(()=>new Promise(r=>resolve=r));pending.w.qixiaTravel.open('book');pending.d.querySelector('[data-chapter=maple]').click();resolve({ok:true,json:async()=>snapshot});await tick();assert.equal(pending.d.querySelector('#journal-detail-title').textContent,'红叶谷');pending.dom.window.close();checks.push('Delayed knowledge does not reset a reading chapter');
 const calls=[];const offline=setup(async url=>{calls.push(url);if(url==='/api/knowledge')throw Error('offline');return{ok:true,json:async()=>snapshot}});offline.w.qixiaTravel.open('book');await tick();assert.ok(calls.includes('assets/travel/book/knowledge.json'));offline.d.querySelector('[data-chapter=lake]').click();const details=offline.d.querySelector('details');details.open=true;details.dispatchEvent(new offline.w.Event('toggle'));assert.ok(offline.d.querySelector('.journal-source-links a'));offline.dom.window.close();checks.push('Local source snapshot fallback after API failure');
 const failed=setup(async()=>{throw Error('offline')});failed.w.qixiaTravel.open('book');await tick();assert.equal(failed.d.querySelectorAll('.journal-card').length,8);failed.d.querySelector('[data-chapter=maple]').click();assert.equal(failed.d.querySelector('#journal-detail-title').textContent,'红叶谷');failed.dom.window.close();checks.push('Eight chapters remain readable with both knowledge requests offline');
 for(const id of [...ids,'botanical'])for(const suffix of ['.jpg','-thumb.jpg'])assert.ok(fs.existsSync(path.join(base,'assets/travel/book',id+suffix)));
 checks.push('All large illustrations and thumbnails exist');
 console.log(JSON.stringify({result:'passed',checks},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
