import {createHash,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {catalogDateFormat,collectionWindow,scraperDate,windowMode,withinWindow} from './collection-window.mjs';
import {fromTarget,discoveryFor} from './campaigns.mjs';
import {normalize,merge,csv} from './importer.mjs';

const campaign=createHash('sha256').update('clevercatch').digest('hex');
const base='https://api.brightdata.com/datasets/v3';
const validId=id=>typeof id==='string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);

export async function refreshStore(db,enqueue,downloadCsv,directory){
  const largeText=db.driver==='mysql'?'LONGTEXT':'TEXT';
  await db.exec('CREATE TABLE IF NOT EXISTS snapshot_runs (source VARCHAR(128) PRIMARY KEY, current_id VARCHAR(128), pending_id VARCHAR(128), phase VARCHAR(32))');
  await db.exec('CREATE TABLE IF NOT EXISTS snapshot_files (filename VARCHAR(160) PRIMARY KEY, csv_text '+largeText+' NOT NULL)');
  await db.exec('CREATE TABLE IF NOT EXISTS record_sources (campaign_id VARCHAR(64), record_key VARCHAR(64), source VARCHAR(255), payload '+largeText+' NOT NULL, PRIMARY KEY(campaign_id,record_key,source))');
  await db.exec('CREATE TABLE IF NOT EXISTS snapshot_attempts (source VARCHAR(128) PRIMARY KEY, submitted_at VARCHAR(32) NOT NULL)');
  await db.exec('CREATE TABLE IF NOT EXISTS first_snapshot_inputs (source VARCHAR(128) PRIMARY KEY,dataset VARCHAR(128) NOT NULL,signature VARCHAR(64) NOT NULL)');
  await db.exec('CREATE TABLE IF NOT EXISTS collection_requests (source VARCHAR(128) PRIMARY KEY, period VARCHAR(8) NOT NULL, starts_at VARCHAR(32), ends_at VARCHAR(32) NOT NULL)');
  await db.exec('CREATE TABLE IF NOT EXISTS collected_snapshots (snapshot_id VARCHAR(128) PRIMARY KEY, period VARCHAR(8) NOT NULL, starts_at VARCHAR(32), ends_at VARCHAR(32), completed_at VARCHAR(32) NOT NULL)');
  function asWindow(row){
    return {period:row?.period||'all',start:row?.starts_at||null,end:row?.ends_at||null};
  }
  async function savedWindow(id){
    return asWindow((await db.all('SELECT * FROM collected_snapshots WHERE snapshot_id=?',[id]))[0]);
  }
  const busy=new Map();
  const tx=async fn=>{
    await db.begin();
    try{const result=await fn();await db.commit();return result;}
    catch(error){await db.rollback();throw error;}
  };
  await db.exec('CREATE TABLE IF NOT EXISTS campaign_identity (campaign_id VARCHAR(64) PRIMARY KEY, payload TEXT NOT NULL)');
  async function keepFacebookIdentity(campaignId,records){
    const group=directory.campaigns.get(campaignId);
    const pages=records.filter(r=>r.platform==='Facebook' && r.type!=='comment' &&
      (!group?.edited||(group.targets.Facebook&&fromTarget(r,{platform:'Facebook',url:group.targets.Facebook}))));
    if(!pages.length)return;
    const [saved]=await db.all('SELECT payload FROM campaign_identity WHERE campaign_id=?',[campaignId]);
    const identity=saved?JSON.parse(saved.payload):{};
    const before=JSON.stringify(identity);
    const clean=value=>typeof value==='string' && !/^(null|undefined|n\/a|—|-)$/i.test(value.trim())?value.trim():'';
    for(const record of pages.slice().sort((a,b)=>(b.collected_at||'').localeCompare(a.collected_at||''))){
      const raw=record.raw||{};
      const profile=record.type==='profile';
      const url=clean(raw.page_url)||clean(raw.user_url)||(profile?clean(record.url):'');
      const pageId=clean(raw.profile_id)||clean(raw.page_id);
      const handle=clean(raw.profile_handle)||clean(raw.page_username)||(profile?clean(raw.username):'');
      const name=clean(raw.page_name)||(profile?clean(record.name):'');
      if(!name && !handle && !pageId && !url)continue;
      if(identity.pageId && pageId && identity.pageId!==pageId)continue;
      if(!(identity.pageId && pageId) && identity.url && url && identity.url.replace(/\/$/,'')!==url.replace(/\/$/,''))continue;
      const about=clean(raw.about);
      const description=clean(raw.page_intro)||clean(raw.biography)||(about && !/^[{\[]/.test(about)?about:'')||(profile?clean(raw.description):'');
      const fields={pageId,name,handle,description,url,website:clean(raw.page_external_website)||clean(raw.website)||clean(raw.external_url)};
      const dates=identity.field_dates||={};
      for(const [key,value] of Object.entries(fields)){
        if(value&&(!identity[key]||(record.collected_at&&record.collected_at>(dates[key]||'')))){
          identity[key]=value;
          dates[key]=record.collected_at||'';
        }
      }
    }
    if(before===JSON.stringify(identity))return;
    if(saved)await db.exec('UPDATE campaign_identity SET payload=? WHERE campaign_id=?',[JSON.stringify(identity),campaignId]);
    else await db.exec('INSERT INTO campaign_identity(campaign_id,payload) VALUES(?,?)',[campaignId,JSON.stringify(identity)]);
  }
  // Populate campaign cards on upgrade using existing imported Facebook observations.
  const unlinked=await db.all("SELECT DISTINCT r.campaign_id FROM records r LEFT JOIN campaign_identity i ON i.campaign_id=r.campaign_id WHERE i.campaign_id IS NULL AND r.platform='Facebook' AND r.record_type IN ('profile','content')");
  for(const {campaign_id} of unlinked){
    const rows=await db.all("SELECT payload FROM records WHERE campaign_id=? AND platform='Facebook' AND record_type IN ('profile','content') ORDER BY CASE WHEN record_type='profile' THEN 0 ELSE 1 END,collected_at DESC,record_key",[campaign_id]);
    await keepFacebookIdentity(campaign_id,rows.map(row=>JSON.parse(row.payload)));
  }
  async function remember(c,key,source,payload){
    await db.exec('DELETE FROM record_sources WHERE campaign_id=? AND record_key=? AND source=?',[c,key,source]);
    await db.exec('INSERT INTO record_sources(campaign_id,record_key,source,payload) VALUES(?,?,?,?)',[c,key,source,payload]);
  }
  async function track(c,record,filename){
    const source=filename.match(/^((?:sd_|acct_)[a-z0-9_-]+)\s*(?:\(\d+\))?\.csv$/i)?.[1];
    if(directory.owners.get(source)?.id===c)filename=source+'.csv';
    const prior=await db.all('SELECT payload FROM records WHERE campaign_id=? AND record_key=?',[c,record.key]);
    if(prior.length && !(await db.all('SELECT source FROM record_sources WHERE campaign_id=? AND record_key=?',[c,record.key])).length)
      await remember(c,record.key,'@legacy',prior[0].payload);
    const [existing]=await db.all('SELECT payload FROM record_sources WHERE campaign_id=? AND record_key=? AND source=?',[c,record.key,filename]);
    await remember(c,record.key,filename,JSON.stringify(existing?merge(JSON.parse(existing.payload),record):record));
  }
  // Older installations stored import totals but did not record per-file ownership.
  // Recover only unique, byte-matching records from the original campaign exports.
  async function recoverOriginalImports(){
    const records=await db.all('SELECT r.record_key,r.payload FROM records r WHERE r.campaign_id=? AND NOT EXISTS (SELECT 1 FROM record_sources s WHERE s.campaign_id=r.campaign_id AND s.record_key=r.record_key)',[campaign]);
    if(!records.length)return;
    const originals=JSON.parse(await readFile(new URL('./original-imports.json',import.meta.url),'utf8'));
    const logs=(await db.all('SELECT payload FROM imports WHERE campaign_id=?',[campaign])).map(row=>JSON.parse(row.payload));
    const owners=new Map();
    for(const log of logs){
      const spec=originals[log.filename];
      if(!spec || spec.rows!==log.rows || spec.accepted!==log.accepted)return;
      for(const [key,signature] of Object.entries(spec.signatures)){
        if(!owners.has(key))owners.set(key,new Map());
        owners.get(key).set(log.filename,signature);
      }
    }
    await tx(async()=>{
      for(const row of records){
        const sources=owners.get(row.record_key);
        if(!sources)continue;
        const signature=createHash('sha256').update(row.payload).digest('base64');
        if([...sources.values()].every(value=>value===signature)){
          for(const name of sources.keys())await remember(campaign,row.record_key,name,row.payload);
        }
      }
    });
  }
  await recoverOriginalImports();
  // Coalesce browser download suffixes on existing, explicitly mapped exports.
  for(const {source,id} of directory.owners.values()){
    const rows=await db.all('SELECT DISTINCT source FROM record_sources WHERE campaign_id=? AND source LIKE ?',[id,source+'%']);
    for(const row of rows){
      if(row.source===source+'.csv'||row.source.replace(/\s*\(\d+\)(?=\.csv$)/i,'')!==source+'.csv')continue;
      await tx(async()=>{
        for(const r of await db.all('SELECT record_key,payload FROM record_sources WHERE campaign_id=? AND source=?',[id,row.source])){
          const [prior]=await db.all('SELECT payload FROM record_sources WHERE campaign_id=? AND record_key=? AND source=?',[id,r.record_key,source+'.csv']);
          const payload=prior?JSON.stringify(merge(JSON.parse(prior.payload),JSON.parse(r.payload))):r.payload;
          await remember(id,r.record_key,source+'.csv',payload);
        }
        await db.exec('DELETE FROM record_sources WHERE campaign_id=? AND source=?',[id,row.source]);
      });
    }
  }
  await db.exec('CREATE TABLE IF NOT EXISTS snapshot_aliases (snapshot_id VARCHAR(128) PRIMARY KEY, source VARCHAR(128) NOT NULL)');
  async function ownerOfFile(filename){
    const id=filename.match(/^((?:sd_|acct_)[a-z0-9_-]+)\s*(?:\(\d+\))?\.csv$/i)?.[1];
    if(!id)return null;
    const [alias]=await db.all('SELECT source FROM snapshot_aliases WHERE snapshot_id=? UNION SELECT source FROM snapshot_runs WHERE pending_id=? OR current_id=?',[id,id,id]);
    const source=alias?.source||id;
    const active=directory.owners.get(source);
    if(!active&&(await db.all('SELECT source FROM disconnected_sources WHERE source=?',[source])).length)
      throw Error('This snapshot belongs to a disconnected account. Reconnect that account before importing its snapshot.');
    return active;
  }
  async function applyImport(campaign,parsed){
    await keepFacebookIdentity(campaign,parsed.records);
    const source=parsed.owner?parsed.owner.source+'.csv':parsed.filename;
    for(const record of parsed.records){
      await track(campaign,record,source);
      const [old]=await db.all('SELECT payload FROM records WHERE campaign_id=? AND record_key=?',[campaign,record.key]);
      await db.upsert(campaign,old?merge(JSON.parse(old.payload),record):record);
    }
  }
  async function state(source){
    return (await db.all('SELECT current_id,pending_id,phase FROM snapshot_runs WHERE source=?',[source]))[0] || {current_id:directory.owners.get(source)?.url?null:source,phase:'idle'};
  }
  async function remote(path,method='GET',format='json',input){
    const response=await fetch(base+path,{method,headers:{Authorization:'Bearer '+process.env.BRIGHT_DATA_API_KEY.trim(),...(input?{'Content-Type':'application/json'}:{})},...(input?{body:JSON.stringify(input)}:{}),redirect:'error',signal:AbortSignal.timeout(method==='POST'?90000:20000)});
    if(!response.ok){
      const error=new Error('Bright Data returned HTTP '+response.status+(response.status===400?' (the saved inputs may have expired).':'.'));
      error.rejected=response.status>=400 && response.status<500 && response.status!==408;
      throw error;
    }
    return format==='csv'?response.text():response.json();
  }
  async function inputSignature(id){
    const rows=csv(await remote('/snapshot/'+id+'/input','GET','csv'));
    if(!rows.length || !rows.some(row=>Object.values(row).some(value=>value.trim())))throw Error('Bright Data returned empty snapshot inputs.');
    return signature(rows);
  }
  function signature(rows){
    const lines=rows.map(row=>JSON.stringify(Object.keys(row).filter(k=>row[k]!==''&&row[k]!=null).sort().map(k=>[k,typeof row[k]==='object'?JSON.stringify(row[k]):String(row[k])]))).sort();
    return createHash('sha256').update(JSON.stringify(lines)).digest('hex');
  }
  async function findRuns(source,run){
    const [first]=await db.all('SELECT dataset,signature FROM first_snapshot_inputs WHERE source=?',[source]);
    const dataset=first?.dataset||(run.current_id?(await remote('/progress/'+run.current_id)).dataset_id:null);
    if(!validId(dataset))throw Error('Bright Data did not identify the scraper. Check status again.');
    const [attempt]=await db.all('SELECT submitted_at FROM snapshot_attempts WHERE source=?',[source]);
    const start=attempt?Date.parse(attempt.submitted_at):null;
    const query=new URLSearchParams({dataset_id:dataset,limit:'100',trigger_type:'ALL'});
    if(start)query.set('from_date',new Date(start-86400000).toISOString().slice(0,10));
    let snapshots=[];
    for(let skip=0;;skip+=100){
      query.set('skip',String(skip));
      const page=await remote('/snapshots?'+query);
      if(!Array.isArray(page))throw Error('Bright Data returned an unreadable snapshot list.');
      snapshots.push(...page);
      if(page.length<100)break;
      if(skip>=4900)throw Error('The snapshot list is too large to identify this request reliably.');
    }
    const baseline=Date.parse(snapshots.find(row=>row.id===run.current_id)?.created);
    const other=await db.all('SELECT current_id,pending_id FROM snapshot_runs WHERE source<>?',[source]);
    const used=new Set([...other.flatMap(r=>[r.current_id,r.pending_id]),...(await db.all('SELECT snapshot_id FROM snapshot_aliases WHERE source<>?',[source])).map(r=>r.snapshot_id)]);
    const candidates=snapshots.filter(row=>{
      if(used.has(row.id))return false;
      const created=Date.parse(row.created);
      if(row.dataset_id!==dataset || !validId(row.id) || !Number.isFinite(created) || row.id===source || row.id===run.current_id)return false;
      if(Number.isFinite(baseline) && created<=baseline)return false;
      return !start || (created>=start-60000 && created<=start+600000);
    });
    const matches=[];
    if(candidates.length){
      const expected=first?.signature||await inputSignature(run.current_id);
      for(const row of candidates){
        if(await inputSignature(row.id)===expected)matches.push({id:row.id,created:row.created,status:row.status});
      }
    }
    matches.sort((a,b)=>Date.parse(b.created)-Date.parse(a.created));
    return {matches,timed:Boolean(start)};
  }
  async function attachRun(source,id){
    await enqueue(()=>db.exec("UPDATE snapshot_runs SET pending_id=?,phase='running' WHERE source=?",[id,source]));
    return {status:'running'};
  }
  async function discover(source,run){
    const {matches,timed}=await findRuns(source,run);
    if(timed && matches.length===1)return attachRun(source,matches[0].id);
    return {status:'unconfirmed',matches};
  }
  async function firstRequest(source,range,previousId){
    const owner=directory.owners.get(source);
    const dataset=owner.dataset||(await remote('/progress/'+(owner.template||previousId||source))).dataset_id;
    if(typeof dataset!=='string'||!/^gd_[a-zA-Z0-9_-]+$/.test(dataset))throw Error('The selected scraper is unavailable.');
    const discovery=owner.discovery||discoveryFor(owner.platform,owner.type);
    let format='MM-DD-YYYY';
    if(range.start&&windowMode(owner.platform,owner.type)==='catalog'){
      const catalog=await remote('/scrapers?'+new URLSearchParams({dataset_id:dataset}));
      format=catalogDateFormat(catalog,dataset,discovery?'discover_by_'+discovery:'collect_by_url');
    }
    let input;
    if(owner.type==='Comments'){
      const rows=await db.all("SELECT r.payload,s.source FROM records r LEFT JOIN record_sources s ON r.campaign_id=s.campaign_id AND r.record_key=s.record_key WHERE r.campaign_id=? AND r.platform=? AND r.record_type='content'",[owner.id,owner.platform]);
      const urls=new Set();
      for(const row of rows){
        const record=JSON.parse(row.payload);
        if(!withinWindow(record.published_at,range)||!record.url)continue;
        const origin=directory.owners.get(row.source?.replace(/\.csv$/i,''));
        const url=owner.url||owner.accountUrl;
        if(!url||(origin?.id===owner.id&&(origin.url||origin.accountUrl)===url)||fromTarget(record,{...owner,url}))urls.add(record.url);
      }
      input=[...urls].map(url=>({url}));
      if(!input.length)throw Error('No eligible uploads for this account and window. Import posts, reels or videos first, or choose a wider window. No request was sent.');
    }else if(owner.url){
      input=[{url:owner.url+(owner.platform==='YouTube'&&owner.type==='Videos'?'/videos':'')}];
    }else{
      const rows=csv(await remote('/snapshot/'+(previousId||source)+'/input','GET','csv'));
      input=rows.map(row=>{
        const item={...row};
        for(const [key,value] of Object.entries(item)){
          if(value==='')delete item[key];
          else if(key==='num_of_posts')item[key]=Number(value);
          else if(key==='include_profile_data')item[key]=value==='true';
          else if(key==='posts_to_not_include')item[key]=JSON.parse(value);
        }
        return item;
      });
      if(!input.length||input.some(r=>!r.url))throw Error('The saved account URL is unavailable. No request was sent.');
    }
    if(range.start&&owner.type!=='Comments'){
      for(const row of input)Object.assign(row,{start_date:scraperDate(range.start,format),end_date:scraperDate(range.end,format)});
    }
    const params=new URLSearchParams({dataset_id:dataset,include_errors:'true'});
    if(discovery){params.set('type','discover_new');params.set('discover_by',discovery);}
    return {path:'/trigger?'+params,input,dataset};
  }
  async function update(source,platform,action,period){
    if(!process.env.BRIGHT_DATA_API_KEY?.trim())throw Error('Configure the Bright Data API key first.');
    let run=await state(source);
    if(run.phase==='submitting' && !run.pending_id)return discover(source,run);
    if(action==='start' && !run.pending_id){
      const owner=directory.owners.get(source);
      const range=collectionWindow(platform,owner.type,period);
      const previous=await savedWindow(run.current_id);
      const trigger=range.start||!run.current_id||(owner.url&&(owner.type==='Comments'||previous.start));
      const first=trigger?await firstRequest(source,range,run.current_id):null;
      const rerunId=previous.start?source:run.current_id;
      const recoveryInput=first?{dataset:first.dataset,signature:signature(first.input)}:
        rerunId!==run.current_id?{dataset:(await remote('/progress/'+rerunId)).dataset_id,signature:await inputSignature(rerunId)}:null;
      await enqueue(()=>tx(async()=>{
        if(!directory.owners.has(source))throw Error('This account was disconnected. Reopen Request Latest Data.');
        await db.exec('DELETE FROM collection_requests WHERE source=?',[source]);
        await db.exec('INSERT INTO collection_requests VALUES(?,?,?,?)',[source,range.period,range.start,range.end]);
        await db.exec('DELETE FROM first_snapshot_inputs WHERE source=?',[source]);
        if(recoveryInput){
          await db.exec('INSERT INTO first_snapshot_inputs VALUES(?,?,?)',[source,recoveryInput.dataset,recoveryInput.signature]);
        }
        await db.exec('DELETE FROM snapshot_attempts WHERE source=?',[source]);
        await db.exec('INSERT INTO snapshot_attempts(source,submitted_at) VALUES(?,?)',[source,new Date().toISOString()]);
        await db.exec('DELETE FROM snapshot_runs WHERE source=?',[source]);
        await db.exec('INSERT INTO snapshot_runs(source,current_id,phase) VALUES(?,?,?)',[source,run.current_id,'submitting']);
      }));
      let fresh;
      try{
        fresh=(first?await remote(first.path,'POST','json',{input:first.input}):await remote('/snapshot/'+rerunId+'/rerun','POST')).snapshot_id;
        if(!validId(fresh))throw Error('No valid run ID returned.');
      }catch(error){
        if(!error.rejected)return discover(source,run);
        await enqueue(()=>db.exec("UPDATE snapshot_runs SET phase='failed' WHERE source=?",[source]));
        throw error;
      }
      await enqueue(()=>db.exec("UPDATE snapshot_runs SET pending_id=?, phase='running' WHERE source=?",[fresh,source]));
      return {status:'running'};
    }
    if(!run.pending_id)return {status:run.phase==='idle'&&!run.current_id?'not_started':run.phase};
    if(run.phase==='ready')return {status:'ready',snapshot_id:run.pending_id};
    const {status}=await remote('/progress/'+run.pending_id);
    if(['failed','canceled','cancelled'].includes(status)){
      await enqueue(()=>db.exec('UPDATE snapshot_runs SET phase=?, pending_id=NULL WHERE source=?',[status,source]));
      return {status};
    }
    if(status!=='ready')return {status:'running',provider_status:status};
    const content=await downloadCsv(run.pending_id);
    const [request]=await db.all('SELECT * FROM collection_requests WHERE source=?',[source]);
    const range=asWindow(request);
    try{
      const parsed=normalize(content,{allowEmpty:true});
      if((!parsed.records.length && parsed.errors.length)||parsed.records.some(r=>r.platform!==platform))
        throw Error('No usable export for this platform.');
    }catch(error){
      await enqueue(()=>db.exec("UPDATE snapshot_runs SET phase='failed',pending_id=NULL WHERE source=?",[source]));
      throw Error(error.message+' Previous data was kept.');
    }
    await enqueue(()=>tx(async()=>{
      await db.exec('INSERT INTO collected_snapshots VALUES(?,?,?,?,?)',[run.pending_id,range.period,range.start,range.end,new Date().toISOString()]);
      await db.exec('DELETE FROM snapshot_files WHERE filename=?',[source+'.pending']);
      await db.exec('INSERT INTO snapshot_files VALUES(?,?)',[source+'.pending',content]);
      await db.exec("UPDATE snapshot_runs SET phase='ready' WHERE source=?",[source]);
    }));
    return {status:'ready',snapshot_id:run.pending_id};
  }
  const generations=new Map();
  const generation=source=>generations.get(source)||0;
  async function rebuildRecords(campaign,affected){
    for(const key of affected){
      const rows=await db.all('SELECT payload FROM record_sources WHERE campaign_id=? AND record_key=? ORDER BY source',[campaign,key]);
      if(rows.length)await db.upsert(campaign,rows.map(row=>JSON.parse(row.payload)).sort((a,b)=>(a.collected_at||'').localeCompare(b.collected_at||'')).reduce(merge));
      else {
        await db.exec('DELETE FROM keyword_reviews WHERE campaign_id=? AND record_key=?',[campaign,key]);
        await db.exec('DELETE FROM records WHERE campaign_id=? AND record_key=?',[campaign,key]);
      }
    }
  }
  function clearCollection(source){
    const campaign=directory.owners.get(source).id;
    if(busy.has(source))throw Error('This collection is updating. Try again after it finishes.');
    const filename=source+'.csv';
    const work=enqueue(async()=>{
      const count=await tx(async()=>{
        const run=await state(source);
        if(run.pending_id || run.phase==='submitting')throw Error('Check the current request before clearing this collection.');
        const rows=await db.all('SELECT record_key FROM record_sources WHERE campaign_id=? AND source=?',[campaign,filename]);
        await db.exec('DELETE FROM record_sources WHERE campaign_id=? AND source=?',[campaign,filename]);
        await rebuildRecords(campaign,rows.map(row=>row.record_key));
        await db.exec('DELETE FROM snapshot_files WHERE filename=?',[filename]);
        return rows.length;
      });
      generations.set(source,generation(source)+1);
      return {status:'cleared',count};
    }).finally(()=>busy.delete(source));
    busy.set(source,work);
    return work;
  }
  async function deleteCampaigns(ids,invalidatePreviews){
    return enqueue(async()=>{
      const sources=[...directory.owners.values()].filter(c=>ids.includes(c.id)).map(c=>c.source);
      await tx(async()=>{
        for(const source of sources){
          const run=await state(source);
          if(busy.has(source)||run.pending_id||run.phase==='submitting')throw Error('Finish the pending request for the selected campaign first.');
        }
        for(const id of ids){
          for(const table of ['campaign_identity','record_sources','records','imports'])await db.exec('DELETE FROM '+table+' WHERE campaign_id=?',[id]);
          await db.exec('DELETE FROM campaigns WHERE id=?',[id]);
        }
        for(const source of sources)await db.exec('DELETE FROM snapshot_files WHERE filename=?',[source+'.csv']);
      });
      for(const source of sources)generations.set(source,generation(source)+1);
      invalidatePreviews();
    });
  }
  function saveSnapshot(source,snapshotId,csv,parsed,reviewId){
    const {id:campaign,name}=directory.owners.get(source);
    const filename=source+'.csv';
    return enqueue(()=>tx(async()=>{
      const run=await state(source);
      if(reviewId){
        if(parsed.snapshot.generation!==generation(source))throw Error('This collection was cleared. Review the latest data again.');
        const prior=await db.all('SELECT id FROM imports WHERE id=?',[reviewId]);
        if(prior.length)return {status:'imported',campaign,accepted:parsed.records.length,rejected:parsed.errors.length};
        if((run.pending_id?run.phase!=='ready'||run.pending_id!==snapshotId:run.current_id!==snapshotId) || run.phase==='submitting')
          throw Error('A newer collection is available or in progress. Review the latest data again.');
      }
      await db.upsertCampaign(campaign,name);
      await keepFacebookIdentity(campaign,parsed.records);
      for(const r of parsed.records)await track(campaign,r,filename);
      await rebuildRecords(campaign,new Set(parsed.records.map(r=>r.key)));
      await db.exec('DELETE FROM snapshot_files WHERE filename=?',[filename]);
      await db.exec('INSERT INTO snapshot_files(filename,csv_text) VALUES(?,?)',[filename,csv]);
      const log={id:reviewId||randomUUID(),campaign,filename,snapshot_id:snapshotId,rows:parsed.rows,accepted:parsed.records.length,duplicates:parsed.duplicates,errors:parsed.errors,platforms:parsed.platforms,types:parsed.types};
      await db.exec('INSERT INTO imports(id,campaign_id,created_at,payload) VALUES(?,?,?,?)',[log.id,campaign,new Date().toISOString(),JSON.stringify(log)]);
      const [alias]=await db.all('SELECT source FROM snapshot_aliases WHERE snapshot_id=?',[snapshotId]);
      if(alias&&alias.source!==source)throw Error('The returned snapshot already belongs to a different collection.');
      if(!alias)await db.exec('INSERT INTO snapshot_aliases VALUES(?,?)',[snapshotId,source]);
      await db.exec('DELETE FROM snapshot_files WHERE filename=?',[source+'.pending']);
      if(run.pending_id)await db.exec("UPDATE snapshot_runs SET current_id=?,pending_id=NULL,phase='imported' WHERE source=?",[snapshotId,source]);
      return {status:'imported',campaign,accepted:parsed.records.length,rejected:parsed.errors.length};
    }));
  }
  function refresh(source,platform,action,period){
    if(!busy.has(source))busy.set(source,update(source,platform,action,period).finally(()=>busy.delete(source)));
    return busy.get(source);
  }
  async function recover(source,decision){
    if(busy.has(source))throw Error('A request is in progress. Check its status again shortly.');
    async function resolveSubmission(){
      const run=await state(source);
      if(run.phase!=='submitting' || run.pending_id)throw Error('This submission has already changed. Check its status again.');
      const {matches}=await findRuns(source,run);
      if(decision.action==='clear' && decision.confirmed===true){
        if(matches.length)throw Error('A matching run is visible. Check status to review it.');
        await enqueue(()=>db.exec("UPDATE snapshot_runs SET phase='idle' WHERE source=?",[source]));
        return {status:'idle'};
      }
      if(decision.action!=='attach' || !matches.some(row=>row.id===decision.snapshot_id))
        throw Error('The selected run is no longer in the matching list. Check status again.');
      return attachRun(source,decision.snapshot_id);
    }
    const work=resolveSubmission().finally(()=>busy.delete(source));
    busy.set(source,work);
    return work;
  }
  async function checkEditable(sources){
    for(const source of sources){
      const run=await state(source);
      if(busy.has(source)||run.pending_id||run.phase==='submitting')throw Error('Finish the pending collection for this account before changing its connection.');
    }
  }
  return {checkEditable,state,savedWindow,ownerOfFile,applyImport,track,keepFacebookIdentity,refresh,recover,saveSnapshot,clearCollection,generation,deleteCampaigns};
}
