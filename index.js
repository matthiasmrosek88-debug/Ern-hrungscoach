
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json;charset=utf-8"}});
const text=d=>d.output_text||(d.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||"").join("");
async function coach(req,env){
 if(!env.OPENAI_API_KEY)return json({error:"OPENAI_API_KEY fehlt in Cloudflare."},503);
 const b=await req.json(),instructions="Du bist ein deutschsprachiger Ernährungs- und Gewichtscoach. Sei konkret und alltagstauglich. Kalorien und Makros sind Schätzungen. Keine Diagnose oder Medikamentendosis. Bei Harnsäure/Gicht nur allgemeine ernährungsbezogene Risikohinweise; leite keinen Blut-Harnsäurewert und keine sichere Alkoholmenge aus Mahlzeiten ab.";
 let input=b.action==="parse_food"?`Zerlege: ${JSON.stringify(b.text)}. Nur JSON {"items":[{"label":"...","amount_text":"...","kcal":123,"protein_g":12,"fat_g":5,"carbs_g":20,"uric_level":"green|yellow|red","confidence":"hoch|mittel|niedrig"}]}.`
 :b.action==="day_tips"?`1-2 Tipps für den Rest des Tages. Profil:${JSON.stringify(b.profile)} Ziel:${JSON.stringify(b.goal)} Plan:${JSON.stringify(b.plan)} Bisher:${JSON.stringify(b.entries)}. Nur JSON {"answer":"..."}.`
 :b.action==="week_feedback"?`Kurzer Wochenrückblick. Profil:${JSON.stringify(b.profile)} Ziel:${JSON.stringify(b.goal)} Plan:${JSON.stringify(b.plan)} Einträge:${JSON.stringify(b.weekEntries)} Gewicht:${JSON.stringify(b.weights)}. Nur JSON {"answer":"..."}.`
 :`Kurzes Tagesfazit. Profil:${JSON.stringify(b.profile)} Ziel:${JSON.stringify(b.goal)} Plan:${JSON.stringify(b.plan)} Tag:${b.selectedDate} Einträge:${JSON.stringify(b.entries)}. Zielerreichung und ein kleiner Hebel. Nur JSON {"answer":"..."}.`;
 const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"authorization":`Bearer ${env.OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:env.OPENAI_MODEL||"gpt-5-mini",instructions,input})});
 const d=await r.json();if(!r.ok)return json({error:d.error?.message||"KI-Aufruf fehlgeschlagen"},502);const t=text(d).trim().replace(/^```json\s*/,"").replace(/```$/,"").trim();try{return json(JSON.parse(t))}catch{return json({error:"KI-Antwort konnte nicht verarbeitet werden."},502)}
}
export default{async fetch(req,env){const u=new URL(req.url);if(u.pathname==="/api/coach"&&req.method==="POST"){try{return await coach(req,env)}catch(e){return json({error:e.message||"Serverfehler"},500)}}if(u.pathname.startsWith("/api/"))return json({error:"Nicht gefunden"},404);return env.ASSETS.fetch(req)}};
