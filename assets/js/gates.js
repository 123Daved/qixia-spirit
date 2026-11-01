/* 南门 / 西门：门口人数、停车场余位、打车候车估算。停车场轮廓与面积来自 OpenStreetMap；
   人数与车位为按时段/周末/红叶季/天气的估算模型，景区若开放闸机与停车系统接口，在 transit-config.js 的 api 中填写即可替换。 */
(() => {
  'use strict';
  const q = window.qixia, TC = window.QIXIA_TRANSIT;
  if (!q || !TC?.gates) return;
  const {T, $, app, camera, height, m2w, llm, QD, state, toast, hooks, faceSvg, FACE, lin} = q;
  const now = () => q.transit ? q.transit.now() : (Date.now() / 1000 + 8 * 3600) % 86400;

  document.head.insertAdjacentHTML('beforeend', `<style>
.gate-tag,.lot-tag{position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;align-items:center;gap:5px;padding:3px 9px 3px 4px;border-radius:14px;background:#fffaf3;box-shadow:0 0 0 1.5px #314b43,0 6px 12px -6px #2a3a3080;font:500 11px/1.3 var(--serif);color:var(--ink);pointer-events:auto;white-space:nowrap;transition:opacity .3s}
.gate-tag .face-icon{width:18px;height:18px}.gate-tag b{font:600 10px sans-serif;color:var(--muted)}.lot-tag{padding:2px 8px 2px 3px;box-shadow:0 0 0 1.5px var(--c),0 6px 12px -6px #2a3a3080;font:600 10px sans-serif}
.lot-tag i{width:16px;height:16px;border-radius:4px;background:var(--c);color:#fff;font:700 11px/16px sans-serif;text-align:center;font-style:normal}.gate-tag.hidden,.lot-tag.hidden{opacity:0;pointer-events:none}
.gate-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}.gate-card{padding:12px;border-radius:12px;background:#fff;border:1px solid var(--line)}.gate-card.best{border-color:#3f9a62;box-shadow:0 0 0 2px #3f9a6222}
.gate-card h4{display:flex;align-items:center;gap:6px;margin:0 0 8px;font:500 15px var(--serif)}.gate-card h4 .face-icon{width:20px;height:20px}
.gate-card dl{margin:0;font-size:11px;line-height:1.5}.gate-card dt{color:var(--muted);margin-top:6px}.gate-card dd{margin:0;color:var(--ink);font-size:13px}.gate-card dd b{font:500 20px var(--serif)}
.meter{height:5px;border-radius:3px;background:#efe6da;margin-top:3px;overflow:hidden}.meter i{display:block;height:100%;border-radius:3px}
.advice{padding:12px 14px;border-radius:12px;background:#eef6f0;color:#2f5a43;font-size:12.5px;line-height:1.75}.advice b{font-weight:600}
.gates-card{background:#eef3ee}.gates-card strong{color:#2f5a43}.gates-card .bus-art{position:absolute;right:10px;top:10px;width:24px;height:24px}
</style>`);

  /* ---------- 停车场：从 OSM 停车场多边形中，取离配置点 250 米内的作为该停车场 ---------- */
  const lots = TC.parking.map(c => {
    const at = llm(...c.ll), polys = QD.parking.filter(p => { const cx = p.p.reduce((s, v) => s + v[0], 0) / p.p.length, cz = p.p.reduce((s, v) => s + v[1], 0) / p.p.length; return Math.hypot(cx - at[0], cz - at[1]) < 250; });
    const area = polys.reduce((s, p) => s + p.area, 0), cap = c.capacity || Math.max(60, Math.round(area / 40 / 10) * 10);
    const mat = new T.MeshBasicMaterial({color: 0x6c9a74, transparent: true, opacity: .5, depthWrite: false});
    for (const p of polys) {
      const shape = new T.Shape(p.p.map(([x, z]) => { const [wx, wz] = m2w(x, z); return new T.Vector2(wx, -wz); })), g = new T.ShapeGeometry(shape); g.rotateX(-Math.PI / 2);
      const [cx, cz] = m2w(p.p[0][0], p.p[0][1]), m = new T.Mesh(g, mat); m.position.y = height(cx, cz) + .03; m.renderOrder = 2; q.world.add(m);
    }
    const [wx, wz] = m2w(...at), w = new T.Vector3(wx, height(wx, wz) + .05, wz), tag = document.createElement('button');
    tag.className = 'lot-tag'; tag.onclick = () => open(c.gate); $('#labels').appendChild(tag);
    return {...c, cap, area, polys, mat, w, tag, estimated: !c.capacity};
  });
  const gates = TC.gates.map(c => {
    const [wx, wz] = m2w(...llm(...c.ll)), w = new T.Vector3(wx, height(wx, wz) + .08, wz), tag = document.createElement('button');
    tag.className = 'gate-tag'; tag.onclick = () => open(c.id); $('#labels').appendChild(tag);
    return {...c, w, tag, lot: lots.find(l => l.gate === c.id)};
  });

  /* ---------- 估算模型 ---------- */
  const gauss = (h, m, s) => Math.exp(-(((h - m) / s) ** 2) / 2);
  const arrive = h => gauss(h, 10, 1.5) + .35 * gauss(h, 13.5, 1.2), leave = h => gauss(h, 15.6, 1.3) + .3 * gauss(h, 12, 1);
  const integ = (f, a, b) => { let s = 0; for (let x = a; x < b; x += .05) s += f(x) * .05; return s; };
  const AT = integ(arrive, 5, 22), LT = integ(leave, 5, 22);
  let live = null;  // 接口实测值
  function model() {
    const t = now(), h = t / 3600, d = new Date(Date.now() + 8 * 36e5), dow = d.getUTCDay(), m = d.getUTCMonth() + 1, V = TC.visitors;
    const weekend = dow === 0 || dow === 6, maple = (m === 10 && d.getUTCDate() >= 20) || m === 11, wxm = q.wx?.demo || q.wx?.mode;
    const day = V.weekday * (weekend ? V.weekend : 1) * (maple ? V.mapleSeason : 1) * ({rain: .45, storm: .25, snow: .5, fog: .8, overcast: .9}[wxm] || 1);
    const open = h >= 7 && h < 18, inRate = day * arrive(h) / AT, outRate = day * leave(h) / LT, inPark = Math.max(0, day * (integ(arrive, 5, h) / AT - integ(leave, 5, h) / LT));
    const out = gates.map(g => {
      const enter = inRate * g.share, exit = outRate * g.share, checkCap = g.id === 'west' ? 1800 : 1000;
      const atGate = Math.round((Math.max(0, enter - checkCap) * .25 + enter * .04 + exit * .05) / 5) * 5;
      const lot = g.lot, cars = lot ? Math.min(lot.cap, Math.round(inPark * g.share * V.carShare / V.perCar + lot.cap * .05)) : 0;
      const taxiDemand = exit * V.taxiShare, taxiQueue = Math.round(Math.max(0, taxiDemand - g.taxiPerHour) * .5 + taxiDemand * .06), taxiWait = Math.round(taxiQueue / g.taxiPerHour * 60 + (taxiDemand > 0 ? 3 : 0));
      const L = live?.[g.id] || {};
      return {g, enter: Math.round(enter), exit: Math.round(exit), atGate: L.people ?? atGate, cars: L.cars ?? cars, free: lot ? Math.max(0, lot.cap - (L.cars ?? cars)) : null, taxiQueue, taxiWait, real: !!live?.[g.id]};
    });
    return {t, h, open, day: Math.round(day), inPark: Math.round(inPark), out};
  }
  const levelOf = r => { const load = r.atGate / 300 + (r.g.lot ? (1 - r.free / r.g.lot.cap) * .5 : 0) + r.taxiWait / 40; return load < .55 ? 'laugh' : load < 1.1 ? 'smile' : 'cry'; };
  const occColor = o => o < .6 ? '#6c9a74' : o < .88 ? '#c8964a' : '#b5452f';

  function refresh() {
    const M = model();
    for (const r of M.out) {
      const k = levelOf(r); r.g.tag.innerHTML = `<span class="face-icon">${faceSvg(k)}</span>${r.g.name}<b>${M.open ? '约 ' + r.atGate + ' 人' : '闭园'}</b>`; r.g.tag.setAttribute('aria-label', `${r.g.name}：门口约 ${r.atGate} 人`);
      const lot = r.g.lot; if (lot) { const occ = 1 - r.free / lot.cap, c = occColor(occ); lot.mat.color.set(c); lot.tag.style.setProperty('--c', c); lot.tag.innerHTML = `<i>P</i>余 ${r.free}`; lot.tag.setAttribute('aria-label', `${lot.name}：余位 ${r.free} / ${lot.cap}`); }
    }
    const [a, b] = M.out; $('#gate-sum') && ($('#gate-sum').textContent = `余位 西${a.free ?? '—'} · 南${b.free ?? '—'}`);
    if (state.gatePanel && $('#panel').classList.contains('open')) render();
  }

  /* ---------- 面板：两门对比 + 建议 ---------- */
  function open(focusId) {
    q.closePanel(); state.gatePanel = true; document.body.classList.add('selected'); $('#panel').classList.add('open'); $('#panel').inert = false;
    const g = gates.find(x => x.id === focusId); if (g) q.setGoal({p: g.w.clone().add(new T.Vector3(3, 4, 5)), t: g.w.clone()});
    render();
  }
  function render() {
    const M = model(), hm = t => String(Math.floor(t / 3600) % 24).padStart(2, '0') + ':' + String(Math.floor(t % 3600 / 60)).padStart(2, '0');
    const leaving = M.h >= 13, score = r => leaving ? r.taxiWait : r.atGate + (r.free === 0 ? 400 : 0), best = M.out.slice().sort((x, y) => score(x) - score(y))[0], allFull = M.out.every(r => r.free === 0);
    const card = r => { const lot = r.g.lot, occ = lot ? 1 - r.free / lot.cap : 0, k = levelOf(r); return `<div class="gate-card${r === best && M.open ? ' best' : ''}"><h4><span class="face-icon">${faceSvg(k)}</span>${r.g.name}</h4><dl>
      <dt>门口人数${r.real ? '（实测）' : '（估算）'}</dt><dd><b>${M.open ? r.atGate : 0}</b> 人 · ${FACE[k].label}</dd>
      <dt>每小时进 / 出</dt><dd>${M.open ? r.enter + ' / ' + r.exit : '—'}</dd>
      ${lot ? `<dt>${lot.name}</dt><dd>余位 <b>${r.free}</b> / ${lot.cap}${lot.estimated ? '<small>（按面积估）</small>' : ''}<div class="meter"><i style="width:${occ * 100}%;background:${occColor(occ)}"></i></div></dd>` : ''}
      <dt>打车 · ${r.g.taxi}</dt><dd>${M.open && r.taxiQueue ? `候车约 ${r.taxiQueue} 人 · 约 ${r.taxiWait} 分钟` : '基本不用等'}</dd></dl></div>`; };
    const adv = !M.open ? '现在不在开放时段。明天早上 9 点前到达，停车最从容。' : leaving ? `准备离开？此刻从 <b>${best.g.name}</b> 出园打车更快，预计等 ${best.taxiWait || 3} 分钟；也可以坐观光车到${best.g.id === 'west' ? '西门·游客中心' : '南门'}站再出园。` : allFull ? `两处停车场此刻都已停满，建议改乘公共交通：西门外有公交「栖霞寺」站，红叶季南门有红枫专线公交。若已在路上，<b>${best.g.name}</b> 门口人相对少（约 ${best.atGate} 人）。` : `准备入园？建议走 <b>${best.g.name}</b>：门口约 ${best.atGate} 人${best.free != null ? `，${best.g.lot.name}还有 ${best.free} 个空位` : ''}。`;
    $('#detail').innerHTML = `<div class="panel-head"><div class="eyebrow">出 入 口 · 停 车 · 打 车</div><h2>南门 · 西门</h2><div class="subtitle">此刻 ${hm(M.t)} · 今日预计入园约 ${M.day.toLocaleString()} 人 · 园内约 ${M.inPark.toLocaleString()} 人</div></div><div class="panel-body">
      <div class="advice">${adv}</div><div class="gate-grid">${M.out.map(card).join('')}</div>
      <p class="panel-note">停车场轮廓与面积来自 OpenStreetMap，车位数按面积估算；人数、余位与打车等候为按时段、周末、红叶季与天气的估算模型，非实时实测。景区闸机/停车系统开放接口后可直接接入。</p></div>`;
  }

  /* ---------- 地图标签 + 入口卡片 ---------- */
  const proj = new T.Vector3();
  q.tickers.push(() => {
    const W = app.offsetWidth, H = app.offsetHeight, far = camera.position.distanceTo(q.controls.target) > 30 && !state.gatePanel, hide = far || !!state.selected || document.body.classList.contains('riding') || (state.stop && state.stop !== '__fleet');
    for (const it of [...gates, ...lots]) { proj.copy(it.w).project(camera); it.tag.style.left = (proj.x * .5 + .5) * W + 'px'; it.tag.style.top = (-proj.y * .5 + .5) * H + 'px'; it.tag.classList.toggle('hidden', proj.z > 1 || hide || (state.gatePanel && false)); }
  });
  {
    const card = document.createElement('button'); card.className = 'destination gates-card'; card.dataset.id = '__gates';
    card.innerHTML = `<div class="info"><small>出入口 · 停车</small><strong>南门 / 西门</strong><span class="tag" id="gate-sum">—</span></div><svg class="bus-art" viewBox="0 0 24 24" fill="none" stroke="#2f5a43" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>`;
    card.onclick = () => open(); const bus = $('#destinations .bus-card'); bus ? bus.after(card) : $('#destinations').prepend(card); requestAnimationFrame(() => { $('#destinations').scrollLeft = 0; });  // 插到最前时浏览器的滚动锚定会把列表推走
  }
  const prevClose = hooks.close; hooks.close = () => { prevClose?.(); state.gatePanel = false; };
  const prevBefore = hooks.beforeSelect; hooks.beforeSelect = (id, o) => { prevBefore?.(id, o); state.gatePanel = false; };
  async function poll() {
    for (const [key, url] of [['gates', TC.api?.gates], ['parking', TC.api?.parking]]) if (url) { try { const r = await fetch(url); if (r.ok) live = {...live, ...(await r.json())}; } catch (e) {} }
  }
  poll(); setInterval(() => { poll(); refresh(); }, 15000); refresh();
  Object.assign(q, {gates: {open, model, gates, lots}});
})();
