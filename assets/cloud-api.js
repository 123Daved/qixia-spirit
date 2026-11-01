/* The public GitHub frontend talks to the cloud service; credentials stay server-side. */
(()=>{
 if(location.hostname!=='123daved.github.io'||!location.pathname.startsWith('/qixia-spirit/'))return;
 if(new URLSearchParams(location.search).get('demo')==='1')return;
 const base='https://qixia-spirit-api-123daved.sharp-tapir-4242.chatgpt.site';
 const realFetch=window.fetch.bind(window);window.QIXIA_CLOUD_API=base;
 window.fetch=(input,options)=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return realFetch(input,options);
  const target=base+url.pathname+url.search;
  return realFetch(input instanceof Request?new Request(target,input):target,{...options,credentials:'omit'});
 };
})();
