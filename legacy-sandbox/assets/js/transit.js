/* 观光车：沿真实道路的上山/下山线路、透明站牌、按时刻表运行的模拟车队，
   叠加司机手机上报的实时定位；车牌追踪与跟车视角。配置见 assets/transit-config.js。 */
(() => {
  'use strict';
  const q = window.qixia, TC = window.QIXIA_TRANSIT;
  if (!q || !TC) return;
  const {T, $, app, camera, controls, height, m2w, llm, QD, U, places, pins, state, toast, speak, hush, crowd, crowdLevel, faceSvg, FACE, lin, mesh, ribbonGeo, segDist, reduced, hooks, avaStyle, spiritName} = q;

  document.head.insertAdjacentHTML('beforeend', `<style>
.bus-tag{position:absolute;left:0;top:0;transform:translate(-50%,-140%);display:flex;align-items:center;gap:4px;padding:2px 7px 2px 5px;border-radius:10px;background:#fffaf3;box-shadow:0 0 0 1.5px var(--c),0 4px 10px -4px #5a2a1a66;font:600 9.5px/1.4 sans-serif;color:var(--ink);pointer-events:auto;white-space:nowrap;transition:opacity .3s}
.bus-tag i{width:7px;height:7px;border-radius:50%;background:var(--c)}.bus-tag.live i{background:#3f9a62;box-shadow:0 0 0 3px #3f9a6233;animation:livep 1.4s infinite}@keyframes livep{50%{box-shadow:0 0 0 6px #3f9a6200}}
.bus-tag.hidden{opacity:0;pointer-events:none}.bus-tag.mini{font-size:0;padding:3px;gap:0;transform:translate(-50%,-160%)}.bus-tag.mini i{width:8px;height:8px}.stop.mini .eta-mini,.stop.mini .mood{display:none}.stop.mini .disc{transform:scale(.68);transform-origin:50% 100%}.bus-tag.followed{background:var(--c);color:#fff}.bus-tag.followed i{background:#fff}
.stop .eta-mini{position:absolute;left:50%;top:30px;transform:translateX(-50%);padding:0 4px;border-radius:6px;background:#fffaf3;font:600 9px/14px sans-serif;color:var(--red);white-space:nowrap;box-shadow:0 2px 6px #5a2a1a26}
.dir-card{margin:12px 0;padding:12px 14px;border-radius:12px;background:#fff;border:1px solid var(--line)}.dir-card h4{display:flex;align-items:center;gap:8px;margin:0 0 8px;font:500 13px var(--serif)}
.line-chip{display:inline-block;padding:1px 8px;border-radius:9px;background:var(--c);color:#fff;font:600 10px/18px sans-serif;letter-spacing:.5px}
.arr{display:flex;align-items:baseline;gap:8px;font-size:12px;color:#6f7a70;margin:3px 0}.arr b{font:500 22px var(--serif);color:var(--red);min-width:34px}.arr small{color:var(--muted)}
.goes{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;font-size:10px;color:var(--muted)}.goes span{padding:1px 7px;border-radius:8px;background:#f6efe5}.goes span.spot{background:#fbe9df;color:var(--red)}
.where{font-size:11px;color:#5d6a61;margin-top:6px}.live-badge{display:inline-block;padding:0 6px;border-radius:7px;background:#e3f1e7;color:#2f7a4b;font:600 9px/15px sans-serif;margin-left:4px}.sim-badge{display:inline-block;padding:0 6px;border-radius:7px;background:#f1ece4;color:#8a8170;font:600 9px/15px sans-serif;margin-left:4px}
.plate-row{display:flex;gap:6px;margin:12px 0}.plate-row input{flex:1;min-width:0;min-height:44px;padding:0 12px;border:1px solid var(--line);border-radius:22px;background:#fff;font:14px sans-serif;color:var(--ink);letter-spacing:1px}.plate-row button{min-height:44px;padding:0 16px;border-radius:22px;background:var(--ink);color:#fff;font-size:12px}
.fleet{list-style:none;margin:8px 0;padding:0}.fleet li{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--line)}.fleet li b{font:600 13px sans-serif;letter-spacing:.5px}.fleet li span{flex:1;font-size:11px;color:#6f7a70;line-height:1.5}.fleet li button{min-height:36px;padding:0 12px;border-radius:18px;border:1px solid var(--line);background:#fff;font-size:11px}
.plan{margin:10px 0;padding:10px 12px;border-radius:10px;background:#fbf3ea;font-size:12px;line-height:1.7;color:#5f6a62}.plan select{width:100%;min-height:40px;margin-bottom:6px;border:1px solid var(--line);border-radius:8px;background:#fff;font-size:13px;color:var(--ink)}
.closed{padding:10px 12px;border-radius:10px;background:#f3eee6;font-size:12px;color:#6f6a60;line-height:1.7}.closed button{margin-top:6px;min-height:36px;padding:0 14px;border-radius:18px;background:var(--red);color:#fff;font-size:11px}
.ride-bar .ride-btns{display:flex;gap:6px}.ride-bar .ride-btns button{padding:0 12px}.ride-bar .ghost{background:#fff!important;color:var(--ink)!important;border:1px solid var(--line)}.ride-bar .getoff{background:var(--red)!important}
.ride-bar .ride-btns button[hidden]{display:none}.ride-bar .see{background:var(--red)!important;color:#fff!important;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bus-hint{display:flex;align-items:center;gap:8px;width:100%;margin-top:10px;min-height:40px;padding:6px 12px;border-radius:20px;background:#fbf3ea;border:1px solid #efdccb;font-size:12px;color:#7a4a3a;text-align:left}.bus-hint b{color:var(--red);font-weight:600}.bus-hint span{flex:1}.bus-hint svg{width:18px;height:18px;flex:none;color:var(--red)}
.route-note{font-size:11px;line-height:1.7;color:#8c978b;margin:14px 0}.route-card{border:1px solid #e9e4d9;border-radius:12px;background:#fff;padding:15px;margin:14px 0}.route-heading{display:flex;align-items:center;gap:8px}.route-heading strong{font:17px var(--serif)}.route-heading>span:last-child{font-size:11px;color:#849187}.route-swatch{width:10px;height:10px;border-radius:50%;background:var(--route);box-shadow:0 0 0 4px color-mix(in srgb,var(--route) 18%,transparent)}.route-stops{margin:14px 0;padding:0;list-style:none}.route-stops li{display:flex;align-items:start;gap:10px;position:relative;min-height:37px;font-size:12px}.route-stops li:not(:last-child):before{content:'';position:absolute;left:10px;top:19px;bottom:-1px;width:2px;background:var(--route);opacity:.55}.route-dot{position:relative;z-index:1;display:grid;place-items:center;width:22px;height:22px;flex:none;border-radius:50%;background:#fff;border:2px solid var(--route);color:var(--route);font:600 10px sans-serif}.route-stops li.at .route-dot{background:var(--route);color:white}.route-stops li b{font-weight:500}.route-stops li small{display:block;color:#9a9f95;font-size:10px;margin:2px 0 6px}.route-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.route-board,.route-secondary{min-height:42px;border-radius:7px;font-size:12px;padding:10px 13px}.route-secondary,.route-all{background:#f3eee6;color:#52685c}.route-all{padding:10px 14px;border-radius:7px}.riding #labels .spirit:not(.greet){opacity:0;pointer-events:none}.ride-near[hidden]{display:none}.ride-near{position:absolute;z-index:10;right:16px;bottom:100px;max-width:min(280px,calc(100% - 32px));background:#fffaf3;border:1px solid #eee1d4;border-radius:14px;padding:15px;box-shadow:0 10px 30px #314b4330}.ride-near strong{display:block;font:15px var(--serif);margin-bottom:10px}.ride-near button{display:block;width:100%;text-align:left;background:#f6efe6;color:#6c564a;border-radius:8px;padding:10px;margin-top:6px}.ride-near .ride-near-back{background:none;color:#89958b;text-align:center}
</style>`);

  /* ---------- 1. 真实道路 → 线路几何 ---------- */
  const adj = new Map(), npos = new Map();
  for (const r of QD.roads) {
    if (r.k !== 'road' || r.h === 'primary' || r.h === 'secondary') continue;
    for (let i = 0; i < r.ids.length - 1; i++) {
      const a = r.ids[i], b = r.ids[i + 1], pa = r.p[i], pb = r.p[i + 1], L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      npos.set(a, pa); npos.set(b, pb);
      if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []);
      adj.get(a).push([b, L]); adj.get(b).push([a, L]);
    }
  }
  const snap = m => { let best = null, bd = 1e18; for (const [id, p] of npos) { const d = (p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2; if (d < bd) { bd = d; best = id; } } return best; };
  function dijkstra(a, b) {
    const D = new Map([[a, 0]]), prev = new Map(), done = new Set(), pq = [[0, a]];
    while (pq.length) {
      let mi = 0; for (let i = 1; i < pq.length; i++) if (pq[i][0] < pq[mi][0]) mi = i;
      const [du, u] = pq.splice(mi, 1)[0];
      if (done.has(u)) continue; done.add(u); if (u === b) break;
      for (const [v, L] of adj.get(u) || []) if (du + L < (D.get(v) ?? 1e18)) { D.set(v, du + L); prev.set(v, u); pq.push([du + L, v]); }
    }
    if (!D.has(b)) return null;
    const path = [b]; while (path[path.length - 1] !== a) path.push(prev.get(path[path.length - 1]));
    return path.reverse().map(id => npos.get(id));
  }

  const stops = new Map(TC.stops.map(s => [s.id, {...s, m: llm(...s.ll)}]));
  for (const s of stops.values()) s.node = snap(s.m), s.mm = npos.get(s.node);
  const lines = TC.lines.map(l => {
    let pts = [], stopD = [0];
    l.stops.forEach((sid, j) => {
      if (!j) { pts.push(stops.get(sid).mm); return; }
      const seg = dijkstra(stops.get(l.stops[j - 1]).node, stops.get(sid).node) || [stops.get(l.stops[j - 1]).mm,stops.get(sid).mm];
      pts.push(...seg.slice(1));
    });
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    l.stops.forEach((sid, j) => { if (!j) return; const m = stops.get(sid).mm; let bi = 0, bd = 1e18; pts.forEach((p, i) => { const d = (p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2; if (d < bd && cum[i] >= stopD[j - 1]) { bd = d; bi = i; } }); stopD.push(cum[bi]); });
    return {...l, pts, cum, len: cum[cum.length - 1], stopD, color: l.color, col: new T.Color(l.color)};
  });
  const ptAt = (L, d) => {  // 线路上距起点 d 米处的点（米）与切向
    d = Math.max(0, Math.min(L.len, d)); let i = 1; while (i < L.cum.length - 1 && L.cum[i] < d) i++;
    const a = L.pts[i - 1], b = L.pts[i], t = (d - L.cum[i - 1]) / ((L.cum[i] - L.cum[i - 1]) || 1);
    return {m: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dir: [b[0] - a[0], b[1] - a[1]]};
  };
  const wpt = m => { const [x, z] = m2w(...m); return new T.Vector3(x, height(x, z), z); };

  // 清晰的双色线路：浅色描边衬托路线，选中时突出当前线路。
  const routeLayers=[];
  for (const L of lines) {
    const pts=[];for(let d=0;d<L.len;d+=8)pts.push(wpt(ptAt(L,d).m));pts.push(wpt(ptAt(L,L.len).m));
    const under=new T.Mesh(ribbonGeo([pts],.18,.075),new T.MeshBasicMaterial({color:0xfff7e8,transparent:true,opacity:.95,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-5}));
    const line=new T.Mesh(ribbonGeo([pts],.10,.085),new T.MeshBasicMaterial({color:lin(parseInt(L.color.slice(1),16)),transparent:true,opacity:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6}));
    under.renderOrder=3;line.renderOrder=4;q.world.add(under,line);routeLayers.push({L,under,line});
  }
  function highlightLine(id){for(const layer of routeLayers){const active=!id||layer.L.id===id;layer.line.material.opacity=active?1:.18;layer.under.material.opacity=active?.95:.22}}

  /* ---------- 2. 时刻表模型（确定性：同一时刻所有游客看到的车位置一致）---------- */
  const v = TC.speedKmh / 3.6, dwell = TC.dwellSec, lay = TC.layoverMin * 60;
  const hm = s => { const [h, m] = s.split(':').map(Number); return h * 3600 + m * 60; };
  const OPEN = hm(TC.hours.start), CLOSE = hm(TC.hours.end);
  for (const L of lines) {
    const n = L.stops.length;
    L.dirs = [L.stopD, L.stopD.map(x => L.len - x).reverse()].map(sd => {  // [上山, 下山]：各站距本方向起点的距离与到/离站时刻
      const arr = [0], dep = [0];
      for (let j = 1; j < n; j++) { arr.push(dep[j - 1] + (sd[j] - sd[j - 1]) / v); dep.push(arr[j] + (j < n - 1 ? dwell : 0)); }
      return {sd, arr, dep};
    });
    L.trip = L.dirs[0].arr[n - 1]; L.cycle = 2 * (L.trip + lay); L.headway = L.cycle / L.vehicles.length;
  }
  // 行程内第 e 秒：返回距「上山起点」的距离 d、停靠站序号、下一站序号
  function inTrip(L, e, down) {
    const n = L.stops.length, {sd, arr, dep} = L.dirs[+down];
    for (let j = 1; j < n; j++) {
      if (e < arr[j]) { const f = (e - dep[j - 1]) / (arr[j] - dep[j - 1]), d = sd[j - 1] + f * (sd[j] - sd[j - 1]); return {d: down ? L.len - d : d, at: -1, next: down ? n - 1 - j : j}; }
      if (e < dep[j]) return {d: down ? L.len - sd[j] : sd[j], at: down ? n - 1 - j : j, next: down ? n - 2 - j : j + 1};
    }
    return {d: down ? 0 : L.len, at: down ? 0 : n - 1, next: -1};
  }
  function simState(L, k, t) {
    const n = L.stops.length;
    if (t < OPEN || t > CLOSE + L.cycle) return {phase: 'off', d: 0, at: 0, next: 1, down: false};
    const t0 = OPEN + k * L.headway;
    if (t < t0) return {phase: 'wait', d: 0, at: 0, next: 1, down: false};
    const c = (t - t0) % L.cycle, cycStart = t - c;
    if (cycStart > CLOSE) return {phase: 'off', d: 0, at: 0, next: 1, down: false};
    if (c < L.trip) return {phase: 'up', ...inTrip(L, c, false), down: false};
    if (c < L.trip + lay) return {phase: 'top', d: L.len, at: n - 1, next: n - 2, down: true};
    if (c < 2 * L.trip + lay) return {phase: 'down', ...inTrip(L, c - L.trip - lay, true), down: true};
    return {phase: 'bottom', d: 0, at: 0, next: 1, down: false};
  }
  // 某站某方向接下来的到站（秒）
  function arrivals(L, j, down, t, count = 2) {
    const n = L.stops.length, out = [], jj = down ? n - 1 - j : j;
    if ((!down && j === n - 1) || (down && j === 0)) return out;
    L.vehicles.forEach((plate, k) => {
      const t0 = OPEN + k * L.headway;
      for (let c = Math.max(0, Math.floor((t - t0) / L.cycle) - 1); ; c++) {
        const base = t0 + c * L.cycle; if (base > CLOSE) break;
        const at = base + (down ? L.trip + lay : 0) + L.dirs[+down].arr[jj];
        if (at >= t - 20) { out.push({t: at, plate}); if (out.filter(o => o.plate === plate).length >= count) break; }
      }
    });
    return out.sort((a, b) => a.t - b.t).slice(0, count);
  }

  /* ---------- 3. 时钟：真实北京时间；非运营时段可「以 11:00 演示」，并可 ×10 加速 ---------- */
  const clock = {demo: false, speed: 1, base: 0, at: 0};
  const realNow = () => { const d = new Date(Date.now() + 8 * 36e5); return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds() + d.getUTCMilliseconds() / 1000; };
  const now = () => clock.demo ? clock.base + (performance.now() - clock.at) / 1000 * clock.speed : realNow();
  function setClock(demo, speed) { const t = now(); clock.base = demo && !clock.demo ? 11 * 3600 : t; clock.at = performance.now(); clock.demo = demo; clock.speed = speed; q.applyCrowd?.(); refresh(); }
  const hhmm = t => { t = ((t % 86400) + 86400) % 86400; return String(Math.floor(t / 3600)).padStart(2, '0') + ':' + String(Math.floor(t % 3600 / 60)).padStart(2, '0'); };
  const inService = () => { const t = now(); return t >= OPEN && t <= CLOSE; };

  /* ---------- 4. 车辆：3D 小车 + 车牌标签 ---------- */
  function busModel(color) {
    const g = new T.Group(), cream = new T.MeshStandardMaterial({color: lin(0xf3e8d5), roughness: .8}), red = new T.MeshStandardMaterial({color: lin(parseInt(color.slice(1), 16)), roughness: .7}), dark = new T.MeshStandardMaterial({color: lin(0x3d4641), roughness: .9}), seat = new T.MeshStandardMaterial({color: lin(0x8a5a3c), roughness: .9});
    const add = (geo, mat, x, y, z) => { const m = mesh(geo, mat, g); m.position.set(x, y, z); return m; };
    add(new T.BoxGeometry(.27, .1, .6), cream, 0, .1, 0); add(new T.BoxGeometry(.275, .025, .605), red, 0, .085, 0); add(new T.BoxGeometry(.25, .09, .07), cream, 0, .17, .28);
    for (const z of [-.18, -.04, .1]) add(new T.BoxGeometry(.24, .07, .05), seat, 0, .19, z);
    for (const x of [-.12, .12]) for (const z of [-.27, .27]) add(new T.CylinderGeometry(.008, .008, .2, 5), dark, x, .26, z);
    add(new T.BoxGeometry(.31, .03, .66), red, 0, .37, 0); add(new T.BoxGeometry(.24, .012, .5), cream, 0, .39, 0);
    for (const x of [-.135, .135]) for (const z of [-.19, .19]) { const w = add(new T.CylinderGeometry(.05, .05, .035, 12), dark, x, .05, z); w.rotation.z = Math.PI / 2; }
    g.scale.setScalar(.32); q.world.add(g); return g;
  }
  const fleet = [];
  function addVehicle(plate, L, k, live) {
    const g = busModel(L ? L.color : '#5d7f8c'), tag = document.createElement('button'); g.visible=false;
    tag.className = 'bus-tag'; tag.style.setProperty('--c', L ? L.color : '#5d7f8c'); tag.innerHTML = '<i></i>体验车';
    tag.setAttribute('aria-label', '观光车体验');
    const veh = {plate, L, k, g, tag, live: live || null, st: null, pos: new T.Vector3(), dir: new T.Vector3(0, 0, 1)};
    tag.onclick = () => follow(veh); g.traverse(o => o.userData.veh = veh); fleet.push(veh); return veh;
  }
  lines.forEach(L => L.vehicles.forEach((p, k) => addVehicle(p, L, k)));
  const findPlate = s => { const key = s.replace(/[\s·.\-]/g, '').toUpperCase(); return fleet.find(f => f.plate.replace(/[\s·.\-]/g, '').toUpperCase().endsWith(key) && key.length >= 3); };

  // 司机端实时定位（本地服务 /api/fleet）
  const LIVE_TTL = 60e3;
  async function pollFleet() {
    if (!location.protocol.startsWith('http') || !TC.api?.fleet) return;
    try {
      const r = await fetch(TC.api.fleet, {cache: 'no-store'}); if (!r.ok) return;
      for (const rec of await r.json()) {
        if (Date.now() - rec.ts > LIVE_TTL) continue;
        let veh = fleet.find(f => f.plate === rec.plate);
        if (!veh) veh = addVehicle(rec.plate, lines.find(l => l.id === rec.line) || null, 0, rec);
        veh.live = rec;
      }
    } catch (e) {}
  }
  // 游客体验使用独立演示车，不依赖司机定位或车辆编号。

  // 实时定位吸附到所在线路（60 米内）；返回距起点 d 与行驶方向
  function snapToLine(L, m) {
    let best = {dist: 1e9}; for (let i = 0; i < L.pts.length - 1; i++) { const dd = segDist(m[0], m[1], L.pts[i], L.pts[i + 1]); if (dd < best.dist) { const a = L.pts[i], b = L.pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = Math.max(0, Math.min(1, ((m[0] - a[0]) * (b[0] - a[0]) + (m[1] - a[1]) * (b[1] - a[1])) / len / len)); best = {dist: dd, d: L.cum[i] + t * len}; } }
    return best;
  }

  /* ---------- 5. 每帧更新车辆位置 ---------- */
  const tmp = new T.Vector3(), proj = new T.Vector3();
  const tour={active:false,L:null,current:0,dir:1,d:0,wait:0,paused:false,st:null};
  const tourVehicle=addVehicle('体验车',lines[0],0);tourVehicle.tour=true;
  function advanceTour(dt){if(!tour.active||tour.paused)return;const L=tour.L,n=L.stops.length,next=tour.current+tour.dir,down=tour.dir<0;
    if(tour.wait>0){tour.wait=Math.max(0,tour.wait-dt);tour.st={phase:'tour',d:tour.d,at:tour.current,next:next>=0&&next<n?next:-1,down};return}
    if(next<0||next>=n){tour.st={phase:'tour',d:tour.d,at:tour.current,next:-1,down};return}
    const target=L.stopD[next],step=48*dt;tour.d+=Math.sign(target-tour.d)*Math.min(Math.abs(target-tour.d),step);
    if(Math.abs(tour.d-target)<.01){tour.d=target;tour.current=next;tour.wait=8;tour.st={phase:'tour',d:tour.d,at:next,next:next+tour.dir>=0&&next+tour.dir<n?next+tour.dir:-1,down}}
    else tour.st={phase:'tour',d:tour.d,at:-1,next,down};
  }
  function board(L,start=0,dir=1){if(!L||start<0||start>=L.stops.length)return;if(ride.on)endRide(true);tour.active=true;tour.paused=false;tour.L=L;tour.current=start;tour.dir=dir;tour.d=L.stopD[start];tour.wait=8;tour.st={phase:'tour',d:tour.d,at:start,next:start+dir>=0&&start+dir<L.stops.length?start+dir:-1,down:dir<0};tourVehicle.L=L;tourVehicle.st=tour.st;tourVehicle.pos.copy(wpt(ptAt(L,tour.d).m));highlightLine(L.id);follow(tourVehicle);toast('已上车，沿途可以看景点或随时下车')}

  function vehicleState(veh, t) {
    if(veh.tour)return tour.active?tour.st:null;
    const live = veh.live && Date.now() - veh.live.ts < LIVE_TTL ? veh.live : null;
    if (live) {
      const m = llm(live.lat, live.lng);
      if (veh.L) { const s = snapToLine(veh.L, m); if (s.dist < 60) { const prev = veh.st?.d ?? s.d, down = s.d < prev - .5 ? true : s.d > prev + .5 ? false : veh.st?.down ?? false; return {phase: 'live', d: s.d, down, live: true, at: nearStopIdx(veh.L, s.d), next: nextIdx(veh.L, s.d, down)}; } }
      return {phase: 'live-free', m, heading: live.heading, live: true, at: -1, next: -1};
    }
    return veh.L ? simState(veh.L, veh.k, t) : null;
  }
  const nearStopIdx = (L, d) => L.stopD.findIndex(x => Math.abs(x - d) < 25);
  const nextIdx = (L, d, down) => { if (down) { for (let j = L.stopD.length - 1; j >= 0; j--) if (L.stopD[j] < d - 25) return j; return -1; } return L.stopD.findIndex(x => x > d + 25); };

  q.tickers.push((dt) => {
    advanceTour(dt);const t = now(), W = app.offsetWidth, H = app.offsetHeight, far = camera.position.distanceTo(controls.target) > 30 && !ride.on;
    for (const veh of fleet) {
      const st = vehicleState(veh, t); if (!st) continue; veh.st = st;
      let m, dir;
      if (st.phase === 'live-free') { m = st.m; const h = (st.heading || 0) * Math.PI / 180; dir = [Math.sin(h), -Math.cos(h)]; }
      else { const p = ptAt(veh.L, st.d); m = p.m; dir = st.down ? [-p.dir[0], -p.dir[1]] : p.dir; }
      const w = wpt(m); veh.pos.lerp(w, veh.pos.lengthSq() ? Math.min(1, dt * 4) : 1); // 车身覆盖范围内取最高地形，避免斜坡穿入底盘；水平移动仍平滑。
      const clearance = .11, radius = .11;
      let ground = height(veh.pos.x, veh.pos.z);
      for (const [ox, oz] of [[radius,0],[-radius,0],[0,radius],[0,-radius]]) ground = Math.max(ground, height(veh.pos.x + ox, veh.pos.z + oz));
      veh.pos.y = ground + clearance; veh.g.position.copy(veh.pos);
      const [dx, dz] = [dir[0] / U, dir[1] / U]; if (dx || dz) { veh.dir.set(dx, 0, dz).normalize(); veh.g.lookAt(tmp.copy(veh.pos).add(veh.dir)); }
      veh.g.visible = !!veh.tour && tour.active;
      proj.copy(veh.pos); proj.y += .12; proj.project(camera);
      veh.tag.style.left = (proj.x * .5 + .5) * W + 'px'; veh.tag.style.top = (-proj.y * .5 + .5) * H + 'px'; veh.tag.style.zIndex = 9000;
      veh.tag.classList.add('hidden');
      veh.tag.classList.toggle('mini', far); veh.tag.classList.toggle('live', !!st.live); veh.tag.classList.toggle('followed', ride.veh === veh);
    }
    // 站牌
    for (const s of stops.values()) {
      if (!s.b) continue; proj.copy(s.w); proj.project(camera);
      s.b.style.left = (proj.x * .5 + .5) * W + 'px'; s.b.style.top = (-proj.y * .5 + .5) * H + 'px'; s.b.style.zIndex = Math.round((1 - proj.z) * 1e4);
      s.b.style.transform = `translate(-50%,-100%) scale(${Math.min(1.15, Math.max(.7, 60 / camera.position.distanceTo(s.w))).toFixed(3)})`;
      s.b.classList.toggle('hidden', proj.z > 1 || !!state.selected || (!!state.stop && state.stop !== s.id) || ride.on);
      s.b.classList.toggle('active', state.stop === s.id); s.b.classList.toggle('mini', far);
    }
    if (ride.on) rideTick(dt);
  });

  /* ---------- 6. 站牌 ---------- */
  const BUS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7h17M5 7v9M19 7v9M3 16h18v1.8H3zM8 16v-3.5h8V16"/><path d="M4 7l1-2h14l1 2"/><circle cx="7.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/></svg>';
  const shelterMat = q.pillarMat;
  for (const s of stops.values()) {
    s.w = wpt(s.mm); s.lines = lines.filter(L => L.stops.includes(s.id));
    // 候车亭放在路边（取较平的一侧），面朝道路，不压在路面上
    const L0 = s.lines[0], d0 = ptAt(L0, L0.stopD[L0.stops.indexOf(s.id)]).dir, side = new T.Vector3(-d0[1], 0, d0[0]).normalize().multiplyScalar(.12);
    // 两侧都试，再沿路前后挪，取第一个不与古迹/亭子相撞、且较平的位置
    const F = hooks.foot, along = new T.Vector3(d0[0], 0, d0[1]).normalize().multiplyScalar(.12), tries = [];
    for (const k of [0, 1, -1, 2, -2]) for (const sd of [1, -1]) tries.push(s.w.clone().addScaledVector(side, sd).addScaledVector(along, k));
    const cand = tries.map(p => (p.y = height(p.x, p.z), p)).filter(p => !F || F.isFree(p.x, p.z, .14)).concat([s.w.clone().add(side)]); const best = cand.slice(0, 2).sort((a, b) => Math.abs(a.y - s.w.y) - Math.abs(b.y - s.w.y))[0]; F?.claim(best.x, best.z, .14); hooks.trees?.hide(best.x, best.z, .38);
    const g = new T.Group(); g.position.copy(best); g.lookAt(s.w.x, best.y, s.w.z); g.scale.setScalar(.6);
    const add = (geo, mat, x, y, z) => { const m = mesh(geo, mat, g); m.position.set(x, y, z); return m; };
    add(new T.BoxGeometry(.42, .03, .2), q.stoneMat, 0, .015, 0); for (const x of [-.17, .17]) add(new T.CylinderGeometry(.012, .012, .26, 5), shelterMat, x, .15, -.06);
    const roof = add(new T.BoxGeometry(.46, .025, .24), shelterMat, 0, .29, -.01); roof.rotation.x = -.18; add(new T.CylinderGeometry(.06, .06, .015, 16), shelterMat, .25, .38, .08).rotation.x = Math.PI / 2;
    q.world.add(g);
    const b = document.createElement('button'); b.className = 'stop' + (s.gate ? ' home' : ''); b.dataset.id = s.id; b.setAttribute('aria-label', `观光车站 · ${s.name}`);
    b.innerHTML = `<span class="thread"></span><span class="disc">${BUS_SVG}</span><i class="mood" aria-hidden="true"></i><b class="eta-mini"></b>`; b.onclick = () => openStop(s.id); $('#labels').appendChild(b); s.b = b;
  }
  const stopLoad = s => { const ids = s.near.length ? s.near : []; if (!crowd.list.length) return 0; const ls = ids.map(id => crowd.list[places.findIndex(p => p.id === id)]?.load || 0); return ls.length ? ls.reduce((a, b) => a + b) / ls.length * 1.1 : crowd.list.reduce((a, c) => a + c.load, 0) / crowd.list.length * (s.gate ? 1.4 : .8); };
  const nextAny = s => { const t = now(); let best = null; for (const L of s.lines) { const j = L.stops.indexOf(s.id); for (const down of [false, true]) for (const a of arrivals(L, j, down, t, 1)) if (!best || a.t < best.t) best = a; } return best; };
  function refreshStops() {
    for (const s of stops.values()) {
      s.b.querySelector('.mood').innerHTML = faceSvg(crowdLevel(stopLoad(s)));
      s.b.querySelector('.eta-mini').textContent = ''; 
    }
  }
  const dirName = (L, down) => down ? `下山 · 往${stops.get(L.stops[0]).name}` : `上山 · 往${stops.get(L.stops[L.stops.length - 1]).name}`;
  function whereIs(plate) {
    const veh = fleet.find(f => f.plate === plate); if (!veh?.L) return ''; const st = vehicleState(veh, now()); if (!st) return '';
    const L = veh.L, nm = j => stops.get(L.stops[j])?.name;
    if (st.phase === 'off') return '已回场';
    if (st.phase === 'wait') return `在${nm(0)}待发`;
    if (st.at >= 0) return `正在${nm(st.at)}停靠`;
    return st.next >= 0 ? `正开往${nm(st.next)}` : '';
  }
  function routeMarkup(L, startId=null){
    const j=startId?L.stops.indexOf(startId):0;
    const stopsHtml=L.stops.map((id,i)=>{const s=stops.get(id),names=s.near.map(x=>places.find(p=>p.id===x)?.name).filter(Boolean);return `<li${i===j?' class="at"':''}><span class="route-dot">${i+1}</span><span><b>${s.name}</b>${names.length?`<small>${names.join(' · ')}</small>`:''}</span></li>`}).join('');
    const actions=startId?`${j<L.stops.length-1?`<button class="main-button route-board" data-line="${L.id}" data-start="${j}" data-dir="1">向山顶上车 →</button>`:''}${j>0?`<button class="route-secondary route-board" data-line="${L.id}" data-start="${j}" data-dir="-1">向入口上车 →</button>`:''}`:`<button class="main-button route-board" data-line="${L.id}" data-start="0" data-dir="1">从${stops.get(L.stops[0]).name}上车 →</button>`;
    return `<article class="route-card" style="--route:${L.color}"><div class="route-heading"><span class="route-swatch"></span><strong>${L.short}</strong><span>${L.name}</span></div><ol class="route-stops">${stopsHtml}</ol><div class="route-actions">${actions}</div></article>`;
  }
  function bindBoard(){ $('#detail').querySelectorAll('.route-board').forEach(b=>b.onclick=()=>{const L=lines.find(x=>x.id===b.dataset.line);board(L,Number(b.dataset.start),Number(b.dataset.dir))}); }
  function openStop(id){if(ride.on)endRide(true);const stop=stops.get(id);if(!stop)return;q.closePanel();hush();state.stop=id;controls.autoRotate=false;q.setGoal({p:stop.w.clone().add(new T.Vector3(3.6,4.4,5.2)),t:stop.w.clone()});document.body.classList.add('selected');$('#panel').classList.add('open');$('#panel').inert=false;renderStop()}
  function renderStop(){const stop=stops.get(state.stop);if(!stop)return;$('#detail').innerHTML=`<div class="panel-head"><div class="eyebrow">观 光 车 · 站 点</div><h2>${stop.name}</h2><div class="subtitle">选择方向上车，沿途可随时下车看风景</div></div><div class="panel-body"><p class="route-note">以下是地图里的模拟游览线路，并非景区实时班次。</p>${stop.lines.map(L=>routeMarkup(L,stop.id)).join('')}<button class="route-all" id="show-all-routes">查看全部线路</button></div>`;bindBoard();$('#show-all-routes').onclick=openFleet}
  function openFleet(){if(ride.on)endRide(true);q.closePanel();hush();state.stop='__fleet';document.body.classList.add('selected');$('#panel').classList.add('open');$('#panel').inert=false;q.setGoal(q.homeView());highlightLine(null);renderFleet()}
  function renderFleet(){$('#detail').innerHTML=`<div class="panel-head"><div class="eyebrow">坐 上 观 光 车 · 慢 慢 看 山</div><h2>选择一条线路</h2><div class="subtitle">上车 · 看景点 · 随时下车</div></div><div class="panel-body"><p class="route-note">这是模拟游览，线路为地图示意，请以景区现场信息为准。</p>${lines.map(L=>routeMarkup(L)).join('')}</div>`;bindBoard()}

  {
    const card = document.createElement('button'); card.className = 'destination bus-card'; card.dataset.id = '__fleet';
    card.innerHTML = `<div class="info"><small>山中观光车</small><strong id="bus-eta">选线 · 上车</strong><span class="tag" id="bus-sub">两条游览线路</span></div><svg class="bus-art" viewBox="0 0 74 58" aria-hidden="true"><rect x="8" y="12" width="60" height="5" rx="2" fill="#b5452f"/><path d="M12 17v20M64 17v20M38 17v20" stroke="#7d6b5c" stroke-width="1.5"/><rect x="6" y="34" width="64" height="11" rx="3" fill="#f3e6d2" stroke="#d8c3a8"/><rect x="6" y="38" width="64" height="2.5" fill="#b5452f"/><circle cx="18" cy="47" r="5" fill="#3f4a44"/><circle cx="58" cy="47" r="5" fill="#3f4a44"/></svg>`;
    card.onclick = openFleet; $('#destinations').prepend(card);
  }

  /* ---------- 8. 跟车视角（点车/车牌）+ 到站播报 + 在此下车 ---------- */
  const ride = {on: false, veh: null, lastAt: null};
  function follow(veh) {
    if (!veh) return; q.closePanel(); hush(); ride.on = true; ride.veh = veh; ride.lastAt = veh.st?.at ?? null; state.focusBus = veh;
    q.setGoal(null); controls.autoRotate = false; controls.enabled = false; controls.minDistance = 0;
    document.body.classList.add('riding'); $('#ride-bar').inert = false; rideBarSetup();
  }
  function endRide(silent) {
    if (!ride.on) return; ride.on = false; tour.active=false;tour.paused=false;const menu=$('#ride-near');if(menu)menu.hidden=true;tourVehicle.g.visible=false;highlightLine(null); state.focusBus = null; controls.enabled = true; controls.minDistance = 2.5;
    document.body.classList.remove('riding'); $('#ride-bar').inert = true; hush(); pins.forEach(({b}) => b.classList.remove('greet')); ride.veh = null; if (!silent) q.home();
  }
  function rideBarSetup(){const bar=$('#ride-bar');if(!bar.querySelector('.ride-btns')){bar.querySelector('#ride-exit').remove();bar.insertAdjacentHTML('beforeend',`<span class="ride-btns"><button class="see" id="ride-see" hidden>看景点</button><button class="getoff" id="ride-exit2">下车</button></span>`);const menu=document.createElement('section');menu.id='ride-near';menu.className='ride-near';menu.hidden=true;app.appendChild(menu);$('#ride-exit2').onclick=()=>{endRide();toast('已下车，继续自由游览')}}}
  function showNear(stop){const menu=$('#ride-near');tour.paused=true;menu.replaceChildren();const title=document.createElement('strong');title.textContent=stop.name+' · 附近景点';menu.append(title);for(const id of stop.near){const p=places.find(x=>x.id===id);if(!p)continue;const b=document.createElement('button');b.textContent=p.name+' ↗';b.onclick=()=>{endRide(true);q.select(p.id)};menu.append(b)}const back=document.createElement('button');back.className='ride-near-back';back.textContent='继续乘车';back.onclick=()=>{menu.hidden=true;tour.paused=false};menu.append(back);menu.hidden=false}
  function rideTick(dt){const veh=ride.veh,st=veh.st;if(!st)return;
    const p=veh.pos,fwd=veh.dir.clone(),side=new T.Vector3(-fwd.z,0,fwd.x),f=reduced?1:1-Math.exp(-dt*2.6);
    const want=p.clone().addScaledVector(fwd,-2.7).addScaledVector(side,.9).add(tmp.set(0,2.3,0)),look=p.clone().addScaledVector(fwd,1.1).add(tmp.set(0,.1,0));camera.position.lerp(want,f);controls.target.lerp(look,f);camera.lookAt(controls.target);
    const L=veh.L,nm=j=>stops.get(L.stops[j])?.name||'';
    $('#ride-next').textContent=st.at>=0?(st.next<0?`终点 · ${nm(st.at)}`:`到站 · ${nm(st.at)}`):`下一站 · ${nm(st.next)}`;
    $('#ride-sub').textContent=`${L.short} · ${st.down?'向入口':'向山顶'} · 模拟游览`;
    const here=st.at>=0?stops.get(L.stops[st.at]):null,see=$('#ride-see');see.hidden=!here?.near.length;
    if(here?.near.length){see.textContent='看景点';see.onclick=()=>showNear(here)}
    if(st.at!==ride.lastAt){ride.lastAt=st.at;if(st.at>=0)arrive(stops.get(L.stops[st.at]),false)}
  }
  async function arrive(s, live) {
    window.qixiaGuide?.notifyArrival(s,live);
    const near = s.near.map(id => pins.find(x => x.p.id === id)).filter(Boolean);
    near.forEach(({p, b}) => { b.querySelector('.say').textContent = q.VO?.spots[p.id]?.clips.greet || ''; b.classList.add('greet'); });
    const ok = await speak(`bus-${s.id}`); if (ok && near[0]) await speak(`${near[0].p.id}-greet`);
    near.forEach(({b}) => b.classList.remove('greet'));
  }

  // 点 3D 小车也能跟车
  let down0;
  q.renderer.domElement.addEventListener('pointerdown', e => down0 = [e.clientX, e.clientY]);
  q.renderer.domElement.addEventListener('pointerup', e => {
    if (!down0 || Math.hypot(e.clientX - down0[0], e.clientY - down0[1]) > 7) return;
    const r = app.getBoundingClientRect(), ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, 1 - (e.clientY - r.top) / r.height * 2), camera);
    const hit = ray.intersectObjects(fleet.map(f => f.g), true)[0]; if (hit?.object.userData.veh?.tour) openFleet();
  });

  /* ---------- 9. 刷新与钩子 ---------- */
  function refresh(){refreshStops();const label=$('#bus-eta');if(label)label.textContent='选线 · 上车'}
  setInterval(refresh, 5000); setTimeout(refresh, 300);
  const prevCrowd = hooks.crowd; hooks.crowd = () => { prevCrowd?.(); refreshStops(); };
  const prevBefore = hooks.beforeSelect; hooks.beforeSelect = (id, o) => { prevBefore?.(id, o); if (ride.on) endRide(true); state.stop = null; };
  const prevClose = hooks.close; hooks.close = () => { prevClose?.(); state.stop = null; };
  // 景点面板里加一行「乘车」：最近的车站与上/下山下一班，点开即看站牌
  const prevAfter = hooks.afterSelect; hooks.afterSelect = (p, o) => {
    prevAfter?.(p, o); const pm = q.w2m(p.pos[0], p.pos[2]), s = [...stops.values()].filter(x => x.near.includes(p.id)).sort((a, b) => Math.hypot(a.mm[0] - pm[0], a.mm[1] - pm[1]) - Math.hypot(b.mm[0] - pm[0], b.mm[1] - pm[1]))[0];
    const anchor = $('#crowd-line'); if (!s || !anchor) return;
    anchor.insertAdjacentHTML('afterend', `<button class="bus-hint" id="bus-hint">${BUS_SVG}<span>${s.name}<br>查看线路，从附近站点上车</span>›</button>`);
    $('#bus-hint').onclick = () => openStop(s.id);
  };

  Object.assign(q, {transit: {lines, stops, fleet, now, setClock, follow, endRide, openStop, openFleet, board, ride, ptAt, wpt, clock}});
})();
