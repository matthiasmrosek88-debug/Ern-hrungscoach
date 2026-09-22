
const DB_NAME="mein-coach", STORE="kv";
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function getState(){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE,"readonly").objectStore(STORE).get("state");r.onsuccess=()=>res(r.result||{});r.onerror=()=>rej(r.error)})}
async function putState(s){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put(s,"state");tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
const newId=()=>Date.now()*1000+Math.floor(Math.random()*999);
function makeBuilder(table){
 let op="select",payload=null,filters=[],orderBy=null,lim=null;
 const b={select(){op="select";return b},eq(k,v){filters.push([k,v]);return b},order(k,o={}){orderBy=[k,o.ascending!==false];return b},limit(n){lim=n;return b},
 maybeSingle(){return b.then(x=>({data:(x.data||[])[0]||null,error:null}))},single(){return b.then(x=>({data:(x.data||[])[0]||null,error:null}))},
 insert(x){op="insert";payload=x;return b},update(x){op="update";payload=x;return b},delete(){op="delete";return b},upsert(x){op="upsert";payload=x;return b},
 async then(resolve){try{const s=await getState(),rows=s[table]||(s[table]=[]),match=r=>filters.every(([k,v])=>String(r[k])===String(v));let result=[];
 if(op==="select"){result=rows.filter(match);if(orderBy)result.sort((a,c)=>{const d=String(a[orderBy[0]]??"").localeCompare(String(c[orderBy[0]]??""));return orderBy[1]?d:-d});if(lim)result=result.slice(0,lim)}
 else if(op==="insert"){const xs=Array.isArray(payload)?payload:[payload];result=xs.map(x=>({...x,id:x.id??newId(),created_at:x.created_at??new Date().toISOString()}));rows.push(...result);await putState(s)}
 else if(op==="update"){for(const r of rows)if(match(r)){Object.assign(r,payload,{updated_at:new Date().toISOString()});result.push(r)}await putState(s)}
 else if(op==="delete"){result=rows.filter(match);s[table]=rows.filter(r=>!match(r));await putState(s)}
 else if(op==="upsert"){const xs=Array.isArray(payload)?payload:[payload];result=[];for(const x of xs){const keys=table==="profiles"?["user_id"]:table==="weight_entries"?["user_id","measured_on"]:table==="day_summaries"?["user_id","summary_date"]:[];let r=rows.find(y=>keys.length&&keys.every(k=>String(y[k])===String(x[k])));if(r){Object.assign(r,x,{updated_at:new Date().toISOString()});result.push(r)}else{r={...x,id:x.id??newId(),created_at:new Date().toISOString()};rows.push(r);result.push(r)}}await putState(s)}
 resolve({data:result,error:null})}catch(e){resolve({data:null,error:{message:e.message}})}}};return b}
window.netlifyStore={from:makeBuilder,auth:{async getSession(){return {data:{session:{user:{id:"local-user",email:"Lokal auf diesem Gerät"}}}}},async signOut(){},onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}}};
window.coachBackup={async export(){const data=await getState(),blob=new Blob([JSON.stringify({version:1,exported_at:new Date().toISOString(),data},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`mein-coach-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)},async importFile(file){const x=JSON.parse(await file.text());if(!x?.data)throw new Error("Ungültiges Backup");await putState(x.data);location.reload()}};
