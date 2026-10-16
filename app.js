(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const C = window.CarrowmontCompoundCore;
  const L = window.CarrowmontLocale;
  if (!C || !L) return;

  const COMPOUNDING_LABELS = {
    annual: 'annually', semiannual: 'semi-annually', quarterly: 'quarterly', monthly: 'monthly', daily: 'daily'
  };
  const CONTRIBUTION_LABELS = {
    weekly: 'Weekly', biweekly: 'Every 2 Weeks', semimonthly: 'Twice Monthly', fourweekly: 'Every 4 Weeks', monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annually'
  };

  let lastResult = null;
  let contributionFrequencyUserOverride = false;

  function compact(value){ return L.formatCompactMoney(value,{maximumFractionDigits:2}); }
  function money(value){ return L.formatMoney(value,{maximumFractionDigits:0}); }
  function pct(value, digits=2){ return `${(Number(value)*100).toFixed(digits)}%`; }
  function n(value){ const x=Number(value); return Number.isFinite(x)?x:0; }

  function sortedRegions(){
    return Object.entries(L.regions).sort(([a,av],[b,bv])=>{
      if(a==='OTHER') return 1; if(b==='OTHER') return -1;
      return av.label.localeCompare(bv.label,'en',{sensitivity:'base'});
    });
  }
  function sortedCurrencies(){ return Object.entries(L.currencies).sort(([,a],[,b])=>a.label.localeCompare(b.label,'en',{sensitivity:'base'})); }

  function populateLocaleControls(){
    $('regionSelect').innerHTML = sortedRegions().map(([code,cfg])=>`<option value="${code}">${cfg.label}</option>`).join('');
    $('currencySelect').innerHTML = sortedCurrencies().map(([code,cfg])=>`<option value="${code}">${code} · ${cfg.label}</option>`).join('');
    $('regionSelect').value=L.getRegion(); $('currencySelect').value=L.getCurrency();
  }

  function twoWeekText(){
    const mode=L.getProfile()?.twoWeekLabel;
    if(mode==='biweekly') return 'Biweekly (Every 2 Weeks)';
    if(mode==='fortnightly') return 'Fortnightly (Every 2 Weeks)';
    return 'Every 2 Weeks';
  }
  function defaultContributionFrequency(){
    const key=L.getProfile()?.contributionFrequency || 'monthly';
    return C.CONTRIBUTION_FREQUENCIES[key] ? key : 'monthly';
  }
  function updateFrequencyCopy(){
    const opt=$('contributionFrequency')?.querySelector('option[value="biweekly"]');
    if(opt) opt.textContent=twoWeekText();
  }
  function contributionFrequencyLabel(key){
    if(key==='biweekly') return twoWeekText();
    return CONTRIBUTION_LABELS[key] || key;
  }

  function applyLocale({regionChanged=false}={}){
    $('regionSelect').value=L.getRegion(); $('currencySelect').value=L.getCurrency();
    const profile=L.getProfile();
    $('localeCurrent').textContent=`${profile.label} · ${L.getCurrency()}`;
    document.body.classList.toggle('india-inr',L.getRegion()==='IN'&&L.getCurrency()==='INR');
    document.querySelectorAll('.currency-prefix').forEach(el=>{el.textContent=L.currencySymbol();});
    updateFrequencyCopy();
    if(regionChanged || !contributionFrequencyUserOverride) $('contributionFrequency').value=defaultContributionFrequency();
    render();
  }

  function stateFromUi(){
    return {
      principal:n($('principal').value),
      annualRate:n($('annualRate').value),
      years:n($('years').value),
      compounding:$('compoundingFrequency').value,
      contributionEnabled:$('contributionEnabled').checked,
      contribution:n($('contributionAmount').value),
      contributionFrequency:$('contributionFrequency').value,
      contributionTiming:$('contributionTiming').value,
      inflationEnabled:$('inflationEnabled').checked,
      inflation:n($('inflationRate').value)
    };
  }

  function syncOptionalFields(){
    const contrib=$('contributionEnabled').checked;
    ['contributionAmount','contributionFrequency','contributionTiming'].forEach(id=>{$(id).disabled=!contrib;});
    $('contributionFields').setAttribute('aria-disabled',String(!contrib));
    const inf=$('inflationEnabled').checked;
    $('inflationRate').disabled=!inf;
  }

  function clearInvalid(){
    ['principal','annualRate','years','contributionAmount','inflationRate'].forEach(id=>$(id).removeAttribute('aria-invalid'));
  }
  function showValidation(errors){
    const box=$('validationMessage');
    if(!errors.length){box.hidden=true; box.textContent=''; clearInvalid(); return;}
    box.hidden=false; box.textContent=errors.join(' ');
    if(errors.some(e=>e.startsWith('Starting amount'))) $('principal').setAttribute('aria-invalid','true');
    if(errors.some(e=>e.startsWith('Annual rate')||e.includes('too low'))) $('annualRate').setAttribute('aria-invalid','true');
    if(errors.some(e=>e.startsWith('Time horizon'))) $('years').setAttribute('aria-invalid','true');
    if(errors.some(e=>e.startsWith('Regular contribution'))) $('contributionAmount').setAttribute('aria-invalid','true');
    if(errors.some(e=>e.startsWith('Inflation rate'))) $('inflationRate').setAttribute('aria-invalid','true');
  }

  function renderHeadline(r){
    $('endingValue').textContent=money(r.endingValue);
    $('totalContributed').textContent=money(r.totalContributed);
    $('growthEarned').textContent=money(r.growth);
    $('effectiveAnnualRate').textContent=pct(r.effectiveAnnualRate,2);
    $('simpleEndingValue').textContent=money(r.simpleEndingValue);
    const diff=r.compoundVsSimpleDifference;
    $('simpleDifference').textContent=`Compound result is ${diff>=0?'higher':'lower'} by ${money(Math.abs(diff))} in this illustration.`;
    $('endingNote').textContent=`After ${r.state.years} years at a ${r.state.annualRate.toFixed(1)}% nominal annual rate, compounded ${COMPOUNDING_LABELS[r.state.compounding]}.`;
    const showReal=r.state.inflationEnabled;
    $('realValueCard').hidden=!showReal;
    if(showReal){$('realEndingValue').textContent=money(r.realEndingValue);$('realValueNote').textContent=`Adjusted for ${r.state.inflation.toFixed(1)}% annual inflation over ${r.state.years} years.`;}
  }

  function svgEl(name,attrs={},text=''){
    const el=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    if(text!==undefined&&text!==null) el.textContent=text;
    return el;
  }
  function pathFor(series,key,xFor,yFor){
    return series.map((row,i)=>`${i?'L':'M'} ${xFor(row.year).toFixed(2)} ${yFor(row[key]??0).toFixed(2)}`).join(' ');
  }
  function renderChart(r){
    const svg=$('growthChart');
    while(svg.lastChild && !['title','desc'].includes(svg.lastChild.tagName?.toLowerCase())) svg.removeChild(svg.lastChild);
    // Clear any previously rendered nodes while preserving accessible title/description.
    [...svg.children].filter(el=>!['title','desc'].includes(el.tagName.toLowerCase())).forEach(el=>el.remove());
    const W=800,H=380,Lm=92,Rm=28,T=34,B=58;
    const values=r.series.flatMap(row=>[row.totalContributed,row.endingValue,row.realValue??0]);
    const maxV=Math.max(1,...values);
    const yMax=maxV*1.08;
    const xFor=year=>Lm+(year/r.state.years)*(W-Lm-Rm);
    const yFor=value=>T+(1-(Math.max(0,value)/yMax))*(H-T-B);
    const g=svgEl('g'); svg.appendChild(g);
    for(let i=0;i<=4;i+=1){
      const y=T+i*(H-T-B)/4, value=yMax*(1-i/4);
      g.appendChild(svgEl('line',{x1:Lm,y1:y,x2:W-Rm,y2:y,stroke:'#dce6ea','stroke-width':1}));
      g.appendChild(svgEl('text',{x:Lm-12,y:y+4,'text-anchor':'end',fill:'#61798b','font-size':12,'font-weight':600},compact(value)));
    }
    const xTicks=[0,Math.round(r.state.years/2),r.state.years];
    [...new Set(xTicks)].forEach(year=>{const x=xFor(year);g.appendChild(svgEl('text',{x,y:H-22,'text-anchor':'middle',fill:'#61798b','font-size':12,'font-weight':650},year===0?'Today':`Year ${year}`));});
    g.appendChild(svgEl('path',{d:pathFor(r.series,'totalContributed',xFor,yFor),fill:'none',stroke:'#7c91a3','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'}));
    g.appendChild(svgEl('path',{d:pathFor(r.series,'endingValue',xFor,yFor),fill:'none',stroke:'#0e8b80','stroke-width':4,'stroke-linecap':'round','stroke-linejoin':'round'}));
    if(r.state.inflationEnabled){g.appendChild(svgEl('path',{d:pathFor(r.series,'realValue',xFor,yFor),fill:'none',stroke:'#b47b21','stroke-width':3,'stroke-dasharray':'8 6','stroke-linecap':'round'}));}
    const final=r.series[r.series.length-1],fx=xFor(final.year);
    const label=(value,color,dy,text)=>{const y=yFor(value);g.appendChild(svgEl('circle',{cx:fx,cy:y,r:5,fill:color,stroke:'#fff','stroke-width':2}));g.appendChild(svgEl('text',{x:fx-8,y:Math.max(17,y+dy),'text-anchor':'end',fill:color,'font-size':12,'font-weight':850},text));};
    label(final.endingValue,'#0e8b80',-9,`Compound ${compact(final.endingValue)}`);
    label(final.totalContributed,'#60788a',17,`Contributed ${compact(final.totalContributed)}`);
    if(r.state.inflationEnabled) label(final.realValue,'#9a6413',-9,`Today's money ${compact(final.realValue)}`);
    $('chartDesc').textContent=`Over ${r.state.years} years, total contributions reach ${money(r.totalContributed)} and the modeled compound value reaches ${money(r.endingValue)}.`;
    $('chartSummary').textContent=`You contribute ${money(r.totalContributed)} in total. Under the selected constant-rate assumptions, the ending value is ${money(r.endingValue)}, including ${money(r.growth)} of modeled growth.${r.state.inflationEnabled?` In today's purchasing-power terms, the ending value is ${money(r.realEndingValue)}.`:''}`;
    $('realLegend').hidden=!r.state.inflationEnabled;
  }

  function sampledSeries(series){
    if(series.length<=31) return series;
    const out=[series[0]],maxIndex=series.length-1, step=Math.ceil(maxIndex/29);
    for(let i=step;i<maxIndex;i+=step) out.push(series[i]);
    if(out[out.length-1]!==series[maxIndex]) out.push(series[maxIndex]);
    return out.slice(0,31);
  }
  function renderTable(r){
    const rows=sampledSeries(r.series);
    $('annualTableBody').innerHTML=rows.map(row=>`<tr><td>${row.year===0?'Today':`Year ${row.year}`}</td><td>${money(row.totalContributed)}</td><td>${money(row.endingValue)}</td><td>${money(row.growth)}</td>${r.state.inflationEnabled?`<td>${money(row.realValue)}</td>`:''}</tr>`).join('');
    document.querySelectorAll('.real-column').forEach(el=>{el.hidden=!r.state.inflationEnabled;});
    $('tableNote').textContent=r.series.length>31?'A representative set of years is shown here for readability. The CSV and PDF report include the full annual series.':'The CSV and PDF report include this complete annual series.';
  }

  function render(){
    syncOptionalFields();
    const result=C.calculate(stateFromUi());
    if(!result.ok){showValidation(result.errors);lastResult=null;return;}
    showValidation([]);lastResult=result;renderHeadline(result);renderChart(result);renderTable(result);
    if(window.CarrowmontPlanState){
      window.CarrowmontPlanState.setMany({
        'assumptions.compoundAnnualRate':{value:result.state.annualRate,sourceTool:'compound-interest-calculator'},
        'assumptions.compoundInflationRate':{value:result.state.inflationEnabled?result.state.inflation:null,sourceTool:'compound-interest-calculator'}
      });
    }
  }

  function reset(){
    $('principal').value='100000';$('annualRate').value='7';$('years').value='10';$('compoundingFrequency').value='monthly';
    $('contributionEnabled').checked=false;$('contributionAmount').value='5000';contributionFrequencyUserOverride=false;$('contributionFrequency').value=defaultContributionFrequency();$('contributionTiming').value='end';
    $('inflationEnabled').checked=false;$('inflationRate').value='3';render();
  }

  function summaryText(){
    const r=lastResult;if(!r)return '';
    const s=r.state;const lines=[
      'Carrowmont Compound Interest Calculator',
      `Starting amount: ${money(s.principal)}`,
      `Annual rate: ${s.annualRate.toFixed(2)}%`,
      `Compounding: ${COMPOUNDING_LABELS[s.compounding]}`,
      `Time horizon: ${s.years} years`,
      `Regular contributions: ${s.contributionEnabled?`${money(s.contribution)} · ${contributionFrequencyLabel(s.contributionFrequency)} · ${s.contributionTiming} of period`:'Not included'}`,
      `Ending value: ${money(r.endingValue)}`,
      `Total contributed: ${money(r.totalContributed)}`,
      `Growth / interest earned: ${money(r.growth)}`,
      `Effective annual rate: ${pct(r.effectiveAnnualRate,2)}`,
      `Simple-interest comparison: ${money(r.simpleEndingValue)}`
    ];
    if(s.inflationEnabled)lines.push(`Ending value in today's money: ${money(r.realEndingValue)} using ${s.inflation.toFixed(2)}% inflation`);
    lines.push('Educational illustration only; assumed rates are not guaranteed outcomes.');return lines.join('\n');
  }

  async function copySummary(){
    const text=summaryText();if(!text)return;
    try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);else throw new Error('clipboard unavailable');$('reportDownloadStatus').textContent='Summary copied.';}
    catch(_){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();$('reportDownloadStatus').textContent='Summary copied.';}
  }

  function csvRows(){
    const r=lastResult;if(!r)return [];
    const header=['year','total_contributed','ending_balance','growth'];if(r.state.inflationEnabled)header.push('ending_value_today_money');
    const rows=[header];r.series.forEach(row=>{const vals=[row.year,row.totalContributed,row.endingValue,row.growth];if(r.state.inflationEnabled)vals.push(row.realValue);rows.push(vals);});return rows;
  }
  function downloadCsv(){
    const rows=csvRows();if(!rows.length)return;
    const csv=rows.map(row=>row.map(v=>typeof v==='number'?Number(v.toFixed(6)):String(v)).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='carrowmont-compound-interest-growth.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);$('reportDownloadStatus').textContent='CSV has been downloaded.';
  }
  async function downloadReport(){
    if(!lastResult||!window.CarrowmontCompoundPdf)return;
    const btn=$('reportBtn');btn.disabled=true;$('reportDownloadStatus').textContent='Preparing report…';
    try{await window.CarrowmontCompoundPdf.download(lastResult,$('growthChart'));$('reportDownloadStatus').textContent='Report has been downloaded.';}
    catch(err){console.error(err);$('reportDownloadStatus').textContent='The report could not be generated. Please try again.';}
    finally{btn.disabled=false;}
  }

  function bind(){
    ['principal','annualRate','years','compoundingFrequency','contributionAmount','contributionTiming','inflationRate'].forEach(id=>$(id).addEventListener('input',render));
    $('compoundingFrequency').addEventListener('change',render);
    $('contributionFrequency').addEventListener('change',()=>{contributionFrequencyUserOverride=true;render();});
    $('contributionEnabled').addEventListener('change',render);$('inflationEnabled').addEventListener('change',render);
    $('resetBtn').addEventListener('click',reset);$('copySummaryBtn').addEventListener('click',copySummary);$('csvBtn').addEventListener('click',downloadCsv);$('reportBtn').addEventListener('click',downloadReport);
    $('regionSelect').addEventListener('change',()=>{contributionFrequencyUserOverride=false;L.setRegion($('regionSelect').value,{syncCurrency:true});});
    $('currencySelect').addEventListener('change',()=>L.setCurrency($('currencySelect').value));
    $('localeDone').addEventListener('click',()=>{$('localeMenu').open=false;});
    window.addEventListener('carrowmont:localechange',()=>applyLocale({regionChanged:false}));
  }

  function consumeSharedLocale(){
    const S=window.CarrowmontPlanState;if(!S)return;
    const region=S.readValue('locale.region'),currency=S.readValue('locale.currency');
    if(region&&L.regions[region]&&currency&&L.currencies[currency]&&(region!==L.getRegion()||currency!==L.getCurrency()))L.setLocale(region,currency);
  }

  populateLocaleControls();bind();consumeSharedLocale();applyLocale();
})();
