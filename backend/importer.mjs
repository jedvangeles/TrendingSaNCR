import {createHash} from 'node:crypto';
export function csv(text){let rows=[],row=[],s='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'&&text[i+1]==='"'){s+='"';i++;}else if(c==='"')q=false;else s+=c;}else if(c==='"'){if(s)throw Error('Invalid CSV quoting');q=true;}else if(c===','){row.push(s);s='';}else if(c==='\n'){row.push(s.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];s='';}else s+=c;}if(q)throw Error('Unclosed CSV quotation');if(s||row.length){row.push(s.replace(/\r$/,''));rows.push(row);}const headers=(rows.shift()||[]).map(h=>h.replace(/^\uFEFF/,'').trim());if(!headers.length||headers.some(h=>!h)||new Set(headers).size!==headers.length)throw Error('Unique CSV headers required');return rows.map((r,i)=>{if(r.length!==headers.length)throw Error('Wrong column count on CSV row '+(i+2));return Object.fromEntries(headers.map((h,j)=>[h,r[j]]));});}
export function platform(url){try{const h=new URL(url).hostname.toLowerCase().replace(/^www\./,'');for(const [p,d] of [['Facebook','facebook.com'],['Facebook','fb.watch'],['Instagram','instagram.com'],['TikTok','tiktok.com'],['YouTube','youtube.com'],['YouTube','youtu.be'],['LinkedIn','linkedin.com'],['X','twitter.com'],['X','x.com']])if(h===d||h.endsWith('.'+d))return p;}catch{}return null;}
const first=(r,...keys)=>{for(const k of keys)if(r[k]!==undefined&&r[k]!==''&&r[k]!=='null')return r[k];return null;};
const number=v=>{if(v===null)return null;const n=Number(String(v).replace(/,/g,''));return Number.isFinite(n)&&n>=0?n:null;};
export function date(v){if(!v)return null;if(/^\d{10,13}$/.test(v))v=Number(v)*(v.length===10?1000:1);const d=new Date(v);return Number.isNaN(+d)?null:d.toISOString();}
function canonical(url){try{const u=new URL(url);return u.searchParams.get('v')||u.pathname.replace(/\/$/,'');}catch{return url;}}
const digest=s=>createHash('sha256').update(s).digest('hex');
export function normalize(text,{allowEmpty=false}={}){const rows=csv(text);if(!rows.length&&!allowEmpty)throw Error('CSV has no records');let records=[],errors=[],detected=new Set(),detectedTypes=new Set();for(const [i,r] of rows.entries()){
 const schemaPlatform=('commenter_user_name'in r||'digg_count'in r||'secu_id'in r)?'TikTok':('comment_user'in r||'product_type'in r||'biography'in r&&'fbid'in r)?'Instagram':('commentator_profile'in r||'page_name'in r)?'Facebook':('youtuber'in r||'date_iso'in r||'Details'in r)?'YouTube':('employees_in_linkedin'in r||'post_text'in r)?'LinkedIn':null;
 // Source URL fields only: never captions, CDN media URLs, or unrelated embedded links.
 const urls=['post_url','url','input_url','profile_url','channel_url','user_profile_url'].map(k=>r[k]).filter(Boolean);
 const p=urls.map(platform).find(Boolean);let type=('comment_id'in r||'comment_text'in r||'comment_user'in r)?'comment':('date_posted'in r||'post_id'in r||'post_text'in r||'collect_count'in r)?'content':'profile';
 if(p){detected.add(schemaPlatform||p);detectedTypes.add(type);}if(r.error||r.error_code){errors.push({row:i+2,platform:p,message:r.error||r.error_code,status:'source_error'});continue;}
 if(!p){errors.push({row:i+2,message:'No supported social platform URL',status:'unsupported_url'});continue;}
 if(schemaPlatform&&schemaPlatform!==p){errors.push({row:i+2,platform:p,message:'URL platform does not match export schema ('+schemaPlatform+')',status:'platform_mismatch'});continue;}
 const url=first(r,'url','post_url','input_url');
 const rawid=type==='comment'?first(r,'comment_id'):type==='content'?first(r,'post_id','video_id','id','shortcode'):first(r,'id','account_id','profile_id','url');
 const id=rawid&&rawid!=='video.php'?rawid:canonical(url);
 if(!id){errors.push({row:i+2,message:'Missing source identity'});continue;}
 const published=date(first(r,...(type==='comment'?['comment_date','date_created','date_iso','date']:['date_posted','create_time','published_at'])));
 const likes=number(first(r,'likes','digg_count','num_likes','likes_number','like_count'));
 const rec={key:digest(p+'|'+type+'|'+id),platform:p,type,source_id:String(id),url,published_at:type==='profile'?null:published,collected_at:date(r.timestamp),name:first(r,'profile_name','full_name','name','nickname','page_name','user_name','youtuber','user_posted','profile_username','account','handle'),text:first(r,...(type==='comment'?['comment_text','comment']:['post_text','content','description','biography','about','Description','page_intro'])),title:first(r,'title'),parent_url:type==='comment'?first(r,'post_url','input_url','url'):null,author:type==='comment'?first(r,'commenter_id','user_id','commenter_user_name','comment_user','user_name','username'):null,likes,comments:number(first(r,'num_comments','comment_count'))??(p==='X'&&type==='content'?number(first(r,'replies')):null),shares:number(first(r,'num_shares','share_count','num_share_count','reposts')),saves:number(first(r,'collect_count','bookmarks')),views:number(first(r,'views','video_view_count','view_count')),plays:number(first(r,'play_count','video_play_count')),followers:number(first(r,'followers','subscribers','page_followers','profile_followers','user_followers')),following:number(first(r,'following')),content_total:number(first(r,'posts_count','videos_count')),raw:r};
 records.push(rec);
 if(p==='Facebook'&&type==='content'&&r.profile_id&&r.page_url){records.push({...rec,key:digest(p+'|profile|'+r.profile_id),type:'profile',source_id:r.profile_id,url:r.page_url,published_at:null,name:r.page_name,text:r.page_intro||r.about||null,title:null,likes:number(first(r,'page_likes')),comments:null,shares:null,saves:null,views:null,plays:null});}
 }
 const merged=new Map();for(const r of records){const old=merged.get(r.key);merged.set(r.key,old?merge(old,r):r);}
 return {records:[...merged.values()],errors,rows:rows.length,duplicates:records.length-merged.size,platforms:[...detected],types:[...detectedTypes]};}
export function merge(a,b){const newer=(b.collected_at||'')>=(a.collected_at||'');const out={...a};for(const [k,v]of Object.entries(b))if(v!==null&&v!==''&&(newer||a[k]==null))out[k]=v;const raw={...a.raw};
 for(const [k,v] of Object.entries(b.raw||{})){
   if(v!=null&&v!==''&&v!=='null'&&(newer||raw[k]==null||raw[k]===''))raw[k]=v;
 }
 out.raw=raw;return out;}
