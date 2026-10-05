/** CLES v1.7.0 optional GAS sync. Local storage remains the source of truth. */
const CLESSync = (() => {
  const ENDPOINT_KEY='cles.gasEndpoint.v1';
  const SYNC_KEY='cles.syncState.v1';
  function endpoint(){return (localStorage.getItem(ENDPOINT_KEY)||'').trim()}
  function setEndpoint(v){localStorage.setItem(ENDPOINT_KEY,(v||'').trim())}
  function state(){try{return JSON.parse(localStorage.getItem(SYNC_KEY)||'{}')}catch(_){return {}}}
  function saveState(s){localStorage.setItem(SYNC_KEY,JSON.stringify(s))}
  function eventId(log){if(log.event_id)return log.event_id; const raw=[log.ts,log.session_id,log.item_id,log.answer,log.time_sec].join('|');let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return 'evt_'+(h>>>0).toString(36)}
  function pending(){const s=state(), synced=s.synced||{};return CLESStorage.load().logs.map(l=>({...l,event_id:eventId(l)})).filter(l=>!synced[l.event_id])}
  async function syncAll(){const url=endpoint();if(!url)return {ok:false,reason:'endpoint-not-set',pending:pending().length};const rows=pending();if(!rows.length)return {ok:true,sent:0,pending:0};const payload={schema:'cles-sync-batch',schema_version:'1.0',app_version:(typeof APP_VERSION!=='undefined'?APP_VERSION:''),sent_at:new Date().toISOString(),rows};try{const res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});if(!res.ok)throw new Error('HTTP '+res.status);const out=await res.json();if(out.ok!==true)throw new Error(out.error||'GAS rejected batch');const s=state();s.synced=s.synced||{};rows.forEach(r=>s.synced[r.event_id]=new Date().toISOString());s.last_sync_at=new Date().toISOString();s.last_error='';saveState(s);return {ok:true,sent:rows.length,pending:0,last_sync_at:s.last_sync_at}}catch(e){const s=state();s.last_error=String(e&&e.message||e);s.last_attempt_at=new Date().toISOString();saveState(s);return {ok:false,reason:s.last_error,pending:rows.length}}
  }
  function status(){const s=state();return {configured:!!endpoint(),pending:pending().length,last_sync_at:s.last_sync_at||'',last_error:s.last_error||''}}
  return {endpoint,setEndpoint,syncAll,status,pending,eventId};
})();
