import {createHash} from 'node:crypto';

function group(map,key,comment){
  if(!map.has(key))map.set(key,[]);
  map.get(key).push(comment);
}

// A group belongs to one campaign, one platform and one parent post.
export function detectSignals(records){
  const hours=new Map(),phrases=new Map(),signals=[];
  for(const comment of records){
    if(comment.type!=='comment'||!comment.author||!comment.published_at)continue;
    const parent=comment.raw?.post_id||comment.parent_url;
    if(!parent)continue;
    const scope=[comment.campaign_id,comment.platform,parent];
    group(hours,JSON.stringify([...scope,comment.published_at.slice(0,13)]),comment);
    const phrase=(comment.text||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    if(phrase.length>=8&&phrase.includes(' '))group(phrases,JSON.stringify([...scope,phrase]),comment);
  }
  function collect(groups,burst){
    for(const [scope,rows] of groups){
      const authors=new Set(rows.map(r=>String(r.author).trim().toLowerCase())).size;
      if(authors<(burst?3:2))continue;
      rows.sort((a,b)=>b.published_at.localeCompare(a.published_at)||a.key.localeCompare(b.key));
      const last=rows[0],rule=burst?'Comment burst':'Repeated wording';
      const id=createHash('sha256').update(JSON.stringify([rule,scope,rows.map(r=>r.key).sort()])).digest('hex');
      const detail=rows.length+' comments from '+authors+' accounts '+(burst?'in the same clock hour':'using “'+JSON.parse(scope).at(-1)+'”');
      signals.push({id,campaign:last.campaign_id,platform:last.platform,rule,detail,date:last.published_at,url:last.parent_url});
    }
  }
  collect(hours,true);
  collect(phrases,false);
  return signals.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}

export async function signalStore(db){
  await db.exec('CREATE TABLE IF NOT EXISTS signal_reviews (id VARCHAR(64) PRIMARY KEY, campaign_id VARCHAR(64) NOT NULL, decision VARCHAR(32) NOT NULL, FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE)');
  async function list(records){
    const decisions=new Map((await db.all('SELECT id,decision FROM signal_reviews')).map(r=>[r.id,r.decision]));
    return detectSignals(records).map(r=>({...r,status:decisions.get(r.id)||'Pending review'}));
  }
  async function review(data,eligible){
    if(!['Reviewed','Dismissed','Pending review'].includes(data.decision))throw Error('Choose a review status.');
    if(!detectSignals(eligible).some(r=>r.id===data.id))throw Error('The evidence changed. Open Trend Guard again.');
    await db.begin();
    try{
      await db.exec('DELETE FROM signal_reviews WHERE id=?',[data.id]);
      await db.exec('INSERT INTO signal_reviews VALUES(?,?,?)',[data.id,data.campaign,data.decision]);
      await db.commit();
    }catch(error){await db.rollback();throw error;}
  }
  return {list,review};
}
