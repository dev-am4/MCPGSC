export const CONSOLE_CSS = String.raw`
/* Console v2: a compact, single-viewport dark dashboard matching MCPGSC CI. */
:root{--bg:#111416;--side:#0b0e10;--hover:#202826;--text:#f0f5f2;--soft:#b6c4bf;--sub:#869994;--line:#283631;--green:#70e3bc;--good:#80dfb5;--bad:#ef969a}
html,body{height:100%;overflow:hidden;background:var(--bg)}
.shell{height:100dvh;min-height:0;overflow:hidden;grid-template-columns:204px minmax(0,1fr)}
.sidebar{height:100dvh;overflow:auto;padding:22px 11px 12px}
.sidebar .brand{margin:0 0 16px;padding:7px;background:#edf2ef;border-radius:10px}
.sidebar .nav{display:grid;gap:4px}
.sidebar .nav button{font-size:12px;padding:11px 13px;min-height:39px}
.sidebar .foot{font-size:10px;line-height:1.45;padding:11px 9px 0;overflow-wrap:anywhere}
.main{height:100dvh;min-width:0;overflow:hidden}
.container{height:100%;width:100%;max-width:1600px;margin:auto;display:flex;flex-direction:column;min-height:0;padding:22px clamp(15px,2.5vw,38px) 15px}
.top{flex:none;align-items:center;margin:0 0 12px;gap:16px;min-height:52px}
.top h1{font-size:clamp(22px,2vw,28px);letter-spacing:-.8px;margin:0 0 2px;line-height:1.22}
.top .kicker{display:none}
.top .subtitle{font-size:11px;line-height:1.35;margin:0}
.tools{gap:8px}
.tools .pill-group{padding:3px;border-radius:10px;white-space:nowrap}
.tools .pill-group button{font-size:11px;padding:7px 10px}
.tools .quiet-btn{font-size:11px;padding:7px 9px}
.topic-tabs{flex:none;display:flex;align-items:center;gap:6px;padding:0 0 11px;margin:0 0 10px;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;border-bottom:1px solid var(--line);white-space:nowrap}
.topic-tabs button,.compact-tabs button,.metric-toggle button{flex:none;border:1px solid transparent;border-radius:9px;background:transparent;color:#a2b4ac;padding:8px 11px;font-size:11px;font-weight:600;line-height:1.2;min-height:33px;white-space:nowrap;cursor:pointer}
.topic-tabs button:hover,.compact-tabs button:hover,.metric-toggle button:hover{background:#202925;color:#e6f7ef}
.topic-tabs button.active,.compact-tabs button.active,.metric-toggle button.active{background:#203e33;border-color:#39654e;color:#d5ffe9}
#content{flex:1;min-height:0;overflow:auto;scrollbar-width:thin;overscroll-behavior:contain;padding:2px 2px 10px}
#content .metrics{margin:0 0 12px;gap:8px}
#content .metrics>div{border:1px solid var(--line);background:#171d1c;border-radius:12px;padding:14px 17px;min-width:0}
#content .metric-label{font-size:10px;line-height:1.4;letter-spacing:0}
#content .metric-value{font-size:clamp(21px,2.2vw,31px);letter-spacing:-.9px;margin:4px 0}
#content .metric-change{font-size:10px;line-height:1.35}
.console-two{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(280px,.8fr);gap:12px;align-items:stretch;margin-bottom:12px}
.console-panel{background:#171d1b;border:1px solid var(--line);border-radius:12px;padding:15px 17px;min-width:0}
.console-panel h2{margin:0;font-size:14px;line-height:1.3;font-weight:650;color:#e8f5ee;letter-spacing:-.2px}
.console-mini{font-size:10px;color:var(--sub);line-height:1.5}
.console-panel-head,.console-controls{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:9px;margin-bottom:11px}
.console-controls{justify-content:flex-start}
.console-chart{margin:0;height:243px;width:100%;position:relative;overflow:hidden}
.console-chart svg{width:100%;height:100%;display:block}
.console-chart line{stroke:#34413c;stroke-width:1}
.console-chart text{fill:#90a39a;font:12px ui-sans-serif,system-ui,sans-serif}
.console-legend{display:flex;align-items:center;gap:12px;font-size:10px;color:#99b5a8;margin-top:5px}
.legend-current:before,.legend-previous:before{content:"";display:inline-block;vertical-align:middle;margin-right:5px;width:15px;border-top:2px solid #75e7ba}
.legend-previous:before{border-color:#8baba0;border-top-style:dashed}
.metric-toggle,.compact-tabs{display:flex;gap:4px;flex-wrap:wrap}
.metric-toggle button,.compact-tabs button{min-height:30px;padding:6px 10px;font-size:11px;border-radius:8px}
.console-bars{display:grid;gap:12px;padding-top:5px}
.console-bar-row{display:grid;gap:5px}
.console-bar-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:11px}
.console-bar-top span:first-child{color:#cad9d0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.console-bar-top strong{font-size:11px;color:#eefbf3}
.console-bar-track{height:5px;background:#2a3631;border-radius:999px;overflow:hidden}
.console-bar-track i{display:block;height:100%;background:#6bd8b1;border-radius:inherit}
.console-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.console-fact{border:1px solid var(--line);border-radius:11px;padding:11px 13px;min-width:0;background:#151b19}
.console-fact strong{display:block;color:#e2f5e9;font-size:11px;font-weight:650;margin-bottom:4px}
.console-fact span{font-size:11px;color:#9cb1a6;line-height:1.4;display:block;overflow-wrap:anywhere}
.console-note{font-size:10px;color:#82978d;margin:10px 0 3px;line-height:1.4}
.console-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.console-action{display:block;border:1px solid var(--line);border-radius:10px;background:#18201d;padding:12px;text-align:left;color:#eef5ef;width:100%;min-width:0}
.console-action:hover{border-color:#568674;background:#202e28}
.console-action strong{font-size:12px;display:block;margin:5px 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.console-action span,.console-action small{font-size:10px;color:#a9c1b2;display:block;line-height:1.55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.console-action .console-priority{font-size:10px;color:#80e4bb}
.console-statline{display:flex;align-items:center;gap:10px;justify-content:space-between;margin:0 0 12px;flex-wrap:wrap}
.console-statline .tag{font-size:10px}
.console-subtabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}
.console-table{max-height:min(52dvh,475px);overflow:auto;scrollbar-width:thin;border:1px solid var(--line);border-radius:10px;background:#151a19}
.console-table .table-wrap{margin:0;overflow:auto;max-height:inherit}
.console-table .surface-list{min-width:580px;width:100%}
.console-table .surface-list th,.console-table .surface-list td{padding:10px 12px;font-size:11px}
.console-table .surface-list th{position:sticky;top:0;background:#202924;z-index:2;white-space:nowrap}
.console-table .surface-list td{line-height:1.4}
.console-table .surface-list .name{font-size:11px;max-width:440px}
.console-table .surface-list .name.wrap{overflow-wrap:anywhere;word-break:break-word}
.console-table .inline-input{min-height:30px;padding:5px 8px;font-size:10px}
.console-panel .bar{margin-bottom:11px}
.console-panel .inline-input{min-height:34px;padding:6px 10px;font-size:11px;border:1px solid #35423d;background:#1c2521}
.console-panel .row{gap:8px}
.console-panel .notice{margin-bottom:8px}
.console-fullchart{height:min(50dvh,410px)}
.console-compact-note{padding:7px 0;color:#93a89e;font-size:10px}
.console-pair{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.console-muted{color:#83968b;font-size:10px}
.console-pill{display:inline-flex;align-items:center;font-size:10px;color:#a6ebc8;background:#1d392e;border:1px solid #355947;border-radius:999px;padding:4px 8px}
.console-panel .section-head{margin-bottom:10px}
#content .smallnote{font-size:10px;margin:8px 0 0;line-height:1.4}
#content .empty{padding:28px 12px}
#content .empty p{margin-bottom:10px}
#content .health-checks{margin-top:9px}
#content .health-row{padding:11px 0}
#content .health-row p{margin:4px 0}
#content .settings-line{padding:14px 0}
#content .detail{padding:13px 0}
.console-export{display:flex;gap:5px;align-items:center}
@media(max-width:1160px){.console-two{grid-template-columns:minmax(0,1fr)}.console-bars{grid-template-columns:repeat(2,minmax(0,1fr))}.console-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){
 .shell{height:100dvh;display:block}.main{height:100dvh}
 .sidebar{position:fixed;top:0;left:0;z-index:21;width:244px;height:100dvh}
 .mobile-header{padding:8px 13px 0;flex:none}
 .container{height:calc(100dvh - 46px);padding:13px 12px 10px}
 .top{margin:0 0 9px;gap:9px;min-height:45px;display:flex;align-items:center;flex-wrap:wrap}
 .top h1{font-size:21px}
 .top .subtitle{display:none}
 .top .tools{margin:0 0 0 auto}
 .top .tools .quiet-btn span{display:none}
 .topic-tabs{margin:0 0 8px;padding-bottom:8px}
 .topic-tabs button{font-size:11px;padding:7px 9px;min-height:31px}
 #content .metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
 #content .metrics>div{padding:11px}
 #content .metric-value{font-size:24px}
 .console-panel{padding:12px}
 .console-two{display:block}
 .console-two .console-panel{margin-bottom:9px}
 .console-chart{height:220px}
 .console-fullchart{height:260px}
 .console-bars{grid-template-columns:1fr}
 .console-actions,.console-facts{grid-template-columns:1fr}
 .console-table{max-height:53dvh}
 .console-table .surface-list{min-width:590px}
 .console-statline{gap:6px}
}
@media(max-height:660px){.container{padding-top:11px}.console-chart{height:183px}.console-fullchart{height:245px}.console-table{max-height:42dvh}}
.ai-time{white-space:nowrap;font-size:10px}
.ai-list{display:grid;gap:8px;overflow:auto;max-height:calc(100dvh - 285px);scrollbar-width:thin}
.ai-card{border:1px solid var(--line);background:#151e1b;border-radius:11px;padding:12px 14px}
.ai-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.ai-card strong{font-size:12px}.ai-card p{font-size:11px;color:#a7bcb1;line-height:1.5;overflow-wrap:anywhere;margin:6px 0}
.ai-card details{font-size:10px;color:#a7bcb1;margin-top:7px}.ai-card summary{cursor:pointer}
.ai-priority{font-size:10px;border:1px solid #54725e;border-radius:6px;padding:3px 6px;color:#c0f1cf}
.ai-priority.high{border-color:#a95859;color:#ffc0c0}.ai-priority.low{border-color:#658199;color:#c2def4}
#ai-site{max-width:220px}
@media(max-width:760px){.ai-time{display:none}.ai-list{max-height:calc(100dvh - 315px)}}

`;
export const CONSOLE_NAV = "\n<nav class=\"topic-tabs\" aria-label=\"เลือกหัวข้อ\">\n<button type=\"button\" data-view=\"overview\" class=\"active\">ภาพรวม</button>\n<button type=\"button\" data-view=\"trend\">กราฟ</button>\n<button type=\"button\" data-view=\"strategy\">วิเคราะห์</button>\n<button type=\"button\" data-view=\"opportunities\">โอกาส</button>\n<button type=\"button\" data-view=\"queries\">คำค้น</button>\n<button type=\"button\" data-view=\"pages\">หน้าเว็บ</button>\n<button type=\"button\" data-view=\"segments\">อุปกรณ์ / ประเทศ</button>\n<button type=\"button\" data-view=\"sitemaps\">Sitemap</button>\n<button type=\"button\" data-view=\"inspect\">ตรวจ URL</button>\n<button type=\"button\" data-view=\"diagnostics\">ระบบ</button>\n<button type=\"button\" data-view=\"settings\">ตั้งค่า</button>\n</nav>";
export const CONSOLE_SIDE_NAV = "\n<nav class=\"nav\" id=\"nav\" aria-label=\"เมนูหลัก\">\n<button data-view=\"overview\" class=\"active\">ภาพรวม</button>\n<button data-view=\"trend\">กราฟและเทรนด์</button>\n<button data-view=\"strategy\">วิเคราะห์ SEO</button>\n<button data-view=\"opportunities\">โอกาสอันดับ</button>\n<button data-view=\"sitemaps\">ดัชนี / Sitemap</button>\n<button data-view=\"diagnostics\">สถานะระบบ</button>\n<button data-view=\"settings\">ตั้งค่า</button>\n</nav>";
export const CONSOLE_JS = String.raw`
// MCPGSC compact console v2. All analysis uses authenticated GSC responses.
Object.assign(state,{chartMetric:'clicks',chartSite:'all',chartCompare:true,
 strategyTab:'actions',strategyGroup:'opportunities',segmentDimension:'device',
 segmentRows:[],sitemapRows:[],requestId:0});
Object.assign(headings,{
 trend:['กราฟและเทรนด์','เทียบข้อมูลรายวันและช่วงก่อน'],
 segments:['อุปกรณ์และประเทศ','พฤติกรรมการค้นหาจาก Google'],
 sitemaps:['ดัชนีและ Sitemap','สถานะไฟล์ที่ส่งให้ Google']
});
function renderTools(){
 var view=state.view,hasDays=['overview','trend','strategy','queries','pages','opportunities','segments'].includes(view);
 var selectable=state.me&&state.me.authenticated&&['overview','trend','strategy','sites','queries','pages','opportunities','segments','sitemaps'].includes(view);
 el('top-tools').innerHTML=(hasDays?'<div class="pill-group" aria-label="ช่วงเวลา">'+[7,28,90].map(function(d){return '<button data-days="'+d+'" class="'+(state.days===d?'selected':'')+'">'+d+' วัน</button>'}).join('')+'</div>':'')+
 (view==='diagnostics'?'<button class="quiet-btn" data-diagnostics="1">↻ ตรวจใหม่</button>':(view!=='settings'?'<button class="quiet-btn" data-refresh="1">↻ <span>รีเฟรช</span></button>':''))+
 (selectable?'<button class="quiet-btn" data-export="1" aria-label="ส่งออก CSV">CSV</button>':'');
}
function setView(view){
 state.view=view;state.error='';state.filter='';state.visible=12;state.inspected=null;
 el('sidebar').classList.remove('open');el('overlay').classList.remove('show');
 history.replaceState(null,'','#'+view);el('content').scrollTop=0;
 render();if(state.me&&state.me.authenticated)loadView();
}
function render(){
 var title=headings[state.view]||headings.overview;
 el('page-title').textContent=title[0];el('page-subtitle').textContent=title[1];
 renderTools();
 document.querySelectorAll('[data-view]').forEach(function(b){b.classList.toggle('active',b.dataset.view===state.view)});
 el('sidebar-email').textContent=state.me&&state.me.email?state.me.email:'ยังไม่ได้เชื่อมต่อ';
 el('sidebar-status').textContent=state.me&&state.me.authenticated?'เชื่อมต่อแล้ว · GSC Read-only':'GSC Read-only';
 if(!state.me){el('content').innerHTML='<div class="load"></div>';return}
 if(!state.me.authenticated){el('content').innerHTML='<div class="empty"><h2>เชื่อมต่อ Google Search Console</h2><p>ใช้บัญชี Google ที่มีสิทธิ์ในเว็บไซต์</p><a class="primary" href="/auth/google">เชื่อมต่อด้วย Google</a></div>';return}
 if(state.loading){el('content').innerHTML='<div class="load"></div><p class="console-muted">กำลังดึงข้อมูลจริงจาก Google…</p>';return}
 if(state.error){el('content').innerHTML='<div class="empty"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p>'+esc(state.error)+'</p><button class="primary" data-retry="1">ลองใหม่</button></div>';return}
 if(state.view==='overview')renderOverview();
 else if(state.view==='trend')renderTrend();
 else if(state.view==='strategy')renderStrategy();
 else if(state.view==='opportunities')renderOpportunities();
 else if(state.view==='queries'||state.view==='pages')renderDetail();
 else if(state.view==='sites')renderSites();
 else if(state.view==='segments')renderSegments();
 else if(state.view==='sitemaps')renderSitemaps();
 else if(state.view==='inspect')renderInspect();
 else if(state.view==='ai')renderAi();
  else if(state.view==='diagnostics')renderDiagnostics();
 else renderSettings();
}
function toggleMetric(){
 return '<div class="metric-toggle" aria-label="ตัวชี้วัด">'+[
 ['clicks','Clicks'],['impressions','Impressions'],['ctr','CTR'],['position','Position']
 ].map(function(x){return '<button data-chart-metric="'+x[0]+'" class="'+(state.chartMetric===x[0]?'active':'')+'">'+x[1]+'</button>'}).join('')+'</div>';
}
function normMetric(value,metric){var n=Number(value||0);return metric==='ctr'?n*100:n}
function prettyMetric(value,metric){return metric==='ctr'?pct(Number(value||0)):metric==='position'?Number(value||0).toFixed(1):fmt(Math.round(Number(value||0)))}
function fillDays(rows,start,days){
 var m=new Map((rows||[]).map(function(x){return [x.date,x]}));
 var stamp=Date.parse(String(start||'')+'T00:00:00Z');
 if(!Number.isFinite(stamp))return rows||[];
 return Array.from({length:days},function(_,i){var day=new Date(stamp+i*86400000).toISOString().slice(0,10);
 return m.get(day)||{date:day,clicks:0,impressions:0,ctr:0,position:0}});
}
function lineSvg(rows,metric,x,y,style){
 var acc=[],parts=[],points=[];
 rows.forEach(function(row,i){
  if(metric==='position'&&!Number(row.impressions))return;
  var val=normMetric(row[metric],metric),px=x(i),py=y(val);
  points.push(px.toFixed(1)+','+py.toFixed(1));
  if(i%Math.max(1,Math.ceil(rows.length/14))===0||i===rows.length-1){
   parts.push('<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="3" fill="'+(style==='prior'?'#95ada5':'#7be8b9')+'"><title>'+esc(row.date)+' · '+esc(prettyMetric(row[metric],metric))+'</title></circle>');
  }
 });
 if(!points.length)return '';
 return '<polyline points="'+points.join(' ')+'" fill="none" stroke="'+(style==='prior'?'#91aaa0':'#76e6b8')+
 '" stroke-width="'+(style==='prior'?'1.8':'2.7')+'" stroke-dasharray="'+(style==='prior'?'7 6':'none')+
 '" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>'+parts.join('');
}
function drawMetricChart(current,previous,metric,dateStart,priorStart,days,compare){
 var rows=fillDays(current,dateStart,days),before=fillDays(previous,priorStart,days);
 if(!rows.some(function(x){return Number(x.impressions)>0})&&(!compare||!before.some(function(x){return Number(x.impressions)>0})))
  return '<div class="empty"><p>ยังไม่มีข้อมูลรายวันของช่วงนี้</p></div>';
 var vals=rows.concat(compare?before:[]).filter(function(x){return metric!=='position'||Number(x.impressions)>0}).map(function(x){return normMetric(x[metric],metric)}).filter(Number.isFinite);
 var lo=metric==='position'?Math.max(0,Math.floor(Math.min.apply(null,vals))):0;
 var hi=Math.ceil(Math.max.apply(null,vals)*1.08);if(hi<=lo)hi=lo+(metric==='ctr'?1:3);
 if(metric==='ctr')hi=Math.min(100,Math.max(1,hi));
 var width=940,height=274,L=58,R=13,T=14,B=32,plotW=width-L-R,plotH=height-T-B;
 function X(i){return L+(days<=1?plotW/2:plotW*i/(days-1))}
 function Y(v){return metric==='position'?T+(v-lo)/(hi-lo)*plotH:T+plotH-(v-lo)/(hi-lo)*plotH}
 var grid=[0,.25,.5,.75,1].map(function(fr){var val=lo+(hi-lo)*fr,y=Y(val);
  return '<line x1="'+L+'" y1="'+y.toFixed(1)+'" x2="'+(width-R)+'" y2="'+y.toFixed(1)+'"/><text x="5" y="'+(y+4).toFixed(1)+'">'+
   (metric==='ctr'?val.toFixed(1)+'%':metric==='position'?val.toFixed(1):fmt(Math.round(val)))+'</text>';
 }).join('');
 var indices=[0,Math.floor((days-1)/2),days-1].filter(function(v,i,a){return a.indexOf(v)===i});
 var ticks=indices.map(function(i){return '<text text-anchor="'+(i===0?'start':i===days-1?'end':'middle')+'" x="'+X(i)+'" y="267">'+esc((rows[i]?.date||'').slice(5))+'</text>';}).join('');
 return '<div class="console-chart" role="group" aria-label="กราฟ '+esc(metric)+' จาก Google Search Console"><svg viewBox="0 0 940 274" preserveAspectRatio="none" role="img" aria-label="ข้อมูลรายวัน">'+grid+
  (compare?lineSvg(before,metric,X,Y,'prior'):'')+lineSvg(rows,metric,X,Y,'current')+ticks+'</svg></div>'+
  '<div class="console-legend"><span class="legend-current">ช่วงที่เลือก</span>'+(compare?'<span class="legend-previous">ช่วงก่อน</span>':'')+'</div>';
}
function siteBars(rows,metric,limit){
 var sorted=(rows||[]).filter(function(x){return x.current&&!x.error}).slice().sort(function(a,b){return Number(b.current[metric]||0)-Number(a.current[metric]||0)}).slice(0,limit||6);
 var max=Math.max(1,...sorted.map(function(x){return Number(x.current[metric]||0)}));
 if(!sorted.length)return '<p class="console-muted">ยังไม่มีข้อมูลเว็บไซต์</p>';
 return '<div class="console-bars">'+sorted.map(function(x){
  var v=Number(x.current[metric]||0),width=Math.max(0,Math.min(100,v/max*100));
  return '<div class="console-bar-row"><div class="console-bar-top"><span title="'+esc(x.site.label)+'">'+esc(x.site.label)+'</span><strong>'+
   prettyMetric(v,metric)+'</strong></div><div class="console-bar-track"><i style="width:'+width.toFixed(1)+'%"></i></div></div>';
 }).join('')+'</div>';
}
function quickFacts(d){
 var sites=(d.sites||[]).filter(function(x){return x.current&&!x.error});
 var active=sites.filter(function(x){return x.current.impressions>0}).length;
 var down=sites.filter(function(x){return x.previous.clicks>=5&&x.current.clicks<x.previous.clicks*.8}).length;
 var near=sites.filter(function(x){return x.current.impressions>=10&&x.current.position>3&&x.current.position<=20}).length;
 return '<div class="console-facts">'+
  '<div class="console-fact"><strong>'+fmt(active)+' เว็บมีการแสดงผล</strong><span>จาก '+fmt(d.successful||0)+' เว็บที่ดึงสำเร็จ</span></div>'+
  '<div class="console-fact"><strong>'+fmt(down)+' เว็บ Clicks ลด</strong><span>ต่ำกว่าช่วงก่อนอย่างน้อย 20%*</span></div>'+
  '<div class="console-fact"><strong>'+fmt(near)+' เว็บอันดับ 4–20</strong><span>ค่าเฉลี่ยที่มี ≥10 Impressions*</span></div></div>';
}
function renderOverview(){
 var d=state.overview;if(!d){el('content').innerHTML='<div class="empty">ยังไม่มีข้อมูล</div>';return}
 var t=d.total||{},p=d.previous||{},html='';
 if(d.partial)html+='<div class="notice">บางเว็บไซต์โหลดไม่สำเร็จ ('+fmt(d.successful)+'/'+fmt(d.connected)+') · ผลรวมนับเฉพาะเว็บที่สำเร็จ</div>';
 html+='<div class="metrics">'+metric('Clicks',fmt(t.clicks),trend(t.clicks,p.clicks,false))+
 metric('Impressions',fmt(t.impressions),trend(t.impressions,p.impressions,false))+
 metric('CTR',pct(t.ctr),trend(t.ctr,p.ctr,false))+
 metric('Position',pos(t.position,t.impressions),trend(t.position,p.position,true))+'</div>';
 html+='<div class="console-two"><section class="console-panel"><div class="console-panel-head"><div><h2>ประสิทธิภาพ</h2><span class="console-mini">'+esc(d.period.start)+' – '+esc(d.period.end)+'</span></div>'+toggleMetric()+'</div>'+
 drawMetricChart(d.timeline,d.previousTimeline,state.chartMetric,d.period.start,d.period.previousStart,d.days,true)+'</section>'+
 '<section class="console-panel"><div class="console-panel-head"><h2>เว็บเด่น · Clicks</h2><button class="quiet-btn" data-view="sites">ทั้งหมด</button></div>'+
 siteBars(d.sites,'clicks',6)+'</section></div>';
 html+=quickFacts(d)+'<p class="console-note">* เกณฑ์จัดกลุ่มของ MCPGSC ไม่ใช่คะแนนจาก Google · GSC อาจล่าช้า 2–3 วัน · Position ถ่วงน้ำหนักด้วย Impressions</p>';
 el('content').innerHTML=html;
}
function chartSiteSelect(d){
 return '<select id="chart-site" class="inline-input" aria-label="เลือกเว็บไซต์"><option value="all">ทุกเว็บไซต์</option>'+
 (d.sites||[]).filter(function(s){return s.current&&!s.error}).map(function(s){return '<option value="'+esc(s.site.property)+'"'+
 (state.chartSite===s.site.property?' selected':'')+'>'+esc(s.site.label)+'</option>';}).join('')+'</select>';
}
function renderTrend(){
 var d=state.overview;if(!d){el('content').innerHTML='<div class="empty">ยังไม่มีกราฟ</div>';return}
 var selected=(d.sites||[]).find(function(x){return x.site.property===state.chartSite&&x.current&&!x.error});
 var now=selected?selected.timeline:d.timeline,prior=selected?selected.previousTimeline:d.previousTimeline;
 var t=selected?selected.current:d.total,p=selected?selected.previous:d.previous;
 var html='<section class="console-panel"><div class="console-panel-head"><h2>กราฟผลค้นหา</h2>'+
 '<div class="console-pair">'+chartSiteSelect(d)+'</div></div><div class="console-controls">'+toggleMetric()+
 '<button class="quiet-btn" data-chart-compare="1">'+(state.chartCompare?'✓ เทียบช่วงก่อน':'เทียบช่วงก่อน')+'</button></div>'+
 '<div class="console-fullchart">'+drawMetricChart(now,prior,state.chartMetric,d.period.start,d.period.previousStart,d.days,state.chartCompare)+'</div></section>';
 html+='<div class="metrics" style="margin-top:12px">'+metric('Clicks',fmt(t?.clicks),trend(t?.clicks,p?.clicks,false))+
 metric('Impressions',fmt(t?.impressions),trend(t?.impressions,p?.impressions,false))+
 metric('CTR',pct(t?.ctr),trend(t?.ctr,p?.ctr,false))+
 metric('Position',pos(t?.position,t?.impressions),trend(t?.position,p?.position,true))+'</div>'+
 '<p class="console-note">ใช้ข้อมูล GSC จริง · กราฟ Position: ตัวเลขต่ำหมายถึงอันดับดีกว่า · วันที่ไม่มี Impressions ไม่ใช่อันดับ 0</p>';
 el('content').innerHTML=html;
}
function strategyMiniTable(rows){
 if(!rows||!rows.length)return '<div class="empty"><p>ยังไม่มีรายการเข้าเงื่อนไข</p></div>';
 return '<div class="console-table"><table class="surface-list"><thead><tr><th>คำค้น / URL</th><th class="right">Clicks</th><th class="right">Δ</th><th class="right">Impressions</th><th class="right">CTR</th><th class="right">Position</th></tr></thead><tbody>'+
 rows.slice(0,10).map(function(x){return '<tr><td class="name wrap">'+esc(x.key)+'</td><td class="right">'+fmt(x.clicks)+'</td><td class="right">'+
 '<span class="'+(x.deltaClicks>=0?'up':'down')+'">'+(x.deltaClicks>0?'+':'')+fmt(x.deltaClicks)+'</span></td><td class="right">'+fmt(x.impressions)+'</td><td class="right">'+pct(x.ctr)+'</td><td class="right">'+pos(x.position,x.impressions)+'</td></tr>';}).join('')+
 '</tbody></table></div>';
}
function renderStrategy(){
 var d=state.strategy;if(!d){el('content').innerHTML='<div class="empty"><p>ไม่มีข้อมูลกลยุทธ์</p></div>';return}
 var tabs=[['actions','งานด่วน'],['sites','รายเว็บไซต์'],['overlap','คำค้นซ้ำ'],['playbook','เจาะเว็บ']];
 var ok=(d.sites||[]).filter(function(x){return x.current&&!x.error});
 var chosen=ok.find(function(x){return x.site.property===state.strategySite})||ok[0];
 var html='<div class="console-statline"><div class="compact-tabs">'+tabs.map(function(t){return '<button data-strategy-tab="'+t[0]+'" class="'+(state.strategyTab===t[0]?'active':'')+'">'+t[1]+'</button>'}).join('')+'</div>'+
 '<span class="tag">'+fmt(d.successful)+'/'+fmt(d.connected)+' เว็บ · '+esc(d.period.start)+' – '+esc(d.period.end)+'</span></div>';
 if(d.partial)html+='<div class="notice">บางเว็บไซต์โหลดไม่สำเร็จ · ไม่รวมในผลวิเคราะห์</div>';
 if(state.strategyTab==='actions'){
  var actions=d.portfolioActions||[];
  html+='<section class="console-panel"><div class="console-panel-head"><h2>ควรทำก่อน</h2><span class="console-pill">'+fmt(actions.length)+' รายการ</span></div>';
  html+=!actions.length?'<div class="empty"><p>ยังไม่มีสัญญาณที่เข้าเงื่อนไข</p></div>':
   '<div class="console-actions">'+actions.slice(0,8).map(function(x,i){return '<button class="console-action" data-strategy-open="'+esc(x.site.property)+'"><span class="console-priority">#'+(i+1)+' · '+esc(x.site.label)+'</span><strong>'+esc(x.title)+'</strong><small>'+esc(x.detail||'')+'</small></button>';}).join('')+'</div>';
  html+='</section>';
 }else if(state.strategyTab==='sites'){
  html+='<section class="console-panel"><div class="console-panel-head"><h2>ทุกเว็บไซต์</h2><span class="console-mini">เทียบช่วงก่อน</span></div>';
  html+='<div class="console-table"><table class="surface-list"><thead><tr><th>เว็บไซต์</th><th>แนวโน้ม</th><th class="right">Clicks</th><th class="right">Δ Clicks</th><th class="right">Impressions</th><th class="right">Position</th></tr></thead><tbody>'+
  (d.sites||[]).map(function(x){return '<tr><td class="name"><button data-strategy-open="'+esc(x.site.property)+'">'+esc(x.site.label)+'</button></td><td>'+esc(x.error?'โหลดไม่ได้':strategyStatusLabel(x.status))+'</td><td class="right">'+fmt(x.current?.clicks)+'</td><td class="right">'+strategyDelta(x.current?.clicks,x.previous?.clicks,false)+'</td><td class="right">'+fmt(x.current?.impressions)+'</td><td class="right">'+pos(x.current?.position,x.current?.impressions)+'</td></tr>';}).join('')+'</tbody></table></div></section>';
 }else if(state.strategyTab==='overlap'){
  html+='<section class="console-panel"><div class="console-panel-head"><h2>คำค้นที่พบหลายเว็บไซต์</h2><span class="console-mini">ไม่ใช่ Duplicate Content โดยอัตโนมัติ</span></div>';
  var overlap=d.overlaps||[];
  html+=!overlap.length?'<div class="empty"><p>ยังไม่พบคำค้นร่วมที่เข้าเงื่อนไข</p></div>':
  '<div class="console-table"><table class="surface-list"><thead><tr><th>คำค้น</th><th class="right">เว็บที่พบ</th><th class="right">Impressions</th><th>โดเมน</th></tr></thead><tbody>'+
  overlap.slice(0,12).map(function(x){return '<tr><td class="name wrap">'+esc(x.query)+'</td><td class="right">'+fmt(x.sites?.length)+'</td><td class="right">'+fmt(x.impressions)+'</td><td class="name wrap">'+(x.sites||[]).map(function(s){return esc(s.site.label)}).join(' · ')+'</td></tr>';}).join('')+'</tbody></table></div>';
  html+='</section>';
 }else{
  var groups=[['opportunities','ใกล้หน้าแรก'],['lowCtr','CTR ต่ำ'],['losses','คลิกลด'],['winners','กำลังโต'],['pageOpportunities','หน้าเด่น'],['pageLosses','หน้าตก']];
  html+='<section class="console-panel"><div class="console-panel-head"><h2>แผนรายเว็บไซต์</h2><select id="strategy-site" class="inline-input" aria-label="เลือกเว็บไซต์">'+ok.map(function(x){return '<option value="'+esc(x.site.property)+'"'+(chosen?.site.property===x.site.property?' selected':'')+'>'+esc(x.site.label)+'</option>';}).join('')+'</select></div>';
  html+='<div class="console-subtabs compact-tabs">'+groups.map(function(x){return '<button data-strategy-group="'+x[0]+'" class="'+(state.strategyGroup===x[0]?'active':'')+'">'+x[1]+'</button>';}).join('')+'</div>';
  html+=chosen?strategyMiniTable(chosen[state.strategyGroup]||[]):'<div class="empty"><p>ไม่มีข้อมูลรายเว็บไซต์</p></div>';
  html+='</section>';
 }
 html+='<p class="console-note">คำแนะนำจัดลำดับจากข้อมูล GSC ไม่ใช่การรับประกันอันดับ · ข้อมูล Query/Page อาจเป็นเพียงบางส่วน</p>';
 el('content').innerHTML=html;
}
function renderOpportunities(){
 if(!state.sites.length){el('content').innerHTML='<div class="empty"><p>ไม่พบเว็บไซต์</p></div>';return}
 var items=(state.rows||[]).map(opportunity).filter(Boolean).sort(function(a,b){return b.score-a.score});
 var filtered=items.filter(function(x){return (state.opFilter==='all'||x.kind===state.opFilter)&&
  (state.opStatus==='all'||(state.opNotes[opKey(x.value)]||'new')===state.opStatus)&&(!state.filter||x.value.toLowerCase().includes(state.filter.toLowerCase()));});
 var html='<section class="console-panel"><div class="console-statline"><div class="row">'+selector()+
 '<select class="inline-input" id="op-dimension"><option value="query"'+(state.opDimension==='query'?' selected':'')+'>คำค้น</option><option value="page"'+(state.opDimension==='page'?' selected':'')+'>URL</option></select>'+
 '<select class="inline-input" id="op-filter"><option value="all">ทุกโอกาส</option>'+['ใกล้หน้าแรก','CTR ต่ำ','มี Impressions แต่ยังอันดับต่ำ'].map(function(v){return '<option value="'+esc(v)+'"'+(state.opFilter===v?' selected':'')+'>'+esc(v)+'</option>'}).join('')+'</select>'+
 '<select class="inline-input" id="op-status"><option value="all">ทุกสถานะ</option><option value="new"'+(state.opStatus==='new'?' selected':'')+'>ยังไม่เริ่ม</option><option value="doing"'+(state.opStatus==='doing'?' selected':'')+'>กำลังแก้</option><option value="done"'+(state.opStatus==='done'?' selected':'')+'>เสร็จแล้ว</option></select></div>'+
 '<span class="console-pill">'+fmt(filtered.length)+' โอกาส</span></div>'+
 '<div class="bar"><input type="search" class="inline-input" id="op-search" placeholder="ค้นหาคำ / URL..." value="'+esc(state.filter)+'" aria-label="ค้นหาโอกาส"></div>';
 html+='<div class="console-table"><table class="surface-list"><thead><tr><th>คำค้น / URL</th><th>โอกาส</th><th class="right">Score</th><th class="right">Impressions</th><th class="right">CTR</th><th class="right">Position</th><th>สถานะ</th></tr></thead><tbody>'+
 filtered.slice(0,state.visible).map(function(x){return '<tr><td class="name wrap">'+esc(x.value)+'</td><td>'+esc(x.kind)+'</td><td class="right">'+fmt(x.score)+'</td><td class="right">'+fmt(x.imp)+'</td><td class="right">'+pct(x.ctr)+'</td><td class="right">'+pos(x.rank,x.imp)+'</td><td><select class="inline-input op-track" data-op-key="'+esc(opKey(x.value))+'"><option value="new">ใหม่</option><option value="doing"'+(state.opNotes[opKey(x.value)]==='doing'?' selected':'')+'>ทำอยู่</option><option value="done"'+(state.opNotes[opKey(x.value)]==='done'?' selected':'')+'>เสร็จ</option></select></td></tr>';}).join('')+'</tbody></table></div>';
 if(filtered.length>state.visible)html+='<button class="quiet-btn" data-more="1">แสดงเพิ่ม</button>';
 html+='</section><p class="console-note">Score เป็นคะแนนช่วยจัดลำดับของ MCPGSC · สถานะงานบันทึกในเบราว์เซอร์นี้เท่านั้น</p>';
 el('content').innerHTML=html;
}
function renderDetail(){
 if(!state.sites.length){el('content').innerHTML='<div class="empty"><p>ไม่พบเว็บไซต์</p></div>';return}
 var q=state.view==='queries',rows=(state.rows||[]).filter(function(r){return String(r.keys?.[0]||'').toLowerCase().includes(state.filter.toLowerCase())});
 var html='<section class="console-panel"><div class="console-statline">'+selector()+'<span class="console-pill">'+fmt(rows.length)+' รายการ</span></div>'+
 '<div class="bar"><input type="search" id="detail-search" class="inline-input" placeholder="'+(q?'ค้นหาคำค้น...':'ค้นหา URL...')+'" value="'+esc(state.filter)+'"></div>'+
 '<div class="console-table"><table class="surface-list"><thead><tr><th>'+(q?'คำค้นหา':'URL')+'</th><th class="right">Clicks</th><th class="right">Impressions</th><th class="right">CTR</th><th class="right">Position</th></tr></thead><tbody>'+
 rows.slice(0,state.visible).map(function(x){return '<tr><td class="name wrap">'+esc(x.keys?.[0]||'—')+'</td><td class="right">'+fmt(x.clicks)+'</td><td class="right">'+fmt(x.impressions)+'</td><td class="right">'+pct(x.ctr)+'</td><td class="right">'+pos(x.position,x.impressions)+'</td></tr>';}).join('')+'</tbody></table></div>';
 if(rows.length>state.visible)html+='<button class="quiet-btn" data-more="1">แสดงเพิ่ม</button>';
 html+='</section><p class="console-note">GSC API ส่งกลับสูงสุด 250 แถวในมุมมองนี้ · บาง Query ไม่ถูกเปิดเผย</p>';
 el('content').innerHTML=html;
}
function renderSegments(){
 var sites=state.sites||[];if(!sites.length){el('content').innerHTML='<div class="empty">ไม่พบเว็บไซต์</div>';return}
 var rows=(state.segmentRows||[]).slice().sort(function(a,b){return b.impressions-a.impressions});
 var total=rows.reduce(function(sum,x){return sum+Number(x.impressions||0)},0);
 var names={DESKTOP:'คอมพิวเตอร์',MOBILE:'มือถือ',TABLET:'แท็บเล็ต'};
 var labels=[['device','อุปกรณ์'],['country','ประเทศ'],['searchAppearance','รูปแบบผลค้น']];
 var html='<section class="console-panel"><div class="console-statline"><div class="console-pair">'+selector()+
 '<div class="compact-tabs">'+labels.map(function(x){return '<button data-segment-dimension="'+x[0]+'" class="'+(state.segmentDimension===x[0]?'active':'')+'">'+x[1]+'</button>';}).join('')+'</div></div>'+
 '<span class="console-pill">'+fmt(rows.length)+' กลุ่ม</span></div>';
 if(!rows.length)html+='<div class="empty"><p>ยังไม่มีข้อมูลมิตินี้ในช่วงวันที่เลือก</p></div>';
 else html+='<div class="console-two"><div class="console-panel"><h2>สัดส่วน Impressions</h2><div class="console-bars" style="margin-top:14px">'+rows.slice(0,8).map(function(x){var v=Number(x.impressions||0);return '<div class="console-bar-row"><div class="console-bar-top"><span>'+esc(names[x.keys?.[0]]||x.keys?.[0]||'—')+'</span><strong>'+(total?((v/total)*100).toFixed(1):'0')+'%</strong></div><div class="console-bar-track"><i style="width:'+(total?v/total*100:0).toFixed(1)+'%"></i></div></div>';}).join('')+'</div></div>'+
 '<div class="console-panel"><h2>ประสิทธิภาพ</h2><div class="console-table" style="margin-top:12px"><table class="surface-list"><thead><tr><th>กลุ่ม</th><th class="right">Clicks</th><th class="right">CTR</th><th class="right">Position</th></tr></thead><tbody>'+
 rows.slice(0,12).map(function(x){return '<tr><td class="name">'+esc(names[x.keys?.[0]]||x.keys?.[0]||'—')+'</td><td class="right">'+fmt(x.clicks)+'</td><td class="right">'+pct(x.ctr)+'</td><td class="right">'+pos(x.position,x.impressions)+'</td></tr>';}).join('')+'</tbody></table></div></div></div>';
 html+='</section><p class="console-note">สัดส่วนคำนวณจากแถวของมิตินี้ ไม่ใช่ยอดรวมทั้งบัญชี · Search Appearance บางเว็บอาจไม่มีข้อมูล</p>';
 el('content').innerHTML=html;
}
function renderSitemaps(){
 if(!state.sites?.length){el('content').innerHTML='<div class="empty">ไม่พบเว็บไซต์</div>';return}
 var rows=state.sitemapRows||[],errors=rows.reduce(function(v,x){return v+Number(x.errors||0)},0);
 var warnings=rows.reduce(function(v,x){return v+Number(x.warnings||0)},0);
 var html='<section class="console-panel"><div class="console-statline"><div class="console-pair">'+selector()+
 '</div><div class="console-pair"><span class="console-pill">'+fmt(rows.length)+' Sitemap</span>'+
 '<span class="tag">'+fmt(errors)+' Errors · '+fmt(warnings)+' Warnings</span></div></div>';
 if(!rows.length)html+='<div class="empty"><p>GSC ไม่แสดง Sitemap ที่ส่งสำหรับ Property นี้</p></div>';
 else html+='<div class="console-table"><table class="surface-list"><thead><tr><th>ไฟล์ Sitemap</th><th class="right">URLs ที่รายงาน</th><th class="right">Errors</th><th class="right">Warnings</th><th>อ่านล่าสุด</th><th>สถานะ</th></tr></thead><tbody>'+
 rows.map(function(x){var submitted=(x.contents||[]).reduce(function(n,v){return n+Number(v.submitted||0)},0);return '<tr><td class="name wrap"><a href="'+esc(x.path)+'" target="_blank" rel="noopener noreferrer">'+esc(x.path)+'</a></td>'+
 '<td class="right">'+fmt(submitted)+'</td><td class="right">'+fmt(x.errors)+'</td><td class="right">'+fmt(x.warnings)+'</td><td>'+esc(x.lastDownloaded?x.lastDownloaded.slice(0,10):'—')+'</td>'+
 '<td>'+(x.isPending?'กำลังประมวลผล':x.errors?'ตรวจข้อผิดพลาด':x.warnings?'มีคำเตือน':'ปกติ')+'</td></tr>';}).join('')+'</tbody></table></div>';
 html+='</section><p class="console-note">จำนวน URLs คือค่าที่ Search Console รายงาน แยกตาม Sitemap · Sitemap Index อาจมีรายการซ้อนกัน และไม่ใช่จำนวนหน้าที่ Index แล้วfunction syncSnapshot(){
 var snap=state.snapshot;if(!snap)return;
 state.overview=snap.overview;state.strategy=snap.strategy;state.sites=snap.sites||[];
 if(!state.sites.some(function(x){return x.property===state.site}))state.site=state.sites[0]?.property||'';
 var asset=(snap.assets||{})[state.site]||{};
 state.rows=(state.view==='pages'||(state.view==='opportunities'&&state.opDimension==='page'))?asset.pages||[]:asset.queries||[];
 state.segmentRows=(asset.segments||{})[state.segmentDimension]||[];
 state.sitemapRows=asset.sitemaps||[];
}
async function loadView(){
 if(!state.me?.authenticated)return;
 var current=++state.requestId,days=state.days;
 if(state.view==='diagnostics'){
  try{state.loading=true;state.error='';render();var diagnostics=await api('/api/diagnostics');if(current===state.requestId)state.diagnostics=diagnostics}
  catch(e){if(current===state.requestId)state.error=e.message||'Diagnostics failed'}
  finally{if(current===state.requestId){state.loading=false;render()}}return;
 }
 if(state.view==='settings'||state.view==='inspect'){syncSnapshot();render();return}
 if(state.snapshots[days]){state.snapshot=state.snapshots[days];syncSnapshot();state.loading=false;state.error='';render();return}
 try{state.loading=true;state.error='';render();var snap=await api('/api/snapshot?days='+days);
  if(current!==state.requestId)return;state.snapshots[days]=snap;state.snapshot=snap;syncSnapshot();
 }catch(e){if(current===state.requestId)state.error=e.message||'Snapshot failed'}
 finally{if(current===state.requestId){state.loading=false;render()}}
}
async function refresh(){
 var current=++state.requestId;
 try{state.loading=true;state.error='';render();
  var snap=await api('/api/refresh?days='+state.days,{method:'POST'});
  if(current!==state.requestId)return;state.snapshots={};state.snapshots[state.days]=snap;state.snapshot=snap;syncSnapshot();
 }catch(e){if(current===state.requestId)state.error=e.message||'Refresh failed'}
 finally{if(current===state.requestId){state.loading=false;render()}}
}
.message||'Refresh failed';render()}}
}
function csvSafe(value){
 var s=String(value===null||value===undefined?'':value);
 if(/^[\s]*[=+\-@]/.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function exportConsole(){
 var headers=[],rows=[],name='mcpgsc-'+state.view;
 if(state.view==='overview'||state.view==='trend'||state.view==='sites'){
  headers=['site','clicks','impressions','ctr','position','previous_clicks'];
  rows=(state.overview?.sites||[]).map(function(x){return [x.site.label,x.current?.clicks,x.current?.impressions,x.current?.ctr,x.current?.position,x.previous?.clicks]});
 }else if(state.view==='strategy'){
  headers=['site','action','priority','impact','details'];
  rows=(state.strategy?.portfolioActions||[]).map(function(x){return [x.site?.label,x.title,x.priority,x.impact,x.detail]});
 }else if(state.view==='sitemaps'){
  headers=['path','submitted','errors','warnings','lastDownloaded','pending'];
  rows=(state.sitemapRows||[]).map(function(x){return [x.path,(x.contents||[]).reduce(function(n,c){return n+Number(c.submitted||0)},0),x.errors,x.warnings,x.lastDownloaded,x.isPending]});
 }else if(state.view==='segments'){
  headers=['group','clicks','impressions','ctr','position'];
  rows=(state.segmentRows||[]).map(function(x){return [x.keys?.[0],x.clicks,x.impressions,x.ctr,x.position]});
 }else{
  headers=['query_or_url','clicks','impressions','ctr','position'];
  rows=(state.rows||[]).map(function(x){return [x.keys?.[0],x.clicks,x.impressions,x.ctr,x.position]});
 }
 var csv='\uFEFF'+[headers].concat(rows).map(function(row){return row.map(csvSafe).join(',')}).join('\r\n');
 var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob);
 var link=document.createElement('a');link.href=url;link.download=name+'-'+state.days+'d.csv';
 document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);
}
document.addEventListener('click',function(event){
 var target=event.target.closest('button');if(!target)return;
 if(target.dataset.chartMetric){state.chartMetric=target.dataset.chartMetric;render();return}
 if(target.dataset.chartCompare){state.chartCompare=!state.chartCompare;render();return}
 if(target.dataset.strategyTab){state.strategyTab=target.dataset.strategyTab;render();return}
 if(target.dataset.strategyGroup){state.strategyGroup=target.dataset.strategyGroup;render();return}
 if(target.dataset.strategyOpen){state.strategySite=target.dataset.strategyOpen;state.strategyTab='playbook';render();return}
 if(target.dataset.segmentDimension){state.segmentDimension=target.dataset.segmentDimension;state.visible=12;loadView();return}
 if(target.dataset.export){exportConsole();return}
});
document.addEventListener('change',function(event){
 if(event.target.id==='chart-site'){state.chartSite=event.target.value;render()}
});
Object.assign(state,{snapshot:null,snapshots:{},aiSite:'all'});
headings.ai=['คำสั่ง AI แก้ SEO','วิเคราะห์ปัญหาและสร้างคำสั่งพร้อมคัดลอก'];
document.querySelectorAll('.topic-tabs,#nav').forEach(function(nav){
 if(nav.querySelector('[data-view="ai"]'))return;
 var button=document.createElement('button');button.type='button';button.dataset.view='ai';
 button.textContent='คำสั่ง AI';var strategy=nav.querySelector('[data-view="strategy"]');
 if(strategy)strategy.insertAdjacentElement('afterend',button);else nav.appendChild(button);
});
function renderAi(){
 var s=state.snapshot;if(!s){el('content').innerHTML='<div class="empty">ไม่มีข้อมูล</div>';return}
 var all=s.issues||[],chosen=state.aiSite;
 var issues=chosen==='all'?all:all.filter(function(x){return x.property===chosen});
 var html='<div class="console-statline"><div class="console-pair"><span class="console-pill">'+fmt(issues.length)+' รายการ</span>'+
 '<span class="console-muted">ด่วน '+issues.filter(function(x){return x.severity==='high'}).length+' · ต้องตรวจ '+issues.filter(function(x){return x.severity==='medium'}).length+'</span></div>'+
 '<div class="console-pair"><select id="ai-site" class="inline-input"><option value="all">ทุกเว็บไซต์</option>'+
 (s.sites||[]).map(function(site){return '<option value="'+esc(site.property)+'"'+(chosen===site.property?' selected':'')+'>'+esc(site.label)+'</option>'}).join('')+
 '</select><button class="quiet-btn" data-ai-all="1">คัดลอกคำสั่งรวม</button></div></div>';
 if(s.partial)html+='<p class="notice">มีข้อมูลบางมิติที่โหลดไม่สำเร็จ กรุณาตรวจ API ก่อนสรุปปัญหา</p>';
 html+='<section class="console-panel"><div class="console-panel-head"><h2>ประเด็นที่ควรแก้</h2><span class="console-mini">อ้างอิง Google Search Console</span></div>';
 html+=issues.length?'<div class="ai-list">'+issues.slice(0,90).map(function(issue){
  var idx=all.indexOf(issue);
  return '<article class="ai-card"><div class="ai-head"><div><span class="ai-priority '+esc(issue.severity)+'">'+
   (issue.severity==='high'?'ด่วน':issue.severity==='medium'?'ตรวจ':'โอกาส')+'</span> <span class="console-muted">'+esc(issue.site)+'</span></div>'+
   '<button class="quiet-btn" data-ai-copy="'+idx+'">คัดลอกคำสั่ง</button></div>'+
   '<strong>'+esc(issue.title)+'</strong><p>'+esc(issue.evidence)+'</p>'+
   '<details><summary>รายละเอียดการวิเคราะห์</summary><p>สมมติฐาน: '+esc(issue.hypothesis)+'</p><p>ตรวจต่อ: '+esc(issue.action)+'</p></details></article>';
 }).join('')+'</div>':'<div class="empty">ยังไม่พบสัญญาณที่เข้าเกณฑ์ ไม่ได้หมายความว่าไม่มีปัญหา SEO</div>';
 html+='</section><p class="console-note">GSC มีความหน่วงและไม่แสดงคำค้นครบทุกคำ · AI ต้องตรวจเว็บและโค้ดจริงก่อนแก้</p>';
 el('content').innerHTML=html;
}
function copyPrompt(text){
 if(!navigator.clipboard?.writeText){alert('กรุณาเปิดผ่าน HTTPS เพื่อใช้ Clipboard');return}
 navigator.clipboard.writeText(text).then(function(){el('page-subtitle').textContent='คัดลอกแล้ว · วางให้ AI ภายนอกได้ทันที'})
 .catch(function(){alert('คัดลอกไม่สำเร็จ กรุณาตรวจสิทธิ์ Clipboard')});
}
document.addEventListener('click',function(event){
 var button=event.target.closest('button');if(!button||!state.snapshot)return;
 if(button.dataset.aiCopy!==undefined){var item=state.snapshot.issues?.[Number(button.dataset.aiCopy)];if(item)copyPrompt(item.prompt);return}
 if(button.dataset.aiAll){
  var items=(state.snapshot.issues||[]).filter(function(i){return state.aiSite==='all'||i.property===state.aiSite});
  copyPrompt(items.length?items.map(function(i,n){return '=== งาน '+(n+1)+' ===\n'+i.prompt}).join('\n\n'):
   'ตรวจ SEO ของ '+state.aiSite+' จาก GSC จริง ตรวจ sitemap/robots/canonical/metadata/indexing/performance และโค้ด ก่อนแก้ ทดสอบ CI และรายงานผล');
 }
});
document.addEventListener('change',function(event){if(event.target.id==='ai-site'){state.aiSite=event.target.value;render()}});
var originalTools=renderTools;
renderTools=function(){
 originalTools();
 if(state.snapshot?.generatedAt&&state.view!=='settings'){
  var d=new Date(state.snapshot.generatedAt);
  el('top-tools').insertAdjacentHTML('afterbegin','<span class="console-muted ai-time">ข้อมูลกลาง '+esc(d.toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))+'</span>');
 }
};
init=async function(){
 try{state.opNotes=JSON.parse(localStorage.getItem('mcpgsc-op-notes')||'{}')}catch(_){state.opNotes={}}
 state.view=headings[location.hash.slice(1)]?location.hash.slice(1):'overview';
 try{state.me=await api('/api/me')}catch(e){state.me={authenticated:false};state.error=e.message||'Login failed'}
 render();if(state.me?.authenticated&&!state.error)await loadView();
};


`;
