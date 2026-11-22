/* Charts share the current module response and lifecycle with its data tables. */
const dashboardCharts=(()=>{
  const mounted=new Set();
  const colors=['#a9cf92','#efc47c','#80c6c0','#c4a7d6','#dd9c8d','#97a69e'];
  const text='#d6e2d2', grid='#365044';
  function clear(){
    for(const chart of mounted)chart.destroy();
    mounted.clear();
  }
  function draw(anchor,title,labels,series,{horizontal=false,stacked=false,ring=false,details=''}={}){
    if(!anchor||!window.Chart||!labels.length||!series.some(s=>s.values.some(Number.isFinite)))return;
    const figure=document.createElement('figure');
    figure.className='analytics-figure';
    const caption=document.createElement('figcaption');
    caption.textContent=title;
    const frame=document.createElement('div');
    frame.className='plot-frame';
    if(horizontal)frame.style.height=Math.max(145,labels.length*27+60)+'px';
    const canvas=document.createElement('canvas');
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',title+'. Detailed values follow.');
    frame.append(canvas);figure.append(caption,frame);
    anchor.before(figure);
    const datasets=series.map((s,i)=>({
      label:s.name,data:s.values,backgroundColor:s.colors||colors[i],borderColor:ring?'#152b20':colors[i],
      borderWidth:ring?2:0,borderRadius:ring?0:2,maxBarThickness:24
    }));
    const ticks={color:text,font:{family:'Tahoma, Arial, sans-serif',size:10}};
    const category={grid:{display:false},ticks:{...ticks,autoSkip:!horizontal,maxRotation:0,...(horizontal?{}:{maxTicksLimit:8})}};
    const count={beginAtZero:true,ticks:{...ticks,precision:0},grid:{color:grid}};
    const config={
      type:ring?'doughnut':'bar',data:{labels,datasets},
      options:{
        responsive:true,maintainAspectRatio:false,animation:false,devicePixelRatio:Math.min(window.devicePixelRatio||1,2),
        indexAxis:horizontal?'y':'x',...(ring?{cutout:'62%'}:{scales:{
          x:{...(horizontal?count:category),stacked},y:{...(horizontal?category:count),stacked}
        }}),
        plugins:{legend:{display:ring||series.length>1,position:'bottom',labels:{color:text,boxWidth:10,boxHeight:10,font:{family:'Tahoma, Arial, sans-serif',size:11}}},
          tooltip:{backgroundColor:'#12271d',titleColor:'#f3f4df',bodyColor:text,borderColor:'#607d68',borderWidth:1}}
      }
    };
    try{
      const chart=new Chart(canvas,config);
      mounted.add(chart);
    }catch(error){
      figure.remove();console.warn('Could not display chart',error);return;
    }
    if(details){
      const disclosure=document.createElement('details'),summary=document.createElement('summary');
      disclosure.className='plot-details';summary.textContent=details;disclosure.append(summary);anchor.before(disclosure);disclosure.append(anchor);
    }
  }
  function activity(anchor,days,mode){
    if(!anchor||!days.size)return;
    const dates=[...days.keys()].sort(),first=dates[0],last=dates.at(-1);
    const span=(Date.parse(last)-Date.parse(first))/86400000;
    const unit=span<=31?'day':span<=730?'month':'year';
    const groups=new Map();
    for(const [day,row] of days){
      const key=day.slice(0,unit==='day'?10:unit==='month'?7:4);
      const group=groups.get(key)||{content:0,comment:0,interactions:null};
      group.content+=row.content;group.comment+=row.comment;
      if(row.interactions!=null)group.interactions=(group.interactions??0)+row.interactions;
      groups.set(key,group);
    }
    const labels=[];
    const cursor=new Date(first+'T00:00:00Z');
    if(unit!=='day')cursor.setUTCDate(1);
    if(unit==='year')cursor.setUTCMonth(0);
    while(cursor.getTime()<=Date.parse(last)){
      labels.push(cursor.toISOString().slice(0,unit==='day'?10:unit==='month'?7:4));
      if(unit==='day')cursor.setUTCDate(cursor.getUTCDate()+1);
      else if(unit==='month')cursor.setUTCMonth(cursor.getUTCMonth()+1);
      else cursor.setUTCFullYear(cursor.getUTCFullYear()+1);
    }
    const values=key=>labels.map(l=>groups.get(l)?.[key]??null);
    const overview=mode==='overview.activity_series';
    const series=overview?[{name:'Known interactions',values:values('interactions')}]:[{name:'Uploads',values:values('content')}];
    if(mode==='audience.activity_series')series.push({name:'Comments',values:values('comment')});
    const title=overview?'Known interactions by upload '+unit:mode==='audience.activity_series'?'Uploads and comments by '+unit:'Published uploads by '+unit;
    draw(anchor,title,labels,series,{details:'View daily records'});
  }
  function topics(anchor,trends,power){
    if(!anchor)return;
    let rows;
    if(power){
      const topics=new Map();
      for(const row of trends.power){
        const item=topics.get(row.term)||{term:row.term,content:0,comment:0};
        item[row.type==='Campaign content'?'content':'comment']=row.active;topics.set(row.term,item);
      }
      rows=[...topics.values()].sort((a,b)=>Math.max(b.content,b.comment)-Math.max(a.content,a.comment)||a.term.localeCompare(b.term));
    }else rows=trends.radar;
    rows=rows.slice(0,8);
    draw(anchor,'Top '+rows.length+' topics by '+(power?'active weeks':'matching records'),rows.map(r=>r.term),[
      {name:'Campaign content',values:rows.map(r=>r.content)},{name:'Audience comments',values:rows.map(r=>r.comment)}
    ],{horizontal:true,stacked:!power,details:'View all trend evidence'});
  }
  function sentiment(anchor,comments){
    if(!anchor||!comments.length)return;
    const categories=['Positive','Negative','Neutral','Mixed','Context review','Unclassified'];
    const palette=[colors[0],colors[4],colors[2],colors[3],colors[1],colors[5]];
    const totals=categories.map(label=>comments.filter(a=>(a.decision||a.result)===label).length);
    draw(anchor,'Comments by sentiment',categories,[{name:'Comments',values:totals,colors:palette}],{ring:true});
  }
  function signals(anchor,rows){
    draw(anchor,'Review flags by observed date',rows.map(r=>r[0]),[
      {name:'Comment bursts',values:rows.map(r=>r[1])},{name:'Repeated wording',values:rows.map(r=>r[2])}
    ],{stacked:true,details:'View flagged dates'});
  }
  return {clear,activity,topics,sentiment,signals};
})();
