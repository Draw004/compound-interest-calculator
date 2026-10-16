(() => {
  'use strict';
  const script=document.currentScript;
  const tool=script?.dataset?.carrowmontTool||'';
  const S=window.CarrowmontPlanState;
  const L=window.CarrowmontLocale;
  if(!S||!L||!tool)return;

  const $=id=>document.getElementById(id);
  const qsa=(sel,root=document)=>[...root.querySelectorAll(sel)];
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
  const ppy={weekly:52,biweekly:26,fortnightly:26,semimonthly:24,fourweekly:13,monthly:12,quarterly:4,annual:1};
  const monthlyEquivalent=(amount,frequency)=>num(amount)*(ppy[frequency]||12)/12;
  const sameCurrency=path=>S.readValue(path,{currency:L.getCurrency()});
  const format=v=>L.formatMoney(num(v),{maximumFractionDigits:0});

  function styles(){
    if(document.getElementById('cm-shared-plan-bridge-style'))return;
    const st=document.createElement('style');st.id='cm-shared-plan-bridge-style';st.textContent=`
      .cm-shared-plan-banner{max-width:1180px;margin:18px auto;padding:14px 16px;border:1px solid #c7ddd9;border-radius:14px;background:#f0f8f6;color:#102945;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;align-items:center;justify-content:space-between;gap:16px;box-sizing:border-box}
      .cm-shared-plan-banner[hidden]{display:none!important}.cm-shared-plan-banner strong{display:block;font-size:14px;margin-bottom:3px}.cm-shared-plan-banner span{display:block;color:#4c6379;font-size:13px;line-height:1.45}.cm-shared-plan-banner button{min-height:44px;border:0;border-radius:11px;padding:0 15px;background:#0e8b80;color:#fff;font:800 13px/1 Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer;white-space:nowrap}.cm-shared-plan-banner button.secondary{background:#fff;color:#08756d;border:1px solid #b8d8d3}.cm-shared-plan-actions{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:700px){.cm-shared-plan-banner{margin:14px;align-items:stretch;flex-direction:column}.cm-shared-plan-actions{width:100%}.cm-shared-plan-banner button{flex:1;white-space:normal}}
    `;document.head.appendChild(st);
  }
  function mountBanner(message,detail,actions=[]){
    styles();let host=document.getElementById('cmSharedPlanBanner');
    if(!host){host=document.createElement('aside');host.id='cmSharedPlanBanner';host.className='cm-shared-plan-banner';host.setAttribute('aria-live','polite');const target=document.querySelector('main')||document.body;const anchor=target.querySelector('section:nth-of-type(2), .planner-shell, .planner-section, .tool-shell, .calculator-shell, .split-section');if(anchor?.parentNode)anchor.parentNode.insertBefore(host,anchor);else target.insertBefore(host,target.firstChild);}
    host.innerHTML='';const copy=document.createElement('div');copy.innerHTML=`<strong>${message}</strong><span>${detail}</span>`;host.appendChild(copy);if(actions.length){const group=document.createElement('div');group.className='cm-shared-plan-actions';actions.forEach(a=>{const b=document.createElement('button');b.type='button';b.textContent=a.label;if(a.secondary)b.className='secondary';b.addEventListener('click',()=>a.run(host));group.appendChild(b);});host.appendChild(group);}host.hidden=false;return host;
  }
  function hideBanner(){const h=document.getElementById('cmSharedPlanBanner');if(h)h.hidden=true;}
  function dispatch(el,type='input'){if(!el)return;el.dispatchEvent(new Event(type,{bubbles:true}));if(type!=='change')el.dispatchEvent(new Event('change',{bubbles:true}));}

  function mortgageBridge(){
    const possible=sameCurrency('housingLoan.possibleRegularPayment');
    if(!(possible>0))return;
    mountBanner('Budget housing commitment available',`${format(possible)} per month is available from Budget & Cash Flow as a possible regular housing payment. Carrowmont will not assume it is your loan repayment unless you choose to use it.`,[
      {label:'Use as current repayment',run:host=>{const toggle=$('useCurrentPayment'),input=$('currentPayment');if(toggle&&input){toggle.checked=true;input.value=String(possible);dispatch(toggle,'change');dispatch(input);host.hidden=true;}}},
      {label:'Not now',secondary:true,run:host=>host.hidden=true}
    ]);
  }

  function budgetHousingRow(){
    return qsa('#essentialRows .entry-row').find(row=>/rent\s*\/\s*mortgage|mortgage|home loan/i.test(row.querySelector('[data-field="name"]')?.value||''));
  }
  function publishBudgetHousing(){
    const row=budgetHousingRow();if(!row)return;const amount=num(row.querySelector('[data-field="amount"]')?.value),frequency=row.querySelector('[data-field="frequency"]')?.value||'monthly';const monthly=monthlyEquivalent(amount,frequency);if(monthly>0)S.set('housingLoan.possibleRegularPayment',monthly,{sourceTool:'budget-cash-flow-planner',currency:L.getCurrency()});
  }
  function budgetBridge(){
    publishBudgetHousing();document.addEventListener('input',e=>{if(e.target.closest?.('#essentialRows'))publishBudgetHousing();});document.addEventListener('change',e=>{if(e.target.closest?.('#essentialRows'))publishBudgetHousing();});
    const payment=sameCurrency('housingLoan.monthlyEquivalentPayment'),date=S.readValue('housingLoan.modeledPayoffDate');if(!(payment>0))return;
    mountBanner('Home-loan repayment available from Carrowmont',`${format(payment)} per month${date?` with a modeled payoff around ${date}`:''} is available from the Home Loan / Mortgage tool. Apply it only if this is the housing commitment you want in this budget.`,[
      {label:'Use in Rent / mortgage',run:host=>{let row=budgetHousingRow();if(!row)return;let freq=row.querySelector('[data-field="frequency"]');if(freq&&freq.value!=='monthly'){freq.value='monthly';dispatch(freq,'change');row=budgetHousingRow()||row;}const amount=row.querySelector('[data-field="amount"]');if(amount){amount.value=String(payment);dispatch(amount);}host.hidden=true;publishBudgetHousing();}},
      {label:'Keep my budget value',secondary:true,run:host=>host.hidden=true}
    ]);
  }

  function retirementBridge(){
    const payment=sameCurrency('housingLoan.monthlyEquivalentPayment'),payoff=S.readValue('housingLoan.modeledPayoffDate');if(!(payment>0))return;
    mountBanner('Home-loan payment available',`${format(payment)} per month is available from the Home Loan / Mortgage tool${payoff?`, with a modeled payoff around ${payoff}`:''}. You can apply it to the existing “Home loan / rent” expense row after reviewing the retirement timing.`,[
      {label:'Apply to Home loan / rent',run:host=>{const row=qsa('#expenseRows .expense-row').find(tr=>/home loan|mortgage|rent/i.test(tr.querySelector('.exp-name')?.value||''));if(!row)return;const amount=row.querySelector('.exp-amount');if(amount){amount.value=String(payment);dispatch(amount);}if(payoff){const currentAge=num($('currentAge')?.value);const now=new Date(),end=new Date(`${payoff}T00:00:00Z`);const years=Math.max(0,(end-now)/(365.2425*86400000));const age=Math.round(currentAge+years);const rule=row.querySelector('.exp-rule');if(rule&&age>currentAge&&age<=110){rule.value='end';dispatch(rule,'change');setTimeout(()=>{const setting=row.querySelector('.exp-setting');if(setting){setting.value=String(age);dispatch(setting);}},0);}}host.hidden=true;}},
      {label:'Review only',secondary:true,run:host=>host.hidden=true}
    ]);
  }

  function goalBridge(){
    const balance=sameCurrency('housingLoan.balance');if(!(balance>0))return;
    mountBanner('Home-loan balance available',`${format(balance)} is available from the Home Loan / Mortgage tool. Use it only if you deliberately want to model paying off today’s balance as a financial goal; it is not a lender settlement quote.`,[
      {label:'Use balance as goal amount',run:host=>{const amount=$('amountToday'),name=$('goalName');if(amount){amount.value=String(balance);dispatch(amount);}if(name){name.value='Home loan payoff';dispatch(name);}host.hidden=true;}},
      {label:'Keep current goal',secondary:true,run:host=>host.hidden=true}
    ]);
  }

  function fiBridge(){
    const payment=sameCurrency('housingLoan.monthlyEquivalentPayment'),date=S.readValue('housingLoan.modeledPayoffDate');if(!(payment>0))return;
    mountBanner('Housing debt context is available',`Your shared Carrowmont plan contains a modeled housing payment of ${format(payment)} per month${date?` ending around ${date}`:''}. Financial Independence uses total household spending, so Carrowmont will not add this automatically and risk double-counting it. Review whether your current monthly spending already includes the payment.`,[{label:'Dismiss',secondary:true,run:host=>host.hidden=true}]);
  }

  function sipBridge(){
    const payment=sameCurrency('housingLoan.monthlyEquivalentPayment'),date=S.readValue('housingLoan.modeledPayoffDate');if(!(payment>0))return;
    mountBanner('Possible post-payoff cash flow',`The shared home-loan plan contains a payment of ${format(payment)} per month${date?` until about ${date}`:''}. This investment calculator starts recurring contributions immediately, so Carrowmont will not automatically redirect that future payment into investing.`,[{label:'Dismiss',secondary:true,run:host=>host.hidden=true}]);
  }

  function inflationBridge(){
    const balance=sameCurrency('housingLoan.balance');if(!(balance>0))return;
    mountBanner('Loan balance kept separate from inflation',`A shared housing-loan balance of ${format(balance)} is available, but Carrowmont will not inflate the loan balance merely because the Inflation Calculator is open. Use this tool only for a separate purchasing-power or future-cost question.`,[{label:'Dismiss',secondary:true,run:host=>host.hidden=true}]);
  }

  function run(){hideBanner();({
    'mortgage-payoff-calculator':mortgageBridge,
    'budget-cash-flow-planner':budgetBridge,
    'retirement-calculator':retirementBridge,
    'goal-planner':goalBridge,
    'financial-independence':fiBridge,
    'sip-calculator':sipBridge,
    'inflation-calculator':inflationBridge
  }[tool]||(()=>{}))();}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else setTimeout(run,0);
  window.addEventListener('carrowmont:planchange',e=>{const keys=e.detail?.keys||[];if(tool==='budget-cash-flow-planner'&&keys.length&&keys.every(k=>k==='housingLoan.possibleRegularPayment'))return;if(keys.some(k=>k==='*'||k.startsWith('housingLoan.')))setTimeout(run,0);});
})();
