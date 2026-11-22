export function windowMode(platform,type){
  if(type==='Comments')return 'parents';
  if((platform==='Facebook'&&type==='Posts')||(platform==='Instagram'&&['Posts','Reels'].includes(type)))return 'dates';
  if(['Videos','Reels','Posts'].includes(type))return 'catalog';
  return 'all';
}

export function collectionWindow(platform,type,period,now=new Date()){
  if(!['all','1','7','30'].includes(period))throw Error('Choose a valid collection window.');
  if(period!=='all'&&windowMode(platform,type)==='all')throw Error('Only All Time is available for this scraper.');
  const end=now.toISOString();
  const start=period==='all'?null:new Date(now.getTime()-Number(period)*86400000).toISOString();
  return {period,start,end};
}

export function withinWindow(timestamp,range){
  return !range.start || Boolean(timestamp && timestamp>range.start && timestamp<=range.end);
}

export function scraperDate(instant,format='MM-DD-YYYY'){
  const [year,month,day]=new Date(Date.parse(instant)+8*3600000).toISOString().slice(0,10).split('-');
  return format.replace('YYYY',year).replace('MM',month).replace('DD',day);
}

// Check the selected discovery method. Other methods on a dataset may accept different inputs.
export function catalogDateFormat(catalog,dataset,method){
  const rows=Array.isArray(catalog)?catalog:[catalog];
  const entry=rows.find(row=>(row.dataset_id||row.id)===dataset);
  const variant=entry?.scrapers?.[method];
  const schema=variant?.input_schema;
  const fields=schema?.properties||schema||{};
  const typeFor=key=>{
    const spec=Array.isArray(fields)?fields.find(f=>(f.name||f.field)===key):fields[key];
    if(!spec)return null;
    if(spec.format==='date')return 'YYYY-MM-DD';
    const hint=[spec.description,spec.format,spec.placeholder].filter(Boolean).join(' ').toUpperCase();
    const pattern=hint.match(/\b(?:YYYY-MM-DD|MM-DD-YYYY|DD-MM-YYYY|MM\/DD\/YYYY|DD\/MM\/YYYY)\b/);
    if(pattern)return pattern[0];
    let sample=variant.sample_input;
    if(typeof sample==='string'){try{sample=JSON.parse(sample);}catch{sample=null;}}
    const example=spec.example||(Array.isArray(sample)?sample[0]:sample)?.[key];
    return /^\d{4}-\d{2}-\d{2}$/.test(example)?'YYYY-MM-DD':null;
  };
  const format=typeFor('start_date');
  if(!format||format!==typeFor('end_date'))throw Error('Bright Data did not confirm the date format for this scraper. No collection was started. Choose All Time or import a CSV.');
  return format;
}
