import {readFile} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';

export const sentiments = ['Positive','Negative','Neutral','Context review'];
const decisions = ['Positive','Negative','Neutral','Mixed','Unclassified'];
const normalize = s => s.normalize('NFKC').toLowerCase().replace(/[’‘]/gu,"'").replace(/\s+/gu,' ').trim();
const split = rule => [rule.term,...rule.variants.split(',')].map(normalize).filter(Boolean);
const hash = s => createHash('sha256').update(s).digest('hex');
function ruleInput(data) {
  const clean = (key,max) => {
    if(typeof data[key]!=='string' || data[key].length>max)throw Error('Check the '+key+' field.');
    return data[key].trim();
  };
  const term=clean('term',120), variants=clean('variants',800).split(',').map(s=>s.trim()).filter(Boolean).join(', ');
  const category=clean('category',120),sentiment=data.sentiment;
  if(!term || term.includes(',') || !category || !sentiments.includes(sentiment))throw Error('Enter a phrase, category and valid sentiment.');
  return {term,variants,category,sentiment};
}
export async function keywordStore(db) {
  await db.exec('CREATE TABLE IF NOT EXISTS keyword_rules (id VARCHAR(64) PRIMARY KEY, payload TEXT NOT NULL)');
  await db.exec('CREATE TABLE IF NOT EXISTS library_versions (id VARCHAR(64) PRIMARY KEY)');
  await db.exec('CREATE TABLE IF NOT EXISTS keyword_reviews (campaign_id VARCHAR(64) NOT NULL, record_key VARCHAR(64) NOT NULL, fingerprint VARCHAR(64) NOT NULL, decision VARCHAR(32) NOT NULL, PRIMARY KEY(campaign_id,record_key), FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE)');
  if(!(await db.all('SELECT id FROM library_versions WHERE id=?',['campaign-v1'])).length){
    const seed=JSON.parse(await readFile(new URL('./keyword-seed.json',import.meta.url),'utf8'));
    await db.begin();
    try {
      for(const [term,variants,category,sentiment] of seed)await db.exec('INSERT INTO keyword_rules VALUES(?,?)',[hash(term),JSON.stringify({term,variants,category,sentiment})]);
      await db.exec('INSERT INTO library_versions VALUES(?)',['campaign-v1']);await db.commit();
    }catch(e){await db.rollback();throw e;}
  }
  // Apply this curated expansion once. Existing rules, aliases and user deletions from the first seed are preserved.
  if(!(await db.all('SELECT id FROM library_versions WHERE id=?',['clevercatch-v2'])).length){
    const additions=JSON.parse(await readFile(new URL('./campaign-keywords.json',import.meta.url),'utf8'));
    await db.begin();
    try{
      const occupied=new Set((await list()).flatMap(split));
      for(const [term,aliases,category,sentiment] of additions){
        if(occupied.has(normalize(term)))continue;
        const variants=aliases.split(',').map(v=>v.trim()).filter(v=>v&&!occupied.has(normalize(v))).join(', ');
        const rule=ruleInput({term,variants,category,sentiment});
        await db.exec('INSERT INTO keyword_rules VALUES(?,?)',[hash(term),JSON.stringify(rule)]);
        for(const form of split(rule))occupied.add(form);
      }
      await db.exec('INSERT INTO library_versions VALUES(?)',['clevercatch-v2']);
      await db.commit();
    }catch(e){await db.rollback();throw e;}
  }
  async function list(){return (await db.all('SELECT id,payload FROM keyword_rules ORDER BY id')).map(r=>({id:r.id,...JSON.parse(r.payload)})).sort((a,b)=>a.term.localeCompare(b.term));}
  async function change(id,data){
    const all=await list();
    if(id&&!all.some(r=>r.id===id))throw Error('This rule was removed. Reload the library.');
    if(data===null)return db.exec('DELETE FROM keyword_rules WHERE id=?',[id]);
    const rule=ruleInput(data), forms=new Set(split(rule));
    if(all.some(r=>r.id!==id && split(r).some(s=>forms.has(s))))throw Error('A phrase or variation already belongs to another rule.');
    return id?db.exec('UPDATE keyword_rules SET payload=? WHERE id=?',[JSON.stringify(rule),id]):db.exec('INSERT INTO keyword_rules VALUES(?,?)',[randomUUID(),JSON.stringify(rule)]);
  }
  async function analyze(records,campaign){
    const rules=(await list()).map(r=>({...r,pattern:new RegExp('(?<![#\\p{L}\\p{N}_])(?:'+split(r).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\p{L}\\p{N}_])','u')}));
    const reviews=new Map((await db.all('SELECT * FROM keyword_reviews'+(campaign?' WHERE campaign_id=?':''),campaign?[campaign]:[])).map(r=>[r.campaign_id+':'+r.record_key,r]));
    return records.flatMap(r=>{
      if(!['content','comment'].includes(r.type))return [];
      const raw=r.raw||{};
      const parts=[r.title,...(r.type==='comment'?[r.text]:[raw.post_text,raw.content,raw.description,raw.caption,raw.text])].filter(x=>typeof x==='string'&&x.trim());
      const fields=[...new Set(parts)].map(normalize);
      if(!fields.length)return [];
      const hits=rules.flatMap(rule=>{
        for(const field of fields){const match=field.match(rule.pattern);if(match){
          const prefix=field.slice(0,match.index);
          const negated=['Positive','Negative'].includes(rule.sentiment)&&/(?:^|[^\p{L}\p{N}_])(?:not|never|hindi|di|hinde|isn't|isnt|don't|dont)(?:\s+[\p{L}]+){0,2}\s*$/u.test(prefix);
          return [{id:rule.id,term:rule.term,phrase:match[0],sentiment:negated?'Context review':rule.sentiment}];
        }}
        return [];
      });
      const labels=new Set(hits.map(h=>h.sentiment));
      const result=labels.has('Positive')&&labels.has('Negative')?'Mixed':labels.has('Context review')?'Context review':labels.has('Positive')?'Positive':labels.has('Negative')?'Negative':labels.has('Neutral')?'Neutral':'Unclassified';
      const fingerprint=hash(JSON.stringify([fields,hits]));
      const saved=reviews.get(r.campaign_id+':'+r.key);
      const decision=saved?.fingerprint===fingerprint?saved.decision:null;
      return [{campaign:r.campaign_id,key:r.key,hits,result,decision,fingerprint}];
    });
  }
  async function review(input){
    if(!decisions.includes(input.decision))throw Error('Choose a review decision.');
    const [row]=await db.all("SELECT payload FROM records WHERE campaign_id=? AND record_key=? AND record_type='comment'",[input.campaign,input.key]);
    if(!row)throw Error('This comment is no longer available.');
    const [evidence]=await analyze([{...JSON.parse(row.payload),campaign_id:input.campaign}],input.campaign);
    if(!evidence||evidence.fingerprint!==input.fingerprint)throw Error('The comment or its rules changed. Reopen the review.');
    const values=[input.campaign,input.key,input.fingerprint,input.decision];
    await db.exec('INSERT INTO keyword_reviews(campaign_id,record_key,fingerprint,decision) VALUES(?,?,?,?) '+(db.driver==='mysql'?'ON DUPLICATE KEY UPDATE fingerprint=VALUES(fingerprint),decision=VALUES(decision)':'ON CONFLICT(campaign_id,record_key) DO UPDATE SET fingerprint=excluded.fingerprint,decision=excluded.decision'),values);
  }
  return {list,change,analyze,review};
}
