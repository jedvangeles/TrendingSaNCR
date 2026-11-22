import {createHash} from 'node:crypto';
import {platform as detectPlatform} from './importer.mjs';

export function campaignName(value){
  const name=typeof value==='string'?value.trim():'';
  if(!name||name.length>255)throw Error('Enter a campaign name of 1 to 255 characters.');
  return name;
}
export const campaignId=name=>createHash('sha256').update(campaignName(name).toLowerCase()).digest('hex');

export function sourceDirectory(config){
  // Accept the platform-only format from earlier installations.
  const groups=Object.values(config).some(v=>Object.values(v).some(x=>typeof x==='string'))?{CleverCatch:config}:config;
  const owners=new Map(),campaigns=new Map();
  for(const [name,platforms] of Object.entries(groups)){
    const id=campaignId(name);
    if(campaigns.has(id))throw Error('Duplicate campaign in snapshots.json.');
    campaigns.set(id,{id,name,platforms});
    for(const [platform,types] of Object.entries(platforms)){
      for(const [type,source] of Object.entries(types)){
        if(typeof source!=='string'||!/^sd_[a-zA-Z0-9_-]+$/.test(source)||owners.has(source))throw Error('Each configured collection needs a distinct snapshot ID.');
        owners.set(source,{id,name,platform,type,source});
      }
    }
  }
  const choices=id=>Object.fromEntries(Object.entries(campaigns.get(id)?.platforms||{}).map(([p,t])=>[p,Object.keys(t)]));
  const seeds=new Map([...campaigns].map(([id,c])=>[id,structuredClone(c.platforms)]));
  return {owners,campaigns,choices,seeds};
}

export function campaignAccounts(records){
  const grouped=new Map();
  for(const r of records){
    const accounts=grouped.get(r.campaign_id)||new Map();
    grouped.set(r.campaign_id,accounts);
    const urls=accounts.get(r.platform)||new Map();
    accounts.set(r.platform,urls);
    if(r.type==='comment')continue;
    const raw=r.raw||{};
    const candidate=r.type==='profile'?r.url:raw.page_url||raw.profile_url||raw.user_profile_url||raw.channel_url||raw.company_url;
    if(!candidate||detectPlatform(candidate)!==r.platform)continue;
    const url=new URL(candidate);
    if(!['https:','http:'].includes(url.protocol))continue;
    url.hash='';
    if(!url.pathname.endsWith('/profile.php'))url.search='';
    const key=url.hostname.replace(/^www\./,'')+url.pathname.replace(/\/$/,'')+url.search;
    urls.set(key,url.href);
  }
  return Object.fromEntries([...grouped].map(([id,platforms])=>[id,Object.fromEntries([...platforms].map(([platform,urls])=>[platform,[...urls.values()].sort()]))]));
}

const scrapers={
  Facebook:{Posts:['gd_lkaxegm826bjpoo9m5'],Reels:[null],Comments:['gd_lkay758p1eanlolqw8']},
  Instagram:{Profile:['gd_l1vikfch901nx3by4'],Posts:['gd_lk5ns7kz21pck8jpis','url'],Reels:['gd_lyclm20il4r5helnj','url_all_reels'],Comments:['gd_ltppn085pokosxh13']},
  YouTube:{Channel:['gd_lk538t2k2p1k3oos71'],Videos:['gd_lk56epmy2i5g7lzu0k','url'],Comments:['gd_lk9q0ew71spt1mxywf']},
  TikTok:{Profile:['gd_l1villgoiiidt09ci'],Videos:['gd_lu702nij2f790tmv9h','profile_url'],Comments:['gd_lkf2st302ap89utw5k']},
  LinkedIn:{'Company profile':['gd_l1vikfnt1wgvvqz95w'],Posts:['gd_lyy3tktm25m4avu764','company_url']},
  X:{Profile:['gd_lwxmeb2u1cniijd7t4'],Posts:['gd_lwxkxvnf1cynvib9co','profile_url']}
};
export const supportedCollections=Object.fromEntries(Object.entries(scrapers).map(([platform,types])=>[platform,Object.keys(types)]));
export const discoveryFor=(platform,type)=>scrapers[platform]?.[type]?.[1];
const hosts={Facebook:'www.facebook.com',Instagram:'www.instagram.com',YouTube:'www.youtube.com',TikTok:'www.tiktok.com',LinkedIn:'www.linkedin.com',X:'x.com'};
export function normalizeTargets(input={}){
  const result={};
  for(const [p,raw] of Object.entries(input)){
    if(!Object.hasOwn(hosts,p)||typeof raw!=='string')throw Error('Invalid social platform input.');
    let value=raw.trim();
    if(!value)continue;
    const invalid=()=>new Error('Enter a '+p+' account handle or profile URL.');
    if(value.length>1024)throw invalid();
    if(!/^https?:\/\//i.test(value)){
      if(/^(?:[\w-]+\.)+(?:com)\//i.test(value))value='https://'+value;
      else{
        const handle=value.replace(/^@/,'');
        if(!/^[\p{L}\p{N}_.-]+$/u.test(handle))throw invalid();
        const prefix=p==='LinkedIn'?'company/':['TikTok','YouTube'].includes(p)?'@':'';
        value='https://'+hosts[p]+'/'+prefix+encodeURIComponent(handle);
      }
    }
    const url=new URL(value);
    if(detectPlatform(value)!==p||url.username||url.password||url.port)throw invalid();
    let path=url.pathname.replace(/\/$/,'');
    if(p==='YouTube')path=path.replace(/\/(videos|shorts|featured)$/,'');
    const ok=p==='LinkedIn'?/^\/(company|in)\/[^/]+$/.test(path):p==='TikTok'?/^\/@[^/]+$/.test(path):p==='YouTube'?/^\/(?:@[^/]+|(?:channel|c|user)\/[^/]+)$/.test(path):/^\/[^/]+$/.test(path);
    if(!ok||/^\/(?:p|reel|reels|posts|watch|share|groups|videos|shorts|status|explore|home|i)$/i.test(path)||url.hostname.endsWith('youtu.be')||url.hostname.endsWith('fb.watch'))throw invalid();
    let query='';
    if(p==='Facebook'&&path==='/profile.php'){
      const id=url.searchParams.get('id');
      if(!/^\d+$/.test(id||''))throw invalid();
      query='?id='+id;
    }
    result[p]='https://'+hosts[p]+path+query;
  }
  return result;
}

export function registerTargets(directory,name,targets,id=campaignId(name)){
  let group=directory.campaigns.get(id);
  if(!group){group={id,name,platforms:{}};directory.campaigns.set(id,group);}
  group.targets=targets;
  for(const [p,url] of Object.entries(targets)){
    const personal=p==='LinkedIn'&&url.includes('/in/');
    const specs=personal?{Profile:['gd_l1viktl72bvl7bjuj0'],Posts:['gd_lyy3tktm25m4avu764','profile_url']}:scrapers[p];
    for(const [type,[dataset,discovery]] of Object.entries(specs)){
      const types=group.platforms[p]||={};
      if(types[type])continue;
      const source='acct_'+createHash('sha256').update(JSON.stringify([id,p,type,url])).digest('hex');
      const template=dataset?null:directory.seeds.get(campaignId('CleverCatch'))?.[p]?.[type];
      if(!dataset&&!template)continue;
      types[type]=source;
      directory.owners.set(source,{id,name,platform:p,type,source,url,dataset,discovery,template});
    }
  }
}

export function fromTarget(record,owner){
  const raw=record.raw||{};
  let discovery;
  try{discovery=JSON.parse(raw.discovery_input||'{}');}catch{}
  const urls=[record.type==='profile'?record.url:null,raw.page_url,raw.user_url,raw.profile_url,raw.user_profile_url,raw.channel_url,raw.channel_url_decoded,discovery?.url];
  if(owner.platform==='TikTok')urls.push(record.url?.split('/video/')[0]);
  return urls.some(url=>{
    if(!url||detectPlatform(url)!==owner.platform)return false;
    try{return normalizeTargets({[owner.platform]:url})[owner.platform].toLowerCase()===owner.url.toLowerCase();}catch{return false;}
  });
}

// Profile URLs from the original CleverCatch exports that supplied the configured snapshot IDs.
const originalAccounts=normalizeTargets({Facebook:'clevercatch.ph',Instagram:'clevercatch.ph',
  LinkedIn:'clevercatch-inc',TikTok:'clevercatch.ph',YouTube:'clevercatchph'});
export function seededAccounts(directory,id){
  return id===campaignId('CleverCatch')?Object.fromEntries(Object.entries(originalAccounts)
    .filter(([p])=>directory.seeds.get(id)?.[p])):{};
}

export function setCampaignAccounts(directory,id,name,targets){
  const previous=directory.campaigns.get(id);
  for(const types of Object.values(previous?.platforms||{})){
    for(const source of Object.values(types))directory.owners.delete(source);
  }
  const group={id,name,targets,platforms:{},edited:true};
  directory.campaigns.set(id,group);
  const originals=seededAccounts(directory,id);
  for(const [platform,url] of Object.entries(targets)){
    if(url!==originals[platform])continue;
    const types=directory.seeds.get(id)[platform];
    group.platforms[platform]={...types};
    for(const [type,source] of Object.entries(types))directory.owners.set(source,{id,name,platform,type,source,accountUrl:url});
  }
  registerTargets(directory,name,targets,id);
}
