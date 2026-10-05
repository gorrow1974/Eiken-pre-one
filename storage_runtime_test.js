const fs=require('fs'),vm=require('vm');
class LS{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
global.localStorage=new LS(); global.location={origin:'https://gorrow1974.github.io'};
vm.runInThisContext(fs.readFileSync('storage_manager.js','utf8'));
function assert(x,m){if(!x)throw new Error(m)}
let h=CLESStorage.healthCheck(); assert(h.ok===false || h.logCount===0,'initial count');
const base={ts:'2026-08-11T00:00:00.000Z',session_id:'S1',item_id:'Q001',answer:'WHY',correct_answer:'WHY',ok:true,time_sec:3.2,mastery_score:80,user_profile:'learner'};
let r=CLESStorage.appendLog(base); assert(r.before===0&&r.after===1,'append must +1');
assert(CLESStorage.load().logs.length===1,'reload must preserve');
let exp=CLESStorage.exportBundle({appVersion:'1.6.1'}); assert(exp.user_data.logs.length===1,'export count');
let r2=CLESStorage.appendLog({...base,ts:'2026-08-11T00:00:01.000Z'}); assert(r2.after===2,'second append');
console.log('PASS storage runtime: append/reload/export/count verification');
