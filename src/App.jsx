import { useState, useMemo, useEffect, useRef } from "react";

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
let _id=500; const uid=()=>++_id;
function fmt(n){return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n||0);}
function fmtD(n){return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);}
function fmtDate(d){return d.toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"});}
function daysUntil(d){const n=new Date();n.setHours(0,0,0,0);const x=new Date(d);x.setHours(0,0,0,0);return Math.round((x-n)/864e5);}

// Anchor: Jun 19 2026 = Friday (confirmed). Every 14 days.
function nextCatorcenas(n=6){
  const anchor=new Date(2026,5,19,12,0,0);
  const today=new Date();today.setHours(12,0,0,0);
  const elapsed=today.getTime()-anchor.getTime();
  const periods=Math.max(0,Math.ceil(elapsed/(14*864e5)));
  return Array.from({length:n},(_,i)=>new Date(anchor.getTime()+(periods+i)*14*864e5));
}

// Business days between two dates EXCLUSIVE of end (working days TO travel)
// Changed to count calendar days for transport (user travels every day)
function calendarDaysBetween(a,b){
  const s=new Date(a);s.setHours(0,0,0,0);
  const e=new Date(b);e.setHours(0,0,0,0);
  return Math.max(0,Math.round((e-s)/864e5));
}
function bizDaysBetween(a,b){
  const s=new Date(a);s.setHours(12,0,0,0);
  const e=new Date(b);e.setHours(12,0,0,0);
  if(e<=s)return 0;
  let n=0,cur=new Date(s);
  while(cur<=e){if(cur.getDay()!==0&&cur.getDay()!==6)n++;cur.setDate(cur.getDate()+1);}
  return n;
}

const DEFAULT_FIXED=[
  {id:1,name:"Renta",cat:"Vivienda",amount:0,active:true},
  {id:2,name:"Food / Despensa",cat:"Alimentación",amount:0,active:true},
  {id:3,name:"Terapia",cat:"Salud",amount:0,active:true},
  {id:4,name:"Quetiapina",cat:"Medicamentos",amount:0,active:true},
  {id:5,name:"Vitaminas",cat:"Medicamentos",amount:0,active:true},
  {id:6,name:"Minoxidil",cat:"Medicamentos",amount:0,active:true},
  {id:7,name:"Laundry",cat:"Hogar",amount:0,active:true},
  {id:8,name:"Haircut",cat:"Personal",amount:0,active:true},
  {id:9,name:"Transport (tarjeta)",cat:"Transporte",amount:0,active:true},
  {id:10,name:"YouTube Premium",cat:"Suscripciones",amount:0,active:true},
  {id:11,name:"Home supplies",cat:"Hogar",amount:0,active:true},
  {id:12,name:"Bait",cat:"Suscripciones",amount:0,active:true},
  {id:13,name:"Weed",cat:"Personal",amount:0,active:true},
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
// Full category list based on user's Excel data
const DEFAULT_CATS=[
  "Vivienda","Alimentación","Salud","Medicamentos","Hogar","Personal",
  "Transporte","Suscripciones","Entretenimiento","Ropa","Educación",
  "Fisioterapia","Restaurantes","Electrónica","Cuidado personal","Otro"
];
const DEFAULT_EXTRA_CATS=[
  "Alimentación","Restaurantes","Ropa","Calzado","Salud",
  "Transporte","Entretenimiento","Hogar","Electrónica","Cuidado personal",
  "Regalos","Educación","Otro"
];
const PRIO=[{id:"alta",label:"Alta",color:C.red},{id:"media",label:"Media",color:C.amber},{id:"baja",label:"Baja",color:C.lo}];

// ── Micro UI ──────────────────────────────────────────────────────────────────
function Toggle({on,onChange}){
  return<button onClick={onChange} style={{width:32,height:18,borderRadius:99,flexShrink:0,background:on?C.accent:C.border,border:"none",cursor:"pointer",position:"relative",transition:"background .15s"}}>
    <span style={{position:"absolute",top:3,left:on?15:3,width:12,height:12,borderRadius:"50%",background:on?C.bg:C.lo,transition:"left .15s",display:"block"}}/>
  </button>;
}
function MI({value,onChange,dimmed,width,ph}){
  return<div style={{position:"relative",display:"flex",alignItems:"center",flexShrink:0}}>
    <span style={{position:"absolute",left:8,fontSize:11,color:dimmed?C.lo:C.mid,pointerEvents:"none"}}>$</span>
    <input type="number" min="0" value={value||""} placeholder={ph||"0"} onChange={e=>onChange(parseFloat(e.target.value)||0)} disabled={dimmed}
      style={{width:width||100,paddingLeft:18,paddingRight:6,paddingTop:7,paddingBottom:7,background:dimmed?"transparent":C.s2,border:`1px solid ${dimmed?C.border:C.borderHi}`,borderRadius:7,color:dimmed?C.lo:C.hi,fontFamily:"monospace",fontWeight:500,textAlign:"right",outline:"none"}}/>
  </div>;
}
function TI({value,onChange,placeholder,dimmed}){
  return<input value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} disabled={dimmed}
    style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${dimmed?"transparent":C.border}`,color:dimmed?C.lo:C.hi,padding:"3px 0",outline:"none",fontFamily:"inherit",minWidth:0}}/>;
}
// Clear-only button — always ← (left arrow), amber on hover, perfectly centred
function ClearBtn({onClear}){
  return<button onClick={onClear} title="Limpiar valor"
    style={{background:"none",border:"none",color:C.lo,cursor:"pointer",padding:0,flexShrink:0,
      display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:4,transition:"color .15s"}}
    onMouseEnter={e=>e.currentTarget.style.color=C.amber}
    onMouseLeave={e=>e.currentTarget.style.color=C.lo}>
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 7H2M7 12l-5-5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>;
}
// Full delete button — two-step confirmation: first click asks, second requires typing "delete"
function XBtn({onClick,label}){
  const [step,setStep]=useState(0); // 0=idle 1=confirm 2=type
  const [typed,setTyped]=useState("");
  const ref=useRef(null);
  useEffect(()=>{
    if(step===0)return;
    function h(e){if(ref.current&&!ref.current.contains(e.target))setStep(0);}
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[step]);
  if(step===0)return(
    <button onClick={e=>{e.stopPropagation();setStep(1);}} title={`Eliminar${label?" "+label:""}`}
      style={{background:"none",border:"none",color:C.lo,cursor:"pointer",lineHeight:1,padding:"4px",flexShrink:0,transition:"color .15s",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",minWidth:28,minHeight:28}}
      onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.lo}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6v5M8.5 6v5M2.5 3.5l.7 8a1 1 0 001 .9h5.6a1 1 0 001-.9l.7-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
  if(step===1)return(
    <div ref={ref} onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:5,background:C.s2,border:`1px solid ${C.red}44`,borderRadius:7,padding:"3px 8px",flexShrink:0}}>
      <span style={{fontSize:10,color:C.mid,whiteSpace:"nowrap"}}>¿Eliminar?</span>
      <button onClick={()=>setStep(2)} style={{background:C.red+"22",border:"none",color:C.red,cursor:"pointer",fontSize:10,fontWeight:700,borderRadius:4,padding:"2px 7px",fontFamily:"inherit"}}>Sí</button>
      <button onClick={()=>setStep(0)} style={{background:"none",border:"none",color:C.lo,cursor:"pointer",fontSize:10,borderRadius:4,padding:"2px 5px",fontFamily:"inherit"}}>No</button>
    </div>
  );
  return(
    <div ref={ref} onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:5,background:C.s2,border:`1px solid ${C.red}55`,borderRadius:7,padding:"3px 8px",flexShrink:0}}>
      <input autoFocus value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Escribe: delete"
        onKeyDown={e=>{if(e.key==="Escape")setStep(0);if(e.key==="Enter"&&typed==="delete"){onClick();setStep(0);}}}
        style={{width:110,background:"transparent",border:"none",color:C.red,fontSize:11,outline:"none",fontFamily:"monospace"}}/>
      <button onClick={()=>{if(typed==="delete"){onClick();setStep(0);}}} disabled={typed!=="delete"}
        style={{background:typed==="delete"?C.red:"transparent",border:"none",color:typed==="delete"?C.bg:C.lo,cursor:typed==="delete"?"pointer":"default",fontSize:10,fontWeight:700,borderRadius:4,padding:"2px 7px",fontFamily:"inherit",transition:"all .15s"}}>✓</button>
      <button onClick={()=>{setStep(0);setTyped("");}} style={{background:"none",border:"none",color:C.lo,cursor:"pointer",fontSize:10,padding:"2px 4px"}}>✕</button>
    </div>
  );
}
// Quick delete — no confirmation (Cargos/TX). Always ← arrow, centred.
function QDelBtn({onClick}){
  return<button onClick={e=>{e.stopPropagation();onClick();}} title="Eliminar"
    style={{background:"none",border:"none",color:C.lo,cursor:"pointer",padding:0,flexShrink:0,
      display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:4,transition:"color .15s"}}
    onMouseEnter={e=>e.currentTarget.style.color=C.red}
    onMouseLeave={e=>e.currentTarget.style.color=C.lo}>
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 7H2M7 12l-5-5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>;
}
function AddBtn({label,onClick,color}){
  return<button onClick={onClick} style={{display:"flex",alignItems:"center",gap:7,width:"100%",background:"none",border:"none",padding:"10px 16px",color:C.lo,cursor:"pointer",fontFamily:"inherit",transition:"color .15s"}}
    onMouseEnter={e=>e.currentTarget.style.color=color||C.accent} onMouseLeave={e=>e.currentTarget.style.color=C.lo}>
    <span style={{fontSize:16}}>+</span>{label}
  </button>;
}
function Block({label,total,totalColor,accent,children,footer,defaultOpen=true}){
  const [open,setOpen]=useState(defaultOpen);
  return<div style={{background:C.s1,border:`1px solid ${accent?accent+"44":C.border}`,borderRadius:14,marginBottom:12,overflow:"hidden"}}>
    <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 16px",borderBottom:open?`1px solid ${C.border}`:"none",cursor:"pointer",userSelect:"none"}}>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:accent||C.mid,textTransform:"uppercase"}}>
        {label} <span style={{color:C.lo,fontWeight:400}}>{open?"▾":"▸"}</span>
      </span>
      {total!==undefined&&<span style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:totalColor||C.hi}}>{fmt(total)}</span>}
    </div>
    {open&&<>{children}{footer&&<div style={{borderTop:`1px solid ${C.border}`}}>{footer}</div>}</>}
  </div>;
}
function TR({children,dimmed}){
  return<div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderBottom:`1px solid ${C.border}`,opacity:dimmed?0.3:1,flexWrap:"wrap"}}>{children}</div>;
}
function Badge({label,color}){
  return<span style={{fontSize:10,fontWeight:700,color,background:color+"18",borderRadius:5,padding:"2px 7px",flexShrink:0,whiteSpace:"nowrap"}}>{label}</span>;
}
function NI({value,onChange,width}){
  return<input type="number" min="0" value={value||""} onChange={e=>onChange(parseFloat(e.target.value)||0)}
    style={{width:width||70,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"6px 8px",fontFamily:"monospace",fontSize:13,textAlign:"right",outline:"none"}}/>;
}
function CatSel({value,onChange,cats}){
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const ref=useRef(null);
  useEffect(()=>{
    if(!open)return;
    function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[open]);
  const allCats=[...cats.filter(c=>c!=="Otro"),"Otra"];
  const filtered=allCats.filter(c=>c.toLowerCase().includes(q.toLowerCase()));
  return<div ref={ref} style={{position:"relative",flexShrink:0}}>
    <div onClick={()=>{setOpen(o=>!o);setQ("");}} style={{display:"flex",alignItems:"center",gap:4,background:C.s2,border:`1px solid ${open?C.accent:C.border}`,borderRadius:7,padding:"5px 8px",cursor:"pointer",minWidth:90,maxWidth:130}}>
      <span style={{flex:1,fontSize:12,color:C.mid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value||allCats[0]}</span>
      <span style={{fontSize:9,color:C.lo}}>{open?"▴":"▾"}</span>
    </div>
    {open&&<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:99,background:C.s1,border:`1px solid ${C.borderHi}`,borderRadius:9,minWidth:150,maxWidth:200,boxShadow:"0 8px 24px #0008",overflow:"hidden"}}>
      <input autoFocus value={q} onChange={e=>{setQ(e.target.value);}}
        onKeyDown={e=>{if(e.key==="Escape")setOpen(false);}}
        placeholder="Buscar o escribir..."
        style={{width:"100%",background:C.s2,border:"none",borderBottom:`1px solid ${C.border}`,color:C.hi,padding:"8px 10px",fontSize:12,fontFamily:"inherit",outline:"none"}}/>
      <div style={{maxHeight:160,overflowY:"auto"}}>
        {q.trim()&&!allCats.find(c=>c.toLowerCase()===q.trim().toLowerCase())&&
          <div onClick={()=>{onChange(q.trim());setOpen(false);setQ("");}} style={{padding:"8px 12px",fontSize:12,color:C.accent,cursor:"pointer",borderBottom:`1px solid ${C.border}`}}>
            + Agregar "{q.trim()}"
          </div>}
        {filtered.map(c=><div key={c} onClick={()=>{onChange(c==="Otra"?"Otro":c);setOpen(false);setQ("");}}
          style={{padding:"8px 12px",fontSize:12,color:c===value?C.accent:c==="Otra"?C.lo:C.hi,background:c===value?C.accent+"11":"transparent",cursor:"pointer",transition:"background .1s"}}
          onMouseEnter={e=>e.currentTarget.style.background=C.s2} onMouseLeave={e=>e.currentTarget.style.background=c===value?C.accent+"11":"transparent"}>
          {c}
        </div>)}
      </div>
    </div>}
  </div>;
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS=[{id:"main",label:"💰 Principal"},{id:"cuentas",label:"🏦 Cuentas"},{id:"deudas",label:"📋 Deudas"},{id:"transporte",label:"🚌 Bus"},{id:"wish",label:"⭐ Wishlist"}];
function Tabs({active,onChange}){
  return<div style={{display:"flex",gap:3,marginBottom:14,background:C.s1,border:`1px solid ${C.border}`,borderRadius:10,padding:3,overflowX:"auto"}}>
    {TABS.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{flex:"0 0 auto",padding:"8px 12px",border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:12,background:active===t.id?C.s2:"transparent",color:active===t.id?C.hi:C.lo,whiteSpace:"nowrap",boxShadow:active===t.id?`0 0 0 1px ${C.border}`:"none"}}>{t.label}</button>)}
  </div>;
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero({income,fixed,extra,saving,debt,synced}){
  const out=fixed+extra+saving+debt, bal=income-out;
  const pct=income>0?Math.min(100,(out/income)*100):0;
  const bar=pct>90?C.red:pct>70?C.amber:C.accent;
  return<div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 16px",marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
      <div style={{fontSize:10,letterSpacing:1.5,color:C.mid,textTransform:"uppercase",fontWeight:600}}>Balance mensual</div>
      <div style={{fontSize:10,color:synced?C.green:C.lo}}>{synced?"● sync":"○ ..."}</div>
    </div>
    <div style={{fontFamily:"monospace",fontWeight:700,fontSize:32,letterSpacing:-1,marginBottom:14,color:bal>=0?C.accent:C.red,lineHeight:1}}>{fmt(bal)}</div>
    <div style={{height:2,background:C.border,borderRadius:99,marginBottom:14}}><div style={{height:"100%",width:`${pct}%`,borderRadius:99,background:bar,transition:"width .4s"}}/></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(70px,1fr))",gap:5}}>
      {[{l:"Ingresos",v:income,c:C.green},{l:"Fijos",v:fixed,c:C.hi},{l:"Extra",v:extra,c:C.amber},{l:"Ahorro",v:saving,c:C.teal},{l:"Deudas",v:debt,c:C.pink}].map(s=><div key={s.l} style={{borderLeft:`2px solid ${C.border}`,paddingLeft:7,minWidth:0}}>
        <div style={{fontSize:9,color:C.mid,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.l}</div>
        <div style={{fontFamily:"monospace",fontWeight:700,fontSize:10,color:s.c,overflow:"hidden",textOverflow:"ellipsis"}}>{fmt(s.v)}</div>
      </div>)}
    </div>
  </div>;
}

// ── CATORCENA STRIP ───────────────────────────────────────────────────────────
function CatorcenaStrip({totalIncome,totalFixed,totalExtra,savingGoals,debts}){
  const dates=useMemo(()=>nextCatorcenas(5),[]);
  const [sel,setSel]=useState(0);
  const pay=dates[sel];
  const dias=daysUntil(pay);
  const incomeCat=totalIncome/2;
  const fixedCat=totalFixed/2;
  const savingCat=savingGoals.reduce((s,g)=>s+Math.max(incomeCat*(g.pct/100),(g.target&&g.months?g.target/(g.months*2):0)),0);
  const debtCat=debts.filter(d=>d.active).reduce((s,d)=>s+(d.monthly||0)/2,0);
  const balCat=incomeCat-fixedCat-savingCat-debtCat-totalExtra;
  return<div style={{marginBottom:12}}>
    <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>
      Catorcena — viernes cada 14 días (base 19 jun 2026)
    </div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
      {dates.map((d,i)=>{
        const dU=daysUntil(d);
        return<button key={i} onClick={()=>setSel(i)} style={{padding:"6px 11px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,background:sel===i?C.accent:C.s2,color:sel===i?C.bg:C.mid,outline:sel===i?"none":`1px solid ${C.border}`}}>
          {fmtDate(d)}<br/><span style={{fontSize:10,fontWeight:400,color:sel===i?C.bg+"99":C.lo}}>{dU===0?"hoy":dU>0?`en ${dU}d`:`hace ${-dU}d`}</span>
        </button>;
      })}
    </div>
    <div style={{background:C.s1,border:`2px solid ${C.accent}33`,borderRadius:14,padding:"14px 16px"}}>
      <div style={{fontSize:10,color:C.accent,letterSpacing:1,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>
        {fmtDate(pay)} — {dias>0?`en ${dias} días`:dias===0?"hoy":"pasada"}
      </div>
      <div style={{fontFamily:"monospace",fontWeight:700,fontSize:26,color:balCat>=0?C.accent:C.red,marginBottom:10}}>{fmt(balCat)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {[{l:"Ingreso catorcena",v:incomeCat,c:C.green,s:"+"},{l:"Gastos fijos (½)",v:fixedCat,c:C.hi,s:"−"},{l:"Ahorro (½)",v:savingCat,c:C.teal,s:"−"},{l:"Deudas (½)",v:debtCat,c:C.pink,s:"−"}].map(r=><div key={r.l} style={{background:C.s2,borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontSize:10,color:C.lo,marginBottom:3}}>{r.l}</div>
          <div style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:r.c}}>{r.s} {fmt(r.v)}</div>
        </div>)}
      </div>
      {totalExtra>0&&<div style={{marginTop:8,fontSize:11,color:C.amber}}>Esporádicos del mes: − {fmt(totalExtra)}</div>}
    </div>
  </div>;
}

// ── AHORRO ROW (extracted to avoid useState-in-map) ───────────────────────────
function AhorroRow({g,incomeCat,onDeposit,onDel}){
  const catAmt=Math.max(incomeCat*(g.pct/100),(g.target&&g.months?g.target/(g.months*2):0));
  const catN=g.target&&catAmt>0?Math.ceil(g.target/catAmt):0;
  const pct2=g.target>0?Math.min(100,((g.saved||0)/g.target)*100):0;
  const [dep,setDep]=useState("");
  const [customN,setCustomN]=useState("");
  const cN=parseInt(customN)||0;
  const customAmt=cN>0&&g.target>0?Math.max(0,g.target-(g.saved||0))/cN:0;
  return<div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
      <span style={{color:C.hi,fontWeight:600}}>{g.name}</span>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{catAmt>0&&<Badge label={`${fmt(catAmt)}/cat`} color={C.teal}/>}<XBtn onClick={()=>onDel(g.id)}/></div>
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
          {customAmt>0&&<><Badge label={`${fmt(customAmt)}/cat`} color={C.accent}/>{incomeCat>0&&<Badge label={`${((customAmt/incomeCat)*100).toFixed(1)}% ingreso`} color={C.mid}/>}</>}
        </div>
      </div>
    </>}
    {g.pct>0&&<div style={{fontSize:11,color:C.mid,marginBottom:6}}>{g.pct}% = {fmt(incomeCat*(g.pct/100))}/cat</div>}
    <div style={{display:"flex",gap:6,alignItems:"center"}}>
      <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
        <input type="number" min="0" value={dep} onChange={e=>setDep(e.target.value)} placeholder="Depositar" style={{width:"100%",paddingLeft:18,paddingRight:6,paddingTop:6,paddingBottom:6,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:6,color:C.hi,fontFamily:"monospace",fontSize:12,textAlign:"right",outline:"none"}}/></div>
      <button onClick={()=>{const a=parseFloat(dep);if(a)onDeposit(g.id,a);setDep("");}} style={{background:C.teal+"22",color:C.teal,border:`1px solid ${C.teal}44`,borderRadius:6,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Depositar</button>
    </div>
  </div>;
}

// ── AHORRO BLOCK ──────────────────────────────────────────────────────────────
function AhorroBlock({totalIncome}){
  const [goals,setGoals]=useSynced("saving_goals",[]);
  const [name,setName]=useState(""); const [target,setTarget]=useState(""); const [pct,setPct]=useState(""); const [months,setMonths]=useState("");
  function add(){if(!name.trim())return;setGoals(p=>[...p,{id:uid(),name:name.trim(),target:parseFloat(target)||0,pct:parseFloat(pct)||0,months:parseInt(months)||0,saved:0}]);setName("");setTarget("");setPct("");setMonths("");}
  function deposit(id,amt){setGoals(p=>p.map(g=>g.id===id?{...g,saved:(g.saved||0)+amt}:g));}
  function del(id){setGoals(p=>p.filter(g=>g.id!==id));}
  const incomeCat=totalIncome/2;
  const total=goals.reduce((s,g)=>s+Math.max(incomeCat*(g.pct/100),(g.target&&g.months?g.target/g.months:0)),0);
  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"7px 10px",fontFamily:"inherit",outline:"none",width:"100%"};
  return<Block label="Ahorro" total={total} totalColor={C.teal} accent={C.teal} footer={<AddBtn label="Nuevo objetivo" onClick={add} color={C.teal}/>}>
    <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre (ej. Vacaciones, Emergencia)" style={inp}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:80,position:"relative"}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={target} onChange={e=>setTarget(e.target.value)} placeholder="Meta $" style={{...inp,paddingLeft:18,textAlign:"right"}}/></div>
        <div style={{flex:1,minWidth:70,position:"relative"}}><span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>%</span><input type="number" min="0" max="100" value={pct} onChange={e=>setPct(e.target.value)} placeholder="% ingreso" style={{...inp,paddingRight:24,textAlign:"right"}}/></div>
        <div style={{flex:1,minWidth:70}}><input type="number" min="1" value={months} onChange={e=>setMonths(e.target.value)} placeholder="# meses" style={{...inp,textAlign:"right"}}/></div>
      </div>
    </div>
    {goals.length===0&&<div style={{padding:"10px 16px",color:C.lo,fontStyle:"italic",fontSize:12}}>Sin objetivos de ahorro</div>}
    {goals.map(g=><AhorroRow key={g.id} g={g} incomeCat={incomeCat} onDeposit={deposit} onDel={del}/>)}
  </Block>;
}

// ── MAIN TAB ──────────────────────────────────────────────────────────────────
function MainTab({fixed,setFixed,extras,setExtras,cats,setCats,extraCats,setExtraCats,savingGoals,debts,totalIncome,totalFixed,totalExtra}){
  const [eName,setEName]=useState(""); const [eWhere,setEWhere]=useState(""); const [eCat,setECat]=useState(extraCats[0]||"Otro"); const [eAmt,setEAmt]=useState("");
  const [savingGoalsData]=useSynced("saving_goals",[]);
  const [debtsData]=useSynced("debts",[]);
  const [txs,setTxs]=useSynced("txs",[]);
  const [showTxForm,setShowTxForm]=useState(false);
  const [txDesc,setTxDesc]=useState(""); const [txAmt,setTxAmt]=useState(""); const [txType,setTxType]=useState("gasto"); const [txAcc,setTxAcc]=useState("");
  const [accounts]=useSynced("accounts",DEFAULT_ACCOUNTS);
  const incomeCat=totalIncome/2;
  const totalSaving=useMemo(()=>savingGoalsData.reduce((s,g)=>s+Math.max(incomeCat*(g.pct/100),(g.target&&g.months?g.target/g.months:0)),0),[savingGoalsData,incomeCat]);
  const totalDebt=useMemo(()=>debtsData.filter(d=>d.active).reduce((s,d)=>s+(d.monthly||0),0),[debtsData]);
  const updF=(id,f,v)=>setFixed(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  function addExtra(){const a=parseFloat(eAmt);if(!eName.trim()||!a)return;if(!extraCats.includes(eCat))setExtraCats(p=>[...p,eCat]);setExtras(p=>[...p,{id:uid(),name:eName.trim(),where:eWhere.trim(),cat:eCat,amount:a,date:new Date().toISOString().slice(0,10)}]);setEName("");setEWhere("");setEAmt("");}
  function addTx(){
    const a=parseFloat(txAmt); if(!txDesc.trim()||!a||!txAcc)return;
    const acc=accounts.find(x=>x.id===parseInt(txAcc));
    const newBal=txType==="gasto"?(acc?.balance||0)+a:(acc?.balance||0)-a;
    // No need to update accounts from MainTab — just log the TX
    setTxs(p=>[{id:uid(),desc:txDesc.trim(),amt:a,type:txType,accId:parseInt(txAcc),accName:acc?.name||"",accType:acc?.type||"debito",date:new Date().toLocaleDateString("es-MX"),ts:Date.now()},...p]);
    setTxDesc("");setTxAmt("");
  }
  const typeColors={gasto:C.red,abono:C.green,cargo:C.amber};
  const typeLabels={gasto:"Gasto",abono:"Abono",cargo:"Cargo"};
  const debito=accounts.filter(a=>a.type==="debito");
  const credito=accounts.filter(a=>a.type==="credito");
  const bal=totalIncome-totalFixed-totalExtra-totalSaving-totalDebt;

  return<div>
    <CatorcenaStrip totalIncome={totalIncome} totalFixed={totalFixed} totalExtra={totalExtra} savingGoals={savingGoalsData} debts={debtsData}/>

    {/* GASTOS FIJOS */}
    <Block label="Gastos fijos mensuales" total={totalFixed}
      footer={<AddBtn label="Agregar gasto fijo" onClick={()=>setFixed(p=>[...p,{id:uid(),name:"",cat:cats[0],amount:0,active:true}])}/>}>
      {fixed.map(r=><TR key={r.id} dimmed={!r.active}>
        <Toggle on={r.active} onChange={()=>setFixed(p=>p.map(x=>x.id===r.id?{...x,active:!x.active}:x))}/>
        <TI value={r.name} onChange={v=>updF(r.id,"name",v)} placeholder="Nombre" dimmed={!r.active}/>
        <CatSel value={r.cat} onChange={v=>updF(r.id,"cat",v)} cats={cats}/>
        <MI value={r.amount} onChange={v=>updF(r.id,"amount",v)} dimmed={!r.active}/>
        <ClearBtn onClear={()=>updF(r.id,"amount",0)}/>
        <XBtn onClick={()=>setFixed(p=>p.filter(x=>x.id!==r.id))}/>
      </TR>)}
    </Block>

    {/* GASTOS ESPORÁDICOS + TX */}
    <Block label="Gastos esporádicos / TX" total={totalExtra} totalColor={C.amber} accent={C.amber}>
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",gap:8}}>
          <input value={eName} onChange={e=>setEName(e.target.value)} placeholder="¿Qué?" style={{flex:2,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"7px 10px",fontFamily:"inherit",outline:"none"}}/>
          <input value={eWhere} onChange={e=>setEWhere(e.target.value)} placeholder="¿Dónde?" style={{flex:1,background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.hi,padding:"7px 10px",fontFamily:"inherit",outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <CatSel value={eCat} onChange={setECat} cats={extraCats}/>
          <div style={{position:"relative",flexShrink:0}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
            <input type="number" min="0" value={eAmt} placeholder="0" onChange={e=>setEAmt(e.target.value)} style={{width:100,paddingLeft:18,paddingRight:6,paddingTop:7,paddingBottom:7,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,fontFamily:"monospace",textAlign:"right",outline:"none"}}/></div>
          <button onClick={addExtra} style={{background:C.amber,color:C.bg,border:"none",borderRadius:7,padding:"7px 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>+</button>
        </div>
      </div>
      {/* TX toggle sub-section */}
      <div style={{padding:"8px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
        <Toggle on={showTxForm} onChange={()=>setShowTxForm(s=>!s)}/>
        <span style={{fontSize:11,color:C.lo}}>Registrar TX en cuenta</span>
      </div>
      {showTxForm&&<div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,background:C.s2,display:"flex",flexDirection:"column",gap:8}}>
        <input value={txDesc} onChange={e=>setTxDesc(e.target.value)} placeholder="Descripción TX" style={{background:C.bg,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"7px 10px",fontFamily:"inherit",outline:"none",fontSize:12}}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative",flex:1,minWidth:80}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
            <input type="number" min="0" value={txAmt} onChange={e=>setTxAmt(e.target.value)} style={{width:"100%",paddingLeft:18,paddingRight:6,paddingTop:6,paddingBottom:6,background:C.bg,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,fontFamily:"monospace",textAlign:"right",outline:"none",fontSize:12}}/></div>
          <div style={{display:"flex",gap:3,background:C.border,borderRadius:7,padding:2,flexShrink:0}}>
            {["gasto","abono","cargo"].map(t=><button key={t} onClick={()=>setTxType(t)} style={{padding:"4px 9px",borderRadius:5,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,background:txType===t?typeColors[t]:"transparent",color:txType===t?C.bg:C.lo,transition:"all .15s"}}>{typeLabels[t]}</button>)}
          </div>
          <select value={txAcc} onChange={e=>setTxAcc(e.target.value)} style={{background:C.bg,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.mid,padding:"7px 8px",fontFamily:"inherit",outline:"none",flexShrink:0}}>
            <option value="">Cuenta...</option>
            <optgroup label="Débito">{debito.map(a=><option key={a.id} value={a.id}>{a.name||"Sin nombre"}</option>)}</optgroup>
            <optgroup label="Crédito">{credito.map(a=><option key={a.id} value={a.id}>{a.name||"Sin nombre"}</option>)}</optgroup>
          </select>
          <button onClick={addTx} style={{background:C.blue,color:C.bg,border:"none",borderRadius:7,padding:"7px 14px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>+</button>
        </div>
      </div>}
      {extras.length===0&&<div style={{padding:"10px 16px",color:C.lo,fontStyle:"italic",fontSize:12}}>Sin gastos este mes</div>}
      {extras.length>0&&<div style={{overflowY:"auto",maxHeight:200}}>
        {extras.map(r=><div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr 70px 75px 24px",gap:6,alignItems:"center",padding:"7px 16px",borderBottom:`1px solid ${C.border}`,transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background=C.s2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div><div style={{color:C.hi,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}}>{r.name}</div>{r.where&&<div style={{color:C.lo,fontSize:10}}>{r.where}</div>}</div>
          <span style={{fontSize:11,color:C.mid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.cat}</span>
          <span style={{fontFamily:"monospace",color:C.amber,textAlign:"right",fontSize:13}}>{fmt(r.amount)}</span>
          <QDelBtn onClick={()=>setExtras(p=>p.filter(x=>x.id!==r.id))}/>
        </div>)}
      </div>}
    </Block>

    {/* AHORRO */}
    <AhorroBlock totalIncome={totalIncome}/>

    {/* RESUMEN */}
    <div style={{background:C.s1,border:`1px solid ${C.accent}33`,borderRadius:14,overflow:"hidden",marginBottom:12}}>
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:C.accent,textTransform:"uppercase"}}>Resumen mensual</span></div>
      {[{l:"Ingresos",v:totalIncome,s:"+",c:C.green},{l:"Gastos fijos",v:totalFixed,s:"−",c:C.hi},{l:"Esporádicos",v:totalExtra,s:"−",c:C.amber},{l:"Ahorro",v:totalSaving,s:"−",c:C.teal},{l:"Deudas",v:totalDebt,s:"−",c:C.pink}].map(({l,v,s,c})=><div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 16px",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.mid,fontSize:13}}>{l}</span><span style={{fontFamily:"monospace",fontWeight:600,color:c}}>{s} {fmt(v)}</span></div>)}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px"}}><span style={{fontSize:14,fontWeight:700,color:C.hi}}>Balance</span><span style={{fontFamily:"monospace",fontSize:20,fontWeight:700,color:bal>=0?C.accent:C.red}}>{fmt(bal)}</span></div>
    </div>
  </div>;
}

// ── CREDIT CARD ROW (extracted component with payment/expense section) ────────
function CreditCardRow({a,disp,cardTxs,typeColors,typeLabels,onUpd,onDel,onAddCardTx}){
  const [showForm,setShowForm]=useState(false);
  const [desc,setDesc]=useState(""); const [amt,setAmt]=useState(""); const [type,setType]=useState("gasto");
  function submit(){const v=parseFloat(amt);if(!desc.trim()||!v)return;onAddCardTx(desc.trim(),v,type);setDesc("");setAmt("");}
  return<div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 90px 90px 24px 24px",gap:6,alignItems:"center",padding:"9px 16px",borderBottom:`1px solid ${C.border}`}}>
      <TI value={a.name} onChange={v=>onUpd(a.id,"name",v)} placeholder="Nombre"/>
      <MI value={a.balance} onChange={v=>onUpd(a.id,"balance",v)} width={82}/>
      <MI value={a.limit} onChange={v=>onUpd(a.id,"limit",v)} width={82} ph="Límite"/>
      <ClearBtn onClear={()=>onUpd(a.id,"balance",0)}/>
      <XBtn onClick={()=>onDel(a.id)} label={a.name}/>
    </div>
    {(a.limit||0)>0&&<div style={{padding:"3px 16px 5px",fontSize:11,color:disp>=0?C.green:C.red,borderBottom:`1px solid ${C.border}`}}>Disponible: {fmt(disp)}</div>}
    {/* Toggle abonos/gastos */}
    <div style={{padding:"6px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
      <Toggle on={showForm} onChange={()=>setShowForm(s=>!s)}/>
      <span style={{fontSize:11,color:C.lo}}>Registrar pago / gasto</span>
    </div>
    {showForm&&<div style={{padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:C.s2,display:"flex",flexDirection:"column",gap:6}}>
      <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descripción" style={{background:C.bg,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"6px 10px",fontFamily:"inherit",outline:"none",fontSize:12}}/>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:80}}><span style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
          <input type="number" min="0" value={amt} onChange={e=>setAmt(e.target.value)} style={{width:"100%",paddingLeft:18,paddingRight:6,paddingTop:6,paddingBottom:6,background:C.bg,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,fontFamily:"monospace",textAlign:"right",outline:"none",fontSize:12}}/></div>
        <div style={{display:"flex",gap:3,background:C.border,borderRadius:7,padding:2,flexShrink:0}}>
          {["gasto","abono"].map(t=><button key={t} onClick={()=>setType(t)} style={{padding:"4px 10px",borderRadius:5,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,background:type===t?(t==="abono"?C.green:C.pink):"transparent",color:type===t?C.bg:C.lo,transition:"all .15s"}}>{t==="gasto"?"Cargo":"Abono"}</button>)}
        </div>
        <button onClick={submit} style={{background:C.pink,color:C.bg,border:"none",borderRadius:7,padding:"6px 14px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:12,flexShrink:0}}>+</button>
      </div>
    </div>}
    {/* Mini historial */}
    {cardTxs.length>0&&<div style={{padding:"6px 16px 8px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:4,fontWeight:600}}>Últimos movimientos</div>
      {cardTxs.map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}>
        <span style={{color:C.mid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{t.desc}</span>
        <span style={{fontFamily:"monospace",color:typeColors[t.type]||C.mid,marginLeft:8,flexShrink:0}}>{t.type==="abono"?"-":""}{fmt(t.amt)}</span>
      </div>)}
    </div>}
  </div>;
}

// ── TX ROW — inline-editable description ─────────────────────────────────────
function TxRow({t,typeColors,typeLabels,onDel,onRename}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(t.desc);
  function commit(){const v=val.trim();if(v&&v!==t.desc)onRename(t.id,v);setEditing(false);}
  return<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,transition:"background .1s"}}
    onMouseEnter={e=>e.currentTarget.style.background=C.s2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
    <div style={{flex:1,minWidth:0}}>
      {editing
        ?<input autoFocus value={val} onChange={e=>setVal(e.target.value)}
            onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setVal(t.desc);setEditing(false);}}}
            style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${C.accent}`,color:C.accent,fontSize:13,outline:"none",fontFamily:"inherit",fontWeight:600,padding:"0 1px"}}/>
        :<div onClick={()=>{setVal(t.desc);setEditing(true);}} title="Clic para editar"
            style={{color:C.hi,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"text",
              borderBottom:`1px dashed ${C.border}`,paddingBottom:1,transition:"border-color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.lo}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            {t.desc}
          </div>}
      <div style={{fontSize:10,color:C.lo,marginTop:2}}>{t.accName} · {t.date}</div>
    </div>
    <Badge label={typeLabels[t.type]} color={typeColors[t.type]}/>
    <span style={{fontFamily:"monospace",fontSize:13,color:typeColors[t.type],flexShrink:0}}>{t.type==="abono"?"-":""}{fmt(t.amt)}</span>
    <QDelBtn onClick={()=>onDel(t.id)}/>
  </div>;
}

// ── CUENTAS TAB (includes ingresos) ───────────────────────────────────────────
function CuentasTab({totalFixed,totalExtra,incomes,setIncomes}){
  const [accounts,setAccounts]=useSynced("accounts",DEFAULT_ACCOUNTS);
  const [txs,setTxs]=useSynced("txs",[]);
  const [txFilter,setTxFilter]=useState("todas");
  const debito=accounts.filter(a=>a.type==="debito");
  const credito=accounts.filter(a=>a.type==="credito");
  const totalDebito=debito.reduce((s,a)=>s+a.balance,0);
  const totalCredito=credito.reduce((s,a)=>s+a.balance,0);
  const totalLimit=credito.reduce((s,a)=>s+(a.limit||0),0);
  const totalIncome=incomes.reduce((s,r)=>s+r.amount,0);
  function upd(id,f,v){setAccounts(p=>p.map(a=>a.id===id?{...a,[f]:v}:a));}
  function add(type){setAccounts(p=>[...p,{id:uid(),name:"",type,balance:0,limit:0}]);}
  function delAcc(id){setAccounts(p=>p.filter(a=>a.id!==id));}
  function renameTx(id,desc){setTxs(p=>p.map(t=>t.id===id?{...t,desc}:t));}
  const updI=(id,f,v)=>setIncomes(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const netoReal=totalDebito-totalCredito;
  const disponibleTras=netoReal-totalFixed-totalExtra;
  const filteredTxs=txFilter==="todas"?txs:txFilter==="credito"?txs.filter(t=>t.accType==="credito"):txs.filter(t=>t.accType==="debito");
  const typeColors={gasto:C.red,abono:C.green,cargo:C.amber};
  const typeLabels={gasto:"Gasto",abono:"Abono",cargo:"Cargo"};

  return<div>
    {/* INGRESOS */}
    <Block label="Ingresos" total={totalIncome} totalColor={C.green} footer={<AddBtn label="Agregar fuente" onClick={()=>setIncomes(p=>[...p,{id:uid(),name:"",amount:0}])}/>}>
      {incomes.map(r=><TR key={r.id}>
        <TI value={r.name} onChange={v=>updI(r.id,"name",v)} placeholder="Fuente de ingreso"/>
        <MI value={r.amount} onChange={v=>updI(r.id,"amount",v)}/>
        <ClearBtn onClear={()=>updI(r.id,"amount",0)}/>
        <XBtn onClick={()=>setIncomes(p=>p.filter(x=>x.id!==r.id))} label="ingreso"/>
      </TR>)}
    </Block>

    {/* DÉBITO */}
    <Block label="Débito" total={totalDebito} totalColor={C.green} accent={C.green} footer={<AddBtn label="Agregar débito" onClick={()=>add("debito")} color={C.green}/>}>
      {debito.map(a=><TR key={a.id}>
        <TI value={a.name} onChange={v=>upd(a.id,"name",v)} placeholder="Nombre"/>
        <MI value={a.balance} onChange={v=>upd(a.id,"balance",v)}/>
        <ClearBtn onClear={()=>upd(a.id,"balance",0)}/>
        <XBtn onClick={()=>delAcc(a.id)} label={a.name}/>
      </TR>)}
    </Block>

    {/* CRÉDITO */}
    <Block label="Crédito" totalColor={C.pink} accent={C.pink} footer={<AddBtn label="Agregar tarjeta crédito" onClick={()=>add("credito")} color={C.pink}/>}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 90px 90px 24px 24px",gap:6,padding:"6px 16px",borderBottom:`1px solid ${C.border}`}}>
        {["Tarjeta","Usado","Límite","",""].map((h,i)=><span key={i} style={{fontSize:10,color:C.lo,fontWeight:600,letterSpacing:.8,textTransform:"uppercase"}}>{h}</span>)}
      </div>
      {credito.map(a=>{
        const disp=(a.limit||0)-a.balance;
        const cardTxs=txs.filter(t=>t.accId===a.id).slice(0,5);
        return<CreditCardRow key={a.id} a={a} disp={disp} cardTxs={cardTxs} typeColors={typeColors} typeLabels={typeLabels} onUpd={upd} onDel={delAcc} onAddCardTx={(desc,amt,type)=>{
          const isGasto=type==="gasto"||type==="cargo";
          const newBal=isGasto?(a.balance||0)+amt:(a.balance||0)-Math.min(a.balance||0,amt);
          setAccounts(p=>p.map(x=>x.id===a.id?{...x,balance:Math.max(0,newBal)}:x));
          setTxs(p=>[{id:uid(),desc,amt,type,accId:a.id,accName:a.name||"",accType:"credito",date:new Date().toLocaleDateString("es-MX"),ts:Date.now()},...p]);
        }}/>;
      })}
      <div style={{padding:"10px 16px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
        <span style={{fontSize:11,color:C.mid}}>Usado: <b style={{color:C.pink,fontFamily:"monospace"}}>{fmt(totalCredito)}</b></span>
        {totalLimit>0&&<span style={{fontSize:11,color:C.mid}}>Disponible: <b style={{color:totalLimit-totalCredito>=0?C.green:C.red,fontFamily:"monospace"}}>{fmt(totalLimit-totalCredito)}</b></span>}
      </div>
    </Block>

    {/* TRANSACCIONES — solo visualización */}
    <Block label="Transacciones" accent={C.blue} defaultOpen={false}>
      {/* Filtro */}
      <div style={{display:"flex",gap:4,padding:"8px 16px",borderBottom:`1px solid ${C.border}`}}>
        {["todas","debito","credito"].map(f=><button key={f} onClick={()=>setTxFilter(f)} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,background:txFilter===f?C.blue+"22":"transparent",color:txFilter===f?C.blue:C.lo,outline:txFilter===f?`1px solid ${C.blue}44`:"none"}}>{f==="todas"?"Todas":f==="debito"?"Débito":"Crédito"}</button>)}
      </div>
      {filteredTxs.length===0&&<div style={{padding:"12px 16px",color:C.lo,fontStyle:"italic",fontSize:12}}>Sin transacciones</div>}
      <div style={{maxHeight:300,overflowY:"auto"}}>
        {filteredTxs.map(t=><TxRow key={t.id} t={t} typeColors={typeColors} typeLabels={typeLabels} onDel={id=>setTxs(p=>p.filter(x=>x.id!==id))} onRename={renameTx}/>)
      </div>
    </Block>

    {/* POSICIÓN REAL */}
    <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:C.mid,textTransform:"uppercase"}}>Posición real</span></div>
      {[{l:"Total débito",v:totalDebito,c:C.green},{l:"Total crédito (debes)",v:-totalCredito,c:C.pink},{l:"Neto bancario",v:netoReal,c:netoReal>=0?C.green:C.red},{l:"Menos gastos fijos",v:-totalFixed,c:C.hi},{l:"Menos esporádicos",v:-totalExtra,c:C.amber}].map(({l,v,c})=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 16px",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.mid,fontSize:12}}>{l}</span><span style={{fontFamily:"monospace",fontWeight:600,color:c}}>{fmt(v)}</span></div>)}
      <div style={{display:"flex",justifyContent:"space-between",padding:"12px 16px"}}><span style={{fontWeight:700,color:C.hi}}>Disponible tras gastos</span><span style={{fontFamily:"monospace",fontSize:16,fontWeight:700,color:disponibleTras>=0?C.accent:C.red}}>{fmt(disponibleTras)}</span></div>
    </div>
  </div>;
}

// ── DEUDA ROW (extracted to fix useState-in-map crash) ────────────────────────
function DeudaRow({d,onPay,onDel,onTog,onDelAbono,onRename,incomeCat}){
  const remaining=d.total-d.paid;
  const pct=d.total>0?Math.min(100,(d.paid/d.total)*100):0;
  const [payAmt,setPayAmt]=useState("");
  const [catN,setCatN]=useState("");
  const [showAbonos,setShowAbonos]=useState(false);
  const [editingName,setEditingName]=useState(false);
  const [nameVal,setNameVal]=useState(d.name);
  function commitName(){const v=nameVal.trim();if(v&&v!==d.name)onRename(d.id,v);setEditingName(false);}
  const cN=parseInt(catN)||0;
  const abonoSug=cN>0&&remaining>0?remaining/cN:0;
  // Projection: how many catorcenas to pay off with suggested abono per catorcena
  const catorcenasNec=abonoSug>0?cN:(d.monthly>0&&remaining>0?Math.ceil(remaining/(d.monthly/2)):0);
  const abonoPorCat=d.monthly>0?d.monthly/2:0;
  return<div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,opacity:d.active?1:.4}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:6}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
          <Toggle on={d.active} onChange={()=>onTog(d.id)}/>
          {editingName
            ?<input autoFocus value={nameVal} onChange={e=>setNameVal(e.target.value)}
                onBlur={commitName} onKeyDown={e=>{if(e.key==="Enter")commitName();if(e.key==="Escape"){setNameVal(d.name);setEditingName(false);}}}
                style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${C.accent}`,color:C.accent,fontWeight:600,fontSize:13,outline:"none",fontFamily:"inherit",padding:"0 2px",minWidth:0}}/>
            :<span onClick={()=>{setNameVal(d.name);setEditingName(true);}} title="Clic para editar"
                style={{color:C.hi,fontWeight:600,fontSize:13,cursor:"text",borderBottom:`1px dashed ${C.border}`,paddingBottom:1,transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.lo}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                {d.name}
              </span>}
          {d.note&&!editingName&&<span style={{fontSize:11,color:C.lo}}>{d.note}</span>}
        </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{d.monthly>0&&<Badge label={`${fmt(d.monthly)}/mes`} color={C.pink}/>}<XBtn onClick={()=>onDel(d.id)} label={d.name}/></div>
    </div>
    <div style={{height:4,background:C.border,borderRadius:99,marginBottom:5}}><div style={{height:"100%",width:`${pct}%`,borderRadius:99,background:remaining<=0?C.green:C.pink,transition:"width .4s"}}/></div>
    <div style={{fontSize:11,color:C.mid,marginBottom:8}}>{fmt(d.paid)} pagado · {fmt(remaining)} pendiente · {pct.toFixed(0)}%</div>
    {remaining>0&&d.active&&<>
      <div style={{background:C.s2,borderRadius:8,padding:"8px 12px",marginBottom:8}}>
        <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Plan de pago catorcenal</div>
        {abonoPorCat>0&&(()=>{
          const cats=Math.ceil(remaining/abonoPorCat);
          const catsDone=d.total>0?Math.round((d.paid/d.total)*cats):0;
          const bars=Math.min(cats,20);
          return<>
            <div style={{fontSize:11,color:C.mid,marginBottom:6}}>Con {fmt(abonoPorCat)}/cat → <b style={{color:C.pink}}>{cats} catorcenas</b> (~{(cats/2).toFixed(1)} meses)</div>
            <div style={{display:"flex",gap:2,flexWrap:"wrap",marginBottom:4}}>
              {Array.from({length:bars},(_,i)=><div key={i} style={{width:10,height:10,borderRadius:2,background:i<catsDone?C.green:i===catsDone?C.pink:C.border,flexShrink:0,transition:"background .3s"}}/>)}
              {cats>20&&<span style={{fontSize:10,color:C.lo,alignSelf:"center"}}>+{cats-20}</span>}
            </div>
          </>;
        })()}
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:C.mid,flexShrink:0}}>Liquidar en</span>
          <NI value={catN} onChange={v=>setCatN(v)} width={60}/>
          <span style={{fontSize:11,color:C.mid,flexShrink:0}}>catorcenas →</span>
          {abonoSug>0&&<><Badge label={`${fmt(abonoSug)}/cat`} color={C.teal}/>{incomeCat>0&&<Badge label={`${((abonoSug/incomeCat)*100).toFixed(1)}% ingreso`} color={C.mid}/>}</>}
        </div>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
        <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:10,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={payAmt} onChange={e=>setPayAmt(e.target.value)} placeholder="Registrar abono" style={{width:"100%",paddingLeft:18,paddingRight:6,paddingTop:6,paddingBottom:6,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:6,color:C.hi,fontFamily:"monospace",fontSize:12,textAlign:"right",outline:"none"}}/></div>
        <button onClick={()=>{const a=parseFloat(payAmt);if(a){onPay(d.id,a);setPayAmt("");}}} style={{background:C.pink+"22",color:C.pink,border:`1px solid ${C.pink}44`,borderRadius:6,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Abonar</button>
      </div>
    </>}
    {remaining<=0&&<Badge label="✓ Liquidada" color={C.green}/>}
    {/* Historial de abonos — toggle */}
    {(d.abonos||[]).length>0&&<div style={{marginTop:6}}>
      <button onClick={()=>setShowAbonos(s=>!s)} style={{background:"none",border:"none",color:C.lo,cursor:"pointer",fontSize:11,padding:"2px 0",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
        <span>{showAbonos?"▾":"▸"}</span> Historial ({(d.abonos||[]).length} abonos)
      </button>
      {showAbonos&&<div style={{marginTop:6,borderTop:`1px solid ${C.border}`,paddingTop:6}}>
        {[...(d.abonos||[])].reverse().map((a)=>{
          const aKey=a.id||(a.date+a.amt);
          return<div key={aKey} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:C.mid,padding:"3px 0",borderBottom:`1px solid ${C.border}22`}}>
            <span>{a.date}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"monospace",color:C.pink}}>{fmt(a.amt)}</span>
              {onDelAbono&&<XBtn onClick={()=>onDelAbono(d.id,aKey)} label="abono"/>}
            </div>
          </div>;
        })}
      </div>}
    </div>}
  </div>;
}

function DeudasTab({totalIncome}){
  const [debts,setDebts]=useSynced("debts",[]);
  const [name,setName]=useState(""); const [total,setTotal]=useState("");
  function add(){
    if(!name.trim()||!total)return;
    setDebts(p=>[...p,{id:uid(),name:name.trim(),total:parseFloat(total)||0,paid:0,note:"",active:true,abonos:[]}]);
    setName("");setTotal("");
  }
  function pay(id,amt){
    setDebts(p=>p.map(d=>d.id===id?{...d,paid:Math.min(d.total,d.paid+amt),abonos:[...(d.abonos||[]),{id:uid(),amt,date:new Date().toLocaleDateString("es-MX")}]}:d));
  }
  function delAbono(debtId,abonoId){
    setDebts(p=>p.map(d=>{
      if(d.id!==debtId)return d;
      // Support old abonos without id (legacy Supabase records)
      const abonos=(d.abonos||[]);
      const target=abonos.find(a=>(a.id||a.date+a.amt)===abonoId);
      const removedAmt=target?.amt||0;
      return{...d,paid:Math.max(0,d.paid-removedAmt),abonos:abonos.filter(a=>(a.id||a.date+a.amt)!==abonoId)};
    }));
  }
  function rename(id,name){setDebts(p=>p.map(d=>d.id===id?{...d,name}:d));}
  function del(id){setDebts(p=>p.filter(d=>d.id!==id));}
  function tog(id){setDebts(p=>p.map(d=>d.id===id?{...d,active:!d.active}:d));}
  const incomeCat=totalIncome/2;
  const totalDebt=debts.filter(d=>d.active).reduce((s,d)=>s+(d.total-d.paid),0);
  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"8px 10px",fontFamily:"inherit",outline:"none",width:"100%"};
  return<Block label="Deudas y cargos" total={totalDebt} totalColor={C.pink} accent={C.pink} footer={<AddBtn label="Agregar deuda / cargo" onClick={add} color={C.pink}/>}>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Concepto (ej. UVEG, Dentista, Tarjeta)" style={inp}/>
      <div style={{position:"relative"}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={total} onChange={e=>setTotal(e.target.value)} placeholder="Monto total de la deuda" style={{...inp,paddingLeft:18,textAlign:"right"}}/></div>
    </div>
    {debts.length===0&&<div style={{padding:"12px 16px",color:C.lo,fontStyle:"italic",fontSize:12}}>Sin deudas registradas</div>}
    {debts.map(d=><DeudaRow key={d.id} d={d} onPay={pay} onDel={del} onTog={tog} onDelAbono={delAbono} onRename={rename} incomeCat={incomeCat}/>)}
  </Block>;
}

// ── TRANSPORTE TAB ────────────────────────────────────────────────────────────
// Corrected logic:
// Normal bus: $11 per ride
// With transbordo: $11 (bus) + $5.50 (transfer) = $16.50 per ride
// If 2 transbordos: 2 × $5.50 = $11 in transfers, so ride = $11 + $11 = $22? 
// User says: 2 transbordos = $5.50 + $5.50 = $11, daily total = $33
// => 2 normales ($11×2=$22) + 2 con transbordo ($5.50×2=$11) = $33/day total
// Correct formula: normales×$11 + transbordos×$5.50 = total/day
function TransporteTab(){
  const [cfg,setCfg]=useSynced("bus_cfg",{camion:11,transbordo:5.50,normales:2,transbordos:2,extra:0,useBiz:false});
  const [fechas,setFechas]=useSynced("bus_fechas",{inicio:"",fin:""});
  const [periodo,setPeriodo]=useState("catorcena");
  // Rest 1 day per week: semana=6, catorcena=12 (14−2), quincena=13, mes=26
  const periodos={semana:6,catorcena:12,quincena:13,mes:26};

  const diasCalc=useMemo(()=>{
    if(!fechas.inicio||!fechas.fin)return periodos[periodo]||10;
    return cfg.useBiz?bizDaysBetween(fechas.inicio+"T12:00:00",fechas.fin+"T12:00:00"):calendarDaysBetween(fechas.inicio,fechas.fin)+1;
  },[fechas,periodo,cfg.useBiz]);

  // $11×normales + $5.50×transbordos = total/day
  const costoDia=(cfg.normales*cfg.camion)+(cfg.transbordos*cfg.transbordo);
  const costoExtra=(cfg.extra||0)*cfg.camion;
  const costoTotal=diasCalc*costoDia+costoExtra;
  const viajesTotal=(cfg.normales+cfg.transbordos)*diasCalc+(cfg.extra||0);

  const inp={background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.hi,padding:"7px 10px",fontFamily:"monospace",outline:"none"};
  return<div>
    <Block label="Calculadora de transporte" accent={C.blue}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:10,fontWeight:600}}>Tarifas</div>
        <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
          <span style={{flex:1,fontSize:12,color:C.mid}}>Costo camión</span>
          <div style={{position:"relative",flexShrink:0}}><span style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
            <input type="number" min="0" step="0.5" value={cfg.camion} onChange={e=>setCfg(p=>({...p,camion:parseFloat(e.target.value)||0}))} style={{...inp,width:90,paddingLeft:18,textAlign:"right"}}/></div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{flex:1,fontSize:12,color:C.mid}}>Costo transbordo</span>
          <div style={{position:"relative",flexShrink:0}}><span style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
            <input type="number" min="0" step="0.5" value={cfg.transbordo} onChange={e=>setCfg(p=>({...p,transbordo:parseFloat(e.target.value)||0}))} style={{...inp,width:90,paddingLeft:18,textAlign:"right"}}/></div>
        </div>
        <div style={{height:1,background:C.border,margin:"12px 0"}}/>
        <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:10,fontWeight:600}}>Viajes diarios</div>
        <div style={{background:C.s2,borderRadius:10,padding:"12px",marginBottom:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <div style={{fontSize:11,color:C.mid,marginBottom:6}}>Camiones normales</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><NI value={cfg.normales} onChange={v=>setCfg(p=>({...p,normales:v}))} width={55}/><span style={{fontSize:11,color:C.lo}}>× {fmtD(cfg.camion)}</span></div>
              <div style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:C.hi}}>= {fmtD(cfg.normales*cfg.camion)}/día</div>
            </div>
            <div>
              <div style={{fontSize:11,color:C.mid,marginBottom:6}}>Transbordos</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><NI value={cfg.transbordos} onChange={v=>setCfg(p=>({...p,transbordos:v}))} width={55}/><span style={{fontSize:11,color:C.lo}}>× {fmtD(cfg.transbordo)}</span></div>
              <div style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:C.hi}}>= {fmtD(cfg.transbordos*cfg.transbordo)}/día</div>
            </div>
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:C.mid}}>{cfg.normales+cfg.transbordos} viajes/día — total</span>
            <span style={{fontFamily:"monospace",fontWeight:700,fontSize:15,color:C.accent}}>{fmtD(costoDia)}/día</span>
          </div>
          <div style={{marginTop:4,fontSize:11,color:C.lo}}>({cfg.normales}×{fmtD(cfg.camion)}) + ({cfg.transbordos}×{fmtD(cfg.transbordo)}) = {fmtD(costoDia)}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{flex:1,fontSize:12,color:C.mid}}>Viajes extra ocasionales</span>
          <NI value={cfg.extra} onChange={v=>setCfg(p=>({...p,extra:v}))} width={55}/>
          <span style={{fontSize:11,color:C.lo}}>× {fmtD(cfg.camion)}</span>
        </div>
      </div>

      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>Período</div>
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
          {Object.keys(periodos).map(p=><button key={p} onClick={()=>{setPeriodo(p);setFechas({inicio:"",fin:""}); }} style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,background:periodo===p&&!fechas.inicio?C.blue+"22":"transparent",color:periodo===p&&!fechas.inicio?C.blue:C.lo,outline:periodo===p&&!fechas.inicio?`1px solid ${C.blue}44`:"none"}}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>)}
        </div>
        <div style={{fontSize:11,color:C.mid,marginBottom:6}}>O elige rango de fechas:</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          {[{l:"Inicio",k:"inicio"},{l:"Fin",k:"fin"}].map(({l,k})=><div key={k} style={{flex:1,minWidth:120}}>
            <div style={{fontSize:10,color:C.lo,marginBottom:4}}>{l}</div>
            <input type="date" value={fechas[k]} onChange={e=>setFechas(p=>({...p,[k]:e.target.value}))} style={{...inp,width:"100%"}}/>
          </div>)}
        </div>
        {fechas.inicio&&fechas.fin&&<div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setCfg(p=>({...p,useBiz:false}))} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:!cfg.useBiz?C.blue+"22":"transparent",color:!cfg.useBiz?C.blue:C.lo,outline:!cfg.useBiz?`1px solid ${C.blue}44`:"none"}}>Días naturales</button>
          <button onClick={()=>setCfg(p=>({...p,useBiz:true}))} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,background:cfg.useBiz?C.blue+"22":"transparent",color:cfg.useBiz?C.blue:C.lo,outline:cfg.useBiz?`1px solid ${C.blue}44`:"none"}}>Solo días hábiles</button>
        </div>}
      </div>

      <div style={{padding:"14px 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[{l:"Costo/día",v:fmtD(costoDia),c:C.hi},{l:"Días calculados",v:`${diasCalc} días`,c:C.mid},{l:"Total viajes",v:`${viajesTotal}`,c:C.blue},{l:"Costo del período",v:fmtD(costoTotal),c:C.accent}].map(s=><div key={s.l} style={{background:C.s2,borderRadius:10,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:C.lo,marginBottom:4}}>{s.l}</div>
            <div style={{fontFamily:"monospace",fontWeight:700,fontSize:14,color:s.c}}>{s.v}</div>
          </div>)}
        </div>
      </div>
    </Block>
  </div>;
}

// ── WISHLIST TAB ──────────────────────────────────────────────────────────────
function WishlistTab({totalIncome}){
  const [items,setItems]=useSynced("wish_items",[]);
  const [name,setName]=useState(""); const [price,setPrice]=useState(""); const [prio,setPrio]=useState("media"); const [url,setUrl]=useState(""); const [cat,setCat]=useState("General");
  const incomeCat=totalIncome/2;
  const wCats=["General","Ropa","Calzado","Tecnología","Hogar","Salud","Entretenimiento","Otro"];
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
        <div style={{position:"relative",flex:1,minWidth:90}}><span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span><input type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Precio" style={{...inp,paddingLeft:18,textAlign:"right"}}/></div>
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
        return<div key={r.id} style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`,opacity:r.bought?0.4:1,transition:"background .1s"}} onMouseEnter={e=>e.currentTarget.style.background=C.s2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
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
            <XBtn onClick={()=>del(r.id)}/>
          </div>
          {!r.bought&&r.price>0&&<div style={{marginTop:8,background:C.s2,borderRadius:8,padding:"8px 12px"}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:C.mid,flexShrink:0}}>Ahorrar en</span>
              <NI value={r.catPlan} onChange={v=>updPlan(r.id,v)} width={55}/>
              <span style={{fontSize:11,color:C.mid,flexShrink:0}}>catorcenas →</span>
              {catAmt>0&&<><Badge label={`${fmt(catAmt)}/cat`} color={C.purple}/>{incomeCat>0&&<Badge label={`${((catAmt/incomeCat)*100).toFixed(1)}% ingreso`} color={C.mid}/>}</>}
            </div>
          </div>}
        </div>;
      })}
    </div>
  </Block>;
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("main");
  const [incomes,setIncomes,incSynced]=useSynced("incomes",[{id:1,name:"Sueldo / Nómina",amount:0}]);
  const [fixed,setFixed,fixSynced]=useSynced("fixed",DEFAULT_FIXED);
  const [extras,setExtras,extSynced]=useSynced("extras",[]);
  const [savingGoals]=useSynced("saving_goals",[]);
  const [debts]=useSynced("debts",[]);
  const [cats,setCats]=useSynced("fixed_cats",DEFAULT_CATS);
  const [extraCats,setExtraCats]=useSynced("extra_cats",DEFAULT_EXTRA_CATS);
  const synced=incSynced&&fixSynced&&extSynced;

  const totalIncome=useMemo(()=>incomes.reduce((s,r)=>s+r.amount,0),[incomes]);
  const totalFixed=useMemo(()=>fixed.filter(r=>r.active).reduce((s,r)=>s+r.amount,0),[fixed]);
  const totalExtra=useMemo(()=>extras.reduce((s,r)=>s+r.amount,0),[extras]);
  const incomeCat=totalIncome/2;
  const totalSaving=useMemo(()=>savingGoals.reduce((s,g)=>s+Math.max(incomeCat*(g.pct/100),(g.target&&g.months?g.target/g.months:0)),0),[savingGoals,incomeCat]);
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
      button{-webkit-tap-highlight-color:transparent;}
      input,select,button{font-size:16px;}
      @media(max-width:480px){
        input,select{font-size:16px!important;}
      }
    `}</style>
    <div style={{marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <h1 style={{fontSize:17,fontWeight:700,color:C.hi,letterSpacing:-.3}}>Life 2.0</h1>
      <div style={{fontSize:10,color:synced?C.green:C.lo}}>{synced?"☁ sync":"○ ..."}</div>
    </div>
    <Hero income={totalIncome} fixed={totalFixed} extra={totalExtra} saving={totalSaving} debt={totalDebt} synced={synced}/>
    <Tabs active={tab} onChange={setTab}/>
    {tab==="main"&&<MainTab fixed={fixed} setFixed={setFixed} extras={extras} setExtras={setExtras} cats={cats} setCats={setCats} extraCats={extraCats} setExtraCats={setExtraCats} savingGoals={savingGoals} debts={debts} totalIncome={totalIncome} totalFixed={totalFixed} totalExtra={totalExtra}/>}
    {tab==="cuentas"&&<CuentasTab totalFixed={totalFixed} totalExtra={totalExtra} incomes={incomes} setIncomes={setIncomes}/>}
    {tab==="deudas"&&<DeudasTab totalIncome={totalIncome}/>}
    {tab==="transporte"&&<TransporteTab/>}
    {tab==="wish"&&<WishlistTab totalIncome={totalIncome}/>}
  </div>;
}
