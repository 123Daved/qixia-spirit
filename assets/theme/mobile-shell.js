/* A real mobile browsing viewport on desktop; edge-to-edge on phones. */
(()=>{
 const frame=document.querySelector('#phone-app'),preview=document.querySelector('.phone-preview'),rotate=document.querySelector('#phone-rotate'),label=document.querySelector('#phone-size');
 let landscape=false;
 function fit(){const coarse=matchMedia('(pointer:coarse)').matches;const phone=innerWidth<=430||(coarse&&Math.max(innerWidth,innerHeight)<=1100);document.body.dataset.device=phone?'phone':'preview';document.body.style.setProperty('--visible-height',(window.visualViewport?.height||innerHeight)+'px');label.textContent=landscape?'手机横屏':'手机竖屏';}
 rotate.onclick=()=>{landscape=!landscape;preview.classList.toggle('landscape',landscape);rotate.textContent=landscape?'竖屏预览 ↻':'横屏预览 ↻';rotate.setAttribute('aria-label',landscape?'切换到手机竖屏':'切换到手机横屏');rotate.setAttribute('aria-pressed',String(landscape));fit()};
 const url=new URL('栖霞有灵_手机应用.html',location.href);url.search=location.search;url.hash=location.hash;
 frame.addEventListener('load',()=>{document.querySelector('.phone-loading').hidden=true});
 fit();frame.src=url.href;window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
})();
