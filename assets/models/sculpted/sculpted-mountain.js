/* A complete, all-angle sculpted miniature. Buildings, rocks, stairs, foliage,
   bridges and veins are real mesh geometry. Illustration is not projected on it. */
(()=>{
 'use strict';const q=window.qixia;if(!q)return;const {T}=q;
 const root=new T.Group();root.name='Qixia sculpted miniature';root.visible=false;q.scene.add(root);
 const C=h=>new T.Color(h).convertSRGBToLinear();
 const mat=(c,opts={})=>new T.MeshStandardMaterial({color:C(c),roughness:.86,...opts});
 const tex=new T.TextureLoader().load('assets/models/sculpted/limestone.webp');tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(1.5,2);tex.encoding=T.sRGBEncoding;tex.anisotropy=Math.min(8,q.renderer.capabilities.getMaxAnisotropy());
 const M={rock:mat(0xd7c9ac,{map:tex,bumpMap:tex,bumpScale:.035}),stone:mat(0xe7d6b6,{map:tex}),wood:mat(0x8e4527),woodLight:mat(0xc17a44),roof:mat(0x535950),tile:mat(0x788073),gold:mat(0xb89550,{metalness:.25,roughness:.55}),leaf:mat(0xcc4c22),vein:mat(0xec9c53),water:mat(0x6ba7a0,{metalness:.2,roughness:.28,transparent:true,opacity:.87}),foam:mat(0xe3f2e5,{transparent:true,opacity:.8}),bark:mat(0x6c5035),foliage:mat(0xffffff,{side:T.DoubleSide}),soil:mat(0xa5a47b)};
 const buckets=new Map(),dummy=new T.Object3D();let seed=28319;
 const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
 const box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,8),sphere=new T.IcosahedronGeometry(1,1);
 function instance(g,m,p,s=[1,1,1],r=[0,0,0],color){const key=g.uuid+m.uuid;let b=buckets.get(key);if(!b){b={g,m,items:[]};buckets.set(key,b)}dummy.position.set(...p);dummy.scale.set(...s);dummy.rotation.set(...r);dummy.updateMatrix();b.items.push({matrix:dummy.matrix.clone(),color})}
 function direct(g,m,name){const o=new T.Mesh(g,m);o.name=name||'';o.castShadow=true;o.receiveShadow=true;root.add(o);return o}
 function beam(a,b,r,m=M.wood){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);dummy.position.copy(av.add(bv).multiplyScalar(.5));dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());dummy.scale.set(r,d.length(),r);dummy.updateMatrix();let bucket=buckets.get(cylinder.uuid+m.uuid);if(!bucket){bucket={g:cylinder,m,items:[]};buckets.set(cylinder.uuid+m.uuid,bucket)}bucket.items.push({matrix:dummy.matrix.clone()})}
 function tube(points,r,m,name,segments=24){return direct(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,r,5,false),m,name)}
 const sites=[{x:0,z:-2.0,r:.56,h:6.2,kind:'tower'},{x:-1.9,z:-.75,r:.62,h:4.15},{x:-2.15,z:1.1,r:.62,h:2.6},{x:-2.6,z:2.65,r:.55,h:1.25},{x:1.75,z:-.15,r:.62,h:3.55},{x:2.6,z:2.55,r:.55,h:1.2},{x:-.45,z:3.6,r:.7,h:.65,kind:'gate'}];
 const hills=[[0,-1.8,6,1.5],[-1.8,-.3,3.65,1.45],[1.7,-.1,3.6,1.4],[-2.6,2.1,1.5,1.3],[2.6,2.1,1.3,1.3]];
 const riverX=z=>1.18+.37*Math.sin(z*1.5);
 function H(x,z){const r=Math.hypot(x/5,z/5.1);let h=.15;
  for(const [cx,cz,a,s] of hills)h=Math.max(h,a*Math.exp(-((x-cx)**2+(z-cz)**2)/(s*s*1.7)));
  h+=Math.max(0,1-r)*.25;h+=Math.min(h*.12,.22)*(Math.sin(x*6+z*.7)*Math.sin(z*4.2)+.4*Math.sin(x*13-z*8));
  if(z>-.3&&z<4.3){const dist=Math.abs(x-riverX(z));const mix=Math.exp(-dist*dist/.18);h=h*(1-mix)+(.25+Math.max(0,1.1-z)*2.0)*mix}
  for(const s of sites){const d=Math.hypot(x-s.x,z-s.z);if(d<s.r+.25){const t=Math.min(1,Math.max(0,(d-s.r)/.25));const k=t*t*(3-2*t);h=s.h*(1-k)+h*k}}
  return Math.max(.1,h)*Math.min(1,Math.max(0,(1-r)*12));
 }
 // Detailed continuous terrain, with steep sandstone faces and green terraces.
 const N=176,terrain=new T.PlaneGeometry(10.8,11,N,N);terrain.rotateX(-Math.PI/2);const pa=terrain.attributes.position,colors=[];
 for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,H(x,z))}
 const trimmed=[];for(let i=0;i<terrain.index.count;i+=3){const a=terrain.index.getX(i),b=terrain.index.getX(i+1),c=terrain.index.getX(i+2),x=(pa.getX(a)+pa.getX(b)+pa.getX(c))/3,z=(pa.getZ(a)+pa.getZ(b)+pa.getZ(c))/3;if(Math.hypot(x/5,z/5.1)<.995)trimmed.push(a,b,c)}terrain.setIndex(trimmed);terrain.computeVertexNormals();
 for(let i=0;i<pa.count;i++){const y=pa.getY(i),ny=terrain.attributes.normal.getY(i),v=.5+.5*Math.sin(pa.getX(i)*19+pa.getZ(i)*11);const c=C(ny>.7&&y>.2?0x7f8e63:0xcaba9d);c.multiplyScalar(.85+v*.18);colors.push(c.r,c.g,c.b)}terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const terrainMat=new T.MeshStandardMaterial({vertexColors:true,map:tex,bumpMap:tex,bumpScale:.025,roughness:.95});direct(terrain,terrainMat,'sculpted rock and forest terraces');
 // Radially shaped maple leaf: a thick curled surface with fine serrations.
 const points=[],lobes=7,steps=280;
 for(let i=0;i<steps;i++){const a=i/steps*Math.PI*2;const sector=(a+Math.PI*.1)*lobes;const lobe=.5+.5*Math.cos(sector);const r=5.45+1.35*Math.pow(lobe,3)+.075*Math.sin(i*2.1);points.push(new T.Vector2(Math.sin(a)*r,Math.cos(a)*r*.85))}
 const leafG=new T.ExtrudeGeometry(new T.Shape(points),{depth:.18,bevelEnabled:true,bevelThickness:.065,bevelSize:.05,bevelSegments:3,curveSegments:2});leafG.rotateX(-Math.PI/2);
 const lp=leafG.attributes.position;for(let i=0;i<lp.count;i++){const x=lp.getX(i),z=lp.getZ(i),r=Math.hypot(x,z);lp.setY(i,lp.getY(i)-.28+Math.max(0,r-4.3)**2*.12)}leafG.computeVertexNormals();
 const lc=[];for(let i=0;i<lp.count;i++){const x=lp.getX(i),z=lp.getZ(i),f=.5+.5*Math.sin(x*2.1+z*1.3);const c=C(0x982b1c).lerp(C(0xd55b2b),f*.5);lc.push(c.r,c.g,c.b)}leafG.setAttribute('color',new T.Float32BufferAttribute(lc,3));direct(leafG,new T.MeshStandardMaterial({vertexColors:true,roughness:.7,bumpMap:tex,bumpScale:.018}),'sculpted maple leaf base');
 const leafY=(x,z)=>-.205+Math.max(0,Math.hypot(x,z)-4.3)**2*.12;
 for(let k=0;k<7;k++){const a=k/7*Math.PI*2-Math.PI*.1;const pts=[];for(let j=0;j<=12;j++){const r=j/12*6.4,x=Math.sin(a)*r,z=Math.cos(a)*r*.85;pts.push([x,leafY(x,z),z])}tube(pts,.025,M.vein,'raised leaf vein',30);for(let j=5;j<12;j++)for(const sign of [-1,1]){const r=j/12*6.2,aa=a+sign*.17;const x=Math.sin(a)*r,z=Math.cos(a)*r*.85,xx=Math.sin(aa)*(r+.6),zz=Math.cos(aa)*(r+.6)*.85;tube([[x,leafY(x,z),z],[(x+xx)/2,leafY((x+xx)/2,(z+zz)/2)+.01,(z+zz)/2],[xx,leafY(xx,zz),zz]],.009,M.vein,'fine leaf vein',6)}}
 tube([[1.5,-.25,4.5],[2.6,-.29,5.5],[4,-.42,6.4],[5,-.55,7]],.12,M.leaf,'curved leaf stem',35);
 // Vertical split rocks, embedded in terrain instead of freestanding cones.
 const rockGeo=new T.IcosahedronGeometry(1,2),rp=rockGeo.attributes.position;
 for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),n=1+.1*Math.sin(x*19+y*3)*Math.cos(z*13+y*5);rp.setXYZ(i,x*n,y*(1+.06*Math.sin(x*9+z*4)),z*n)}rockGeo.computeVertexNormals();
 const rockPositions=[];
 for(let i=0;i<370;i++){const x=(rnd()-.5)*9,z=(rnd()-.5)*9,h=H(x,z);if(h<.35||sites.some(s=>Math.hypot(x-s.x,z-s.z)<s.r+.2)||z>-.2&&Math.abs(x-riverX(z))<.5)continue;const slope=Math.hypot(H(x+.12,z)-H(x-.12,z),H(x,z+.12)-H(x,z-.12))/.24;if(slope<.65)continue;const sy=.3+rnd()*.48;instance(rockGeo,M.rock,[x,h-sy*.25,z],[.15+rnd()*.16,sy,.14+rnd()*.19],[rnd()*.18,rnd()*6.28,rnd()*.12]);rockPositions.push([x,z])}
 // Shared curved tiled roof template, including each raised tile channel.
 function roofGeometry(){const pos=[],idx=[],R=16,A=64;
  for(let j=0;j<=R;j++){const r=.025+.975*j/R;for(let i=0;i<=A;i++){const a=i/A*Math.PI*2,c=Math.cos(a),s=Math.sin(a),edge=1/Math.max(Math.abs(c),Math.abs(s)),corner=Math.pow(Math.abs(Math.sin(a*2)),6);pos.push(c*edge*r,.52*Math.pow(1-r,.8)+.16*corner*r**5,s*edge*r)}}
  for(let j=0;j<R;j++)for(let i=0;i<A;i++){const k=j*(A+1)+i;idx.push(k,k+A+1,k+1,k+1,k+A+1,k+A+2)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 const roofGeo=roofGeometry();M.roof.side=T.DoubleSide;
 function roof(x,y,z,s){instance(roofGeo,M.roof,[x,y,z],[s,s*.8,s]);
  for(let row=2;row<=10;row++){const r=row/10,pts=[];for(let k=0;k<=64;k++){const a=k/64*Math.PI*2,co=Math.cos(a),si=Math.sin(a),edge=1/Math.max(Math.abs(co),Math.abs(si));pts.push([x+co*edge*r*s,y+(.52*(1-r)**.8+.16*Math.abs(Math.sin(a*2))**6*r**5)*s*.8+.005,z+si*edge*r*s])}tube(pts,.004*s,M.tile,'overlapping tile courses',64)}
  for(let a=0;a<48;a++){const theta=a/48*Math.PI*2,co=Math.cos(theta),si=Math.sin(theta),ed=1/Math.max(Math.abs(co),Math.abs(si)),corner=Math.abs(Math.sin(theta*2))**6;const pts=[];for(let j=0;j<=9;j++){const r=.13+j/9*.87;pts.push([x+co*ed*r*s,y+(.52*(1-r)**.8+.16*corner*r**5)*s*.8+.008,z+si*ed*r*s])}tube(pts,.008*s,M.tile,'individual roof tile ridge',10)}
  for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2,dx=Math.cos(a)*Math.SQRT2,dz=Math.sin(a)*Math.SQRT2;tube([[x,y+.43*s,z],[x+dx*s*.5,y+.24*s,z+dz*s*.5],[x+dx*s,y+.14*s,z+dz*s]],.018*s,M.gold,'roof corner ridge',12)}
  instance(sphere,M.gold,[x,y+.46*s,z],[.045*s,.065*s,.045*s]);
 }
 function railing(a,b,y,height=.19){const d=Math.hypot(a[0]-b[0],a[1]-b[1]),n=Math.max(1,Math.ceil(d/.17));beam([a[0],y+height,a[1]],[b[0],y+height,b[1]],.016,M.stone);beam([a[0],y+.06,a[1]],[b[0],y+.06,b[1]],.012,M.stone);for(let i=0;i<=n;i++){const x=a[0]+(b[0]-a[0])*i/n,z=a[1]+(b[1]-a[1])*i/n;instance(box,M.stone,[x,y+height/2,z],[.032,height,.032]);instance(sphere,M.stone,[x,y+height+.018,z],[.026,.026,.026])}}
 function pavilion(s,tower=false){const {x,z,h}=s,scale=tower?.72:.64;
  instance(box,M.stone,[x,h+.045,z],[scale*1.65,.09,scale*1.65]);instance(box,M.stone,[x,h+.11,z],[scale*1.43,.055,scale*1.43]);
  const levels=tower?3:1;
  for(let l=0;l<levels;l++){const w=scale*(1-l*.15),y=h+.14+l*.58;
   for(const a of [-1,1])for(const b of [-1,1]){instance(cylinder,M.wood,[x+a*w*.53,y+.24,z+b*w*.53],[.027,.48,.027]);instance(box,M.woodLight,[x+a*w*.53,y+.47,z+b*w*.53],[.14,.045,.14]);for(let k=0;k<3;k++)instance(box,M.wood,[x+a*w*.53,y+.48+k*.035,z+b*w*.53],[.13+k*.05,.025,.04])}
   for(const a of [-1,1]){beam([x-w*.65,y+.42,z+a*w*.53],[x+w*.65,y+.42,z+a*w*.53],.025,M.wood);beam([x+a*w*.53,y+.42,z-w*.65],[x+a*w*.53,y+.42,z+w*.65],.025,M.wood)}
   if(l>0){instance(box,M.woodLight,[x,y+.12,z],[w,.24,w]);for(const a of [-1,1])for(let j=-2;j<=2;j++)instance(box,M.wood,[x+j*w*.13,y+.17,z+a*w*.505],[.016,.17,.015])}
   roof(x,y+.49,z,w);
  }
  railing([x-scale*.68,z-scale*.68],[x+scale*.68,z-scale*.68],h+.15);for(const a of [-1,1])railing([x+a*scale*.68,z-scale*.68],[x+a*scale*.68,z+scale*.68],h+.15);
 }
 sites.filter(s=>s.kind!=='gate').forEach(s=>pavilion(s,s.kind==='tower'));
 // Entrance arch, carved beams, steps, and ridge ends.
 {const s=sites[6],x=s.x,z=s.z,y=s.h;for(const dx of [-.5,.5]){instance(box,M.stone,[x+dx,y+.08,z],[.22,.16,.22]);instance(cylinder,M.wood,[x+dx,y+.65,z],[.055,1.14,.055]);instance(box,M.woodLight,[x+dx,y+1.07,z],[.17,.07,.3])}instance(box,M.wood,[x,y+.92,z],[1.18,.17,.09]);roof(x,y+1.17,z,.65);instance(box,M.woodLight,[x,y+1.01,z+.06],[.35,.12,.025]);}
 // Each stair is an individual stone tread; the railing follows its elevation.
 const routeNodes=[[-.45,4.15],[-.45,3.6],[-1.5,3.2],[-2.6,2.65],[-2.85,1.8],[-2.15,1.1],[-1.4,.4],[-1.9,-.75],[-1.05,-1.3],[0,-2]];
 const branches=[routeNodes,[[-2.15,1.1],[-.7,1.5],[.5,2],[2.6,2.55]],[[0,-2],[1,-1.35],[1.75,-.15],[2.8,.9],[2.6,2.55]]];
 const pathPoints=[];
 for(const nodes of branches){const curve=new T.CatmullRomCurve3(nodes.map(([x,z])=>new T.Vector3(x,0,z)));const n=Math.ceil(curve.getLength()/.075);let previous=null;
  for(let i=0;i<=n;i++){const v=curve.getPoint(i/n),tan=curve.getTangent(i/n),yaw=Math.atan2(tan.x,tan.z);let h=H(v.x,v.z)+.07;const p=[v.x,h,v.z];pathPoints.push(p);instance(box,M.stone,[v.x,h-.025,v.z],[.31,.075,.085],[0,yaw,0]);
   if(i%4===0&&h>1.1){const nx=Math.cos(yaw)*.205,nz=-Math.sin(yaw)*.205;const post=[v.x+nx,h,v.z+nz];beam(post,[post[0],h+.22,post[2]],.018,M.stone);instance(sphere,M.stone,[post[0],h+.235,post[2]],[.025,.025,.025]);if(previous)beam([previous[0],previous[1]+.21,previous[2]],[post[0],h+.21,post[2]],.015,M.stone);previous=post}
  }
 }
 // Stream ribbon and waterfall filaments with animated glints.
 const waterPts=[];for(let i=0;i<=70;i++){const z=-.05+i/70*4.15,x=riverX(z);waterPts.push(new T.Vector3(x,H(x,z)+.055,z))}
 const wp=[],wi=[];for(let i=0;i<waterPts.length;i++){const p=waterPts[i];wp.push(p.x-.18,p.y,p.z,p.x+.18,p.y,p.z);if(i){const k=i*2;wi.push(k-2,k-1,k,k-1,k+1,k)}}const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute(wp,3));wg.setIndex(wi);wg.computeVertexNormals();M.water.side=T.DoubleSide;direct(wg,M.water,'flowing mountain stream');
 const glints=[];for(let i=0;i<20;i++){const j=5+Math.floor(rnd()*55),p=waterPts[j],next=waterPts[j+2];const o=tube([[p.x+(rnd()-.5)*.25,p.y+.014,p.z],[next.x+(rnd()-.5)*.2,next.y+.014,next.z]],.005+rnd()*.007,M.foam,'water filament',4);glints.push(o)}
 // Sculpted arched bridge, deck planks and both parapets.
 {const z=2.1,cx=riverX(z),base=Math.max(H(cx-.6,z),H(cx+.6,z))+.06;for(let i=0;i<=28;i++){const t=i/28,x=cx+(t-.5)*1.2,y=base+.14+.27*Math.sin(t*Math.PI);instance(box,M.woodLight,[x,y,z],[.046,.06,.42]);for(const side of [-1,1]){const zz=z+side*.24;if(i%4===0)beam([x,y,zz],[x,y+.23,zz],.018,M.wood);if(i<28){const xx=cx+(t+1/28-.5)*1.2,yy=base+.14+.27*Math.sin((t+1/28)*Math.PI);beam([x,y+.23,zz],[xx,yy+.23,zz],.014,M.wood)}}}}
 // Botanical silhouettes: branching trunks, layered pine pads and individual maple leaves.
 const mapleShape=new T.Shape();[[0,.1],[.025,.038],[.075,.06],[.05,.015],[.1,-.005],[.035,-.025],[.015,-.06],[0,-.035],[-.015,-.06],[-.035,-.025],[-.1,-.005],[-.05,.015],[-.075,.06],[-.025,.038]].forEach(([x,y],i)=>i?mapleShape.lineTo(x,y):mapleShape.moveTo(x,y));mapleShape.closePath();const mapleGeo=new T.ShapeGeometry(mapleShape);
 const pineGeo=new T.IcosahedronGeometry(1,1),treeLocations=[];
 for(let i=0;i<1200&&treeLocations.length<205;i++){const x=(rnd()-.5)*8.9,z=(rnd()-.5)*8.7,h=H(x,z);if(h<.25||h>5.75||sites.some(s=>Math.hypot(x-s.x,z-s.z)<s.r+.25)||pathPoints.some(p=>Math.hypot(x-p[0],z-p[2])<.24)||z>-.3&&Math.abs(x-riverX(z))<.44||treeLocations.some(t=>Math.hypot(x-t.x,z-t.z)<.43))continue;
  treeLocations.push({x,z,h});const pine=rnd()<.56,s=.62+rnd()*.36,lean=(rnd()-.5)*.2;
  beam([x,h,z],[x+lean,h+s,z],.021,M.bark);
  for(let j=0;j<6;j++){const a=j*2.399+rnd()*.4,level=.35+j*.085,reach=s*(.38+(5-j)*.035),bx=x+Math.cos(a)*reach,bz=z+Math.sin(a)*reach,by=h+s*level;beam([x+lean*level,by-.06,z],[bx,by,bz],.009,M.bark);
   if(pine){for(let k=0;k<3;k++)instance(pineGeo,M.foliage,[bx+(rnd()-.5)*.13,by+(rnd()-.5)*.04,bz+(rnd()-.5)*.13],[.17,.075,.145],[0,rnd()*6,0],C([0x355640,0x4a6649,0x60784c][k]));}
   else{const col=[0xb94221,0xcd5725,0xdf8737,0xbfa34d][Math.floor(rnd()*4)];for(let k=0;k<38;k++){const a2=rnd()*6.28,rr=Math.sqrt(rnd())*.21;instance(mapleGeo,M.foliage,[bx+Math.cos(a2)*rr,by+(rnd()-.5)*.17,bz+Math.sin(a2)*rr],[.65,.65,.65],[rnd()*Math.PI,rnd()*6,rnd()*6],C(col).multiplyScalar(.85+rnd()*.25))}}
  }
 }
 // Reuse one draw call per material/geometry family, including the thousands of leaves.
 let instances=0;for(const b of buckets.values()){const m=new T.InstancedMesh(b.g,b.m,b.items.length);b.items.forEach((it,i)=>{m.setMatrixAt(i,it.matrix);if(it.color)m.setColorAt(i,it.color)});m.castShadow=true;m.receiveShadow=true;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;root.add(m);instances+=b.items.length}
 // Merge static decorative meshes by material (roof tiles/veins) for mobile GPUs.
 const mergeSets=new Map();for(const o of [...root.children]){if(!o.isMesh||o.isInstancedMesh||glints.includes(o))continue;const key=o.material.uuid;const list=mergeSets.get(key)||[];list.push(o);mergeSets.set(key,list)}
 for(const list of mergeSets.values()){if(list.length<2)continue;const attributes={position:[],normal:[],uv:[]};for(const o of list){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry;for(const name of Object.keys(attributes)){const a=g.attributes[name];if(a)attributes[name].push(...a.array);else attributes[name].push(...new Float32Array(g.attributes.position.count*(name==='uv'?2:3)))}root.remove(o);if(g!==o.geometry)g.dispose();o.geometry.dispose()}const g=new T.BufferGeometry();for(const [name,values] of Object.entries(attributes))g.setAttribute(name,new T.Float32BufferAttribute(values,name==='uv'?2:3));direct(g,list[0].material,'batched architectural details')}
 root.updateMatrixWorld(true);
 const originalPositions=q.places.map(p=>p.pos.slice()),pinPositions=q.pins.map(p=>p.g.position.clone());
 const positions=[[riverX(2.4),H(riverX(2.4),2.4)+.15,2.4],[-2.6,1.45,2.65],[-2.15,2.8,1.1],[-1.9,4.35,-.75],[0,6.55,-2],[1.75,3.8,-.15],[2.6,1.5,2.55],[-.45,.85,3.6]];
 let enabled=false;const previousHome=window.qixiaThemeHome;
 window.qixiaThemeHome=()=>{if(!enabled)return previousHome();const W=q.app.clientWidth,Hh=q.app.clientHeight;const top=100,bottom=Hh-140,h=Math.max(240,bottom-top);const aspect=W/Hh,D=Math.max(23,13/(2*Math.tan(17*Math.PI/180)*aspect),12/(2*Math.tan(17*Math.PI/180)*h/Hh));const target=new T.Vector3(0,3.1,0),dir=new T.Vector3(1.8,9.5,18).normalize();return{p:target.clone().addScaledVector(dir,D),t:target}};
 function enable(on){if(enabled===on)return;enabled=on;root.visible=on;q.world.visible=!on;document.body.classList.toggle('sculpted-view',on);q.places.forEach((p,i)=>{p.pos=on?positions[i].slice():originalPositions[i].slice();q.pins[i].g.position.copy(on?new T.Vector3(...positions[i]):pinPositions[i])});if(on){q.controls.minDistance=3;q.controls.maxDistance=100;q.controls.maxPolarAngle=Math.PI*.49}q.home()}
 const artStage=window.qixiaArtStage,oldSet=artStage.setMode;
 artStage.setMode=(mode,opts)=>{const riding=document.body.classList.contains('riding');enable(mode==='model'&&!riding);oldSet(mode,opts)};
 document.querySelectorAll('.scene-modes button').forEach(b=>b.onclick=()=>artStage.setMode(b.dataset.mode));
 const observer=new MutationObserver(()=>{const riding=document.body.classList.contains('riding');if(riding&&enabled){enabled=false;root.visible=false;q.world.visible=true;document.body.classList.remove('sculpted-view');q.places.forEach((p,i)=>{p.pos=originalPositions[i].slice();q.pins[i].g.position.copy(pinPositions[i])})}else if(!riding&&!artStage.isArtView()&&!enabled)enable(true)});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 q.tickers.push((dt,t)=>{if(enabled)glints.forEach((o,i)=>{o.visible=Math.sin(t*2.5+i*.7)>-.55})});
 const style=document.createElement('style');style.textContent='.sculpted-view #labels .stop,.sculpted-view #labels .bus-tag,.sculpted-view #labels .gate-tag,.sculpted-view #labels .lot-tag,.sculpted-view #labels .rest-tag,.sculpted-view #labels .peak-tag{display:none!important}.sculpted-view .sky{background:radial-gradient(ellipse at 50% 45%,#f5efde,#e5e8dc)}.sculpted-view .hud{display:flex!important;top:110px;right:22px}.sculpted-view .compass{display:none}.sculpted-view .scene-modes button[data-mode=model]{font-weight:600}';document.head.append(style);
 document.querySelector('.scene-modes [data-mode=model]').textContent='精雕 3D';
 const stats={trees:treeLocations.length,rocks:rockPositions.length,instances,meshObjects:root.children.length,terrainVertices:pa.count};
 window.qixiaSculpture={root,enable,stats,positions,height:H};
 // Default to the new real 3D model, after other homepage initialization hooks.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{artStage.setMode('model');q.home()}));
})();
