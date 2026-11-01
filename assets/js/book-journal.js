/* 手绘游山册：画面是独立插画，文字、目录、来源和翻页均为可访问的 HTML。 */
(() => {
  'use strict';
  const asset = 'assets/travel/book/';
  const chapters = [
    { id: 'lake', title: '明镜湖', card: 'place-320113-mingjinghu', aliases: ['彩虹明镜'],
      subtitle: '把湖光留在这一页', motif: '湖光 · 树影',
      lead: '慢一点，看看水面收下了怎样的山色。',
      story: '读明镜湖，可以先从倒影开始。近处是水面的波纹，远处是岸边的树与亭桥；同一处景色，映在水里又有了另一副模样。换一个角度，留意光和风怎样改变眼前的画面。',
      observation: [['看树影', '沿着枝叶的倒影，看水面怎样把清晰的轮廓轻轻揉开。', '18% 30%'], ['看水面', '找一圈细小的涟漪，看看静水与波纹有什么不同。', '50% 75%'], ['看远岸', '把目光放远，在树木与亭桥之间找一处喜欢的构图。', '85% 40%']] },
    { id: 'stele', title: '明征君碑', card: 'place-320113-mingzhengjunbei',
      subtitle: '一块碑，留住山中旧事', motif: '碑刻 · 山中旧事',
      lead: '把时间读慢一点，从一块石碑认识一座山。',
      story: '明征君碑与明僧绍的故事有关。读碑，不只是在读文字，也是在看石面、刻痕与碑的形制。先看整体，再留意一处细节；不急着把所有内容记住，让眼前的线索带你继续了解山中的往事。',
      observation: [['看碑形', '从整体轮廓开始，留意碑首、碑身与基座的关系。', '50% 20%'], ['看刻痕', '在允许的距离观察石面纹理，不触摸、不拓印文物。', '50% 55%'], ['看环境', '把石碑放回周围的空间，看光影怎样落在它身上。', '85% 45%']] },
    { id: 'palace', title: '乾隆行宫遗址', card: 'place-320113-qianlongxinggong', aliases: ['乾隆行宫'],
      subtitle: '旧址上的山风', motif: '遗址 · 草木',
      lead: '从留下的石头与草木，认识曾经的行宫。',
      story: '资料记载，清代两江总督尹继善曾在栖霞山为乾隆建行宫，后来毁于咸丰时期。今天，阅读遗址要从现存的线索出发：看留下的石材与空间，分清眼前的遗存和对过去的想象。',
      observation: [['看石材', '留意石块的边缘与接缝，在现场辨认仍可见的遗存。', '40% 65%'], ['看草木', '看看植物怎样沿石缝生长，给旧址添上新的颜色。', '80% 65%'], ['看空间', '从开放的参观区域观察，不把想象当作建筑的复原。', '50% 30%']] },
    { id: 'tea', title: '茶文化点', virtual: true, aliases: ['山中茶事'],
      subtitle: '把山里的时间泡慢', motif: '茶香 · 一盏停留',
      lead: '在山水之间歇一会儿，让一盏茶陪你慢慢看风景。',
      story: '这一页是山中茶事的数字演绎。从一片茶叶、一只茶杯和片刻停留开始，想象一段不赶路的时光。这里不指向某一处真实茶庄，也不把画中的茶席当作历史现场。',
      observation: [['看茶叶', '留意叶片的形状与舒展，想象它在水中慢慢打开。', '85% 50%'], ['看茶汤', '从杯口的光影，看一盏茶里细微的颜色。', '35% 65%'], ['歇一会', '把脚步放慢，给自己留一段安静的山中时间。', '50% 45%']] },
    { id: 'cave', title: '千佛岩石窟', card: 'place-320113-qianfoyan', aliases: ['千佛岩', '千佛崖'],
      subtitle: '石头藏着慢时光', motif: '石窟 · 岩壁',
      lead: '沿着山石的轮廓，慢慢读一处石窟。',
      story: '千佛岩的石窟依山崖而开，山石与龛窟共同构成了这里的景观。先退后看岩壁的整体，再从允许参观的区域观察一处龛窟。石面的纹理、凿刻的轮廓与山间的光影，都是读懂这一景的线索。',
      observation: [['看岩壁', '观察山石起伏，看看龛窟如何依着岩壁展开。', '28% 40%'], ['看龛窟', '辨认开凿的轮廓与深浅，保持距离，不触碰文物。', '65% 50%'], ['看光影', '留意树影与石面交接的地方，看细节如何显现。', '75% 20%']] },
    { id: 'stone', title: '青锋剑石', aliases: ['青锋剑'],
      subtitle: '山石有自己的时间', motif: '山石 · 自然纹理',
      lead: '沿着石面找一条纹理，留下一处自己的发现。',
      story: '这一页从山石观察出发。名字可以引起想象，眼前的纹理、棱角与草木则值得慢慢看。插画表现山石意境，不作为青锋剑石的实景复原；具体形态，请以现场和经过确认的资料为准。',
      observation: [['看纹理', '顺着石面的一条纹路，观察它怎样延伸和转折。', '50% 50%'], ['看棱角', '比较平整与粗糙的地方，不急着猜测它的成因。', '60% 25%'], ['看草木', '在石头与植物相遇的地方，寻找小小的颜色变化。', '25% 70%']] },
    { id: 'maple', title: '红叶谷', card: 'place-320113-hongyegu',
      subtitle: '把一段秋色带回去', motif: '秋色 · 林间慢行',
      lead: '沿着路慢慢走，挑一片最想记住的颜色。',
      story: '读红叶谷，不必只盯着最红的一片叶子。把目光放进整片山林：枝叶的疏密、光线的明暗、脚下道路的转折，都让这一程有了层次。画中呈现的是秋日意境，山林的颜色会随季节与天气变化。',
      observation: [['看叶色', '留意不同树叶的颜色变化，从浅黄到深红，各有韵味。', '22% 20%', 'botanical'], ['看光影', '阳光穿过树梢，在山路上投下斑驳的光影。', '65% 30%'], ['慢慢走', '放慢脚步，听风吹过树梢，感受山林的宁静。', '50% 75%']] },
    { id: 'spring', title: '栖霞泉', virtual: true, aliases: ['山泉意境'],
      subtitle: '听山水说一段悄悄话', motif: '水声 · 山水想象',
      lead: '闭上眼，想象水声从林间传来。',
      story: '栖霞泉是产品里的虚拟山水意境，不是已经确认的真实泉眼。这一页用水波、石面与树影，邀请你想象片刻清凉。它不代表历史名泉的现状，也不提供寻找泉眼的实地路线。',
      observation: [['看水波', '想象水面轻轻荡开，收下树影与天光。', '50% 70%'], ['看山石', '看水与石相接的地方，感受柔和与坚实的对照。', '22% 60%'], ['听山水', '给想象留一点安静，让这一页在水声里慢慢结束。', '75% 35%']] }
  ];
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe = url => /^https?:\/\//i.test(url || '') ? esc(url) : '#';
  const number = i => String(i + 1).padStart(2, '0');
  const art = (id, small = false) => asset + id + (small ? '-thumb' : '') + '.jpg';
  const label = c => c.virtual ? '数字意境' : c.id === 'maple' ? '秋日意境插画' : '意境插画';
  const find = name => chapters.find(c => c.id === name || c.card === name || c.title === name || c.aliases?.includes(name));
  function create({ body, shell, getKnowledge }) {
    let query = '', active = null, indexScroll = 0;
    function cards(term = query) {
      query = term;
      const needle = term.trim().toLowerCase();
      const filtered = chapters.filter(c => [c.title, c.motif, ...(c.aliases || [])].join(' ').toLowerCase().includes(needle));
      body.querySelector('.journal-grid').innerHTML = filtered.length ? filtered.map(c => `
        <button type="button" class="journal-card${active === c.id ? ' is-current' : ''}" data-chapter="${c.id}" aria-label="阅读第 ${number(chapters.indexOf(c))} 章 ${c.title}">
          <img class="journal-card-art" src="${art(c.id, true)}" alt="" width="1536" height="1024" decoding="async">
          <span class="journal-card-copy"><span class="journal-card-number">${number(chapters.indexOf(c))}<i></i></span><strong>${c.title}</strong><small>${c.motif}</small><span class="journal-card-caption">意境插画${c.virtual ? '<em>数字意境</em>' : ''}</span></span><span class="journal-card-arrow" aria-hidden="true">↗</span>
        </button>`).join('') : `<div class="journal-empty"><span aria-hidden="true">⌕</span><h4>这一页，还没有找到</h4><p>试试“明镜湖”“千佛岩”或“红叶”。</p><button type="button" data-journal-clear>查看全部八景 →</button></div>`;
      body.querySelector('.journal-result').textContent = needle ? `找到 ${filtered.length} 个章节` : '共八个章节，选一景开始阅读';
    }
    function index({ restore = false } = {}) {
      body.innerHTML = `<section class="journal-index" aria-labelledby="journal-index-title"><div class="journal-cover"><div><span class="journal-eyebrow">山中手记 · EIGHT CHAPTERS</span><h3 id="journal-index-title">带一本山中手记出发</h3><p>八个章节，读懂沿途风景</p></div><img class="journal-botanical" src="${art('botanical', true)}" alt="" width="1536" height="1024"><span class="journal-seal" aria-hidden="true">山<br>中<br>行<br>记</span></div><div class="journal-search-row"><label class="journal-search"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg><input type="search" value="${esc(query)}" placeholder="搜索景点，如明镜湖、千佛岩" aria-label="搜索八景章节"></label><span class="journal-result" role="status" aria-live="polite"></span></div><div class="journal-grid"></div><footer class="journal-colophon"><span>栖霞山 · 手绘游山册</span><span>画中见山水，行间读故事</span><small>插画为艺术演绎；实景照片与资料见各章节来源。</small></footer></section>`;
      cards();
      body.querySelector('input').addEventListener('input', e => cards(e.target.value));
      if (restore) {
        shell.scrollTo({ top: indexScroll, behavior: 'instant' });
        body.querySelector(`[data-chapter="${active}"]`)?.focus({ preventScroll: true });
      }
    }
    function sources(c) {
      const kb = getKnowledge();
      const card = kb?.cards.find(x => x.id === c.card);
      const photos = kb?.photos.filter(p => p.card === c.card && !p.historic).slice(0, 3) || [];
      const links = [...new Map((card?.sources || []).filter(s => s.url).map(s => [s.url, s])).values()];
      return `<p class="journal-source-note">本页手绘插画由 AI 创作，用于游山意境表达，不作为实景复原。${c.virtual ? '本章是产品中的数字意境入口。' : '下列照片与资料保留原作者及来源。'}</p>${card ? `<div class="journal-source-links">${links.slice(0, 5).map(s => `<a href="${safe(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title || '参考资料')} ↗</a>`).join('')}<a href="https://qixia.winnielyu.com/place.html?id=${encodeURIComponent(card.id)}" target="_blank" rel="noopener noreferrer">查看完整景点资料 ↗</a></div>` : `<p class="journal-source-note">${c.virtual ? '本章根据项目内的数字体验设定编写，不对应真实地点的历史考证。' : c.id === 'stone' ? '本章为山石观察引导；暂不提供未经确认的实景照片与地质结论。' : '景点来源暂未载入，可稍后重新展开此处查看。'}</p>`}${photos.length ? `<h5>实景照片 · 对照着看</h5><div class="journal-source-photos">${photos.map(p => `<figure><img src="assets/kb-photos/${esc(p.file.split('/').pop())}" alt="${esc(p.desc || p.title)}" loading="lazy"><figcaption>${esc(p.desc || p.title)}<br>作者 ${esc(p.author)} · <a href="${safe(p.license_url || p.source)}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a> · <a href="${safe(p.source)}" target="_blank" rel="noopener noreferrer">原图与来源 ↗</a></figcaption></figure>`).join('')}</div>` : ''}`;
    }
    function detail(id, { focus = true } = {}) {
      const c = find(id); if (!c) return false;
      if (body.querySelector('.journal-index')) indexScroll = shell.scrollTop;
      active = c.id;
      const i = chapters.indexOf(c), previous = chapters[i - 1], next = chapters[i + 1];
      body.innerHTML = `<article class="journal-detail" aria-labelledby="journal-detail-title"><div class="journal-topline"><button type="button" class="journal-back" data-journal-index>← <span>景点目录</span></button><span class="journal-top-caption">山中手记 / ${esc(c.motif)}</span></div><header class="journal-title"><div><span class="journal-eyebrow"><b>${number(i)}</b> / 08${c.virtual ? '<em class="journal-virtual">数字意境</em>' : ''}</span><h3 id="journal-detail-title" tabindex="-1">${c.title}</h3><p>${c.subtitle}</p></div><img class="journal-title-leaf" src="${art('botanical', true)}" alt="" width="1536" height="1024"><span class="journal-page-mark" aria-hidden="true"><b>${number(i)}</b><i></i><span>08</span></span></header><figure class="journal-hero"><img src="${art(c.id)}" alt="${esc(c.title)}主题手绘意境插画" width="1536" height="1024" fetchpriority="high"><figcaption>${label(c)}</figcaption></figure><div class="journal-reading"><p class="journal-lead">${c.lead}</p><p class="journal-story">${c.story}</p></div><section class="journal-observations" aria-labelledby="journal-observe-title"><h4 id="journal-observe-title"><span>沿途，留意这些细节</span></h4><div class="journal-observation-grid">${c.observation.map(([title, text, position, image], n) => `<article class="journal-observation"><div class="journal-observation-image"><img src="${art(image || c.id, true)}" alt="" style="object-position:${position};--detail-focus:${position}" width="1536" height="1024" loading="lazy"></div><h5><small>0${n + 1}</small>${title}</h5><p>${text}</p></article>`).join('')}</div></section><details class="journal-sources"><summary><span>资料与图片来源</span><span class="journal-source-toggle" aria-hidden="true">⌄</span></summary><div class="journal-source-content"></div></details><nav class="journal-pagination" aria-label="章节翻页">${previous ? `<button type="button" data-chapter="${previous.id}" aria-label="上一章 ${previous.title}"><span aria-hidden="true">←</span><span><small>上一章</small>${previous.title}</span></button>` : '<button type="button" data-journal-index>← 返回八景目录</button>'}<span class="journal-pagination-count">${number(i)} <i>/</i> 08</span>${next ? `<button type="button" class="journal-next" data-chapter="${next.id}" aria-label="下一章 ${next.title}"><span><small>下一章</small>${next.title}</span><span aria-hidden="true">→</span></button>` : '<button type="button" class="journal-next" data-journal-index>读完这一册 · 回到目录 →</button>'}</nav><footer class="journal-detail-footer">栖霞山 · 手绘游山册 <span>把风景读慢一点</span></footer></article>`;
      const disclosure = body.querySelector('.journal-sources');
      disclosure.addEventListener('toggle', () => {
        if (disclosure.open) disclosure.querySelector('.journal-source-content').innerHTML = sources(c);
      });
      shell.scrollTo({ top: 0, behavior: 'instant' });
      if (focus) body.querySelector('#journal-detail-title').focus({ preventScroll: true });
      return true;
    }
    body.addEventListener('click', e => {
      const button = e.target.closest('button');
      if (!button) return;
      if (button.dataset.chapter) detail(button.dataset.chapter);
      else if (button.hasAttribute('data-journal-index')) index({ restore: true });
      else if (button.hasAttribute('data-journal-clear')) {
        query = ''; index(); body.querySelector('input').focus();
      }
    });
    return { index, detail, find, cards, refreshSources() {
      const open = body.querySelector('.journal-sources[open]');
      if (open && active) open.querySelector('.journal-source-content').innerHTML = sources(find(active));
    } };
  }
  window.QixiaBookJournal = { create };
})();
