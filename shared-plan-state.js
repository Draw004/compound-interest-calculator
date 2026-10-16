(() => {
  'use strict';

  const STORAGE_KEY = 'carrowmont_plan_context_v1';
  const SCHEMA_VERSION = 1;
  const scriptEl = document.currentScript;
  const DEFAULT_SOURCE = scriptEl?.dataset?.carrowmontTool || 'carrowmont';
  const ALLOWED_ROOTS = new Set(['locale', 'assumptions', 'housingLoan']);

  function now(){ return new Date().toISOString(); }
  function safeParse(raw){
    if(!raw) return null;
    try { const value=JSON.parse(raw); return value && typeof value==='object' ? value : null; }
    catch(_){ return null; }
  }
  function blank(){ return { version:SCHEMA_VERSION, locale:{}, assumptions:{}, housingLoan:{} }; }
  function normalize(value){
    if(!value || typeof value!=='object' || Number(value.version)!==SCHEMA_VERSION) return blank();
    return {
      version:SCHEMA_VERSION,
      locale:value.locale && typeof value.locale==='object' ? value.locale : {},
      assumptions:value.assumptions && typeof value.assumptions==='object' ? value.assumptions : {},
      housingLoan:value.housingLoan && typeof value.housingLoan==='object' ? value.housingLoan : {}
    };
  }
  function load(){
    try { return normalize(safeParse(localStorage.getItem(STORAGE_KEY))); }
    catch(_){ return blank(); }
  }
  function save(state, changedKeys=[]){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(state))); }
    catch(_){ return false; }
    if(changedKeys.length){
      window.dispatchEvent(new CustomEvent('carrowmont:planchange', { detail:{ keys:[...new Set(changedKeys)] } }));
    }
    return true;
  }
  function pathParts(path){
    const parts=String(path||'').split('.').filter(Boolean);
    if(parts.length<2 || !ALLOWED_ROOTS.has(parts[0])) throw new Error(`Unsupported shared-state key: ${path}`);
    return parts;
  }
  function getNode(state, parts, create=false){
    let node=state;
    for(let i=0;i<parts.length-1;i+=1){
      const key=parts[i];
      if(!node[key] || typeof node[key]!=='object'){
        if(!create) return null;
        node[key]={};
      }
      node=node[key];
    }
    return { parent:node, key:parts[parts.length-1] };
  }
  function get(path){
    const state=load();
    const parts=pathParts(path);
    const holder=getNode(state,parts,false);
    return holder ? holder.parent[holder.key] ?? null : null;
  }
  function readValue(path, options={}){
    const entry=get(path);
    if(!entry || typeof entry!=='object' || !Object.prototype.hasOwnProperty.call(entry,'value')) return null;
    if(options.currency && entry.currency && entry.currency!==options.currency) return null;
    return entry.value;
  }
  function validPrimitive(value){
    return typeof value==='string' || typeof value==='number' || typeof value==='boolean' || value===null;
  }
  function set(path, value, options={}){
    if(!validPrimitive(value)) throw new Error('Shared-state values must be primitive.');
    if(typeof value==='number' && !Number.isFinite(value)) throw new Error('Shared-state number must be finite.');
    const parts=pathParts(path);
    const state=load();
    const holder=getNode(state,parts,true);
    const sourceTool=options.sourceTool || DEFAULT_SOURCE;
    const entry={ value, sourceTool, updatedAt:now() };
    if(options.currency) entry.currency=String(options.currency);
    holder.parent[holder.key]=entry;
    return save(state,[path]);
  }
  function setMany(values, options={}){
    const state=load();
    const changed=[];
    Object.entries(values||{}).forEach(([path,payload])=>{
      const parts=pathParts(path);
      const holder=getNode(state,parts,true);
      const item=(payload && typeof payload==='object' && Object.prototype.hasOwnProperty.call(payload,'value')) ? payload : {value:payload};
      const value=item.value;
      if(!validPrimitive(value) || (typeof value==='number' && !Number.isFinite(value))) return;
      const entry={ value, sourceTool:item.sourceTool || options.sourceTool || DEFAULT_SOURCE, updatedAt:now() };
      const currency=item.currency || options.currency;
      if(currency) entry.currency=String(currency);
      holder.parent[holder.key]=entry;
      changed.push(path);
    });
    return save(state,changed);
  }
  function clear(paths){
    if(!paths){
      try { localStorage.removeItem(STORAGE_KEY); }
      catch(_){ return false; }
      window.dispatchEvent(new CustomEvent('carrowmont:planchange',{detail:{keys:['*']}}));
      return true;
    }
    const state=load();
    const changed=[];
    for(const path of Array.isArray(paths)?paths:[paths]){
      const parts=pathParts(path);
      const holder=getNode(state,parts,false);
      if(holder && Object.prototype.hasOwnProperty.call(holder.parent,holder.key)){
        delete holder.parent[holder.key]; changed.push(path);
      }
    }
    return save(state,changed);
  }
  function snapshot(){ return JSON.parse(JSON.stringify(load())); }
  function syncLocale(sourceTool=DEFAULT_SOURCE){
    const L=window.CarrowmontLocale;
    if(!L?.getRegion || !L?.getCurrency) return false;
    return setMany({
      'locale.region':{value:L.getRegion(),sourceTool},
      'locale.currency':{value:L.getCurrency(),sourceTool}
    });
  }

  window.CarrowmontPlanState={
    STORAGE_KEY, SCHEMA_VERSION, load:snapshot, get, readValue, set, setMany, clear, syncLocale
  };

  if(window.CarrowmontLocale) syncLocale();
  window.addEventListener('carrowmont:localechange',()=>syncLocale());
})();
