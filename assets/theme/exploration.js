/* Shared illustrated exploration composition for all eight existing guide sessions. */
(()=>{
 'use strict';
 const q=window.qixia;if(!q)return;const $=s=>document.querySelector(s);
 document.body.classList.add('exploration');
 const css=document.createElement('link');css.rel='stylesheet';css.href='assets/theme/exploration.css';document.head.append(css);
 const paths={camera:'M4 7h4l2-3h4l2 3h4v13H4z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',mic:'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0z M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3 M8 22h8',arrow:'M4 12h15 M13 6l6 6-6 6',mail:'M3 5h18v14H3z M3 5l9 8 9-8',map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16'};
 const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n]||paths.arrow}"/></svg>`;
 window.qixiaIcons=icon;
 const nav=$('.top-actions');const explore=document.createElement('button');explore.id='explore-nav';explore.textContent='游山';explore.className='nav-active';explore.onclick=()=>{window.closeLetters?.();if(!q.state.selected)q.select('stele')};nav.prepend(explore);
 $('#journal-button').textContent='我的行记';$('#journal-button').onclick=()=>window.browseLetters?.('',true);
 const letterNav=[...nav.querySelectorAll('button')].find(b=>b.textContent.includes('山中来信'));if(letterNav){letterNav.id='letters-nav';letterNav.textContent='山中来信';letterNav.onclick=()=>window.openLetter(q.places.find(p=>p.id===q.state.selected)||q.places[1])}
 const stage=$('.painted-stage'),mountain=$('.painted-mountain');mountain.src='assets/theme/exploration/mountain-map.jpg';mountain.alt='栖霞秋日山景画卷，景点标记为艺术化示意';
 const label=document.createElement('div');label.className='map-calligraphy';label.innerHTML='<strong>栖霞山</strong><span>金陵胜境<br>一山有灵</span>';stage.append(label);
 const legend=document.createElement('div');legend.className='map-legend';legend.innerHTML='<span>◉ 景点位置</span><span class="legend-current">◉ 此刻停留</span><small>艺术化山境 · 非实地导航</small>';stage.append(legend);
 const coords=[[24,78],[69,43],[35,64],[47,29],[60,18],[24,43],[82,66],[61,86]];
 stage.querySelectorAll('.painted-spot').forEach((b,i)=>{b.style.left=coords[i][0]+'%';b.style.top=coords[i][1]+'%';b.innerHTML=`<i></i><span>${q.places[i].name}<small>第 0${i+1} 境</small></span>`;b.setAttribute('aria-pressed','false')});
 const utility=document.createElement('div');utility.className='exploration-utilities';stage.append(utility);$('.theme-book').textContent='景区讲解书 ↗';utility.append($('.theme-book'));
 const names=q.places.map(p=>p.person.split(' · ')[0]);$('#destinations').querySelectorAll('.destination').forEach((b,i)=>{b.querySelector('strong').textContent=names[i];b.title=q.places[i].name+' · '+names[i]});
 const questions={lake:['湖中的倒影有什么不同？','带我观察湖边细节'],stele:['这块碑有什么故事？','带我找一处细节'],palace:['这里曾经是什么模样？','带我认识一处遗迹'],tea:['陆羽与栖霞有什么故事？','怎样观察山中的茶事？'],cave:['石窟有什么值得看的？','带我寻找光影细节'],stone:['石头上的条纹怎么来的？','传说与地质有什么不同？'],maple:['这些红叶是什么树？','带我观察一片秋色'],spring:['山里的水从哪里来？','陪我听一听泉水']};
 const mount=window.mountConversation;
 window.mountConversation=(p,container,options)=>{
  mount(p,container,options);if(container||p.id==='guide')return;
  const detail=$('#detail'),body=detail.querySelector('.panel-body'),portrait=detail.querySelector('.portrait'),quote=detail.querySelector('.quote'),dialogue=detail.querySelector('.dialogue'),photo=detail.querySelector('.scene-photo');
  detail.dataset.place=p.id;$('#panel').scrollTop=0;
  stage.querySelectorAll('.painted-spot').forEach(b=>{const active=b.dataset.place===p.id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  // Actual photo, separate character artwork and native text: never a screenshot used as UI.
  body.prepend(photo);const credits=document.createElement('details');credits.className='photo-credit';const summary=document.createElement('summary');summary.textContent='实景与图片来源';credits.append(summary,photo.querySelector('figcaption'));photo.append(credits);
  const encounter=document.createElement('section');encounter.className='guide-encounter';const words=document.createElement('div');words.className='guide-words';const title=document.createElement('div');title.className='guide-name';const name=document.createElement('strong');name.textContent=p.person.split(' · ')[0];const badge=document.createElement('span');badge.textContent='山中向导';title.append(name,badge);words.append(title,quote);
  const audio=document.createElement('div');audio.className='guide-audio';const listen=$('#ask-listen');listen.textContent='▶  听他讲';listen.setAttribute('aria-label','听'+name.textContent+'讲述');let playing=false;listen.onclick=async()=>{if(playing){q.hush();playing=false;listen.textContent='▶  听他讲';listen.setAttribute('aria-pressed','false');return}window.pauseConversation?.();playing=true;listen.textContent='Ⅱ  暂停讲述';listen.setAttribute('aria-pressed','true');const ok=await q.speak(p.id+'-full');playing=false;listen.textContent='▶  听他讲';listen.setAttribute('aria-pressed','false');if(!ok&&q.state.selected===p.id)q.toast('讲述已暂停，可随时继续或阅读山中故事。')};audio.append(listen);const wave=document.createElement('span');wave.className='audio-wave';wave.setAttribute('aria-hidden','true');wave.innerHTML=Array.from({length:25},(_,i)=>`<i style="height:${5+(i*13%19)}px"></i>`).join('');audio.append(wave);words.append(audio);encounter.append(portrait,words);photo.after(encounter);body.querySelector('.ask').remove();
  const titleRow=dialogue.querySelector('.dialogue-title');titleRow.innerHTML='<strong>你可能想问</strong>';const suggestions=document.createElement('div');suggestions.className='question-suggestions';questions[p.id].forEach(t=>{const b=document.createElement('button');b.type='button';b.textContent=t+'  ›';b.onclick=()=>{const input=dialogue.querySelector('.dialogue-form input');input.value=t;dialogue.querySelector('form').requestSubmit()};suggestions.append(b)});titleRow.after(suggestions);
  const greeting=dialogue.querySelector('.dialogue-message.assistant');greeting.hidden=true;
  const form=dialogue.querySelector('form'),send=form.querySelector('button');send.className='dialogue-send';send.innerHTML=icon('arrow');send.setAttribute('aria-label','发送问题');
  const input=form.querySelector('input');input.placeholder='问问'+name.textContent+'…';
  for(const [cls,n,text] of [['.dialogue-photo','camera','上传照片提问'],['.dialogue-mic','mic','语音提问']]){const b=dialogue.querySelector(cls);b.innerHTML=icon(n);b.title=text;b.setAttribute('aria-label',text);form.append(b)}
  const tabs=body.querySelector('.tabs'),story=body.querySelector('#story');const details=document.createElement('details');details.className='story-details';const ds=document.createElement('summary');ds.textContent='山中故事 · 小小寻踪';details.append(ds,tabs,story);dialogue.after(details);tabs.querySelector('[data-tab=memory]').textContent='留一句话';
  const bus=$('#bus-hint');if(bus){const span=bus.querySelector('span');span.textContent=span.firstChild.textContent+' · 查看路线 ↗';bus.lastChild.textContent='';}
  window.qixiaArtStage?.relayout?.();
 };
 // Markers clear when returning to the painting; existing transit hooks remain intact.
 const close=q.hooks.close;q.hooks.close=()=>{close?.();stage.querySelectorAll('.painted-spot').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')})};
 for(const b of document.querySelectorAll('.painted-spot,#destinations .destination'))b.addEventListener('click',()=>{if(matchMedia('(max-width:760px)').matches)requestAnimationFrame(()=>document.querySelector('#panel').scrollIntoView({behavior:q.reduced?'auto':'smooth',block:'start'}))});
 function init(){if(!window.qixiaReady){setTimeout(init,100);return}window.qixiaArtStage?.relayout?.();if(document.body.classList.contains('phone-app')||document.querySelector('.autumn-guide:not([hidden])'))return;q.select('stele');}requestAnimationFrame(()=>{if(!q.state.selected)init()});
})();
