/* Shared rice-paper service dialogs for the painted scene and embedded sandbox. */
(()=>{
 'use strict';
 const stylesheet=new URL('paper-ui.css',document.currentScript.src);
 const link=document.createElement('link');link.rel='stylesheet';link.href=stylesheet.href;document.head.append(link);
 const panel=document.querySelector('#panel'),detail=document.querySelector('#detail');
 if(!panel||!detail)return;
 let current='',opener=null,pendingTab=null;
 detail.addEventListener('click',e=>{const tab=e.target.closest('[data-rest-tab]');if(tab)pendingTab=tab.dataset.restTab},true);
 const art=(kind)=>{const node=document.createElement('span');node.className='paper-art paper-art-'+kind;node.setAttribute('aria-hidden','true');return node};
 function decorate(){
  const rest=detail.querySelector('.rest-head'),routes=detail.querySelector('.route-card');
  const kind=rest?'rest':routes?'routes':'';
  const opened=panel.classList.contains('open')&&!!kind;
  if(panel.classList.contains('paper-panel')!==!!kind)panel.classList.toggle('paper-panel',!!kind);
  if(document.body.classList.contains('paper-dialog-open')!==opened)document.body.classList.toggle('paper-dialog-open',opened);
  if(kind){
   const head=detail.querySelector('.rest-head,.panel-head');
   if(head&&!head.querySelector('.paper-art'))head.prepend(art('mist'));
   detail.querySelectorAll('.route-card').forEach(card=>{
    if(!card.querySelector('.paper-art'))card.prepend(art('mountain'));
   });
   detail.querySelectorAll('.rest-place').forEach(card=>{
    if(card.querySelector('.paper-art'))return;
    const icon=card.querySelector('.rest-icon')?.textContent;
    card.prepend(art(icon==='枫'?'gift':['茶','盏'].includes(icon)?'tea':['食','物','西','南'].includes(icon)?'town':'mountain'));
   });
   const hero=detail.querySelector('.rest-hero');
   if(hero&&!hero.querySelector('.paper-art')){
    hero.prepend(art('banner'));
    hero.querySelector('p').textContent='吃饭、喝茶，慢慢逛山。';
   }
   if(rest){
    const sub=rest.querySelector('p');
    if(sub.textContent!=='餐饮、纪念、休息和景区导览')sub.textContent='餐饮、纪念、休息和景区导览';
   }
   const note=detail.querySelector('.rest-note');
   if(note&&!detail.querySelector('.paper-sources')){
    const sources=document.createElement('details');sources.className='paper-sources';
    const summary=document.createElement('summary');summary.textContent='服务说明与资料来源';
    note.before(sources);sources.append(summary,note);
    const footer=document.createElement('p');footer.className='paper-footer';footer.textContent='营业信息以景区现场为准';sources.before(footer);
   }
  }
  if(pendingTab){detail.querySelector(`[data-rest-tab="${pendingTab}"]`)?.focus({preventScroll:true});pendingTab=null}
  const key=opened?kind+':'+detail.querySelector('h2')?.textContent:'';
  if(key===current)return;
  const wasOpen=!!current;current=key;
  if(opened){
   if(!wasOpen)opener=document.activeElement;
   panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
   panel.setAttribute('aria-label',kind==='rest'?'山麓小憩':'观光车选线');
   panel.scrollTop=0;
   panel.querySelector('.panel-close')?.focus({preventScroll:true});
  }else{
   panel.removeAttribute('role');panel.removeAttribute('aria-modal');panel.setAttribute('aria-label','景点故事');
   if(wasOpen&&opener?.isConnected&&!opener.closest('[inert]'))opener.focus({preventScroll:true});
  }
 }
 new MutationObserver(decorate).observe(detail,{childList:true,subtree:true});
 new MutationObserver(decorate).observe(panel,{attributes:true,attributeFilter:['class']});
 document.addEventListener('keydown',e=>{
  if(!current)return;
  if(e.key==='Escape'){e.preventDefault();window.qixia?.home();return}
  if(e.key!=='Tab')return;
  const items=[...panel.querySelectorAll('button:not(:disabled),a[href],summary,[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.closest('[inert]'));
  const first=items[0],last=items.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
 });
 decorate();
})();
