/* TrendingSaNCR: shared campaign analytics interface. */
(()=>{
'use strict';
const ICONS={pulse:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',chart:'<path d="M3 3v18h18"/><path d="m6 16 5-6 4 3 5-8"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2"/><path d="M17 5a3 3 0 0 1 0 6m1 3a6 6 0 0 1 4 6"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',shield:'<path d="m12 2 8 4v5c0 6-4 10-8 11-4-1-8-5-8-11V6z"/><path d="m9 12 2 2 4-4"/>',trend:'<path d="M3 17 9 11l4 4 8-9"/><path d="M15 6h6v6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',hash:'<path d="M10 3 8 21M16 3l-2 18M4 9h17M3 15h17"/>',file:'<path d="M5 2h10l5 5v15H5z"/><path d="M15 2v5h5M8 12h9M8 16h9"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',book:'<path d="M4 4h7a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4z"/><path d="M20 4h-3a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h3z"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2m0-14-2 2M7 17l-2 2"/>',chev:'<path d="m9 18 6-6-6-6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',plus:'<path d="M12 4v16M4 12h16"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',close:'<path d="M5 5l14 14M19 5 5 19"/>',check:'<path d="M4 12l5 5L20 6"/>',pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/>',spark:'<path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8z"/>',activity:'<path d="M3 12h4l2-6 4 12 2-6h6"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',lock:'<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',refresh:'<path d="M20 7a8 8 0 0 0-14-1L3 9m0-6v6h6M4 17a8 8 0 0 0 14 1l3-3m0 6v-6h-6"/>'};
Object.assign(ICONS,{"module_dashboard":"<rect x=\"3.5\" y=\"4\" width=\"7\" height=\"6\" rx=\"1\"/><rect x=\"13.5\" y=\"4\" width=\"7\" height=\"4\" rx=\"1\"/><rect x=\"13.5\" y=\"11\" width=\"7\" height=\"9\" rx=\"1\"/><rect x=\"3.5\" y=\"13\" width=\"7\" height=\"7\" rx=\"1\"/>","module_campaigns":"<path d=\"M4 6.5h16v11H4z\"/><path d=\"M7 10h4m-4 3h7\"/><path d=\"m16 4 4 2.5\"/>","module_audience":"<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3.5 19v-1.2a5.5 5.5 0 0 1 11 0V19zM16 6.2a3 3 0 0 1 0 5.6M18 15a4 4 0 0 1 2.5 3.7V19\"/>","module_competitors":"<path d=\"M4 20V9l5-3 5 3v11M14 20V5l3-2 3 2v15M2 20h20M7 12h1m-1 3h1m9-7h1m-1 4h1\"/>","module_credibility":"<path d=\"M12 3 19 6v5c0 4.7-3 8-7 10-4-2-7-5.3-7-10V6zM8.5 12.5l2.2 2.2 4.8-5\"/>","module_monitor":"<circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"m15.5 15.5 5 5M10.5 7v3.5l2.5 1.5\"/>","module_longevity":"<path d=\"M5 4h14M5 20h14M7 4v4l5 4 5-4V4M7 20v-4l5-4 5 4v4\"/>","module_buzzwords":"<path d=\"M4 5h16v11H9l-5 4zM7.5 9h9m-9 3.5h6\"/>","module_reports":"<path d=\"M6 3.5h8l4 4V20H6zM14 3.5v4h4M9 12h6m-6 3h6\"/>","module_alerts":"<path d=\"M5 17h14l-1.8-2.3V10a5.2 5.2 0 0 0-10.4 0v4.7zM10 20h4\"/><circle cx=\"18.5\" cy=\"5.5\" r=\"2\"/>","module_dictionary":"<path d=\"M4 4.5h6.5a3 3 0 0 1 3 3V20a3 3 0 0 0-3-3H4zM20 4.5h-3.5a3 3 0 0 0-3 3V20a3 3 0 0 1 3-3H20zM6.5 8h4m-4 3h4m5-3h2\"/>","module_users":"<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3.5 19v-1a5.5 5.5 0 0 1 11 0v1zM16 7h5m-2.5-2.5v5\"/>","module_settings":"<path d=\"M4 7h16M4 17h16\"/><circle cx=\"9\" cy=\"7\" r=\"2\"/><circle cx=\"15\" cy=\"17\" r=\"2\"/>","module_performance":"<path d=\"M4 19V5m0 14h16\"/><rect x=\"7\" y=\"12\" width=\"2.5\" height=\"5\" rx=\".5\"/><rect x=\"12\" y=\"8\" width=\"2.5\" height=\"9\" rx=\".5\"/><rect x=\"17\" y=\"5\" width=\"2.5\" height=\"12\" rx=\".5\"/>","module_intelligence":"<path d=\"M12 3v4m0 10v4M3 12h4m10 0h4\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/>","module_reportsGroup":"<path d=\"M4 6h6l2 2h8v11H4zM7 12h10m-10 3h7\"/>","module_administration":"<path d=\"m12 3 8 4.5v9L12 21l-8-4.5v-9zM12 3v9l8 4.5M12 12 4 7.5\"/>"});
const icon=(name,size=18)=>`<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.grid}</svg>`;
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const badge=(v)=>{const x=String(v).toLowerCase();const c=/^inactive|cooling|warning|risk|failed/.test(x)?'red':/^unreviewed|^review$|developing|stable/.test(x)?'amber':/rising|^active$|sustained|^reviewed$|connected/.test(x)?'green':'blue';return `<span class="status-tag ${c}">${escapeHTML(v)}</span>`};
const panelSymbol=title=>/Dictionary|Lexicon|Phrase/.test(title)?'dictionary':/Alert|Notification|Inbox/.test(title)?'alerts':/Report/.test(title)?'reports':/Account|Role|Team/.test(title)?'users':/Preferences|Controls|Integration/.test(title)?'settings':/Brand|Competitor|Overlap/.test(title)?'competitors':/Score|Persistence|Staying|Longevity|Sustained/.test(title)?'longevity':/Word|Term|Salita|Expression|Matched/.test(title)?'buzzwords':/Audience|Interaction|Content/.test(title)?'audience':/Flag|Review|Guard/.test(title)?'credibility':/Trend|Hashtag|NCR Activity/.test(title)?'monitor':/Campaign/.test(title)?'campaigns':'performance';
const panel=(title,desc,body,action='')=>`<section class="panel"><div class="panel-head"><div><h3 class="panel-title">${icon("module_"+panelSymbol(title),19)}<span>${escapeHTML(title)}</span></h3><p class="panel-desc">${escapeHTML(desc)}</p></div>${action?`<div class="panel-actions">${action}</div>`:''}</div><div class="panel-body" role="region" aria-label="${escapeHTML(title)}" tabindex="0">${body}</div></section>`;
const button=(txt,act,cls='',param='')=>`<button type="button" class="btn ${cls}" data-action="${act}" ${param?`data-param="${escapeHTML(param)}"`:''}>${escapeHTML(txt)}</button>`;
const section=(title,right='')=>`<div class="section-header"><h2>${title}</h2><small>${right}</small></div>`;
function renderNav(){return `<aside class="side ${state.drawer?'open':''}" id="side"><div class="brand"><span class="brand-mark"><img src="assets/trendsancr-mark.png" alt="" width="35" height="38"></span><div><div class="brand-name">Trending<span style="color:#f0bf70">Sa</span><em>NCR</em></div><span class="brand-tag">Cross-Platform Social Analytics</span></div></div><div class="side-body"><div class="nav-heading">WORKSPACE</div><button data-route="dashboard" class="nav-direct ${state.route==='dashboard'?'active':''}">${icon('module_dashboard')} Dashboard Overview</button><div class="nav-heading" style="margin-top:21px">EXPLORE</div>${groups.map(g=>`<div class="group"><button class="group-title" data-group="${g.id}" aria-expanded="${state.openGroups.has(g.id)}">${icon("module_"+g.id)}<span>${g.label}</span>${icon('chev',14).replace('class="icon"','class="icon chev"')}</button>${state.openGroups.has(g.id)?`<div class="group-list">${g.routes.map(([r,n,i])=>`<button class="nav-child ${state.route===r?'active':''}" data-route="${r}">${icon("module_"+r,18)}<span>${n}</span></button>`).join('')}</div>`:''}</div>`).join('')}</div><div class="side-bottom"><div class="side-small">CleverCatch Inc. | PLMun CITCS</div></div></aside>`}

const PLATFORMS=['Facebook','Instagram','TikTok','YouTube','LinkedIn','X'];
const PERIODS=[['1','1 day'],['7','7 days'],['30','30 days'],['all','All Time']];
const groups=[{id:'performance',label:'Performance Analytics',routes:[['campaigns','Campaign Lab'],['audience','Content Tracker']]},{id:'intelligence',label:'Trend Intelligence',routes:[['monitor','Trend Monitor'],['buzzwords','Sentiment & Library'],['credibility','Trend Guard']]},{id:'administration',label:'Administration',routes:[['reports','Reports & Insights'],['users','User Management'],['settings','Settings']]}];
const meta={dashboard:['Dashboard Overview','THE NCR TRENDS: NCR Analytics','Cross-Platform Social Analytics'],campaigns:['Campaign Lab','CAMPAIGN MANAGER','Profile and company accounts define each monitored campaign.'],audience:['Content Tracker','CONTENTS & INTERACTIONS','Public interactions and collected comments across campaign content.'],monitor:['Trend Monitor','TREND SCANNER','Observe keyword recurrence and sustained activity across dated content and comments.'],buzzwords:['Sentiment & Library','RULE-BASED MATCHING','Rule-based buzzwords / slangs variations and exact phrase matching, term frequencies and source contexts.'],credibility:['TREND GUARD','CREDIBILITY CHECKER','Explainable risk indicators (possible fraudulent engagement) - manual review status'],reports:['Reports & Insights','REPORT INBOX','Build reports from the selected campaign, platforms and reporting window.'],users:['User Management','ACCESS LAB','Management Accounts roles & status'],settings:['Settings','CONTROL ROOM','Manage data sources, import history and processing rules.']};
const aliases={competitors:'campaigns',longevity:'monitor',dictionary:'buzzwords',alerts:'settings'};
const routeTabs={campaigns:['Campaign profiles','Posts & videos'],monitor:['Trend Radar','Trend Power'],buzzwords:['Sentiment review','Keyword matches','Keywords Library'],settings:['Data sources','Import history','Processing activity','Rules & portability']};
const defaultFilters={campaign:'',platform:'All platforms',period:'all'};
const state={route:'dashboard',openGroups:new Set(groups.map(group=>group.id)),drawer:false,...defaultFilters,tabs:{},staged:[],terms:[],reports:[],events:[]};
let session={role:'Guest'}, accounts=[], reviewRows=new Map(), signalRows=new Map();
const canManage=()=>['Administrator','Analyst'].includes(session.role);
const isAdmin=()=>session.role==='Administrator';
const labelPeriod=()=>PERIODS.find(x=>x[0]===state.period)[1];
const fmt=v=>v==null?'—':String(v);
const kpi=(title,key,detail,ic='pulse')=>`<div class="kpi" data-field="${key}"><div class="kpi-top"><div class="kpi-label">${escapeHTML(title)}</div><span class="kpi-icon">${icon(ic)}</span></div><div class="kpi-value" aria-label="No value available">—</div><div class="kpi-meta">${escapeHTML(detail||'Awaiting processed records')}</div></div>`;
const kpis=items=>`<div class="kpi-grid kpi-count-${items.length}">${items.map(x=>kpi(...x)).join('')}</div>`;
const empty=(title,key,detail='Import CSV or request campaign data to populate this view.')=>`<div class="data-placeholder" data-field="${key}">${icon('module_'+state.route,24)}<strong>${escapeHTML(title)}</strong><span>${escapeHTML(detail)}</span></div>`;
const table=(heads,key,rows=[],scrollLabel)=>`<div class="table-wrap${scrollLabel?' audience-records':''}"${scrollLabel?' role="region" tabindex="0" aria-label="'+escapeHTML(scrollLabel)+'"':''}><table class="data-table" data-field="${key}"><thead><tr>${heads.map(h=>`<th>${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${heads.length}" class="data-empty">No records available for the selected campaign, platform and timeframe.</td></tr>`}</tbody></table></div>`;
const placeholderTable=(title,desc,heads,key,action='')=>panel(title,desc,table(heads,key,[],['campaign.content','overview.campaigns','audience.comments','audience.interactions'].includes(key)?title:null),action);
const grid=(...items)=>`<div class="content-grid equal">${items.join('')}</div>`;
const chart=(title,key,desc,action='')=>panel(title,desc||'Dated records within the selected reporting window',empty('Awaiting dated observations',key,'The chart will use actual publication or comment dates. No values have been loaded.'),action);
const audienceActivityPanel=(action='')=>chart('Audience & Engagements','audience.activity_series','Published posts and collected comments by activity date > Manila time',action);
const trendEvidencePanel=(action='')=>placeholderTable('Trend Longevity','Coverage is active weeks divided by weeks with eligible text of the same type. At least two eligible weeks are needed for a percentage.',['Keyword / topic','Evidence type','Records','First observed','Last observed','Days apart','Active / eligible weeks','Coverage','Platforms','Persistence status'],'trend.persistence',action);
const metricRows=(items,style='')=>`<dl class="metric-list${style?' '+style:''}">${items.map(([name,key,desc])=>`<div data-field="${key}"><dt>${escapeHTML(name)}${desc?`<small>${escapeHTML(desc)}</small>`:''}</dt><dd aria-label="No value available">—</dd></div>`).join('')}</dl>`;
const note=text=>`<p class="scope-note">${escapeHTML(text)}</p>`;
const engagementFields=()=>{
 const p=state.platform;
 const fields=[[p==='Facebook'?'Reactions':p==='All platforms'?'Likes / reactions':'Likes','likes_or_reactions','Known public counts'],['Reported comments','reported_comments','Platform counters on collected content']];
 if(['All platforms','Facebook','TikTok','LinkedIn','X'].includes(p))fields.push(['Shares / reposts','shares','Available source counts only']);
 if(['All platforms','TikTok'].includes(p))fields.push(['Saves','saves','TikTok collect_count when supplied']);
 if(['All platforms','Facebook','Instagram','TikTok','YouTube','X'].includes(p))fields.push([p==='TikTok'?'Video plays':p==='All platforms'?'Views / plays':'Views','views_or_plays','Preserve source definitions and coverage']);
 if(p==='X')fields.push(['Quotes','quotes','When supplied by the X dataset'],['Bookmarks','bookmarks','When publicly available']);
 return fields;
};
function profileFields(){const p=state.platform;return [[p==='YouTube'?'Subscribers':'Followers / subscribers','profile.followers'],...(['All platforms','Facebook','Instagram','TikTok','X'].includes(p)?[['Following','profile.following']]:[]),['Published content total','profile.content_total'],...(['All platforms','TikTok'].includes(p)?[['Account likes received','profile.received_likes','TikTok account total']]:[]),...(['All platforms','YouTube'].includes(p)?[['Channel lifetime views','profile.channel_views','Separate from collected video views']]:[]),...(['All platforms','LinkedIn'].includes(p)?[['Company size / industry','profile.company_details']]:[]),['Collected at','profile.collected_at','Latest completed pull across all campaigns']];}
function profileStatistics(profiles,latest){
  const accounts=new Map();
  for(const p of [...profiles].sort((a,b)=>(a.collected_at||'').localeCompare(b.collected_at||''))){
    const key=p.campaign_id+':'+p.key;
    const row=accounts.get(key)||{};
    const raw=p.raw||{};
    const counters={
      followers:p.followers??raw.followers_count,
      following:p.following??raw.following_count??raw.friends_count,
      content_total:p.content_total??raw.statuses_count,
      received_likes:p.platform==='TikTok'?p.likes:null,
      channel_views:p.platform==='YouTube'?p.views:null
    };
    for(const [metric,value] of Object.entries(counters)){
      if(value==null||String(value).trim()==='')continue;
      const n=Number(String(value).replace(/,/g,''));
      if(Number.isFinite(n)&&n>=0)row[metric]=n;
    }
    if(p.platform==='LinkedIn'){
      if(raw.company_size)row.size=raw.company_size;
      if(raw.industries||raw.industry){
        const industry=raw.industries||raw.industry;
        try{const list=JSON.parse(industry);row.industry=Array.isArray(list)?list.join(', '):industry;}
        catch{row.industry=industry;}
      }
    }
    if(p.collected_at)row.collected_at=p.collected_at;
    accounts.set(key,row);
  }
  const rows=[...accounts.values()],values={};
  for(const metric of ['followers','following','content_total','received_likes','channel_views']){
    const known=rows.map(row=>row[metric]).filter(n=>n!=null);
    values['profile.'+metric]=known.length?known.reduce((sum,n)=>sum+n,0):null;
  }
  const details=rows.map(row=>[row.size,row.industry].filter(Boolean).join(' / ')).filter(Boolean);
  values['profile.company_details']=details.join(', ')||null;
  values['profile.collected_at']=latest?displayTimestamp(latest):null;
  return values;
}
function renderDashboard(){return `<section class="hero"><div class="hero-inner"><div class="hero-kicker">METRO MANILA | TRENDS DATA</div><h2>Dynamic View of the<br><span>Capital</span>.</h2><p>Campaign content, consumer comments and observed marketing trends across six social platforms.</p><div class="hero-chips"><span class="hero-chip">${icon('pin',14)} NCR campaign focus</span><span class="hero-chip">${icon('search',14)} Rule-based keywords matching</span></div></div></section>`+kpis([['Collected content','content_count','Distinct posts, videos and reels','file'],['Known interactions','known_interactions','Sum of available counters','activity'],['Collected comments','collected_comment_count','Distinct comment records','users']])+grid(chart('Overall Engagement Activity','overview.activity_series','Content publication dates > counters as collected'),panel('Platform Coverage','Available inputs and collection status',table(['Platform','Profile','Content','Comments','Last collected','Status'],'overview.platform_coverage',PLATFORMS.map(p=>[escapeHTML(p),'—','—','—','—',badge('No input')])),button('View Campaign Lab','overviewLink','tiny','campaigns|Campaign profiles')))+grid(
 audienceActivityPanel(button('View Interactions','overviewLink','tiny','audience')),
 trendEvidencePanel(button('View Trend Power','overviewLink','tiny','monitor|Trend Power'))
 )+placeholderTable('Campaign Snapshot','Profile / company identity and linked social accounts',['Campaign / profile','Platform','Followers / subscribers','Content records','Collected at'],'overview.campaigns');}
function campaignIdentity(campaigns){
  const fields=[['Profile / company name','name'],['Username / handle','handle'],['Description / about','description'],['Profile URL','url'],['Website','website']];
  return '<dl class="identity-fields">'+fields.map(([label,key])=>{
    const values=campaigns.map(c=>c.facebook_identity?.[key]).filter(Boolean);
    return '<div><dt>'+label+'</dt><dd tabindex="0">'+escapeHTML(values.join(', ')||'—')+'</dd></div>';
  }).join('')+'</dl>';
}
function renderCampaigns(){switch(tabName()){
case 'Posts & videos':return grid(chart('Campaign Performance Timeline','campaign.content_series'),panel('Content Counters',state.platform==='All platforms'?'Combined available totals > platform coverage retained':'Available public fields for '+state.platform,metricRows(engagementFields(),'compact-values')))+placeholderTable('Posts, Videos & Reels','Newest publication first > Manila time',['Platform','Title / caption','Published at','Content type','Likes / reactions','Comments','Shares','Views / plays','Source URL'],'campaign.content');
default:return grid(panel('Campaign Identity','Facebook page details','<div id="campaign-identity">'+campaignIdentity([])+'</div>'),panel('Profile Statistics','Totals from available account profiles for the selected campaign and platforms.',metricRows(profileFields(),'profile-values')))+panel('Campaign Accounts','Social accounts linked to each campaign',table(['Campaign name','Platforms','Profile URL','Collection status',...(isAdmin()?['Edit']:[])],'campaign.accounts',[], 'Campaign Accounts'),canManage()?button('Add campaign','addCampaign')+' '+button('Delete campaigns','deleteCampaigns'):'');}}
function renderAudience(){return kpis([['Known interactions','known_interactions','Available likes / reactions + comments + shares + saves','activity'],['Collected comments','collected_comment_count','Dated comment records','users'],['Commenter identities','commenter_identity_count','Distinct within each campaign and platform','users']])+grid(audienceActivityPanel(),panel('Interaction Composition','Platform counters',metricRows(engagementFields().map(([name,key,description])=>[name,key,['quotes','bookmarks'].includes(key)?description:undefined]),'compact-values')))+grid(panel('Observed Comment Behavior','Based on collected public comments',metricRows([['Returning commenter identities','audience.returning_commenters'],['Comments per content item','audience.comments_per_content'],['Comment activity dates','audience.comment_dates']],'compact-values')+note('Identities are scoped to a platform. Cross-platform totals do not represent unique people.')),panel('Data Coverage','Public observations available to this analysis',metricRows([['Content with interaction counters','audience.counter_coverage'],['Content with views / plays','audience.view_coverage'],['Comments linked to a collected post','audience.parent_match_count']],'compact-values')+note('Reach, impressions, audience demographics and follower growth require additional supported inputs.')))+placeholderTable('Latest Posts & Uploads','Newest publication first > Manila time',['Campaign','Platform','Title / caption','Counters collected at','Post published at','Known interactions','Views / plays','Source URL'],'audience.interactions')
 +placeholderTable('Latest Comments & Interactions','Newest comment first > Manila time',['Campaign','Platform','Comment text','Author / handle','Comment date','Comment likes','Parent content URL','Review status'],'audience.comments');}
function renderMonitoring(){
 if(tabName()==='Trend Power')return trendEvidencePanel()+grid(
   panel('Observed Trend Persistence','Recurrence within the selected campaign, platforms and dates',metricRows([
     ['Topics recurring across weeks','trend.recurring'],['Topics repeated over 30+ days','trend.long_span'],
     ['Observed content weeks','trend.content_weeks'],['Observed comment weeks','trend.comment_weeks']])+note('A topic recurs when it matches in two Manila calendar weeks within the same evidence type. The 30+ day label also requires three active weeks and at least 30 days between matches.')),
   panel('Trend Power: Recurrence Timeline','Monday-start weeks with dated matches',table(['Week of','Campaign content','Audience comments','Matched topics'],'trend.persistence_series'))
 );
 return placeholderTable('Tracked Topics & Hashtags','First and last observations use dated records. Counts include all matches in the selected filters.',['Keyword / hashtag','Content matches','Comment matches','Platforms','First observed','Last observed','Distinct dates'],'trend.radar')
 +grid(panel('Trend Radar','Distinct matching records by Manila publication or comment date',table(['Date','Campaign content','Audience comments','Matched topics'],'trend.keyword_series')),
   panel('Keywords Cloud','Matching records per library rule',empty('No keyword matches in this selection','trend.keyword_cloud','Matches appear when imported text contains a library keyword or variation.'))
 );
}
function guideList(items){
 return '<ul class="rule-guide">'+items.map(([title,detail])=>'<li><strong>'+escapeHTML(title)+'</strong> '+escapeHTML(detail)+'</li>').join('')+'</ul>';
}
function renderBuzzwords(){switch(tabName()){
case 'Keywords Library':{
 const rules=state.terms;
 const heads=['Keyword / phrase','Variations','Category','Sentiment rule'];
 if(canManage())heads.push('Actions');
 return panel('Keywords Library','Exact phrases and comma-separated variations',table(heads,'keywords.library',rules.map(t=>{
   const row=[t.term,t.variants||'—',t.category,t.sentiment].map(escapeHTML);
   if(canManage())row.push(button('Edit','editTerm','tiny',t.id)+' '+button('Remove','removeTerm','tiny',t.id));
   return row;
 }), 'Keyword rules'),canManage()?button('Add keyword rule','addTerm','primary'):'');
}
case 'Keyword matches':return grid(panel('Matching Method','Rule-based exact and registered variation matching',guideList([
 ['Where we look.', 'The selected filters narrow the posts, captions, video titles and comments we check.'],
 ['What counts as a match.', 'A whole keyword or a listed variation must appear in the text. Uppercase letters and extra spaces make no difference.'],
 ['How variations work.', 'Each library entry has a keyword and can include variations. A match on any listed form counts toward that keyword.'],
 ['How to read the cloud.', 'The number beside a keyword is the number of records that matched it. Repeating the keyword or its variations in one record counts once. One record can match several different keywords.'],
 ['How to check a match.', 'In Keyword Match Evidence below, compare the matched phrase with the source text. Open the source link to read more context.']
 ])),panel('Keywords Cloud','Matched terms in the selected window',empty('Awaiting keyword processing','keywords.cloud')))+placeholderTable('Keyword Match Evidence','Review the original text alongside the matching rule',['Platform','Source text','Matched phrase','Rule / variation','Source type','Date','Source URL'],'keywords.matches');
default:return kpis([['Comments eligible for review','sentiment.eligible_comments','Collected comments with usable text','search'],['Unclassified comments','sentiment.pending_count','No matching sentiment rule or final classification','clock'],['Manual review queue','sentiment.review_count','Ambiguous or conflicting matches','shield']])+grid(panel('Rule-based Sentiment Results','Share of processed, eligible comments',metricRows([['Positive','sentiment.positive'],['Negative','sentiment.negative'],['Neutral','sentiment.neutral'],['Mixed / conflicting','sentiment.mixed'],['Context review','sentiment.context'],['Unclassified','sentiment.unclassified']])+note('Percentages use comments with text in the selected filters. A saved review decision takes precedence.')),panel('Classification Rules','Filipino, English and Taglish phrase context',guideList([
 ['Which comments count?', 'The percentages cover comments with text in your current filters. Each comment gets one result.'],
 ['Positive, Negative or Neutral.', 'The label comes from the matching library rule. A neutral brand mention can sit alongside praise or criticism. The positive or negative label takes priority.'],
 ['Mixed.', 'A comment with both a positive and a negative match gets this label.'],
 ['Context review.', 'Some phrases depend on tone. A word like “hindi” just before a positive phrase can also flag the comment for a closer look.'],
 ['Unclassified.', 'No library phrase matched. This has its own count, separate from Neutral.'],
 ['Who can review?', 'An administrator or analyst can read the full comment below and save a decision. That decision counts in the results while the comment and its matching evidence stay the same.']
 ])+note(state.terms.length+' active keyword rules.')))+placeholderTable('Sentiment Review','Explain each classification with its rule and source context',['Platform','Comment text','Matched rule','Classification','Review status','Comment date','Source URL'],'sentiment.review');}}
function renderCredibility(){
 return kpis([['Flagged observations','risk.flag_count','Groups of comments matching a review rule','shield'],['Pending manual review','risk.pending_review_count','Flagged groups awaiting a decision','eye']])+grid(
   panel('Trend Guard: Activity Timeline','Flags by date of the latest comment in each group > Manila time',table(['Date','Comment bursts','Repeated wording'],'risk.events')),
   panel('Reviewable Indicators','Each rule checks distinct imported comments on the same post.',guideList([
     ['Comment burst','At least three accounts commented during the same clock hour.'],
     ['Repeated wording','At least two accounts used the same phrase of two or more words and at least eight characters. Matching ignores case, extra spaces and punctuation.'],
     ['Manual review','Open the source to check the context. Launches, giveaways and common greetings can trigger these rules. Only dated comments with a parent post and an account are eligible.']
   ])))+placeholderTable('Manual Review Queue','Newest evidence first > results reflect the selected campaign, platform and window',['Campaign','Platform','Rule','Evidence','Latest comment','Review status','Source','Review'],'risk.review_queue');
}
function renderReports(){return grid(panel('Report Builder','Uses the active campaign, platform and timeframe',`<form id="report-form" class="form-stack">${field('title','Report title','','text',true,'Enter report title')}${['Campaign performance','Audience & Engagements','Trend Radar & Trend Power','Rule-based sentiment','Keywords matching','Trend Guard review','Data coverage & limitations'].map(t=>`<label class="checkline"><input type="checkbox" checked name="sections" value="${escapeHTML(t)}">${escapeHTML(t)}</label>`).join('')}<button class="btn primary" disabled title="Processed records are required">Generate report</button></form>`),panel('Report Preview',labelPeriod()+' > '+state.platform,empty('No report data available','reports.preview','Import and process campaign records before generating a report. Missing source metrics will remain blank.')))+placeholderTable('Report History','Generated reports and export status',['Report title','Campaign','Platforms','Window','Generated at','Export status'],'reports.history');}
function renderUsers(){
 const matrix=panel('Role Access Matrix','Access by account role',table(['Function','Administrator','Analyst','Guest'],'users.permissions',[
  ['Dashboard Analytics','View','View','View'],['Imports & Requests','Manage','Manage','View history'],
  ['Library & Reviews','Manage','Manage','View'],['User Accounts','Add, edit, remove','—','—']]));
 if(!isAdmin())return matrix;
 const rows=accounts.map(u=>[
  escapeHTML(u.name),escapeHTML(u.email),escapeHTML(u.role),badge(u.status),button('Edit','manageUser','tiny',u.id)+' '+button('Remove','removeUser','tiny',u.id)]);
 return matrix+panel('Team Accounts','Management Accounts roles & status',table(['Name','Email','Role','Status','Actions'],'users.accounts',rows),button('Add account','addUser','primary'));
}
function renderSettings(){switch(tabName()){
case 'Import history':return placeholderTable('Shared Import History','Saved CSV batches are shared across analytics modules',['Batch','Campaign','Platform','Record type','Window','Filename','Status'],'imports.history')+panel('CSV Staging Review','Validated import batches',table(['Filename','Platform','Record type','Rows','Status'],'imports.staged',state.staged.map(s=>[escapeHTML(s.filename),escapeHTML(s.platform),escapeHTML(s.type),String(s.rows),badge('Awaiting backend validation')])));
case 'Processing activity':return panel('Processing Activity',isAdmin()?'Team requests across all campaigns and dates > newest first':'Your requests across all campaigns and dates > newest first',canManage()?table(['Time in Manila','Requested by','Role','Action','Keyword or collection','Outcome'],'jobs.history',[],'Processing requests'):note('Sign in as an analyst or administrator to see request history.'),canManage()?button('Refresh','refreshActivity','tiny'):'');
case 'Rules & portability':return grid(panel('Processing Rules','Shared analytical definitions',note('Deduplicate content and comments by platform and source ID. Preserve long IDs as strings, distinguish missing values from measured zero and retain source field names, dates and collection timestamps.')+note('Post metrics use publication dates; comment analysis uses comment dates. Profile statistics reflect the latest collection. All Time means all dated records in the imported dataset.')),panel('Portable Data & Hosting','On-demand operation',note('CSV remains available alongside user-requested Bright Data collection. No scheduled collection is required. The planned Node.js / Express API and MySQL database will serve this frontend.')+note('Use server environment variables for credentials, export MySQL backups and keep source CSVs for transfer between computers and hosting.')));
default:return grid(panel('Bright Data Integration','Collection is initiated with Request Latest Data',metricRows([['Backend connection','integration.backend_status'],['API credential status','integration.credential_status'],['Last snapshot import','integration.last_success_at']])+note('Request Latest Data uses the saved connection for the selected platform and content type.')),panel('CSV Import','Always available as an alternative data source',note('Import Bright Data CSV exports. URLs identify the platform; headers identify profiles, posts or comments. Review validation before saving. Reporting windows filter stored record dates.')+(canManage()?button('Import CSV','importCsv','primary'):'')))+panel('Platform Connectors','Imported records in this selection and available Bright Data collections',table(['Platform','Profiles','Posts / videos / reels','Comments','Configured collections','Import status'],'integration.platforms'));}}
const screens={dashboard:renderDashboard,campaigns:renderCampaigns,audience:renderAudience,monitor:renderMonitoring,buzzwords:renderBuzzwords,credibility:renderCredibility,reports:renderReports,users:renderUsers,settings:renderSettings};
function tabName(){return state.tabs[state.route]||(routeTabs[state.route]||[])[0];}
function toolbar(){return `<div class="filterbar"><label class="filter-label" for="filter-campaign">Campaign</label><select class="filter" id="filter-campaign"><option value="">All campaigns</option></select><label class="filter-label" for="filter-platform">Platform</label><select class="filter" id="filter-platform">${['All platforms',...PLATFORMS].map(p=>`<option ${p===state.platform?'selected':''}>${p}</option>`).join('')}</select><label class="filter-label" for="filter-period">Window</label><select class="filter" id="filter-period">${PERIODS.map(([v,l])=>`<option value="${v}" ${v===state.period?'selected':''}>${l}</option>`).join('')}</select><span class="filter-hint">— No processed data > ${labelPeriod()}</span></div>${routeTabs[state.route]?`<div class="module-tabs" role="tablist" aria-label="${meta[state.route][0]} sections">${routeTabs[state.route].map(t=>`<button role="tab" aria-selected="${t===tabName()}" class="btn ${t===tabName()?'selected':''}" data-action="tab" data-param="${t}">${t}</button>`).join('')}</div>`:''}`;}
function render(){dashboardCharts.clear();const m=meta[state.route];document.title=m[0]+' > TrendingSaNCR';document.getElementById('app').innerHTML=`<div class="app-shell">${renderNav()}<div class="mobile-scrim ${state.drawer?'active':''}" data-action="closeDrawer"></div><div class="workarea"><header class="topbar"><button class="icon-btn burger" aria-label="Open navigation" data-action="toggleDrawer">${icon('menu')}</button><div class="crumbs"><span class="route-section">Workspace ›</span><b>${m[0]}</b></div><div class="top-spacer"></div><button class="icon-btn" aria-label="Processing notifications" data-action="tabLink" data-param="settings|Processing activity">${icon('bell')}</button><div class="session-info"><span class="session-role">${escapeHTML(session.role)}</span>${session.name?.trim()?'<span class="session-name" title="'+escapeHTML(session.name)+'">'+escapeHTML(session.name)+'</span>':''}</div>${button(session.id?'Sign out':'Sign in',session.id?'logout':'login','tiny')}</header><main class="main-content"><div class="page-lead"><div class="module-heading"><div class="eyebrow">${m[1]}</div><h1>${icon('module_'+state.route,24)}<span>${m[0]}</span></h1><div class="page-sub">${m[2]}</div></div>${canManage()?'<div class="actions"><button class="btn import-action" data-action="importCsv">'+icon('upload',16)+' Import CSV</button><button class="btn primary" data-action="requestData">'+icon('refresh',16)+' Request Latest Data</button></div>':''}</div>${toolbar()}${screens[state.route]()}<div class="demo-foot"><span>TrendingSaNCR > Cross-Platform Social Analytics</span><span>CleverCatch Inc. | PLMun CITCS</span></div></main></div></div>`;queueMicrotask(refreshData);}
function go(r,keepFilters=false){const route=screens[r]?r:aliases[r]||'dashboard';if(state.route!==route&&!keepFilters)Object.assign(state,defaultFilters);state.route=route;state.drawer=false;const g=groups.find(g=>g.routes.some(x=>x[0]===state.route));if(g && g.routes.length>1)state.openGroups.add(g.id);history.replaceState(null,'','#'+state.route);render();window.scrollTo(0,0);}
const toast=msg=>{document.getElementById('toast-root').innerHTML=`<div class="toast">${escapeHTML(msg)}</div>`;setTimeout(()=>document.getElementById('toast-root').replaceChildren(),5000);};
let lastFocus;
function closeModal(){document.getElementById('modal-root').replaceChildren();lastFocus?.focus();}
function modal(title,body,id,submit='Save',disabled=false){lastFocus=document.activeElement;document.getElementById('modal-root').innerHTML=`<div class="modal-overlay"><div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${title}</h2><form id="${id}" class="form-stack">${body}<div class="modal-foot"><button class="btn" type="button" data-action="closeModal">Close</button><button class="btn primary" type="submit" ${disabled?'disabled':''}>${submit}</button></div></form></div></div>`;document.querySelector('.modal-box input,.modal-box select,.modal-box button')?.focus();}
const field=(name,label,val='',type='text',required=true,placeholder='',minLength=0,autocomplete='')=>`<div class="form-row"><label for="m-${name}">${escapeHTML(label)}</label><input class="field" id="m-${name}" name="${name}" value="${escapeHTML(val)}" type="${type}" ${autocomplete?'autocomplete="'+autocomplete+'"':''} ${minLength?'minlength="'+minLength+'"':''} ${required?'required':''} placeholder="${escapeHTML(placeholder)}"></div>`;
const selectField=(name,label,opts,value)=>`<div class="form-row"><label for="m-${name}">${label}</label><select class="field" id="m-${name}" name="${name}">${opts.map(x=>`<option ${value===x?'selected':''}>${x}</option>`).join('')}</select></div>`;
function showImport(){modal('Import campaign CSV files',field('campaign','Campaign name',document.getElementById('filter-campaign').selectedOptions[0]?.value?document.getElementById('filter-campaign').selectedOptions[0].text:'','text',true,'Profile / company campaign name')+`<div class="form-row"><label for="csv-files">Bright Data CSV exports</label><input class="field" id="csv-files" name="csvFiles" type="file" accept=".csv,text/csv" multiple required></div>`+note('Select one or more CSV files for this campaign. Each file is identified by its source URLs and reviewed before the batch is saved. Profile values use collection timestamps; content and comments use their own publication dates. All modules use the imported records.' )+'<p class="scope-note" role="status" aria-live="polite"></p>','csv-form','Review detected data');
 const input=document.querySelector('#csv-form [name="campaign"]');
 const names=document.createElement('datalist');names.id='csv-campaign-names';
 for(const option of document.getElementById('filter-campaign').options)if(option.value)names.append(new Option(option.text,option.text));
 input.after(names);input.setAttribute('list',names.id);
}

const campaignFields=c=>field('name','Campaign name',c?.name||'','text',true)+
  PLATFORMS.map(p=>field('account-'+p,p+' handle or profile URL',c?.accounts?.[p]||'','text',false,'Optional')).join('');
async function editCampaign(id){
  if(!isAdmin())return;
  const c=await api('/api/campaigns/'+encodeURIComponent(id));
  modal('Edit campaign',campaignFields(c)+hidden('campaignId',c.id)+hidden('revision',c.revision)+
    note('Clear a field to disconnect that account. Previously collected records stay in the campaign history.')+
    '<p role="status" aria-live="polite"></p>','edit-campaign-form','Save changes');
}
async function showDeleteCampaigns(){
  modal('Delete campaigns','<div class="campaign-picker"></div><p role="status" aria-live="polite">Loading campaigns…</p>','delete-campaigns-form','Delete selected',true);
  const form=document.getElementById('delete-campaigns-form');
  const picker=form.querySelector('.campaign-picker');
  const status=form.querySelector('[role=status]');
  const submit=form.querySelector('button[type=submit]');
  try{
    const campaigns=await api('/api/campaigns');
    if(!form.isConnected)return;
    picker.innerHTML=campaigns.map(c=>'<label class="checkline"><input type="checkbox" name="campaignId" value="'+escapeHTML(c.id)+'">'+escapeHTML(c.name)+'</label>').join('');
    status.textContent=campaigns.length?'Select the campaigns to delete from this dashboard.':'There are no saved campaigns.';
    const selected=()=>Array.from(picker.querySelectorAll('input:checked'),input=>input.value);
    picker.onchange=()=>{submit.disabled=!selected().length;};
    form.onsubmit=async event=>{
      event.preventDefault();
      event.stopPropagation();
      const ids=selected();
      if(submit.disabled || !ids.length)return;
      const names=campaigns.filter(c=>ids.includes(c.id)).map(c=>c.name);
      if(!window.confirm('Permanently delete all saved records and import history for '+names.join(', ')+'? You can still pull data using the saved snapshot IDs.'))return;
      submit.disabled=true;
      picker.inert=true;
      try{
        await api('/api/campaigns/delete',{method:'POST',body:JSON.stringify({ids,confirmed:true})});
        if(form.isConnected)closeModal();
        Object.assign(state,defaultFilters);
        render();
        toast(names.length===1?'Campaign deleted.':names.length+' campaigns deleted.');
      }catch(error){status.textContent=error.message;picker.inert=false;submit.disabled=false;}
    };
  }catch(error){status.textContent=error.message;}
}
async function showRequest() {
  modal('Request Latest Data', selectField('campaign','Campaign',[],'')+selectField('platform','Social Platform',PLATFORMS,state.platform)+
    selectField('type','Content Type',[],'')+selectField('pullWindow','Collection window',[],'')+
    '<p class="scope-note" data-window-help></p>'+
    '<button type="button" class="btn" name="check" disabled>Check status</button><button type="button" class="btn" name="latest" disabled>Pull latest data</button>'+
    '<button type="button" name="clearData" class="btn" disabled>Clear Data</button>'+
    '<div hidden data-clear-prompt><p></p><button type="button" class="btn" name="clearNo">No</button> <button type="button" class="btn" name="clearYes">Yes</button></div>'+
    '<p role="status" aria-live="polite" class="scope-note">Loading platforms…</p>'+
    '<div hidden data-recovery><label for="recover-id">Matching campaign runs (Manila time)</label><select class="field" id="recover-id" name="snapshotId"></select><button class="btn" type="button" name="attach">Resume this snapshot</button><button class="btn" type="button" name="clearRun">Clear unconfirmed request</button></div>',
    'saved-snapshot-form','Review collected data',true);
  const form=document.getElementById('saved-snapshot-form');
  const {campaign,platform,type,pullWindow,check,latest,attach,clearRun,snapshotId,clearData,clearNo,clearYes}=form.elements;
  const prompt=form.querySelector('[data-clear-prompt]');
  const recovery=form.querySelector('[data-recovery]');
  const submit=form.querySelector('button[type="submit"]');
  const output=form.querySelector('[role="status"]');
  try {
    if(location.protocol==='file:') throw Error('Start Node and open the dashboard server URL to request data.');
    const campaigns=await api('/api/brightdata/sources?directory=1');
    if(!form.isConnected)return;
    campaign.replaceChildren(...campaigns.map(c=>new Option(c.name,c.id)));
    const initial=campaigns.find(c=>c.id===state.campaign)||campaigns.find(c=>c.name.toLowerCase()==='clevercatch')||campaigns[0];
    if(initial)campaign.value=initial.id;
    const selected=()=>campaigns.find(c=>c.id===campaign.value);
    const name=()=>selected()?.name||'';
    const scope=()=>new URLSearchParams({campaign:campaign.value,platform:platform.value,type:type.value});
    function hideRecovery(){recovery.hidden=true;snapshotId.value='';}
    function availability(){
      hideRecovery();
      output.textContent=type.value?name()+' data is available for '+platform.value+' > '+type.value+'.':(name()?'No social account is configured for '+name()+'.':'No campaign is available.');
    }
    function updateWindow(){
      const mode=selected()?.window_modes?.[platform.value]?.[type.value]||'all';
      const preferred=pullWindow.value||'all';
      pullWindow.replaceChildren(...PERIODS.map(([id,label])=>{
        const option=new Option(label,id);
        option.disabled=id!=='all'&&mode==='all';
        return option;
      }));
      pullWindow.value=mode==='all'?'all':preferred;
      form.querySelector('[data-window-help]').textContent=mode==='parents'?'Shorter windows collect comments from saved uploads published in that window. New comments on older uploads are outside this pull.':mode==='catalog'?'For shorter windows, the dashboard checks whether this scraper accepts publication dates before starting a paid collection.':mode==='dates'?'Shorter windows send publication dates to Bright Data before collection.':'All Time is available for this scraper. You can filter the saved results on the dashboard.';
      availability();
    }
    function selectType(){
      const choices=selected()?.platforms[platform.value]||[];
      type.replaceChildren(...choices.map(t=>new Option(t,t)));
      type.disabled=check.disabled=latest.disabled=clearData.disabled=submit.disabled=!choices.length;
      updateWindow();
    }
    function selectCampaign(){
      const available=Object.keys(selected()?.platforms||{});
      platform.replaceChildren(...available.map(p=>new Option(p,p)));
      platform.disabled=!available.length;
      platform.value=available.includes(state.platform)?state.platform:available[0]||'';
      selectType();
    }
    selectCampaign();
    campaign.onchange=selectCampaign;
    platform.onchange=selectType;
    type.onchange=updateWindow;
    async function request(preview){
      if(check.disabled)return;
      campaign.disabled=platform.disabled=type.disabled=pullWindow.disabled=check.disabled=latest.disabled=clearData.disabled=submit.disabled=true;
      output.textContent=preview?'Loading collected data…':'Checking status…';
      try {
        const query=scope();
        const result=await api('/api/brightdata/'+(preview?'preview':'saved-status')+'?'+query,
          preview?{method:'POST'}:{});
        if(!form.isConnected)return;
        if(preview){
          modal('Confirm Data Collected',note(name()+' > '+platform.value+' > '+type.value)+note('Snapshot > '+escapeHTML(result.snapshot_id)+' > '+escapeHTML(PERIODS.find(([id])=>id===result.period)?.[1]||'All Time'))+
            note(result.accepted+' records to save > '+result.duplicates+' repeated rows combined > '+result.outside_window+' outside the window > '+result.errors.length+' rows skipped')+note('Confirm to update matching records with newer values and keep earlier history.')+
            '<p role="status" aria-live="polite" class="scope-note"></p><input type="hidden" name="previewId" value="'+escapeHTML(result.id)+'">',
            'save-snapshot-form','Confirm',!result.can_confirm);
        }else output.textContent=result.status+' > '+new Date().toLocaleTimeString('en-PH',{timeZone:'Asia/Manila'})+' Manila';
      }catch(error){output.textContent=error.message;}
      finally{campaign.disabled=platform.disabled=type.disabled=pullWindow.disabled=check.disabled=latest.disabled=clearData.disabled=submit.disabled=false;}
    }
    async function refreshLatest(start,decision){
      if(check.disabled)return;
      if(start && !window.confirm('Collect the latest '+platform.value+' '+type.value+' for '+name()+' ('+pullWindow.selectedOptions[0].text+')? Bright Data usage charges may apply.'))return;
      const query=scope();
      if(start)query.set('window',pullWindow.value);
      campaign.disabled=platform.disabled=type.disabled=pullWindow.disabled=check.disabled=latest.disabled=clearData.disabled=submit.disabled=true;
      try{
        output.textContent=start?'Requesting fresh data…':'Checking status…';
        attach.disabled=clearRun.disabled=true;
        const route=decision?'recover':(start?'rerun':'continue');
        let result=await api('/api/brightdata/'+route+'?'+query,{method:'POST',body:decision?JSON.stringify(decision):undefined});
        if(!form.isConnected)return;
        if(result.status==='unconfirmed'){
          recovery.hidden=false;
          const matches=result.matches || [];
          snapshotId.replaceChildren(new Option('Select a matching run',''),...matches.map(row=>new Option(
            new Date(row.created).toLocaleString('en-PH',{timeZone:'Asia/Manila'})+' > '+row.status+' > '+row.id,row.id)));
          snapshotId.hidden=attach.hidden=form.querySelector('label[for="recover-id"]').hidden=!matches.length;
          clearRun.hidden=Boolean(matches.length);
          output.textContent=matches.length?'Choose the run from the time you requested data. The scraper and inputs match.':'No matching run is visible yet. Check status again shortly. Clear the request only if you want to allow a new pull.';
          return;
        }
        hideRecovery();
        while(form.isConnected && ['starting','running'].includes(result.status)){
          output.textContent='Bright Data is collecting. You can review the results when ready. Reopen and check status to resume.';
          await new Promise(resolve=>setTimeout(resolve,5000));
          if(!form.isConnected)return;
          result=await api('/api/brightdata/continue?'+query,{method:'POST'});
        }
        if(result.status==='ready'){
          output.textContent='Data is ready. Choose Review collected data, then Confirm to update the dashboard.';
        }else if(result.status==='imported' && result.campaign){
          Object.assign(state,defaultFilters);
          render();
          output.textContent=name()+' updated > '+result.accepted+' records saved > '+result.rejected+' rows skipped';
        }else if(['idle','imported','failed','canceled','cancelled'].includes(result.status)){
          const failed=['failed','canceled','cancelled'].includes(result.status);
          const prefix=failed?'Latest pull '+result.status+' > Previous snapshot kept > ':'';
          try{
            const saved=await api('/api/brightdata/saved-status?'+query);
            output.textContent=saved.status==='not_started'?prefix+'No saved snapshot yet.':prefix+saved.snapshot_id+' > '+saved.status+' > '+new Date().toLocaleTimeString('en-PH',{timeZone:'Asia/Manila'})+' Manila';
          }catch(error){output.textContent=prefix+error.message;}
        }else if(result.status==='not_started'){
          output.textContent='No snapshot yet for '+name()+' > '+platform.value+' > '+type.value+'. Choose Pull latest data to start.';
        }else output.textContent='Collection status: '+result.status;
      }catch(error){output.textContent=error.message;}
      finally{campaign.disabled=platform.disabled=type.disabled=pullWindow.disabled=check.disabled=latest.disabled=clearData.disabled=submit.disabled=attach.disabled=clearRun.disabled=false;}
    }
    attach.onclick=()=>{
      const id=snapshotId.value.trim();
      if(!id){output.textContent='Select a matching run first.';snapshotId.focus();return;}
      if(window.confirm('Import this '+name()+' '+platform.value+' '+type.value+' run as the replacement for the saved CSV?'))
        refreshLatest(false,{action:'attach',snapshot_id:id});
    };
    clearRun.onclick=()=>{
      if(window.confirm('Clear this request? A delayed run could still appear. A later pull may incur a second charge.'))
        refreshLatest(false,{action:'clear',confirmed:true});
    };
    clearData.onclick=()=>{
      if(clearData.disabled)return;
      hideRecovery();
      campaign.disabled=platform.disabled=type.disabled=pullWindow.disabled=check.disabled=latest.disabled=clearData.disabled=submit.disabled=true;
      prompt.querySelector('p').textContent='Clear saved '+name()+' data for '+platform.value+' > '+type.value+' from this dashboard?';
      prompt.hidden=false;
      clearNo.focus();
    };
    function finishClear(){
      prompt.hidden=true;
      campaign.disabled=platform.disabled=type.disabled=pullWindow.disabled=check.disabled=latest.disabled=clearData.disabled=submit.disabled=false;
      clearYes.disabled=clearNo.disabled=false;
      clearData.focus();
    }
    clearNo.onclick=()=>{finishClear();};
    clearYes.onclick=async()=>{
      if(clearYes.disabled || prompt.hidden)return;
      clearYes.disabled=clearNo.disabled=true;
      const query=scope();
      output.textContent='Clearing saved data…';
      try{
        const saved=await api('/api/brightdata/clear-data?'+query,{method:'POST',body:JSON.stringify({confirmed:true})});
        render();
        output.textContent=saved.count?'Cleared the saved '+platform.value+' '+type.value+' collection.':'There was no saved data for this collection.';
      }catch(error){output.textContent=error.message;}
      finally{finishClear();}
    };
    latest.onclick=()=>refreshLatest(true);
    check.onclick=()=>refreshLatest(false);
    form.onsubmit=event=>{event.preventDefault();event.stopPropagation();request(true);};
  }catch(error){output.textContent=error.message;}
}
function parseCSV(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){let c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"'){if(cell)throw Error('Invalid quoting in CSV.');quoted=true;}else if(c===','){row.push(cell);cell='';}else if(c==='\n'){row.push(cell.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}if(quoted)throw Error('CSV has an unclosed quoted value.');if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}const headers=(rows.shift()||[]).map(h=>h.replace(/^\uFEFF/,'').trim());if(!headers.length||headers.some(h=>!h)||new Set(headers).size!==headers.length)throw Error('CSV needs unique, non-empty column headers.');if(!rows.length)throw Error('CSV contains no data rows.');if(rows.some(r=>r.length!==headers.length))throw Error('CSV column counts do not match the header.');return {headers,rows};}
const FIELD_MAP={url:'source_url',input_url:'input_url',user_name:'profile.display_name',name:'profile.display_name',nickname:'profile.display_name',account:'profile.username',username:'profile.username',followers:'profile.followers',followers_count:'profile.followers',subscribers:'profile.followers',biography:'profile.description',description:'description',Description:'profile.description',about:'profile.description',post_id:'source_content_id',id:'source_record_id',video_id:'source_content_id',comment_id:'source_comment_id',post_url:'parent_content_url',video_url:'parent_content_url',content:'content_text',comment:'comment_text',comment_text:'comment_text',text:'record_text',caption:'content_text',title:'content_title',date_posted:'published_at',create_time:'published_at',timestamp:'collected_at',likes:'like_count',num_likes:'like_count',like_count:'like_count',comments:'reported_comment_count',num_comments:'reported_comment_count',comment_count:'reported_comment_count',share_count:'share_count',num_shares:'share_count',num_share_count:'share_count',views:'view_count',video_view_count:'view_count',video_play_count:'play_count',play_count:'play_count',collect_count:'save_count',hashtags:'hashtags',error:'import_error',error_code:'import_error_code'};
function onAction(a,p){switch(a){case 'refreshActivity':render();break;case 'goto':go(p);break;case 'overviewLink':case 'tabLink':{const [r,t]=p.split('|');if(t)state.tabs[r]=t;go(r,a==='overviewLink');break;}case 'tab':state.tabs[state.route]=p;render();break;case 'toggleDrawer':state.drawer=!state.drawer;render();break;case 'closeDrawer':state.drawer=false;render();break;case 'closeModal':closeModal();break;case 'importCsv':showImport();break;case 'requestData':showRequest();break;case 'addCampaign':modal('Add campaign',campaignFields(),'add-campaign-form','Confirm');break;case 'editCampaign':editCampaign(p).catch(e=>toast(e.message));break;case 'deleteCampaigns':showDeleteCampaigns();break;default:accountOrLibraryAction(a,p).catch(e=>toast(e.message));}}
async function loadAccess(){
 const [user,rules]=await Promise.all([api('/api/session'),api('/api/keywords')]);
 session=user;state.terms=rules;
 accounts=isAdmin()?await api('/api/accounts'):[];
}
async function accountOrLibraryAction(a,id){
 if(a==='reviewSignal'&&canManage()){
   const row=signalRows.get(id);if(!row)return;
   return modal('Review flagged comments',note(escapeHTML(row.detail))+hidden('id',id)+hidden('campaign',row.campaign)+hidden('platform',row.platform)+hidden('window',state.period)+selectField('decision','Review status',['Pending review','Reviewed','Dismissed'],row.status),'signal-form','Save decision');
 }
 if(a==='login')return modal('Sign in',field('email','Email address','','email')+field('password','Password','','password'),'login-form','Sign in');
 if(a==='logout'){await api('/api/logout',{method:'POST'});await loadAccess();render();return;}
 if(['addUser','manageUser','removeUser'].includes(a)&&isAdmin()){
   const u=accounts.find(x=>x.id===id)||{};
   if(a==='removeUser')return confirmRemove('account',u.id,u.name);
   modal(id?'Edit account':'Add account',hidden('id',id)+field('name','Name',u.name)+field('email','Email address',u.email,'email')+
     selectField('role','Role',['Administrator','Analyst','Guest'],u.role||'Analyst')+
     selectField('status','Status',['Active','Inactive'],u.status||'Active')+
     field('password','New password','','password',!id,'At least 6 characters',6,'new-password')+
     field('confirmPassword','Confirm password','','password',!id,'Enter the new password again',0,'new-password')+
     (id?note('Leave both password fields blank to keep the current password.'):''),'user-form','Save account');
 }else if(['addTerm','editTerm','removeTerm'].includes(a)&&canManage()){
   const rule=state.terms.find(t=>t.id===id)||{};
   if(a==='removeTerm')return confirmRemove('keyword',id,rule.term);
   modal(id?'Edit keyword rule':'Add keyword rule',hidden('id',id)+field('term','Exact phrase',rule.term)+field('variants','Variations (comma separated)',rule.variants,'text',false)+field('category','Category',rule.category)+selectField('sentiment','Sentiment rule',['Positive','Negative','Neutral','Context review'],rule.sentiment||'Context review'),'term-form','Save rule');
 }else if(a==='reviewComment'&&canManage()){
   const r=reviewRows.get(id);if(!r)return;
   modal('Review comment',note(r.text)+note('Rule result: '+r.result)+hidden('campaign',r.campaign)+hidden('key',r.key)+hidden('fingerprint',r.fingerprint)+selectField('decision','Your classification',['Positive','Negative','Neutral','Mixed','Unclassified'],r.decision||(['Context review','Unclassified'].includes(r.result)?'Unclassified':r.result)),'review-form','Save decision');
 }
}
function hidden(name,value){return '<input type="hidden" name="'+name+'" value="'+escapeHTML(value)+'">';}
function confirmRemove(kind,id,label){modal('Remove '+kind,note('Remove “'+label+'”?')+hidden('id',id)+hidden('kind',kind),'remove-form','Yes, remove');}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b){onAction(b.dataset.action,b.dataset.param||'');return;}const n=e.target.closest('[data-route]');if(n){go(n.dataset.route);return;}const g=e.target.closest('[data-group]');if(g){const groupId=g.dataset.group;
if(state.openGroups.has(groupId)) state.openGroups.delete(groupId);
else state.openGroups.add(groupId);
render();}if(e.target.matches('.modal-overlay'))closeModal();});
document.addEventListener('change',e=>{if(e.target.id==='filter-campaign')state.campaign=e.target.value;else if(e.target.id==='filter-platform')state.platform=e.target.value;else if(e.target.id==='filter-period')state.period=e.target.value;else return;render();});
document.addEventListener('keydown',e=>{const m=document.querySelector('.modal-box');if(!m)return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){const f=[...m.querySelectorAll('button:not([disabled]),input,select')];if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0].focus();}}});
document.addEventListener('input',e=>{
 const input=e.target;
 if(input.form?.getAttribute('id')==='user-form' && ['password','confirmPassword'].includes(input.name)){
   input.form.elements.confirmPassword.setCustomValidity('');
 }
});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;const formId=f.getAttribute('id');const d=Object.fromEntries(new FormData(f));try{if(formId==='save-snapshot-form'){const button=f.querySelector('[type=submit]');
  if(button.disabled)return;
  const message=f.querySelector('[role=status]');
  button.disabled=true;
  button.textContent='Saving…';
  message.textContent='Updating your dashboard…';
  try{
    const saved=await api('/api/imports/'+encodeURIComponent(d.previewId)+'/commit',{method:'POST',body:'{}'});
    Object.assign(state,defaultFilters);
    
    if(f.isConnected)closeModal();
    render();
    toast('Dashboard updated > '+saved.accepted+' records saved.');
  }catch(error){
    message.textContent=error.message;
  }finally{button.disabled=false;button.textContent='Confirm';}
  return;
}if(formId==='add-campaign-form'||formId==='edit-campaign-form'){
 const editing=formId==='edit-campaign-form';
 const submit=f.querySelector('[type=submit]');
 if(submit.disabled)return;
 submit.disabled=true;
 try{
   const saved=await api('/api/campaigns'+(editing?'/'+encodeURIComponent(d.campaignId):''),{method:editing?'PUT':'POST',body:JSON.stringify({name:d.name,revision:d.revision,accounts:Object.fromEntries(PLATFORMS.map(p=>[p,d['account-'+p]||'']))})});
   if(!editing)Object.assign(state,defaultFilters,{campaign:saved.id});
   closeModal();render();toast(editing?'Campaign updated.':'Campaign added.');
 }catch(error){if(!editing)throw error;f.querySelector('[role=status]').textContent=error.message;}finally{submit.disabled=false;}
 return;
}if(formId==='csv-form'){const files=[...f.elements.csvFiles.files];if(!files.length)throw Error('Select at least one CSV file.');if(files.length>20)throw Error('Select no more than 20 CSV files per batch.');for(const file of files)if(file.size>20*1024*1024)throw Error(file.name+' is over 20 MB.');const submit=f.querySelector('[type="submit"]');
const progress=f.querySelector('[role="status"]');
if(submit.disabled)return;
submit.disabled=true;
const previews=[];
try {
  for(const [index,file] of files.entries()){
    if(!f.isConnected)return;
    const label=(index+1)+' of '+files.length+' > '+file.name;
    progress.textContent='Reviewing '+label;
    try{
      const result=await api('/api/imports/preview',{
        method:'POST',body:JSON.stringify({filename:file.name,campaign:d.campaign,csv:await file.text()})
      });
      previews.push({file:file.name,...result});
    }catch(error){
      progress.textContent='Review stopped at '+label+'. '+error.message+' No records have been saved.';
      return;
    }
  }
}finally{submit.disabled=false;}
if(!f.isConnected)return;
const summary=previews.map(x=>note(x.file+' > '+(x.platforms.join(', ')||'No platform detected')+' > '+x.types.join(', ')+' > '+x.accepted+' valid > '+x.duplicates+' duplicates > '+x.errors.length+' rejected')).join('');const errors=previews.flatMap(x=>x.errors.map(e=>[escapeHTML(x.file+' > row '+e.row),escapeHTML(e.message)]));modal('Confirm CSV batch import',summary+note('The files will be saved together for campaign “'+escapeHTML(d.campaign)+'”. Each record’s own date controls the selected reporting window.')+table(['File / row','Reason'],'import.errors',errors.slice(0,100))+`<input type="hidden" name="previewIds" value="${escapeHTML(JSON.stringify(previews.map(x=>x.id)))}">`,'commit-import','Save all files',!previews.some(x=>x.accepted));}else if(formId==='commit-import'){const out=await api('/api/imports/commit-batch',{method:'POST',body:JSON.stringify({ids:JSON.parse(d.previewIds)})});Object.assign(state,defaultFilters);closeModal();render();toast(out.files+' CSV files imported. Showing All Time; choose any timeframe to filter by record dates.');}else if(['signal-form','login-form','term-form','user-form','remove-form','review-form'].includes(formId)){
 if(formId==='user-form'){
   const confirm=f.elements.confirmPassword;
   confirm.setCustomValidity(d.password===d.confirmPassword?'':'The passwords differ. Enter the same password in both fields.');
   if(!confirm.reportValidity())return;
   delete d.confirmPassword;
 }
 const submit=f.querySelector('[type=submit]');if(submit.disabled)return;submit.disabled=true;
 try{
   if(formId==='login-form')await api('/api/login',{method:'POST',body:JSON.stringify(d)});
   else if(formId==='signal-form')await api('/api/signals/review',{method:'POST',body:JSON.stringify(d)});
   else if(formId==='review-form')await api('/api/reviews',{method:'POST',body:JSON.stringify(d)});
   else{
     const collection=formId==='user-form'||d.kind==='account'?'accounts':'keywords';
     await api('/api/'+collection+(d.id?'/'+encodeURIComponent(d.id):''),{method:formId==='remove-form'?'DELETE':d.id?'PUT':'POST',body:JSON.stringify(d)});
   }
   await loadAccess();closeModal();render();toast(formId==='login-form'?'Signed in.':formId==='remove-form'?'Removed.':'Changes saved.');
 }finally{submit.disabled=false;}
}}catch(err){toast(err.message);}});

let dataRequest=0;
async function api(path,options={}){if(location.protocol==='file:')throw Error('Start the backend and open http://localhost:3000 to import CSVs.');let r;try{r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options.headers}});}catch{throw Error('Connection to '+location.origin+' failed. Keep npm start running and check '+location.origin+'/api/health before retrying.');}let data;try{data=await r.json();}catch{throw Error('Backend unavailable. Start the server and use its dashboard URL.');}if(!r.ok){if(r.status===401&&session.id&&path!=='/api/login'){session={role:'Guest'};accounts=[];closeModal();render();}throw Error(data.error||'Request failed');}return data;}
const linkCell=(url,label='Open source ↗')=>{try{const u=new URL(url);if(!['https:','http:'].includes(u.protocol))return '—';return `<a href="${escapeHTML(u.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`;}catch{return '—';}};
// Imported timestamps are normalized to UTC ISO strings. Missing dates sort last.
function newestBy(field) {
  return (left, right) => {
    const byDate = (right[field] || '').localeCompare(left[field] || '');
    return byDate || left.key.localeCompare(right.key) || left.campaign_id.localeCompare(right.campaign_id);
  };
}
const manilaTimestamp = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
});
function displayTimestamp(value) {
  return value ? manilaTimestamp.format(new Date(value)) : '—';
}
function fillTable(key,rows){const t=document.querySelector(`table[data-field="${key}"]`);if(!t||!rows.length)return;t.querySelector('tbody').innerHTML=rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('');}
async function refreshData(){const version=++dataRequest;try{const params=new URLSearchParams({window:state.period,...(state.campaign?{campaign:state.campaign}:{}),...(state.platform!=='All platforms'?{platform:state.platform}:{})});if(['buzzwords','audience','dashboard','monitor'].includes(state.route))params.set('keywords','1');if(state.route==='monitor'||state.route==='dashboard')params.set('trends','1');if(state.route==='credibility')params.set('signals','1');
 if(state.route==='campaigns'&&tabName()==='Campaign profiles')params.set('accounts','1');
 const sources=state.route==='settings'&&tabName()==='Data sources';
 if(sources)params.set('integration','1');
 const activityPage=state.route==='settings'&&tabName()==='Processing activity'&&canManage();
 const [data,campaigns,imports,activity]=await Promise.all([api('/api/data?'+params),api('/api/campaigns'),api('/api/imports'),activityPage?api('/api/activity'):null]);if(version!==dataRequest)return;
 const select=document.getElementById('filter-campaign');select.innerHTML='<option value="">All campaigns</option>'+campaigns.map(c=>`<option value="${c.id}" ${c.id===state.campaign?'selected':''}>${escapeHTML(c.name)}</option>`).join('');
 const identityCard=document.getElementById('campaign-identity');
 if(identityCard)identityCard.innerHTML=campaignIdentity(campaigns.filter(c=>!state.campaign||c.id===state.campaign));
 const records=data.records,posts=records.filter(r=>r.type==='content'),comments=records.filter(r=>r.type==='comment'),profiles=records.filter(r=>r.type==='profile');
 const sum=(rs,key)=>{const known=rs.filter(r=>r[key]!=null);return known.length?known.reduce((a,r)=>a+r[key],0):null;};const likes=sum(posts,'likes'),reported=sum(posts,'comments'),shares=sum(posts,'shares'),saves=sum(posts,'saves');const view=sum(posts.map(r=>({...r,exposure:r.views??r.plays})),'exposure');const observed=records.length>0;const knownInteractions=[likes,reported,shares,saves].some(x=>x!=null)?[likes,reported,shares,saves].reduce((n,x)=>n+(x??0),0):null;
 const ids=new Map();for(const c of comments){if(!c.author)continue;const key=c.campaign_id+'|'+c.platform+'|'+c.author;const parents=ids.get(key)||new Set();parents.add(c.parent_url);ids.set(key,parents);}
 const parentKey=(r,url)=>[r.campaign_id,r.platform,String(url||'').split('#')[0].replace(/\/$/,'')].join('|');
 const parents=new Set(posts.filter(r=>r.url).map(r=>parentKey(r,r.url)));
 const matchedComments=comments.filter(r=>r.parent_url&&parents.has(parentKey(r,r.parent_url)));
 const commentDays=new Set(comments.filter(r=>r.published_at).map(r=>new Date(Date.parse(r.published_at)+8*3600000).toISOString().slice(0,10)));
 const xPosts=posts.filter(r=>r.platform==='X').map(r=>{
   const raw=r.raw||{};
   const input=raw.quotes??raw.quote_count;
   const quotes=input!=null&&String(input).trim()!==''?Number(String(input).replace(/,/g,'')):null;
   return {quotes:Number.isFinite(quotes)?quotes:null,bookmarks:r.saves};
 });
 const values={quotes:sum(xPosts,'quotes'),bookmarks:sum(xPosts,'bookmarks'),'audience.comments_per_content':posts.length?Number((matchedComments.length/posts.length).toFixed(2)):null,'audience.comment_dates':observed?commentDays.size:null,'audience.parent_match_count':observed?matchedComments.length:null,content_count:posts.length||(!observed?null:0),known_interactions:knownInteractions,collected_comment_count:comments.length||(!observed?null:0),text_comment_count:comments.filter(c=>c.text?.trim()).length||(!observed?null:0),commenter_identity_count:ids.size||(!observed?null:0),likes_or_reactions:likes,reported_comments:reported,shares,saves,views_or_plays:view,'sentiment.eligible_comments':comments.filter(c=>c.text?.trim()).length||null,'sentiment.pending_count':comments.filter(c=>c.text?.trim()).length||null,'audience.returning_commenters':[...ids.values()].filter(v=>v.size>=2).length||(!observed?null:0),'audience.counter_coverage':posts.filter(r=>[r.likes,r.comments,r.shares,r.saves].some(v=>v!=null)).length||(!observed?null:0),'audience.view_coverage':posts.filter(r=>r.views!=null||r.plays!=null).length||(!observed?null:0),'integration.backend_status':'Connected'};
 if(data.integration){
   const configured=data.integration.configured;
   values['integration.credential_status']=data.integration.credential_present?'Configured':'No API key saved';
   values['integration.last_success_at']=displayTimestamp(imports.find(row=>row.snapshot_id)?.created_at);
   fillTable('integration.platforms',PLATFORMS.filter(p=>state.platform==='All platforms'||state.platform===p).map(platform=>{
     const rows=records.filter(r=>r.platform===platform);
     const counts=['profile','content','comment'].map(type=>rows.filter(r=>r.type===type).length||'—');
     return [platform,...counts,escapeHTML(configured[platform]?.join(', ')||(data.integration.supported?.[platform]?.join(', ')?data.integration.supported[platform].join(', ')+' > Connect an account':'CSV only')),badge(rows.length?'Imported':'No matching records')];
   }));
 }
 if(activity){
   const rows=activity.map(r=>[displayTimestamp(r.created_at),escapeHTML(r.actor_name),escapeHTML(r.actor_role),escapeHTML(r.operation),escapeHTML(r.subject),badge(r.outcome)]);
   fillTable('jobs.history',rows.length?rows:[['No requests recorded yet.','—','—','—','—','—']]);
 }
 if(data.flags){
   signalRows=new Map(data.flags.map(row=>[row.id,row]));
   values['risk.flag_count']=data.flags.length;
   values['risk.pending_review_count']=data.flags.filter(row=>row.status==='Pending review').length;
   const days=new Map();
   for(const row of data.flags){
     const day=new Date(Date.parse(row.date)+8*3600000).toISOString().slice(0,10);
     if(!days.has(day))days.set(day,[0,0]);
     days.get(day)[row.rule==='Comment burst'?0:1]++;
   }
   const timeline=[...days].sort(([a],[b])=>a.localeCompare(b)).map(([day,counts])=>[day,...counts]);
   fillTable('risk.events',timeline);
   dashboardCharts.signals(document.querySelector('[data-field="risk.events"]')?.closest('.table-wrap'),timeline);
   const rows=data.flags.map(row=>[escapeHTML(campaigns.find(c=>c.id===row.campaign)?.name||'—'),row.platform,row.rule,escapeHTML(row.detail),displayTimestamp(row.date),badge(row.status),linkCell(row.url),canManage()?button('Review','reviewSignal','tiny',row.id):'—']);
   if(rows.length)fillTable('risk.review_queue',rows);
   else document.querySelector('[data-field="risk.review_queue"] .data-empty').textContent='No comment groups meet the review rules for this selection.';
 }
 const assessments=new Map((data.analysis||[]).map(a=>[a.campaign+':'+a.key,a]));
 const assessed=r=>assessments.get(r.campaign_id+':'+r.key);
 const eligible=comments.map(assessed).filter(Boolean);
 if(state.route==='buzzwords')dashboardCharts.sentiment(document.querySelector('[data-field="sentiment.positive"]')?.closest('dl'),eligible);
 const classification=a=>a.decision||a.result;
 if(state.route==='buzzwords'){
   values['sentiment.eligible_comments']=eligible.length;
   values['sentiment.pending_count']=eligible.filter(a=>classification(a)==='Unclassified').length;
   values['sentiment.review_count']=eligible.filter(a=>!a.decision&&['Context review','Mixed'].includes(a.result)).length;
   for(const [label,key] of [['Positive','positive'],['Negative','negative'],['Neutral','neutral'],['Mixed','mixed'],['Context review','context'],['Unclassified','unclassified']]){
     values['sentiment.'+key]=eligible.length?(100*eligible.filter(a=>classification(a)===label).length/eligible.length).toFixed(1)+'%':null;
   }
 }
 if(data.trends){
   const t=data.trends;
   const recurring=new Set(t.power.filter(r=>r.active>=2).map(r=>r.term)).size;
   const longSpan=new Set(t.power.filter(r=>r.active>=3&&r.span>=30).map(r=>r.term)).size;
   for(const [key,count] of Object.entries({recurring,long_span:longSpan,content_weeks:t.eligible.content,comment_weeks:t.eligible.comment}))
     values['trend.'+key]=t.eligible.content||t.eligible.comment?count:null;
   const timeline=rows=>rows.map(r=>[r.date,r.content,r.comment,escapeHTML(r.terms.join(', '))]);
   const power=state.route==='dashboard'||tabName()==='Trend Power';
   if(power){
     fillTable('trend.persistence_series',timeline(t.weeks));
     fillTable('trend.persistence',t.power.map(r=>[escapeHTML(r.term),r.type,r.count,r.first,r.last,r.span,r.active+' / '+r.total,r.coverage==null?'—':r.coverage+'%',escapeHTML(r.platforms.join(', ')),badge(r.status)]));
   }else{
     fillTable('trend.keyword_series',timeline(t.days));
     fillTable('trend.radar',t.radar.map(r=>[escapeHTML(r.term),r.content,r.comment,escapeHTML(r.platforms.join(', ')),r.first||'—',r.last||'—',r.dayCount]));
   }
   const anchor=document.querySelector(power?'table[data-field="trend.persistence"]':'table[data-field="trend.radar"]')?.closest('.table-wrap');
   dashboardCharts.topics(anchor,t,power);
 }
 if(state.route==='campaigns')Object.assign(values,profileStatistics(profiles,data.last_pull_at));
 for(const el of document.querySelectorAll('[data-field]')){const key=el.dataset.field;if(!(key in values))continue;const target=el.querySelector('.kpi-value,dd');if(target){const val=values[key];target.textContent=val==null?'—':typeof val==='number'?val.toLocaleString('en-PH'):val;target.setAttribute('aria-label',val==null?'No value available':String(val));}}
 document.querySelector('.filter-hint').textContent=(observed?'Imported data':'No matching records')+' > '+labelPeriod()+(data.unknown_dates?' > '+data.unknown_dates+' undated':'');
 const pr=posts.sort(newestBy('published_at'));
 const cr=comments.sort(newestBy('published_at'));
 if(data.analysis){
   const frequencies=new Map();
   for(const a of data.analysis)for(const h of a.hits)frequencies.set(h.term,(frequencies.get(h.term)||0)+1);
   const sorted=data.trends?data.trends.radar.map(r=>[r.term,r.content+r.comment]):[...frequencies].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
   for(const key of ['keywords.cloud','trend.keyword_cloud']){
     const el=document.querySelector('[data-field="'+key+'"]');
     if(el&&sorted.length)el.innerHTML=sorted.map(([term,n])=>'<span>'+escapeHTML(term)+' <b>'+n+'</b></span>').join('');
   }
 }
 if(state.route==='buzzwords'){
   reviewRows.clear();
   fillTable('sentiment.review',cr.filter(assessed).map(r=>{
     const a=assessed(r),id=r.campaign_id+':'+r.key;
     reviewRows.set(id,{...a,text:r.text});
     const status=a.decision?'Reviewed':['Context review','Mixed'].includes(a.result)?'Needs review':'Rule result';
     return [escapeHTML(r.platform),escapeHTML(r.text),escapeHTML(a.hits.map(h=>h.term).join(', ')||'—'),badge(classification(a)),badge(status)+(canManage()?' '+button('Review','reviewComment','tiny',id):''),displayTimestamp(r.published_at),linkCell(r.parent_url||r.url)];
   }));
   fillTable('keywords.matches',[...pr,...cr].sort(newestBy('published_at')).flatMap(r=>(assessed(r)?.hits||[]).map(h=>[escapeHTML(r.platform),escapeHTML([r.title,r.text].filter(Boolean).join(' ')),escapeHTML(h.phrase),escapeHTML(h.term),escapeHTML(r.type),displayTimestamp(r.published_at),linkCell(r.parent_url||r.url)])));
 }
 if(state.route==='campaigns')fillTable('campaign.content',pr.map(r=>[r.platform,escapeHTML(r.title||r.text||'—'),displayTimestamp(r.published_at),escapeHTML(r.raw.post_type||r.raw.content_type||'Post'),fmt(r.likes),fmt(r.comments),fmt(r.shares),fmt(r.views??r.plays),linkCell(r.url)]));
 if(state.route==='audience'){
 const names=new Map(campaigns.map(c=>[c.id,escapeHTML(c.name)]));
 fillTable('audience.comments',cr.map(r=>[names.get(r.campaign_id)||'—',r.platform,escapeHTML(r.text||'—'),escapeHTML(r.author||'—'),displayTimestamp(r.published_at),fmt(r.likes),linkCell(r.parent_url),badge(assessed(r)?classification(assessed(r)):'—')]));
 fillTable('audience.interactions',pr.map(r=>[names.get(r.campaign_id)||'—',r.platform,escapeHTML(r.title||r.text||'—'),displayTimestamp(r.collected_at),displayTimestamp(r.published_at),fmt([r.likes,r.comments,r.shares,r.saves].every(x=>x==null)?null:[r.likes,r.comments,r.shares,r.saves].reduce((n,x)=>n+(x??0),0)),fmt(r.views??r.plays),linkCell(r.url)]));
 }
 if(data.accounts){
   const rows=campaigns.filter(c=>!state.campaign||c.id===state.campaign).flatMap(c=>{
     const accounts=data.accounts[c.id]||{};
     const available=PLATFORMS.filter(p=>state.platform==='All platforms'||state.platform===p);
     const platforms=available.filter(p=>c.accounts_edited?c.accounts?.[p]:Object.hasOwn(accounts,p)||c.accounts?.[p]);
     if(state.platform!=='All platforms'&&!platforms.length)return [];
     const links=platforms.flatMap(p=>{
       const urls=c.accounts_edited?[c.accounts[p]]:[...new Set([...(accounts[p]||[]),c.accounts?.[p]].filter(Boolean))];
       return urls.map(url=>'<li>'+escapeHTML(p)+' '+linkCell(url,url.replace(/^https?:\/\/(?:www\.)?/,''))+'</li>');
     });
     const profiles=links.length?'<details class="campaign-links"><summary>Open source</summary><ul>'+links.join('')+'</ul></details>':'—';
     const clean=url=>url.replace(/^https?:\/\/(?:www\.)?/i,'').replace(/\/$/,'').toLowerCase();
     const imported=platforms.some(p=>c.accounts_edited?(accounts[p]||[]).some(url=>clean(url)===clean(c.accounts[p])):Object.hasOwn(accounts,p));
     return [[escapeHTML(c.name),platforms.join(', ')||'—',profiles,badge(imported?'Imported':'Awaiting import'),...(isAdmin()?[button('Edit','editCampaign','tiny',c.id)]:[])]];
   });
   fillTable('campaign.accounts',rows);
 }
 fillTable('overview.campaigns',profiles.map(r=>[escapeHTML(r.name||'—'),r.platform,fmt(r.followers),String(posts.filter(p=>p.campaign_id===r.campaign_id&&p.platform===r.platform).length),escapeHTML(r.collected_at||'—')]));
 const coverage=document.querySelector('table[data-field="overview.platform_coverage"]');if(coverage)coverage.querySelector('tbody').innerHTML=PLATFORMS.map(p=>{const all=records.filter(r=>r.platform===p);return '<tr>'+[p,...['profile','content','comment'].map(t=>all.some(r=>r.type===t)?String(all.filter(r=>r.type===t).length):'—'),escapeHTML(all.map(r=>r.collected_at).filter(Boolean).sort().at(-1)||'—'),badge(all.length?'Imported':'No input')].map(v=>'<td>'+v+'</td>').join('')+'</tr>';}).join('');
 fillTable('imports.history',imports.map(i=>[i.id.slice(0,8),escapeHTML(campaigns.find(c=>c.id===i.campaign)?.name||'—'),i.platforms.join(', '),i.types.join(', '),'By record dates',escapeHTML(i.filename),badge('Saved')]));
 // Daily details and charts use the same Manila publication dates.
 const dayFormat = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Manila', year:'numeric', month:'2-digit', day:'2-digit'});
 for (const key of ['overview.activity_series','campaign.content_series','audience.activity_series']) {
   const element = document.querySelector(`[data-field="${key}"]`);
   if (!element) continue;
   const audience = key === 'audience.activity_series';
   const days = new Map();
   for (const record of (audience ? posts.concat(comments) : posts)) {
     if (!record.published_at) continue;
     const day = dayFormat.format(new Date(record.published_at));
     const totals = days.get(day) || {content:0, comment:0, interactions:null};
     if(record.type==='content'){
       const counters=[record.likes,record.comments,record.shares,record.saves].filter(Number.isFinite);
       if(counters.length)totals.interactions=(totals.interactions??0)+counters.reduce((n,v)=>n+v,0);
     }
     totals[record.type]++;
     days.set(day, totals);
   }
   if (!days.size) continue;
   const orderedDays = [...days.keys()].sort();
   const recent = audience ? orderedDays.reverse() : orderedDays;
   {element.classList.add('audience-dates');element.tabIndex=0;element.setAttribute('role','region');element.setAttribute('aria-label','Activity by date');}
   element.innerHTML = '<strong>Imported activity by date</strong>' + recent.map(day => {
     const totals = days.get(day);
     const counts = audience ? totals.content+' uploads > '+totals.comment+' comments' : totals.content+' uploads'+(key==='overview.activity_series'?' > '+(totals.interactions??'—')+' known interactions':'');
     return '<span>'+day+' > '+counts+'</span>';
   }).join('');
   dashboardCharts.activity(element,days,key);
 }
 }catch(e){if(version===dataRequest){const hint=document.querySelector('.filter-hint');if(hint)hint.textContent=location.protocol==='file:'?'Start backend to import CSVs':'Backend disconnected';}}}
window.addEventListener('hashchange',()=>go(location.hash.slice(1)));
async function start(){
 if(location.protocol!=='file:'){try{await loadAccess();}catch(e){toast(e.message);}}
 else state.terms=window.offlineKeywordRules||[];
 go(location.hash.slice(1)||'dashboard');
}
start();
})();
