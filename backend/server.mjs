import {campaignId,campaignName,campaignAccounts,sourceDirectory,normalizeTargets,registerTargets,setCampaignAccounts,seededAccounts,supportedCollections} from './campaigns.mjs';
import {signalStore} from './signals.mjs';
import {activityStore} from './activity.mjs';
import {trendSummary} from './trends.mjs';
import {accountStore} from './accounts.mjs';
import {keywordStore} from './keywords.mjs';
import {windowMode,withinWindow} from './collection-window.mjs';
import {refreshStore} from './refresh.mjs';
import http from 'node:http';import express from 'express';import {readFile} from 'node:fs/promises';import {resolve,extname,relative,isAbsolute,sep} from 'node:path';import {fileURLToPath} from 'node:url';import {randomUUID,createHash} from 'node:crypto';import {normalize,merge} from './importer.mjs';import {database} from './database.mjs';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));const root=resolve('TrendingSaNCR_UPDATE'),db=await database(),previews=new Map();let queue=Promise.resolve();
const json=async(res,status,obj)=>{
 if(res.locals?.finishActivity){
   const finish=res.locals.finishActivity;
   delete res.locals.finishActivity;
   await finish(status,obj);
 }
 res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));};
async function body(req,limit=30*1024*1024){
  const chunks=[];
  let bytes=0;
  for await(const chunk of req){
    bytes+=chunk.length;
    if(bytes>limit)throw Error('Request exceeds the upload size limit.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
}
export function filterDate(r,window,asOf){if(r.type==='profile'||window==='all')return true;const end=Date.parse(asOf),d=Date.parse(r.published_at);return Number.isFinite(d)&&d<=end&&d>end-Number(window)*86400000;}
async function checkSnapshot(req, res, id) {
  if (req.method !== 'GET') return json(res,405,{error:'Use GET to check status.'});
  if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return json(res,400,{error:'Enter a valid snapshot ID.'});
  const key = process.env.BRIGHT_DATA_API_KEY?.trim();
  if (!key) return json(res,503,{error:'Add BRIGHT_DATA_API_KEY to the server environment and restart Node.'});
  try {
    const response = await fetch('https://api.brightdata.com/datasets/v3/progress/' + id, {
      headers: {Authorization:'Bearer ' + key},
      redirect:'error',
      signal:AbortSignal.timeout(12000)
    });
    if (!response.ok) {
      const messages = {
        401:'Bright Data rejected the API key.',
        403:'The configured key cannot access this snapshot.',
        404:'Bright Data could not find that snapshot.',
        429:'Bright Data is receiving too many requests. Try again shortly.'
      };
      return json(res, response.status, {error:messages[response.status] || 'Bright Data could not check this snapshot.'});
    }
    const {status} = await response.json();
    if (!['starting','running','ready','failed','canceled'].includes(status)) {
      return json(res,502,{error:'Bright Data returned an unrecognized status.'});
    }
    return json(res,200,{status,snapshot_id:id});
  } catch {
    return json(res,502,{error:'Could not reach Bright Data. Try checking again.'});
  }
}
async function previewCsv(d,res,snapshot=null){if(typeof d.csv!=='string'||!d.campaign?.trim())throw Error('CSV and campaign name required');const name=campaignName(d.campaign);
 const scopedId=await resolveName(name);
 const owner=await store.ownerOfFile(String(d.filename||''));
 if(owner&&owner.id!==scopedId)throw Error('This snapshot belongs to '+owner.name+'. Choose that campaign to import it.');
 const parsed=normalize(d.csv,{allowEmpty:Boolean(snapshot)}),id=randomUUID();
 const beforeWindow=parsed.records.length;
 if(snapshot?.range.start){
   parsed.records=parsed.records.filter(r=>r.type==='profile'||withinWindow(r.published_at,snapshot.range));
 }
 if((owner||snapshot) && parsed.records.some(r=>r.platform!==(owner||snapshot).platform))throw Error('The collected data belongs to a different platform.');if(previews.size>=20)previews.delete(previews.keys().next().value);previews.set(id,{...parsed,canConfirmEmpty:Boolean(snapshot&&(beforeWindow||!parsed.rows)),snapshot,owner,campaign:name,campaignId:scopedId,filename:String(d.filename||'import.csv').slice(0,255),expires:Date.now()+15*60*1000});return json(res,200,{id,...(snapshot?{snapshot_id:snapshot.id,period:snapshot.range.period,outside_window:beforeWindow-parsed.records.length,can_confirm:Boolean(beforeWindow||!parsed.rows)}:{}),rows:parsed.rows,accepted:parsed.records.length,duplicates:parsed.duplicates,platforms:parsed.platforms,types:parsed.types,errors:parsed.errors,date_range:parsed.records.map(r=>r.published_at).filter(Boolean).sort().filter((x,i,a)=>i===0||i===a.length-1)});}
const snapshots = JSON.parse(await readFile(new URL('./snapshots.json',import.meta.url),'utf8'));
async function downloadCsv(id) {
  const key = process.env.BRIGHT_DATA_API_KEY?.trim();
  if (!key) throw Error('Configure the server Bright Data API key.');
  const response = await fetch('https://api.brightdata.com/datasets/v3/snapshot/'+id+'?format=csv',{
    headers:{Authorization:'Bearer '+key},redirect:'error',signal:AbortSignal.timeout(45000)
  });
  if (!response.ok || response.status===202) {
    throw Error('Snapshot download unavailable. Check its status and account access.');
  }
  const chunks=[];
  let size=0;
  for await (const chunk of response.body) {
    size+=chunk.length;
    if (size>20*1024*1024) throw Error('Snapshot exceeds 20 MB. Use smaller CSV exports.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
function enqueue(work){
  const run=queue.then(work);
  queue=run.catch(()=>{});
  return run;
}
const directory=sourceDirectory(snapshots);
await db.exec('CREATE TABLE IF NOT EXISTS campaign_targets (id VARCHAR(64) PRIMARY KEY,name VARCHAR(255) NOT NULL,payload TEXT NOT NULL)');
await db.exec('CREATE TABLE IF NOT EXISTS disconnected_sources (source VARCHAR(128) PRIMARY KEY, campaign_id VARCHAR(64) NOT NULL)');
for(const row of await db.all('SELECT id,name,payload FROM campaign_targets')){
  const config=JSON.parse(row.payload);
  if(config.version===1)setCampaignAccounts(directory,row.id,row.name,config.accounts);
  else registerTargets(directory,row.name,config,row.id);
}
async function resolveName(name){
  const [saved]=await db.all('SELECT id FROM campaigns WHERE LOWER(name)=LOWER(?)',[name]);
  if(saved)return saved.id;
  for(const group of directory.campaigns.values())if(group.name.toLowerCase()===name.toLowerCase())return group.id;
  let id=campaignId(name);
  while(directory.campaigns.has(id)||(await db.all('SELECT id FROM campaigns WHERE id=?',[id])).length)id=createHash('sha256').update(id+'|'+name.toLowerCase()).digest('hex');
  return id;
}
async function editableCampaign(id){
  const [row]=await db.all('SELECT id,name FROM campaigns WHERE id=?',[id]);
  if(!row)throw Object.assign(Error('This campaign is no longer available.'),{httpStatus:404});
  const group=directory.campaigns.get(id);
  let accounts=group?.edited?group.targets:{...seededAccounts(directory,id),...group?.targets};
  if(!group?.edited){
    const known=Object.keys(accounts);
    const missing=known.length?' AND platform NOT IN ('+known.map(()=>'?').join(',')+')':'';
    const records=await db.all("SELECT payload FROM records WHERE campaign_id=?"+missing+" AND record_type IN ('profile','content') ORDER BY CASE WHEN record_type='profile' THEN 0 ELSE 1 END,collected_at DESC",[id,...known]);
    for(const {payload} of records){
      const r=JSON.parse(payload),p=r.platform;
      if(accounts[p])continue;
      const raw=r.raw||{},candidates=[r.type==='profile'?r.url:null,raw.page_url,raw.profile_url,raw.channel_url,raw.company_url,raw.user_profile_url];
      for(const url of candidates.filter(Boolean)){
        try{accounts[p]=normalizeTargets({[p]:url})[p];break;}catch{}
      }
    }
  }
  const revision=createHash('sha256').update(JSON.stringify([row.name,Object.entries(accounts).sort()])).digest('hex');
  return {...row,accounts,revision};
}
const store=await refreshStore(db,enqueue,downloadCsv,directory);
const accounts=await accountStore(db), keywords=await keywordStore(db);
const signals=await signalStore(db),activity=await activityStore(db,enqueue);
const app=express();app.disable('x-powered-by');app.use(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost'),pathName=u.pathname,method=req.method;
 if(pathName.startsWith('/api/')){
   if(method!=='GET'){
     if(req.headers.origin && (!['https:','http:'].includes(new URL(req.headers.origin).protocol)||new URL(req.headers.origin).host!==req.headers.host))return json(res,403,{error:'Origin rejected'});
     if(req.headers['content-type']?.split(';')[0]!=='application/json')return json(res,415,{error:'Use application/json.'});
   }
   if(pathName==='/api/login'&&method==='POST')return json(res,200,await accounts.login(req,res,await body(req,4096)));
   if(pathName==='/api/logout'&&method==='POST'){accounts.logout(req,res);return json(res,200,{ok:true});}
   const account=await accounts.current(req);
   if(pathName==='/api/session'&&method==='GET')return json(res,200,account||{role:'Guest'});
   const accountPath=/^\/api\/accounts(?:\/([a-z0-9-]+))?$/.exec(pathName);
   const rulePath=/^\/api\/keywords(?:\/([a-z0-9-]+))?$/.exec(pathName);
   const requireRole=(user)=>{
     if((accountPath||/^\/api\/campaigns\/[a-f0-9]{64}$/.test(pathName)) && user?.role!=='Administrator')throw Object.assign(Error('Administrator access required.'),{httpStatus:user?403:401});
     if((method!=='GET'||pathName.startsWith('/api/brightdata/'))&&!['Administrator','Analyst'].includes(user?.role))throw Object.assign(Error('Sign in as an administrator or analyst.'),{httpStatus:user?403:401});
   };
   requireRole(account);
   res.locals.account=account;
   if(pathName==='/api/activity'&&method==='GET'){
     if(!['Administrator','Analyst'].includes(account?.role))return json(res,403,{error:'Sign in to view processing activity.'});
     return json(res,200,await activity.list(account));
   }
   if(pathName==='/api/signals/review'&&method==='POST'){
     const data=await body(req,4096);
     if(!['1','7','30','all'].includes(data.window))throw Error('Invalid review window.');
     await enqueue(async()=>{
       requireRole(await accounts.current(req));
       const rows=await db.all("SELECT payload FROM records WHERE campaign_id=? AND platform=? AND record_type='comment'",[data.campaign,data.platform]);
       const now=new Date().toISOString();
       const eligible=rows.map(row=>({...JSON.parse(row.payload),campaign_id:data.campaign})).filter(r=>filterDate(r,data.window,now));
       await signals.review(data,eligible);
     });
     return json(res,200,{ok:true});
   }
   if(accountPath||rulePath){
     const resource=accountPath?accounts:keywords,id=(accountPath||rulePath)[1];
     if(method==='GET'&&!id)return json(res,200,await resource.list());
     if((method==='POST'&&!id)||(id&&['PUT','DELETE'].includes(method))){
       const data=method==='DELETE'?null:await body(req,8192);
       if(rulePath){
         const old=id?(await keywords.list()).find(r=>r.id===id):null;
         res.locals.finishActivity=await activity.start(account,({POST:'Add keyword',PUT:'Edit keyword',DELETE:'Remove keyword'})[method],data?.term||old?.term||'Keywords Library');
       }
       await enqueue(async()=>{requireRole(await accounts.current(req));await resource.change(id,data);});
       return json(res,200,{ok:true});
     }
     return json(res,405,{error:'Method not allowed'});
   }
   if(pathName==='/api/reviews'&&method==='POST'){
     const data=await body(req,4096);
     await enqueue(async()=>{requireRole(await accounts.current(req));await keywords.review(data);});
     return json(res,200,{ok:true});
   }
 }
 if(u.pathname==='/api/brightdata/sources' && req.method==='GET'){
   if(!u.searchParams.has('directory'))return json(res,200,directory.choices(u.searchParams.get('campaign')??campaignId('CleverCatch')));
   const saved=await db.all('SELECT id,name FROM campaigns ORDER BY name');
   const items=new Map([...[...directory.campaigns.values()].filter(c=>Object.keys(c.platforms).length),...saved].map(c=>[c.id,{id:c.id,name:c.name,platforms:directory.choices(c.id),window_modes:Object.fromEntries(Object.entries(directory.choices(c.id)).map(([p,types])=>[p,Object.fromEntries(types.map(t=>[t,windowMode(p,t)]))]))}]));
   return json(res,200,[...items.values()].sort((a,b)=>a.name.localeCompare(b.name)));
 }
 if(['/api/brightdata/saved-status','/api/brightdata/preview','/api/brightdata/rerun','/api/brightdata/continue','/api/brightdata/recover','/api/brightdata/clear-data'].includes(u.pathname)){
   const platform=u.searchParams.get('platform'),type=u.searchParams.get('type');
   const selection=directory.campaigns.get(u.searchParams.get('campaign')??campaignId('CleverCatch'));
   const types=selection&&Object.hasOwn(selection.platforms,platform)&&selection.platforms[platform];
   const id=types && Object.hasOwn(types,type) && types[type];
   if(typeof id!=='string'|| !/^[a-zA-Z0-9_-]{1,128}$/.test(id))return json(res,404,{error:'No configured snapshot for this selection.'});
   const operation=u.pathname.split('/').at(-1);
   const names={'rerun':'Request latest data','continue':'Check collection progress','recover':'Recover collection','preview':'Review collected data','saved-status':'Check snapshot status','clear-data':'Clear collection'};
   if((operation==='saved-status'&&req.method==='GET')||(operation!=='saved-status'&&req.method==='POST'))
     res.locals.finishActivity=await activity.start(res.locals.account,names[operation],selection.name+' > '+platform+' > '+type);
   if(u.pathname.endsWith('/clear-data')){
     if(req.method!=='POST')return json(res,405,{error:'Use POST.'});
     if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))return json(res,403,{error:'Clear data from the local dashboard.'});
     const decision=await body(req);
     if(decision.confirmed!==true)return json(res,400,{error:'Confirm the collection before clearing it.'});
     return json(res,200,await store.clearCollection(id));
   }
   if(u.pathname.endsWith('/recover')){
     if(req.method!=='POST')return json(res,405,{error:'Use POST.'});
     if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))return json(res,403,{error:'Recover a submission from the local dashboard.'});
     return json(res,200,await store.recover(id,await body(req)));
   }
   const run=await store.state(id);
   if(u.pathname.endsWith('/saved-status')){
     if(!run.pending_id&&!run.current_id)return json(res,200,{status:'not_started'});
     return await checkSnapshot(req,res,run.pending_id||run.current_id);
   }
   if(u.pathname.endsWith('/rerun') || u.pathname.endsWith('/continue')){
     if(req.method!=='POST')return json(res,405,{error:'Use POST.'});
     if(u.pathname.endsWith('/rerun') && !['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))
       return json(res,403,{error:'Start paid reruns from the local dashboard.'});
     return json(res,200,await store.refresh(id,platform,u.pathname.endsWith('/rerun')?'start':'continue',u.searchParams.get('window')??'all'));
   }
   if(req.method!=='POST')return json(res,405,{error:'Use POST to preview.'});
   if((run.pending_id&&run.phase!=='ready')||run.phase==='submitting')throw Error('Collection is in progress. Check its status before reviewing the data.');
   const snapshotId=run.pending_id||run.current_id;
   if(!snapshotId)throw Error('Use Pull latest data to collect the first snapshot.');
   const generation=store.generation(id);
   const [saved]=await db.all('SELECT csv_text FROM snapshot_files WHERE filename=?',[id+(run.pending_id?'.pending':'.csv')]);
   const csv=saved?saved.csv_text:await downloadCsv(snapshotId);
   const latest=await store.state(id);
   if((latest.pending_id||latest.current_id)!==snapshotId || latest.phase==='submitting' || generation!==store.generation(id))
     throw Error('This collection changed. Review the latest data again.');
   const range=await store.savedWindow(snapshotId);
   return await previewCsv({csv,filename:id+'.csv',campaign:selection.name},res,{source:id,id:snapshotId,platform,csv,generation,range});
 }
 if(u.pathname==='/api/brightdata/status')return await checkSnapshot(req,res,u.searchParams.get('id'));
 if(u.pathname==='/api/health')return json(res,200,{status:'connected',database:db.driver});
 const edit=/^\/api\/campaigns\/([a-f0-9]{64})$/.exec(u.pathname);
 if(edit){
   const id=edit[1];
   if(req.method==='GET')return json(res,200,await editableCampaign(id));
   if(req.method!=='PUT')return json(res,405,{error:'Use PUT to edit a campaign.'});
   const input=await body(req,24000),name=campaignName(input.name);
   if(!input.accounts||typeof input.accounts!=='object'||Array.isArray(input.accounts))throw Error('Expected social account fields.');
   const targets=normalizeTargets(input.accounts);
   await enqueue(async()=>{
     if((await accounts.current(req))?.role!=='Administrator')throw Object.assign(Error('Administrator access required.'),{httpStatus:403});
     const current=await editableCampaign(id);
     if(input.revision!==current.revision)throw Object.assign(Error('This campaign changed. Close and reopen Edit to use the latest details.'),{httpStatus:409});
     if((await db.all('SELECT id FROM campaigns WHERE LOWER(name)=LOWER(?) AND id<>?',[name,id])).length||
        [...directory.campaigns.values()].some(c=>c.id!==id&&c.name.toLowerCase()===name.toLowerCase()))
       throw Object.assign(Error('A campaign with that name already exists.'),{httpStatus:409});
     const group=directory.campaigns.get(id);
     const retired=Object.entries(group?.platforms||{}).filter(([p])=>current.accounts[p]!==targets[p]).flatMap(([,types])=>Object.values(types));
     await store.checkEditable(retired);
     await db.begin();
     try{
       await db.exec('UPDATE campaigns SET name=? WHERE id=?',[name,id]);
       await db.exec('DELETE FROM campaign_targets WHERE id=?',[id]);
       await db.exec('INSERT INTO campaign_targets VALUES(?,?,?)',[id,name,JSON.stringify({version:1,accounts:targets})]);
       for(const source of retired){
         await db.exec('DELETE FROM disconnected_sources WHERE source=?',[source]);
         await db.exec('INSERT INTO disconnected_sources VALUES(?,?)',[source,id]);
       }
       if(current.accounts.Facebook!==targets.Facebook)await db.exec('DELETE FROM campaign_identity WHERE campaign_id=?',[id]);
       await db.commit();
     }catch(error){await db.rollback();throw error;}
     setCampaignAccounts(directory,id,name,targets);
     for(const [key,p] of previews)if(p.campaignId===id||p.campaign.toLowerCase()===name.toLowerCase())previews.delete(key);
   });
   return json(res,200,{id,name,accounts:targets});
 }
 if(u.pathname==='/api/campaigns/delete'){
   if(req.method!=='POST')return json(res,405,{error:'Use POST.'});
   if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))return json(res,403,{error:'Delete campaigns from the local dashboard.'});
   const {ids,confirmed}=await body(req);
   if(confirmed!==true || !Array.isArray(ids) || !ids.length || !ids.every(id=>typeof id==='string' && /^[a-f0-9]{64}$/.test(id)))return json(res,400,{error:'Select and confirm the campaigns to delete.'});
   const selected=[...new Set(ids)];
   await store.deleteCampaigns(selected,()=>{
     for(const [key,preview] of previews){
       const id=preview.campaignId;
       if(selected.includes(id))previews.delete(key);
     }
   });
   return json(res,200,{status:'deleted'});
 }
 if(u.pathname==='/api/campaigns'&&req.method==='POST'){
   const data=await body(req,12000),name=campaignName(data.name);let id;
   const targets=normalizeTargets(data.accounts);
   await enqueue(async()=>{
     id=await resolveName(name);
     if((await db.all('SELECT id FROM campaigns WHERE id=?',[id])).length)throw Object.assign(Error('A campaign with that name already exists.'),{httpStatus:409});
     await db.begin();
     try{
       await db.exec('INSERT INTO campaigns(id,name) VALUES(?,?)',[id,name]);
       await db.exec('DELETE FROM campaign_targets WHERE id=?',[id]);
       await db.exec('INSERT INTO campaign_targets VALUES(?,?,?)',[id,name,JSON.stringify(directory.campaigns.get(id)?.edited?{version:1,accounts:targets}:targets)]);
       await db.commit();
     }catch(error){await db.rollback();throw error;}
     const group=directory.campaigns.get(id);
     if(group?.edited){setCampaignAccounts(directory,id,name,targets);return;}
     if(group)for(const [platform,types] of Object.entries(group.platforms)){
       for(const [type,source] of Object.entries(types))if(directory.owners.get(source)?.url){directory.owners.delete(source);delete types[type];}
       if(!Object.keys(types).length)delete group.platforms[platform];
     }
     registerTargets(directory,name,targets,id);
   });
   return json(res,201,{id,name});
 }
 if(u.pathname==='/api/campaigns'&&req.method==='GET'){
   const rows=await db.all('SELECT c.id,c.name,i.payload FROM campaigns c LEFT JOIN campaign_identity i ON i.campaign_id=c.id ORDER BY c.name');
   return json(res,200,rows.map(row=>({id:row.id,name:row.name,accounts:directory.campaigns.get(row.id)?.targets||seededAccounts(directory,row.id),accounts_edited:Boolean(directory.campaigns.get(row.id)?.edited),facebook_identity:row.payload?JSON.parse(row.payload):null})));
 }
 if(u.pathname==='/api/imports/preview'&&req.method==='POST')return await previewCsv(await body(req),res);
 if(/^\/api\/imports\/[^/]+\/commit$/.test(u.pathname)&&req.method==='POST'){const id=u.pathname.split('/')[3],p=previews.get(id);if(!p||p.expires<Date.now())throw Error('Import preview expired; select the CSV again');if(!p.records.length&&!p.canConfirmEmpty)throw Error('No valid records to import; inspect source errors');if(p.snapshot){
   const {source,id:snapshotId,platform,csv}=p.snapshot;
   res.locals.finishActivity=await activity.start(res.locals.account,'Confirm collected data',p.campaign+' > '+platform+' > '+directory.owners.get(source).type);
   const saved=await store.saveSnapshot(source,snapshotId,csv,p,id);
   return json(res,200,{...saved,platform});
 }const campaign=p.campaignId;const work=async()=>{if(!previews.has(id))throw Error('Review the data again before saving.');await db.begin();try{await db.upsertCampaign(campaign,p.campaign);await store.applyImport(campaign,p);const log={id,campaign,filename:p.filename,rows:p.rows,accepted:p.records.length,duplicates:p.duplicates,errors:p.errors,platforms:p.platforms,types:p.types};await db.exec('INSERT INTO imports(id,campaign_id,created_at,payload) VALUES(?,?,?,?)',[id,campaign,new Date().toISOString(),JSON.stringify(log)]);await db.commit();previews.delete(id);return log;}catch(e){await db.rollback();throw e;}};const run=queue.then(work);queue=run.catch(()=>{});return json(res,200,await run);}
 if(u.pathname==='/api/imports/commit-batch'&&req.method==='POST'){const d=await body(req);if(!Array.isArray(d.ids)||!d.ids.length||d.ids.length>20)throw Error('Select between 1 and 20 CSV files');const batch=d.ids.map(id=>previews.get(id));if(batch.some(p=>!p||p.expires<Date.now()))throw Error('One or more CSV previews expired; select the files again');const campaignName=batch[0].campaign;if(batch.some(p=>p.snapshot))throw Error('Use Confirm to save this collection.');if(batch.some(p=>p.campaign.toLowerCase()!==campaignName.toLowerCase()))throw Error('All CSV files in a batch must use the same campaign name');if(batch.every(p=>!p.records.length))throw Error('No valid records to import; inspect source errors');const campaign=batch[0].campaignId;const work=async()=>{if(!d.ids.every(id=>previews.has(id)))throw Error('Review the files again before saving.');await db.begin();try{await db.upsertCampaign(campaign,campaignName);for(const p of batch){await store.applyImport(campaign,p);const log={id:randomUUID(),campaign,filename:p.filename,rows:p.rows,accepted:p.records.length,duplicates:p.duplicates,errors:p.errors,platforms:p.platforms,types:p.types,batch_size:batch.length};await db.exec('INSERT INTO imports(id,campaign_id,created_at,payload) VALUES(?,?,?,?)',[log.id,campaign,new Date().toISOString(),JSON.stringify(log)]);}await db.commit();for(const id of d.ids)previews.delete(id);return{campaign,files:batch.length,accepted:batch.reduce((n,p)=>n+p.records.length,0),platforms:[...new Set(batch.flatMap(p=>p.platforms))]};}catch(e){await db.rollback();throw e;}};const run=queue.then(work);queue=run.catch(()=>{});return json(res,200,await run);}
 if(u.pathname==='/api/imports')return json(res,200,(await db.all('SELECT created_at,payload FROM imports ORDER BY created_at DESC')).map(r=>({...JSON.parse(r.payload),created_at:r.created_at})));
 if(u.pathname==='/api/data'){const campaign=u.searchParams.get('campaign'),platform=u.searchParams.get('platform'),window=u.searchParams.get('window')||'all',asOf=u.searchParams.get('as_of')||new Date().toISOString();if(!['1','7','30','all'].includes(window)||!Number.isFinite(Date.parse(asOf)))throw Error('Invalid timeframe or as_of date');let records=(await db.all('SELECT campaign_id,payload FROM records')).filter(r=>!campaign||r.campaign_id===campaign).map(r=>({...JSON.parse(r.payload),campaign_id:r.campaign_id})).filter(r=>!platform||r.platform===platform);const grouped=u.searchParams.get('accounts')==='1'?campaignAccounts(records):undefined;const unknownDates=records.filter(r=>r.type!=='profile'&&!r.published_at).length;records=records.filter(r=>filterDate(r,window,asOf));const includeTrends=u.searchParams.get('trends')==='1';const analysis=(includeTrends||u.searchParams.get('keywords')==='1')?await keywords.analyze(records,campaign):undefined;const trends=includeTrends?trendSummary(records,analysis):undefined;const flags=u.searchParams.get('signals')==='1'?await signals.list(records):undefined;
 const integration=u.searchParams.get('integration')==='1'?{supported:supportedCollections,configured:campaign?directory.choices(campaign):Object.fromEntries([...new Set([...directory.owners.values()].map(c=>c.platform))].map(p=>[p,[...new Set([...directory.owners.values()].filter(c=>c.platform===p).map(c=>c.type))]])),credential_present:Boolean(process.env.BRIGHT_DATA_API_KEY?.trim())}:undefined;
 const [lastPull]=await db.all("SELECT MAX(pulled_at) AS latest FROM (SELECT MAX(completed_at) AS pulled_at FROM collected_snapshots UNION ALL SELECT MAX(created_at) AS pulled_at FROM processing_activity WHERE operation='Check collection progress' AND outcome='Imported') pulls");
 return json(res,200,{last_pull_at:lastPull.latest,records,analysis,trends,flags,integration,accounts:grouped,as_of:asOf,unknown_dates:unknownDates});}
 if(u.pathname.startsWith('/api/'))return json(res,404,{error:'API route not found'});
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});const requested=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname);const path=resolve(root,'.'+requested);const rel=relative(root,path);if(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))return json(res,403,{error:'Invalid path'});const bytes=await readFile(path);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png'})[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch(e){json(res,e.httpStatus||(e.code==='ENOENT'?404:400),{error:e.code==='ENOENT'?'File not found':e.message});}});
const server=http.createServer(app);
server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('TrendingSaNCR: http://'+(process.env.HOST||'127.0.0.1')+':'+(process.env.PORT||3000)+' ('+db.driver+')'));
