import { useState, useMemo, useEffect, useRef } from "react";

// ── Supabase ───────────────────────────────────────────────────────────────────
const SB_URL="https://qswoavwqldksakyzudaq.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzd29hdndxbGRrc2FreXp1ZGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDA3NjAsImV4cCI6MjA5Njg3Njc2MH0.DS7j8Mjxwm_O8v6P5g4R0ggmtcXa2KrdfLKpl6zXZyY";
async function sbGet(k){try{const r=await fetch(`${SB_URL}/rest/v1/budget_data?key=eq.${k}&select=value`,{headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`}});const d=await r.json();return d?.[0]?.value??null;}catch{return null;}}
async function sbSet(k,v){try{await fetch(`${SB_URL}/rest/v1/budget_data`,{method:"POST",headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},body:JSON.stringify({key:k,value:v,updated_at:new Date().toISOString()})});}catch{}}
function lsGet(k,fb){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
function useSynced(key,init){
  const [val,setVal]=useState(()=>lsGet(key,init));
  const [ok,setOk]=useState(false);
  const t=useRef(null);
  useEffect(()=>{sbGet(key).then(r=>{if(r!==null){setVal(r);lsSet(key,r);}setOk(true);});},[key]);
  const set=u=>setVal(prev=>{const next=typeof u==="function"?u(prev):u;lsSet(key,next);clearTimeout(t.current);t.current=setTimeout(()=>sbSet(key,next),800);return next;});
  return[val,set,ok];
}

const C={bg:"#0a0a0a",s1:"#111111",s2:"#181818",border:"#252525",borderHi:"#333333",hi:"#f0f0f0",mid:"#888888",lo:"#444444",accent:"#e8ff47",red:"#ff4545",green:"#3ddc84",amber:"#f59e0b",blue:"#60a5fa",purple:"#a78bfa",teal:"#2dd4bf",pink:"#f472b6"};
let _id=500;const uid=()=>++_id;
function fmt(n){return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n||0);}
function fmtD(n){return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);}
function fmtDate(d){return d.toLocaleDateString("es-MX",{day:"numeric",month:"short"});}
function daysUntil(d){const n=new Date();n.setHours(0,0,0,0);const t=new Date(d);t.setHours(0,0,0,0);return Math.round((t-n)/864e5);}

// Anchor: Jun 20 2025 — a Friday. Catorcenas caen cada 14 días, viernes sí / viernes no.
function nextCatorcenas(n=6){
  const anchor=new Date(2025,5,20,12,0,0); // Jun 20 2025 (viernes)
  const today=new Date();today.setHours(12,0,0,0);
  const elapsed=today.getTime()-anchor.getTime();
  const periods=Math.max(0,Math.ceil(elapsed/(14*864e5)));
  return Array.from({length:n},(_,i)=>new Date(anchor.getTime()+(periods+i)*14*864e5));
}

const DEFAULT_FIXED=[
  {id:1,name:"Renta",cat:"Vivienda",amount:3400,active:true},
  {id:2,name:"Food",cat:"Alimentación",amount:3000,active:true},
  {id:3,name:"Terapia",cat:"Salud",amount:1750,active:true},
  {id:4,name:"Quetiapina",cat:"Salud",amount:449,active:true},
  {id:5,name:"Vitaminas",cat:"Salud",amount:488,active:true},
  {id:6,name:"Minoxidil",cat:"Salud",amount:372,active:true},
  {id:7,name:"Laundry",cat:"Servicios",amount:800,active:true},
  {id:8,name:"Haircut",cat:"Personal",amount:450,active:true},
  {id:9,name:"Transport",cat:"Transporte",amount:399,active:true},
  {id:10,name:"YouTube",cat:"Suscripciones",amount:188,active:true},
  {id:11,name:"Home",cat:"Hogar",amount:95,active:true},
  {id:12,name:"Bait",cat:"Internet",amount:199,active:true},
  {id:13,name:"Weed",cat:"Personal",amount:1400,active:true},
];
const DEFAULT_ACCOUNTS=[
  {id:1,name:"Vales",type:"debito",balance:0,limit:0},
  {id:2,name:"OpenBank",type:"debito",balance:0,limit:0},
  {id:3,name:"Santander",type:"debito",balance:0,limit:0},
  {id:4,name:"Banamex",type:"debito",balance:0,limit:0},
  {id:5,name:"Stori",type:"credito",balance:0,limit:0},
  {id:6,name:"Vexi",type:"credito",balance:0,limit:0},
  {id:7,name:"Plata",type:"credito",balance:0,limit:0},
];
const DEFAULT_CATS=["Vivienda","Alimentación","Salud","Hogar","Personal","Transporte","Suscripciones","Internet","Servicios","Entretenimiento","Ropa"];
const EXTRA_CATS_DEFAULT=["Ropa","Salidas","Médico","Hogar","Tecnología","Entretenimiento","Internet","Servicios","Suscripciones","Otro"];
const PRIO=[{id:"alta",label:"Alta",color:C.red},{id:"media",label:"Media",color:C.amber},{id:"baja",label:"Baja",color:C.lo}];

// ── Micro UI ───────────────────────────────────────────────────────────────────
function Toggle({on,onChange}){return<button onClick={onChange} style={{width:32,height:18,borderRadius:99,flexShrink:0,background:on?C.accent:C.border,border:"none",cursor:"pointer",position:"relative",transition:"background .15s"}}><span style={{position:"absolute",top:3,left:on?15:3,width:12,height:12,borderRadius:"50%",background:on?C.bg:C.lo,transition:"left .15s",display:"block"}}/></button>;}
function MI({value,onChange,dimmed,width,ph}){return<div style={{position:"relative",display:"flex",alignItems:"center",flexShrink:0}}><span style={{position:"absolute",left:8,fontSize:11,color:dimmed?C.lo:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={value||""} placeholder={ph||"0"} onChange={e=>onChange(parseFloat(e.target.value)||0)} disabled={dimmed} style={{width:width||100,paddingLeft:18,paddingRight:6,paddingTop:7,paddingBottom:7,background:dimmed?"transparent":C.s2,border:`1px solid ${dimmed?C.border:C.borderHi}`,borderRadius:7,color:dimmed?C.lo:C.hi,fontFamily:"monospace",fontWeight:500,textAlign:"right",outline:"none"}}/></div>;}
function TI({value,onChange,placeholder,dimmed,style:ex}){return<input value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} disabled={dimmed} style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${dimmed?"transparent":C.border}`,color:dimmed?C.lo:C.hi,padding:"3px 0",outline:"none",fontFamily:"inherit",minWidth:0,...ex}}/>;}
function XBtn({onClick,title}){return<button onClick={onClick} title={title} style={{background:"none",border:"none",color:C.lo,cursor:"pointer",fontSize:18,lineHeight:1,padding:"0 2px",flexShrink:0,minWidth:24,transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.lo}>×</button>;}
function AddBtn({label,onClick,color}){return<button onClick={onClick} style={{display:"flex",alignItems:"center",gap:7,width:"100%",background:"none",border:"none",padding:"10px 16px",color:C.lo,cursor:"pointer",fontFamily:"inherit",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color=color||C.accent} onMouseLeave={e=>e.currentTarget.style.color=C.lo}><span style={{fontSize:16}}>+</span>{label}</button>;}
function Block({label,total,totalColor,accent,children,footer,collapsible}){
  const [open,setOpen]=useState(true);
  return<div style={{background:C.s1,border:`1px solid ${accent?accent+"44":C.border}`,borderRadius:14,marginBottom:12,overflow:"hidden"}}>
    <div onClick={collapsible?()=>setOpen(o=>!o):undefined} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 16px",borderBottom:open?`1px solid ${C.border}`:"none",cursor:collapsible?"pointer":"default"}}>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:accent||C.mid,textTransform:"uppercase"}}>{label}{collapsible&&<span style={{marginLeft:6,fontSize:10,color:C.lo}}>{open?"▾":"▸"}</span>}</span>
      {total!==undefined&&<span style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:totalColor||C.hi}}>{fmt(total)}</span>}
    </div>
    {open&&<>{children}{footer&&<div style={{borderTop:`1px solid ${C.border}`}}>{footer}</div>}</>}
  </div>;
}
function TR({children,dimmed}){return<div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderBottom:`1px solid ${C.border}`,opacity:dimmed?0.3:1,flexWrap:"wrap"}}>{children}</div>;}
function Badge({label,color}){return<span style={{fontSize:10,fontWeight:700,color,background:color+"18",borderRadius:5,padding:"2px 7px",flexShrink:0,whiteSpace:"nowrap"}}>{label}</span>;}
function NI({value,onChange,width}){return<input type="number" min="0" value={value||""} onChange={e=>onChange(parseFloat(e.target.value)||0)} style={{width:width||70,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"6px 8px",fontFamily:"monospace",fontSize:13,textAlign:"right",outline:"none"}}/>;}

function CatSel({value,onChange,cats}){
  const [custom,setCustom]=useState(!cats.includes(value)&&!!value);
  if(custom)return<div style={{display:"flex",gap:4,flexShrink:0}}>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder="Categoría" style={{width:100,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"5px 8px",fontSize:12,fontFamily:"inherit",outline:"none"}}/>
    <button onClick={()=>{setCustom(false);onChange(cats[0]);}} style={{background:"none",border:"none",color:C.lo,cursor:"pointer",fontSize:12}}>↩</button>
  </div>;
  return<select value={cats.includes(value)?value:cats[0]} onChange={e=>{if(e.target.value==="__new__"){setCustom(true);onChange("");}else onChange(e.target.value);}} style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.mid,padding:"5px 6px",fontFamily:"inherit",outline:"none",fontSize:12,flexShrink:0}}>
    {cats.map(c=><option key={c} value={c}>{c}</option>)}
    <option value="__new__">+ Agregar...</option>
  </select>;
}

// ── TABS ───────────────────────────────────────────────────────────────────────
const TABS=[{id:"main",label:"💰 Principal"},{id:"cuentas",label:"🏦 Cuentas"},{id:"deudas",label:"📋 Deudas"},{id:"transporte",label:"🚌 Bus"},{id:"wish",label:"⭐ Wishlist"}];
function Tabs({active,onChange}){return<div style={{display:"flex",gap:3,marginBottom:14,background:C.s1,border:`1px solid ${C.border}`,borderRadius:10,padding:3,overflowX:"auto"}}>{TABS.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{flex:"0 0 auto",padding:"8px 12px",border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:12,background:active===t.id?C.s2:"transparent",color:active===t.id?C.hi:C.lo,whiteSpace:"nowrap",boxShadow:active===t.id?`0 0 0 1px ${C.border}`:"none"}}>{t.label}</button>)}</div>;}

// ── HERO ───────────────────────────────────────────────────────────────────────
function Hero({fixed,extra,saving,debt,synced}){
  const total=fixed+extra+saving+debt;
  const segs=[{l:"Fijos",v:fixed,c:C.hi},{l:"Extra",v:extra,c:C.amber},{l:"Ahorro",v:saving,c:C.teal},{l:"Deudas",v:debt,c:C.pink}];
  return<div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 16px",marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
      <div style={{fontSize:10,letterSpacing:1.5,color:C.mid,textTransform:"uppercase",fontWeight:600}}>Gastos mensuales</div>
      <div style={{fontSize:10,color:synced?C.green:C.lo}}>{synced?"● sync":"○ ..."}</div>
    </div>
    <div style={{fontFamily:"monospace",fontWeight:700,fontSize:32,letterSpacing:-1,marginBottom:14,color:C.accent,lineHeight:1}}>{fmt(total)}</div>
    <div style={{display:"flex",height:5,background:C.border,borderRadius:99,overflow:"hidden",marginBottom:14}}>
      {segs.map(s=><div key={s.l} style={{height:"100%",width:total>0?`${(s.v/total)*100}%`:0,background:s.c,transition:"width .4s"}}/>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5}}>
      {segs.map(s=><div key={s.l} style={{borderLeft:`2px solid ${C.border}`,paddingLeft:7}}>
        <div style={{fontSize:9,color:C.mid,marginBottom:2}}>{s.l}</div>
        <div style={{fontFamily:"monospace",fontWeight:700,fontSize:10,color:s.c}}>{fmt(s.v)}</div>
      </div>)}
    </div>
  </div>;
}

// ── CATORCENA STRIP ────────────────────────────────────────────────────────────
function CatorcenaStrip({totalFixed,totalExtra,savingGoals,debts}){
  const dates=useMemo(()=>nextCatorcenas(5),[]);
  const [sel,setSel]=useState(0);
  const pay=dates[sel];
  const dias=daysUntil(pay);
  const fixedCat=totalFixed/2;
  const savingCat=savingGoals.reduce((s,g)=>s+(g.target&&g.months?g.target/(g.months*2):0),0);
  const debtCat=debts.filter(d=>d.active).reduce((s,d)=>s+(d.monthly||0)/2,0);
  const extrasCat=totalExtra; // esporadicos del periodo actual completo
  const totalCat=fixedCat+savingCat+debtCat+extrasCat;

  return<div style={{marginBottom:12}}>
    {/* date selector */}
    <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>
      Próxima catorcena — viernes cada 14 días (base 20 jun 2025)
    </div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
      {dates.map((d,i)=>{
        const dU=daysUntil(d);
        return<button key={i} onClick={()=>setSel(i)} style={{padding:"7px 12px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,background:sel===i?C.accent:C.s2,color:sel===i?C.bg:C.mid,outline:sel===i?"none":`1px solid ${C.border}`}}>
          {fmtDate(d)}<br/><span style={{fontSize:10,fontWeight:400,color:sel===i?C.bg+"99":C.lo}}>{dU===0?"hoy":dU>0?`en ${dU}d`:`hace ${-dU}d`}</span>
        </button>;
      })}
    </div>

    {/* catorcena summary card */}
    <div style={{background:C.s1,border:`2px solid ${C.accent}33`,borderRadius:14,padding:"14px 16px"}}>
      <div style={{fontSize:10,color:C.accent,letterSpacing:1,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>
        {fmtDate(pay)} — {dias>0?`en ${dias} días`:dias===0?"hoy":"pasada"}
      </div>
      <div style={{fontFamily:"monospace",fontWeight:700,fontSize:26,color:C.accent,marginBottom:10}}>− {fmt(totalCat)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {[
          {l:"Gastos fijos (½)",v:fixedCat,c:C.hi},
          {l:"Ahorro (½)",v:savingCat,c:C.teal},
          {l:"Deudas (½)",v:debtCat,c:C.pink},
          {l:"Esporádicos",v:extrasCat,c:C.amber},
        ].map(r=><div key={r.l} style={{background:C.s2,borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:10,color:C.lo,marginBottom:3}}>{r.l}</div>
          <div style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:r.c}}>− {fmt(r.v)}</div>
        </div>)}
      </div>
    </div>
  </div>;
}

// ── MAIN TAB (todo junto) ─────────────────────────────────────────────────────
function MainTab({extras,setExtras,extraCats,setExtraCats,totalFixed,totalExtra}){
  const [savingGoalsLocal]=useSynced("saving_goals",[]);
  const [debtsLocal]=useSynced("debts",[]);

  // Expense quick-add state
  const [eName,setEName]=useState("");const [eWhere,setEWhere]=useState("");const [eCat,setECat]=useState(extraCats[0]||"Otro");const [eAmt,setEAmt]=useState("");

  function addExtra(){
    const a=parseFloat(eAmt);if(!eName.trim()||!a)return;
    if(!extraCats.includes(eCat))setExtraCats(p=>[...p,eCat]);
    setExtras(p=>[...p,{id:uid(),name:eName.trim(),where:eWhere.trim(),cat:eCat,amount:a,date:new Date().toISOString().slice(0,10)}]);
    setEName("");setEWhere("");setEAmt("");
  }

  const totalSaving=useMemo(()=>savingGoalsLocal.reduce((s,g)=>s+(g.target&&g.months?g.target/g.months:0),0),[savingGoalsLocal]);
  const totalDebt=useMemo(()=>debtsLocal.filter(d=>d.active).reduce((s,d)=>s+(d.monthly||0),0),[debtsLocal]);
  const totalMes=totalFixed+totalExtra+totalSaving+totalDebt;

  return<div>
    {/* Catorcena strip */}
    <CatorcenaStrip totalFixed={totalFixed} totalExtra={totalExtra} savingGoals={savingGoalsLocal} debts={debtsLocal}/>

    {/* GASTOS ESPORADICOS */}
    <Block label="Gastos esporádicos" total={totalExtra} totalColor={C.amber} accent={C.amber} collapsible
      footer={null}>
      {/* Quick add */}
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",gap:8}}>
          <input value={eName} onChange={e=>setEName(e.target.value)} placeholder="¿Qué?" onKeyDown={e=>e.key==="Enter"&&addExtra()} style={{flex:2,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"7px 10px",fontFamily:"inherit",outline:"none"}}/>
          <input value={eWhere} onChange={e=>setEWhere(e.target.value)} placeholder="¿Dónde?" onKeyDown={e=>e.key==="Enter"&&addExtra()} style={{flex:1,background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.hi,padding:"7px 10px",fontFamily:"inherit",outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <CatSel value={eCat} onChange={setECat} cats={extraCats}/>
          <div style={{position:"relative",flexShrink:0}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
            <input type="number" min="0" value={eAmt} placeholder="0" onChange={e=>setEAmt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addExtra()} style={{width:100,paddingLeft:18,paddingRight:6,paddingTop:7,paddingBottom:7,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,fontFamily:"monospace",textAlign:"right",outline:"none"}}/>
          </div>
          <button onClick={addExtra} style={{background:C.amber,color:C.bg,border:"none",borderRadius:7,padding:"7px 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>+</button>
        </div>
      </div>
      {extras.length===0&&<div style={{padding:"10px 16px",color:C.lo,fontStyle:"italic",fontSize:12}}>Sin gastos este mes</div>}
      {extras.length>0&&<div style={{overflowY:"auto",maxHeight:220}}>
        {extras.map(r=><div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr 70px 75px 24px",gap:6,alignItems:"center",padding:"7px 16px",borderBottom:`1px solid ${C.border}`,transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background=C.s2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div><div style={{color:C.hi,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}}>{r.name}</div>{r.where&&<div style={{color:C.lo,fontSize:10}}>{r.where}</div>}</div>
          <span style={{fontSize:11,color:C.mid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.cat}</span>
          <span style={{fontFamily:"monospace",color:C.amber,textAlign:"right",fontSize:13}}>{fmt(r.amount)}</span>
          <XBtn onClick={()=>setExtras(p=>p.filter(x=>x.id!==r.id))} title="Eliminar gasto"/>
        </div>)}
      </div>}
    </Block>

    {/* AHORRO */}
    <AhorroBlock/>

    {/* RESUMEN FINAL */}
    <div style={{background:C.s1,border:`1px solid ${C.accent}33`,borderRadius:14,overflow:"hidden",marginBottom:12}}>
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:C.accent,textTransform:"uppercase"}}>Resumen mensual</span></div>
      {[{l:"Gastos fijos",v:totalFixed,c:C.hi},{l:"Esporádicos",v:totalExtra,c:C.amber},{l:"Ahorro",v:totalSaving,c:C.teal},{l:"Deudas",v:totalDebt,c:C.pink}].map(({l,v,c})=><div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 16px",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.mid,fontSize:13}}>{l}</span><span style={{fontFamily:"monospace",fontWeight:600,color:c}}>− {fmt(v)}</span></div>)}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px"}}><span style={{fontSize:14,fontWeight:700,color:C.hi}}>Total a cubrir</span><span style={{fontFamily:"monospace",fontSize:20,fontWeight:700,color:C.accent}}>{fmt(totalMes)}</span></div>
    </div>
  </div>;
}

// ── AHORRO (block reutilizable) ────────────────────────────────────────────────
function AhorroBlock(){
  const [goals,setGoals]=useSynced("saving_goals",[]);
  const [name,setName]=useState("");const [target,setTarget]=useState("");const [months,setMonths]=useState("");
  function add(){if(!name.trim())return;setGoals(p=>[...p,{id:uid(),name:name.trim(),target:parseFloat(target)||0,months:parseInt(months)||0,saved:0}]);setName("");setTarget("");setMonths("");}
  function deposit(id,amt){setGoals(p=>p.map(g=>g.id===id?{...g,saved:(g.saved||0)+amt}:g));}
  function del(id){setGoals(p=>p.filter(g=>g.id!==id));}
  const total=goals.reduce((s,g)=>s+(g.target&&g.months?g.target/g.months:0),0);
  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"7px 10px",fontFamily:"inherit",outline:"none",width:"100%"};
  return<Block label="Ahorro" total={total} totalColor={C.teal} accent={C.teal} collapsible
    footer={<AddBtn label="Nuevo objetivo" onClick={add} color={C.teal}/>}>
    <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre (ej. Vacaciones, Fondo)" style={inp}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:80,position:"relative"}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={target} onChange={e=>setTarget(e.target.value)} placeholder="Meta $" style={{...inp,paddingLeft:18,textAlign:"right"}}/></div>
        <div style={{flex:1,minWidth:70}}><input type="number" min="1" value={months} onChange={e=>setMonths(e.target.value)} placeholder="# meses" style={{...inp,textAlign:"right"}}/></div>
      </div>
    </div>
    {goals.length===0&&<div style={{padding:"10px 16px",color:C.lo,fontStyle:"italic",fontSize:12}}>Sin objetivos de ahorro</div>}
    {goals.map(g=>{
      const catAmt=g.target&&g.months?g.target/(g.months*2):0;
      const catN=g.months?g.months*2:0;
      const pct2=g.target>0?Math.min(100,((g.saved||0)/g.target)*100):0;
      const [dep,setDep]=useState("");
      const [customN,setCustomN]=useState("");
      const cN=parseInt(customN)||0;
      const customAmt=cN>0&&g.target>0?Math.max(0,g.target-(g.saved||0))/cN:0;
      return<div key={g.id} style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{color:C.hi,fontWeight:600}}>{g.name}</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>{catAmt>0&&<Badge label={`${fmt(catAmt)}/cat`} color={C.teal}/>}<XBtn onClick={()=>del(g.id)} title="Eliminar objetivo"/></div>
        </div>
        {g.target>0&&<>
          <div style={{height:4,background:C.border,borderRadius:99,marginBottom:5}}><div style={{height:"100%",width:`${pct2}%`,borderRadius:99,background:C.teal,transition:"width .4s"}}/></div>
          <div style={{fontSize:11,color:C.mid,marginBottom:8}}>{fmt(g.saved||0)} / {fmt(g.target)} · {pct2.toFixed(0)}%</div>
          <div style={{background:C.s2,borderRadius:8,padding:"8px 12px",marginBottom:8}}>
            <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Plan catorcenal</div>
            {catN>0&&<div style={{fontSize:11,color:C.teal,marginBottom:4}}>Auto: {fmt(catAmt)}/cat × {catN} catorcenas (~{(catN/2).toFixed(1)} meses)</div>}
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:C.mid,flexShrink:0}}>Lograrlo en</span>
              <NI value={customN} onChange={v=>setCustomN(v)} width={60}/>
              <span style={{fontSize:11,color:C.mid,flexShrink:0}}>catorcenas →</span>
              {customAmt>0&&<Badge label={`${fmt(customAmt)}/cat`} color={C.accent}/>}
            </div>
          </div>
        </>}
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={dep} onChange={e=>setDep(e.target.value)} placeholder="Depositar" style={{width:"100%",paddingLeft:18,paddingRight:6,paddingTop:6,paddingBottom:6,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:6,color:C.hi,fontFamily:"monospace",fontSize:12,textAlign:"right",outline:"none"}}/></div>
          <button onClick={()=>{const a=parseFloat(dep);if(a)deposit(g.id,a);setDep("");}} style={{background:C.teal+"22",color:C.teal,border:`1px solid ${C.teal}44`,borderRadius:6,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Depositar</button>
        </div>
      </div>;
    })}
  </Block>;
}

// ── CUENTAS ───────────────────────────────────────────────────────────────────
function CuentasTab({fixed,setFixed,cats,setCats,totalFixed,totalExtra}){
  const [accounts,setAccounts]=useSynced("accounts",DEFAULT_ACCOUNTS);
  const debito=accounts.filter(a=>a.type==="debito");
  const credito=accounts.filter(a=>a.type==="credito");
  const totalDebito=debito.reduce((s,a)=>s+a.balance,0);
  const totalCredito=credito.reduce((s,a)=>s+a.balance,0);
  const totalLimit=credito.reduce((s,a)=>s+(a.limit||0),0);
  const dispCredito=totalLimit-totalCredito;
  function upd(id,f,v){setAccounts(p=>p.map(a=>a.id===id?{...a,[f]:v}:a));}
  function add(type){setAccounts(p=>[...p,{id:uid(),name:"Nueva cuenta",type,balance:0,limit:0}]);}
  function del(id){setAccounts(p=>p.filter(a=>a.id!==id));}
  const updF=(id,f,v)=>setFixed(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  // Neto real: dinero disponible menos lo que se debe en crédito menos gastos pendientes
  const netoReal=totalDebito-totalCredito;
  const disponibleTras=netoReal-totalFixed-totalExtra;
  return<div>
    {/* GASTOS FIJOS */}
    <Block label="Gastos fijos mensuales" total={totalFixed} collapsible
      footer={<AddBtn label="Agregar gasto fijo" onClick={()=>setFixed(p=>[...p,{id:uid(),name:"Nuevo gasto",cat:cats[0],amount:0,active:true}])}/>}>
      {fixed.map(r=><TR key={r.id} dimmed={!r.active}>
        <Toggle on={r.active} onChange={()=>setFixed(p=>p.map(x=>x.id===r.id?{...x,active:!x.active}:x))}/>
        <TI value={r.name} onChange={v=>updF(r.id,"name",v)} dimmed={!r.active}/>
        <CatSel value={r.cat} onChange={v=>updF(r.id,"cat",v)} cats={cats}/>
        <MI value={r.amount} onChange={v=>updF(r.id,"amount",v)} dimmed={!r.active}/>
        <XBtn onClick={()=>updF(r.id,"amount",0)} title="Borrar monto"/>
      </TR>)}
    </Block>

    <Block label="Débito" total={totalDebito} totalColor={C.green} accent={C.green} footer={<AddBtn label="Agregar débito" onClick={()=>add("debito")} color={C.green}/>}>
      {debito.map(a=><TR key={a.id}><TI value={a.name} onChange={v=>upd(a.id,"name",v)} placeholder="Nombre"/><MI value={a.balance} onChange={v=>upd(a.id,"balance",v)}/><XBtn onClick={()=>upd(a.id,"balance",0)} title="Borrar monto"/></TR>)}
    </Block>

    <Block label="Crédito" totalColor={C.pink} accent={C.pink} footer={<AddBtn label="Agregar crédito" onClick={()=>add("credito")} color={C.pink}/>}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 95px 95px 24px",gap:6,padding:"6px 16px",borderBottom:`1px solid ${C.border}`}}>
        {["Tarjeta","Usado","Límite",""].map(h=><span key={h} style={{fontSize:10,color:C.lo,fontWeight:600,letterSpacing:.8,textTransform:"uppercase"}}>{h}</span>)}
      </div>
      {credito.map(a=>{const disp=(a.limit||0)-a.balance;return<div key={a.id} style={{display:"grid",gridTemplateColumns:"1fr 95px 95px 24px",gap:6,alignItems:"center",padding:"9px 16px",borderBottom:`1px solid ${C.border}`}}>
        <TI value={a.name} onChange={v=>upd(a.id,"name",v)} placeholder="Nombre"/>
        <MI value={a.balance} onChange={v=>upd(a.id,"balance",v)} width={87}/>
        <MI value={a.limit} onChange={v=>upd(a.id,"limit",v)} width={87} ph="Límite"/>
        <XBtn onClick={()=>upd(a.id,"balance",0)} title="Borrar monto usado"/>
        {(a.limit||0)>0&&<div style={{gridColumn:"1/-1",fontSize:11,color:disp>=0?C.green:C.red,paddingTop:2}}>Disponible: {fmt(disp)}</div>}
      </div>;})}
      <div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
        <span style={{fontSize:11,color:C.mid}}>Usado: <b style={{color:C.pink,fontFamily:"monospace"}}>{fmt(totalCredito)}</b></span>
        {totalLimit>0&&<span style={{fontSize:11,color:C.mid}}>Disponible total: <b style={{color:dispCredito>=0?C.green:C.red,fontFamily:"monospace"}}>{fmt(dispCredito)}</b></span>}
      </div>
    </Block>

    {/* Resumen real considerando gastos */}
    <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:C.mid,textTransform:"uppercase"}}>Posición real</span></div>
      {[
        {l:"Total en débito",v:totalDebito,c:C.green},
        {l:"Total en crédito (debes)",v:-totalCredito,c:C.pink},
        {l:"Neto bancario",v:netoReal,c:netoReal>=0?C.green:C.red},
        {l:"Menos gastos fijos del mes",v:-totalFixed,c:C.hi},
        {l:"Menos esporádicos",v:-totalExtra,c:C.amber},
      ].map(({l,v,c})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 16px",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.mid,fontSize:12}}>{l}</span><span style={{fontFamily:"monospace",fontWeight:600,color:c}}>{fmt(v)}</span></div>)}
      <div style={{display:"flex",justifyContent:"space-between",padding:"12px 16px"}}><span style={{fontWeight:700,color:C.hi}}>Disponible tras gastos</span><span style={{fontFamily:"monospace",fontSize:16,fontWeight:700,color:disponibleTras>=0?C.accent:C.red}}>{fmt(disponibleTras)}</span></div>
    </div>
  </div>;
}

// ── DEUDAS ────────────────────────────────────────────────────────────────────
function DeudasTab(){
  const [debts,setDebts]=useSynced("debts",[]);
  const [name,setName]=useState("");const [total,setTotal]=useState("");const [monthly,setMonthly]=useState("");const [note,setNote]=useState("");
  function add(){if(!name.trim()||!total)return;setDebts(p=>[...p,{id:uid(),name:name.trim(),total:parseFloat(total)||0,paid:0,monthly:parseFloat(monthly)||0,note:note.trim(),active:true}]);setName("");setTotal("");setMonthly("");setNote("");}
  function pay(id,amt){setDebts(p=>p.map(d=>d.id===id?{...d,paid:Math.min(d.total,d.paid+amt)}:d));}
  function del(id){setDebts(p=>p.filter(d=>d.id!==id));}
  function tog(id){setDebts(p=>p.map(d=>d.id===id?{...d,active:!d.active}:d));}
  const totalDebt=debts.filter(d=>d.active).reduce((s,d)=>s+(d.total-d.paid),0);
  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"8px 10px",fontFamily:"inherit",outline:"none",width:"100%"};
  return<Block label="Deudas y cargos" total={totalDebt} totalColor={C.pink} accent={C.pink} footer={<AddBtn label="Agregar deuda / cargo" onClick={add} color={C.pink}/>}>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Concepto (ej. Brenda, UVEG, Dentista)" style={inp}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:100,position:"relative"}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={total} onChange={e=>setTotal(e.target.value)} placeholder="Monto total" style={{...inp,paddingLeft:18,textAlign:"right"}}/></div>
        <div style={{flex:1,minWidth:100,position:"relative"}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={monthly} onChange={e=>setMonthly(e.target.value)} placeholder="Abono/mes (opt.)" style={{...inp,paddingLeft:18,textAlign:"right"}}/></div>
      </div>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Nota" style={{...inp,color:C.mid,border:`1px solid ${C.border}`}}/>
    </div>
    {debts.length===0&&<div style={{padding:"12px 16px",color:C.lo,fontStyle:"italic",fontSize:12}}>Sin deudas registradas</div>}
    {debts.map(d=>{
      const remaining=d.total-d.paid;
      const pct=d.total>0?Math.min(100,(d.paid/d.total)*100):0;
      const [payAmt,setPayAmt]=useState("");
      const [catN,setCatN]=useState("");
      const cN=parseInt(catN)||0;
      const abonoSug=cN>0&&remaining>0?remaining/cN:0;
      const catorcenasNec=d.monthly>0&&remaining>0?Math.ceil(remaining/(d.monthly/2)):0;
      return<div key={d.id} style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,opacity:d.active?1:.4}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><Toggle on={d.active} onChange={()=>tog(d.id)}/><span style={{color:C.hi,fontWeight:600,fontSize:13}}>{d.name}</span>{d.note&&<span style={{fontSize:11,color:C.lo}}>{d.note}</span>}</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>{d.monthly>0&&<Badge label={`${fmt(d.monthly)}/mes`} color={C.pink}/>}<XBtn onClick={()=>del(d.id)} title="Eliminar deuda"/></div>
        </div>
        <div style={{height:4,background:C.border,borderRadius:99,marginBottom:5}}><div style={{height:"100%",width:`${pct}%`,borderRadius:99,background:remaining<=0?C.green:C.pink,transition:"width .4s"}}/></div>
        <div style={{fontSize:11,color:C.mid,marginBottom:8}}>{fmt(d.paid)} pagado · {fmt(remaining)} pendiente · {pct.toFixed(0)}%</div>
        {remaining>0&&<div style={{background:C.s2,borderRadius:8,padding:"8px 12px",marginBottom:8}}>
          <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Plan de pago catorcenal</div>
          {d.monthly>0&&<div style={{fontSize:11,color:C.mid,marginBottom:4}}>Con {fmt(d.monthly/2)}/cat actuales → <b style={{color:C.pink}}>{catorcenasNec} catorcenas</b> (~{(catorcenasNec/2).toFixed(1)} meses)</div>}
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:C.mid,flexShrink:0}}>Liquidar en</span>
            <NI value={catN} onChange={v=>setCatN(v)} width={60}/>
            <span style={{fontSize:11,color:C.mid,flexShrink:0}}>catorcenas →</span>
            {abonoSug>0&&<Badge label={`${fmt(abonoSug)}/cat`} color={C.teal}/>}
          </div>
        </div>}
        {remaining>0&&<div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:10,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={payAmt} onChange={e=>setPayAmt(e.target.value)} placeholder="Abonar" style={{width:"100%",paddingLeft:18,paddingRight:6,paddingTop:6,paddingBottom:6,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:6,color:C.hi,fontFamily:"monospace",fontSize:12,textAlign:"right",outline:"none"}}/></div>
          <button onClick={()=>{const a=parseFloat(payAmt);if(a)pay(d.id,a);setPayAmt("");}} style={{background:C.pink+"22",color:C.pink,border:`1px solid ${C.pink}44`,borderRadius:6,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Abonar</button>
        </div>}
        {remaining<=0&&<Badge label="✓ Liquidada" color={C.green}/>}
      </div>;
    })}
  </Block>;
}

// ── TRANSPORTE ────────────────────────────────────────────────────────────────
// Esquema corregido: cada viaje (trayecto) = camión + transbordo = $11 + $5.50 = $16.50
// Al día se hacen 2 viajes (ida y vuelta) → $16.50 × 2 = $33.00/día
function TransporteTab(){
  const [cfg,setCfg]=useSynced("camiones_config4",{costoBase:11,transbordo:5.50,viajesDia:2,extra:0});
  const [fechas,setFechas]=useSynced("camiones_fechas",{inicio:"",fin:""});
  const [periodo,setPeriodo]=useState("catorcena");
  const periodos={semana:7,catorcena:14,quincena:15,mes:30};
  const dias=useMemo(()=>{
    if(fechas.inicio&&fechas.fin){
      const s=new Date(fechas.inicio+"T12:00:00"),e=new Date(fechas.fin+"T12:00:00");
      return Math.max(0,Math.round((e-s)/864e5));
    }
    return periodos[periodo];
  },[fechas,periodo]);

  // Costo por viaje (trayecto): camión + transbordo
  const costoViaje=cfg.costoBase+cfg.transbordo;
  const costoDia=cfg.viajesDia*costoViaje;
  const costoTotal=dias*costoDia+(cfg.extra||0)*costoViaje;
  const viajesTotal=cfg.viajesDia*dias+(cfg.extra||0);

  const inp={background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.hi,padding:"7px 10px",fontFamily:"monospace",outline:"none"};
  return<Block label="Calculadora de transporte" accent={C.blue}>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:10,fontWeight:600}}>Tarifas</div>
      <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
        <span style={{flex:1,fontSize:12,color:C.mid}}>Costo camión</span>
        <div style={{position:"relative",flexShrink:0}}><span style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" step="0.5" value={cfg.costoBase} onChange={e=>setCfg(p=>({...p,costoBase:parseFloat(e.target.value)||0}))} style={{...inp,width:90,paddingLeft:18,textAlign:"right"}}/></div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:4,alignItems:"center"}}>
        <span style={{flex:1,fontSize:12,color:C.mid}}>Costo transbordo</span>
        <div style={{position:"relative",flexShrink:0}}><span style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" step="0.5" value={cfg.transbordo} onChange={e=>setCfg(p=>({...p,transbordo:parseFloat(e.target.value)||0}))} style={{...inp,width:90,paddingLeft:18,textAlign:"right"}}/></div>
      </div>

      <div style={{height:1,background:C.border,margin:"12px 0"}}/>
      <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:10,fontWeight:600}}>Viajes diarios</div>

      <div style={{background:C.s2,borderRadius:10,padding:"12px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div>
            <div style={{fontSize:11,color:C.mid,marginBottom:6}}>Viajes por día (ida + vuelta)</div>
            <NI value={cfg.viajesDia} onChange={v=>setCfg(p=>({...p,viajesDia:v}))} width={55}/>
          </div>
          <div>
            <div style={{fontSize:11,color:C.mid,marginBottom:6}}>Costo por viaje</div>
            <div style={{fontSize:12,color:C.hi,fontFamily:"monospace"}}><b>{fmtD(costoViaje)}</b></div>
            <div style={{fontSize:10,color:C.lo,marginTop:4}}>{fmtD(cfg.costoBase)} camión + {fmtD(cfg.transbordo)} transbordo</div>
          </div>
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:C.mid}}>{cfg.viajesDia} viaje{cfg.viajesDia===1?"":"s"}/día — total</span>
          <span style={{fontFamily:"monospace",fontWeight:700,fontSize:15,color:C.accent}}>{fmtD(costoDia)}/día</span>
        </div>
        <div style={{marginTop:6,fontSize:11,color:C.lo}}>
          {cfg.viajesDia} × {fmtD(costoViaje)} = {fmtD(costoDia)}
        </div>
      </div>

      <div style={{display:"flex",gap:8,alignItems:"center",marginTop:10}}>
        <span style={{flex:1,fontSize:12,color:C.mid}}>Viajes extra ocasionales</span>
        <NI value={cfg.extra} onChange={v=>setCfg(p=>({...p,extra:v}))} width={55}/>
        <span style={{fontSize:11,color:C.lo}}>× {fmtD(costoViaje)}</span>
      </div>
    </div>

    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>Período</div>
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>{Object.keys(periodos).map(p=><button key={p} onClick={()=>{setPeriodo(p);setFechas({inicio:"",fin:""}); }} style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,background:periodo===p&&!fechas.inicio?C.blue+"22":"transparent",color:periodo===p&&!fechas.inicio?C.blue:C.lo,outline:periodo===p&&!fechas.inicio?`1px solid ${C.blue}44`:"none"}}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>)}</div>
      <div style={{fontSize:11,color:C.mid,marginBottom:6}}>O elige fechas:</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[{l:"Inicio",k:"inicio"},{l:"Fin",k:"fin"}].map(({l,k})=><div key={k} style={{flex:1,minWidth:120}}><div style={{fontSize:10,color:C.lo,marginBottom:4}}>{l}</div><input type="date" value={fechas[k]} onChange={e=>setFechas(p=>({...p,[k]:e.target.value}))} style={{...inp,width:"100%"}}/></div>)}</div>
    </div>

    <div style={{padding:"14px 16px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[{l:"Costo/día",v:fmtD(costoDia),c:C.hi},{l:"Días calculados",v:`${dias} días`,c:C.mid},{l:"Total viajes",v:`${viajesTotal} viajes`,c:C.blue},{l:"Costo del período",v:fmtD(costoTotal),c:C.accent}].map(s=><div key={s.l} style={{background:C.s2,borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:10,color:C.lo,marginBottom:4}}>{s.l}</div><div style={{fontFamily:"monospace",fontWeight:700,fontSize:14,color:s.c}}>{s.v}</div></div>)}
      </div>
    </div>
  </Block>;
}

// ── WISHLIST ──────────────────────────────────────────────────────────────────
function WishlistTab(){
  const [items,setItems]=useSynced("wish_items",[]);
  const [name,setName]=useState("");const [price,setPrice]=useState("");const [prio,setPrio]=useState("media");const [url,setUrl]=useState("");const [cat,setCat]=useState("General");
  const wCats=["General","Ropa","Tecnología","Hogar","Salud","Otro"];
  function add(){if(!name.trim())return;setItems(p=>[...p,{id:uid(),name:name.trim(),price:parseFloat(price)||0,prio,url:url.trim(),cat,bought:false,catPlan:0}]);setName("");setPrice("");setUrl("");}
  function tog(id){setItems(p=>p.map(r=>r.id===id?{...r,bought:!r.bought}:r));}
  function del(id){setItems(p=>p.filter(r=>r.id!==id));}
  function updPlan(id,v){setItems(p=>p.map(r=>r.id===id?{...r,catPlan:parseInt(v)||0}:r));}
  const prioColor=id=>PRIO.find(p=>p.id===id)?.color||C.mid;
  const sorted=[...items].sort((a,b)=>(a.bought===b.bought)?({alta:0,media:1,baja:2}[a.prio]-{alta:0,media:1,baja:2}[b.prio]):(a.bought?1:-1));
  const total=items.filter(r=>!r.bought).reduce((s,r)=>s+r.price,0);
  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"8px 10px",fontFamily:"inherit",outline:"none",width:"100%"};
  return<Block label="Wishlist" total={total} totalColor={C.purple} accent={C.purple}>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="¿Qué quieres?" onKeyDown={e=>e.key==="Enter"&&add()} style={inp}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:90}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Precio" onKeyDown={e=>e.key==="Enter"&&add()} style={{...inp,paddingLeft:18,textAlign:"right"}}/></div>
        <select value={prio} onChange={e=>setPrio(e.target.value)} style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.mid,padding:"8px 6px",fontFamily:"inherit",outline:"none",flexShrink:0}}>{PRIO.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select>
        <select value={cat} onChange={e=>setCat(e.target.value)} style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.mid,padding:"8px 6px",fontFamily:"inherit",outline:"none",flexShrink:0}}>{wCats.map(c=><option key={c}>{c}</option>)}</select>
      </div>
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Link (opcional)" style={{...inp,color:C.mid,border:`1px solid ${C.border}`}}/>
      <button onClick={add} style={{background:C.purple,color:C.bg,border:"none",borderRadius:7,padding:"9px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Agregar</button>
    </div>
    {items.length===0&&<div style={{padding:"14px 16px",color:C.lo,fontStyle:"italic"}}>Tu wishlist está vacía</div>}
    <div style={{overflowY:"auto",maxHeight:500}}>
      {sorted.map(r=>{
        const catAmt=r.catPlan>0&&r.price>0?r.price/r.catPlan:0;
        return<div key={r.id} style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,opacity:r.bought?0.4:1,transition:"opacity .2s,background .1s"}} onMouseEnter={e=>e.currentTarget.style.background=C.s2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <button onClick={()=>tog(r.id)} style={{width:18,height:18,borderRadius:4,flexShrink:0,cursor:"pointer",marginTop:2,background:r.bought?C.green:"transparent",border:`1.5px solid ${r.bought?C.green:C.borderHi}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>{r.bought&&<span style={{fontSize:10,color:C.bg,fontWeight:900,lineHeight:1}}>✓</span>}</button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:r.bought?C.lo:C.hi,textDecoration:r.bought?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
              <div style={{fontSize:11,color:C.lo}}>{r.cat}{r.url&&<> · <a href={r.url} target="_blank" rel="noopener noreferrer" style={{color:C.blue,textDecoration:"none"}}>↗</a></>}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
              {r.price>0&&<span style={{fontFamily:"monospace",fontSize:12,color:r.bought?C.lo:C.purple}}>{fmt(r.price)}</span>}
              <Badge label={PRIO.find(p=>p.id===r.prio)?.label} color={prioColor(r.prio)}/>
            </div>
            <XBtn onClick={()=>del(r.id)} title="Eliminar"/>
          </div>
          {/* Plan de ahorro para este item */}
          {!r.bought&&r.price>0&&<div style={{marginTop:8,background:C.s2,borderRadius:8,padding:"8px 12px"}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:C.mid,flexShrink:0}}>Ahorrar en</span>
              <NI value={r.catPlan} onChange={v=>updPlan(r.id,v)} width={55}/>
              <span style={{fontSize:11,color:C.mid,flexShrink:0}}>catorcenas →</span>
              {catAmt>0&&<Badge label={`${fmt(catAmt)}/cat`} color={C.purple}/>}
            </div>
          </div>}
        </div>;
      })}
    </div>
  </Block>;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("main");
  const [fixed,setFixed,fixSynced]=useSynced("fixed",DEFAULT_FIXED);
  const [extras,setExtras,extSynced]=useSynced("extras",[]);
  const [cats,setCats]=useSynced("fixed_cats",DEFAULT_CATS);
  const [extraCats,setExtraCats]=useSynced("extra_cats",EXTRA_CATS_DEFAULT);
  const synced=fixSynced&&extSynced;

  const totalFixed=useMemo(()=>fixed.filter(r=>r.active).reduce((s,r)=>s+r.amount,0),[fixed]);
  const totalExtra=useMemo(()=>extras.reduce((s,r)=>s+r.amount,0),[extras]);

  const [savingGoals]=useSynced("saving_goals",[]);
  const [debts]=useSynced("debts",[]);
  const totalSaving=useMemo(()=>savingGoals.reduce((s,g)=>s+(g.target&&g.months?g.target/g.months:0),0),[savingGoals]);
  const totalDebt=useMemo(()=>debts.filter(d=>d.active).reduce((s,d)=>s+(d.monthly||0),0),[debts]);

  return<div style={{background:C.bg,minHeight:"100vh",padding:"16px 14px",maxWidth:640,margin:"0 auto",fontFamily:"system-ui,sans-serif",color:C.hi}}>
    <style>{`
      *{box-sizing:border-box;margin:0;}
      ::placeholder{color:#383838!important;}
      input:focus,select:focus{border-color:#e8ff47!important;outline:none;}
      input[type=number]::-webkit-inner-spin-button{display:none;}
      select option{background:#181818;}
      ::-webkit-scrollbar{width:3px;background:#111;}
      ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:99px;}
      a:hover{opacity:.75;}
    `}</style>
    <div style={{marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><h1 style={{fontSize:17,fontWeight:700,color:C.hi,letterSpacing:-.3,marginBottom:2}}>Life 2.0</h1></div>
      <div style={{fontSize:10,color:synced?C.green:C.lo}}>{synced?"☁ sync":"○ ..."}</div>
    </div>
    <Hero fixed={totalFixed} extra={totalExtra} saving={totalSaving} debt={totalDebt} synced={synced}/>
    <Tabs active={tab} onChange={setTab}/>
    {tab==="main"&&<MainTab extras={extras} setExtras={setExtras} extraCats={extraCats} setExtraCats={setExtraCats} totalFixed={totalFixed} totalExtra={totalExtra}/>}
    {tab==="cuentas"&&<CuentasTab fixed={fixed} setFixed={setFixed} cats={cats} setCats={setCats} totalFixed={totalFixed} totalExtra={totalExtra}/>}
    {tab==="deudas"&&<DeudasTab/>}
    {tab==="transporte"&&<TransporteTab/>}
    {tab==="wish"&&<WishlistTab/>}
  </div>;
}
