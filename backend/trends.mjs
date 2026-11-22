// Manila has a fixed UTC+8 offset. The date used here is publication, never collection.
const dayMs=86400000;
function dates(iso){
  const instant=Date.parse(iso);
  if(!Number.isFinite(instant))return {};
  const local=new Date(instant+8*3600000);
  const day=local.toISOString().slice(0,10);
  const monday=new Date(Date.parse(day)-(local.getUTCDay()+6)%7*dayMs);
  return {day,week:monday.toISOString().slice(0,10)};
}
const evidenceType=t=>t==='content'?'Campaign content':'Audience comments';
export function trendSummary(records,analysis){
  const data=new Map(records.map(r=>[r.campaign_id+':'+r.key,r]));
  const topics=new Map(),daily=new Map(),weekly=new Map();
  const eligible={content:new Set(),comment:new Set()};
  const ordered=m=>[...m.entries()].sort(([a],[b])=>b.localeCompare(a));
  for(const a of analysis){
    const r=data.get(a.campaign+':'+a.key);
    if(!r)continue;
    const {day,week}=dates(r.published_at);
    if(week)eligible[r.type].add(week);
    if(a.hits.length&&day){
      for(const [map,key] of [[daily,day],[weekly,week]]){
        const row=map.get(key)||{content:0,comment:0,terms:new Set()};
        row[r.type]++;
        for(const h of a.hits)row.terms.add(h.term);
        map.set(key,row);
      }
    }
    for(const {term} of a.hits){
      const topic=topics.get(term)||{term,content:0,comment:0,platforms:new Set(),days:new Set(),streams:new Map()};
      topics.set(term,topic);topic[r.type]++;topic.platforms.add(r.platform);
      if(!week)continue;
      topic.days.add(day);
      const stream=topic.streams.get(r.type)||{days:new Set(),weeks:new Set(),platforms:new Set(),count:0};
      topic.streams.set(r.type,stream);stream.count++;stream.days.add(day);stream.weeks.add(week);stream.platforms.add(r.platform);
    }
  }
  const radar=[],power=[];
  for(const t of topics.values()){
    const days=[...t.days].sort();
    radar.push({term:t.term,content:t.content,comment:t.comment,platforms:[...t.platforms].sort(),first:days[0],last:days.at(-1),dayCount:days.length});
    for(const [type,s] of t.streams){
      const orderedDays=[...s.days].sort(),first=orderedDays[0],last=orderedDays.at(-1);
      const span=(Date.parse(last)-Date.parse(first))/dayMs;
      const active=s.weeks.size,total=eligible[type].size;
      power.push({term:t.term,type:evidenceType(type),count:s.count,first,last,span,active,total,coverage:total>=2?Math.round(100*active/total):null,platforms:[...s.platforms].sort(),status:active>=3&&span>=30?'Repeated over 30+ days':active>=2?'Repeated across weeks':'One observed week'});
    }
  }
  radar.sort((a,b)=>(b.content+b.comment)-(a.content+a.comment)||a.term.localeCompare(b.term));
  power.sort((a,b)=>b.active-a.active||b.span-a.span||b.count-a.count||a.term.localeCompare(b.term));
  const timeline=map=>ordered(map).map(([date,row])=>({date,content:row.content,comment:row.comment,terms:[...row.terms].sort()}));
  return {radar,power,eligible:{content:eligible.content.size,comment:eligible.comment.size},days:timeline(daily),weeks:timeline(weekly)};
}
