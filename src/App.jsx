import { useState, useMemo, useEffect, useRef } from "react";

// ── Supabase ───────────────────────────────────────────────────────────────────
const SB_URL = "https://qswoavwqldksakyzudaq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzd29hdndxbGRrc2FreXp1ZGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDA3NjAsImV4cCI6MjA5Njg3Njc2MH0.DS7j8Mjxwm_O8v6P5g4R0ggmtcXa2KrdfLKpl6zXZyY";
async function sbGet(key){try{const r=await fetch(`${SB_URL}/rest/v1/budget_data?key=eq.${key}&select=value`,{headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`}});const d=await r.json();return d?.[0]?.value??null;}catch{return null;}}
async function sbSet(key,value){try{await fetch(`${SB_URL}/rest/v1/budget_data`,{method:"POST",headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},body:JSON.stringify({key,value,updated_at:new Date().toISOString()})});}catch{}}
function lsGet(k,fb){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
function useSynced(key,initial){
  const [value,setValue]=useState(()=>lsGet(key,initial));
  const [synced,setSynced]=useState(false);
  const timer=useRef(null);
  useEffect(()=>{sbGet(key).then(r=>{if(r!==null){setValue(r);lsSet(key,r);}setSynced(true);});},[key]);
  const set=(u)=>setValue(prev=>{const next=typeof u==="function"?u(prev):u;lsSet(key,next);clearTimeout(timer.current);timer.current=setTimeout(()=>sbSet(key,next),800);return next;});
  return[value,set,synced];
}

// ── Colors ─────────────────────────────────────────────────────────────────────
const C={bg:"#0a0a0a",s1:"#111111",s2:"#181818",border:"#252525",borderHi:"#333333",hi:"#f0f0f0",mid:"#888888",lo:"#444444",accent:"#e8ff47",red:"#ff4545",green:"#3ddc84",amber:"#f59e0b",blue:"#60a5fa",purple:"#a78bfa",teal:"#2dd4bf",pink:"#f472b6"};

// ── Helpers ────────────────────────────────────────────────────────────────────
let _id=500;const uid=()=>++_id;
function fmt(n){return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n||0);}
function fmtD(n){return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);}

// Next catorcena dates from today (every-other-friday starting Jun 19 2025)
function nextCatorcenas(n=6){
  const anchor=new Date("2025-06-19T12:00:00");
  const today=new Date();today.setHours(12,0,0,0);
  const ms=anchor.getTime();
  const diff=today.getTime()-ms;
  const periods=Math.ceil(diff/(14*864e5));
  const results=[];
  for(let i=0;i<n;i++){
    const d=new Date(ms+(periods+i)*14*864e5);
    results.push(d);
  }
  return results;
}
function fmtDate(d){return d.toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"});}
function daysUntil(d){const now=new Date();now.setHours(0,0,0,0);return Math.round((d-now)/864e5);}

// ── Default data ───────────────────────────────────────────────────────────────
const DEFAULT_FIXED=[
  {id:1,name:"Renta",cat:"Vivienda",amount:3400,active:true},
  {id:2,name:"Food",cat:"Alimentación",amount:3000,active:true},
  {id:3,name:"Terapia",cat:"Salud",amount:1750,active:true},
  {id:4,name:"Quetiapina",cat:"Salud",amount:449,active:true},
  {id:5,name:"Vitaminas",cat:"Salud",amount:488,active:true},
  {id:6,name:"Minoxidil",cat:"Salud",amount:372,active:true},
  {id:7,name:"Laundry",cat:"Hogar",amount:800,active:true},
  {id:8,name:"Haircut",cat:"Personal",amount:450,active:true},
  {id:9,name:"Transport",cat:"Transporte",amount:399,active:true},
  {id:10,name:"YouTube",cat:"Suscripciones",amount:188,active:true},
  {id:11,name:"Home",cat:"Hogar",amount:95,active:true},
  {id:12,name:"Bait",cat:"Suscripciones",amount:199,active:true},
  {id:13,name:"Weed",cat:"Personal",amount:1400,active:true},
];
const DEFAULT_ACCOUNTS=[
  {id:1,name:"Vales",type:"debito",balance:0},
  {id:2,name:"OpenBank",type:"debito",balance:0},
  {id:3,name:"Santander",type:"debito",balance:0},
  {id:4,name:"Banamex",type:"debito",balance:0},
  {id:5,name:"Stori",type:"credito",balance:0},
  {id:6,name:"Vexi",type:"credito",balance:0},
  {id:7,name:"Plata",type:"credito",balance:0},
];
const DEFAULT_CATS=["Vivienda","Alimentación","Salud","Hogar","Personal","Transporte","Suscripciones","Entretenimiento","Ropa","Otro"];
const EXTRA_CATS_DEFAULT=["Ropa","Salidas","Médico","Hogar","Tecnología","Otro"];
const PRIO=[{id:"alta",label:"Alta",color:C.red},{id:"media",label:"Media",color:C.amber},{id:"baja",label:"Baja",color:C.lo}];

// ── Micro UI ───────────────────────────────────────────────────────────────────
function Toggle({on,onChange}){return<button onClick={onChange} style={{width:32,height:18,borderRadius:99,flexShrink:0,background:on?C.accent:C.border,border:"none",cursor:"pointer",position:"relative",transition:"background .15s"}}><span style={{position:"absolute",top:3,left:on?15:3,width:12,height:12,borderRadius:"50%",background:on?C.bg:C.lo,transition:"left .15s",display:"block"}}/></button>;}

function MoneyInput({value,onChange,dimmed,width,placeholder}){
  return<div style={{position:"relative",display:"flex",alignItems:"center",flexShrink:0}}>
    <span style={{position:"absolute",left:8,fontSize:11,color:dimmed?C.lo:C.mid,pointerEvents:"none"}}>$</span>
    <input type="number" min="0" value={value||""} placeholder={placeholder||"0"} onChange={e=>onChange(parseFloat(e.target.value)||0)} disabled={dimmed}
      style={{width:width||100,paddingLeft:18,paddingRight:6,paddingTop:7,paddingBottom:7,background:dimmed?"transparent":C.s2,border:`1px solid ${dimmed?C.border:C.borderHi}`,borderRadius:7,color:dimmed?C.lo:C.hi,fontFamily:"'DM Mono',monospace",fontWeight:500,textAlign:"right",outline:"none"}}/>
  </div>;
}

function TxtIn({value,onChange,placeholder,dimmed,style:extra}){
  return<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} disabled={dimmed}
    style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${dimmed?"transparent":C.border}`,color:dimmed?C.lo:C.hi,padding:"3px 0",outline:"none",fontFamily:"inherit",minWidth:0,...extra}}/>;
}

function XBtn({onClick}){return<button onClick={onClick} style={{background:"none",border:"none",color:C.lo,cursor:"pointer",fontSize:18,lineHeight:1,padding:"0 2px",flexShrink:0,minWidth:24,transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.lo}>×</button>;}

function AddBtn({label,onClick,color}){return<button onClick={onClick} style={{display:"flex",alignItems:"center",gap:7,width:"100%",background:"none",border:"none",padding:"10px 16px",color:C.lo,cursor:"pointer",fontFamily:"inherit",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color=color||C.accent} onMouseLeave={e=>e.currentTarget.style.color=C.lo}><span style={{fontSize:16,lineHeight:1}}>+</span>{label}</button>;}

function Block({label,total,totalColor,accent,children,footer,nopad}){
  return<div style={{background:C.s1,border:`1px solid ${accent?accent+"44":C.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 16px",borderBottom:`1px solid ${C.border}`}}>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:accent||C.mid,textTransform:"uppercase"}}>{label}</span>
      {total!==undefined&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:totalColor||C.hi}}>{fmt(total)}</span>}
    </div>
    {children}
    {footer&&<div style={{borderTop:`1px solid ${C.border}`}}>{footer}</div>}
  </div>;
}

function TR({children,dimmed}){return<div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderBottom:`1px solid ${C.border}`,opacity:dimmed?0.3:1,flexWrap:"wrap"}}>{children}</div>;}

function Badge({label,color}){return<span style={{fontSize:10,fontWeight:700,color,background:color+"18",borderRadius:5,padding:"2px 7px",letterSpacing:.3,flexShrink:0}}>{label}</span>;}

// Category selector with free-text fallback
function CatSelect({value,onChange,cats}){
  const [custom,setCustom]=useState(!cats.includes(value)&&value?true:false);
  if(custom)return<div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder="Categoría"
      style={{width:100,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"5px 8px",fontSize:12,fontFamily:"inherit",outline:"none"}}/>
    <button onClick={()=>{setCustom(false);onChange(cats[0]);}} style={{background:"none",border:"none",color:C.lo,cursor:"pointer",fontSize:12}}>↩</button>
  </div>;
  return<div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
    <select value={cats.includes(value)?value:cats[0]} onChange={e=>{if(e.target.value==="__custom__"){setCustom(true);onChange("");}else onChange(e.target.value);}}
      style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.mid,padding:"5px 6px",fontFamily:"inherit",outline:"none",fontSize:12}}>
      {cats.map(c=><option key={c} value={c}>{c}</option>)}
      <option value="__custom__">+ Otra...</option>
    </select>
  </div>;
}

// ── TABS ───────────────────────────────────────────────────────────────────────
const TABS=[{id:"resumen",label:"Resumen"},{id:"catorcena",label:"Catorcena"},{id:"cuentas",label:"Cuentas"},{id:"gastos",label:"Gastos"},{id:"deudas",label:"Deudas"},{id:"ahorro",label:"Ahorro"},{id:"transporte",label:"Bus"},{id:"wish",label:"Wishlist"}];

function Tabs({active,onChange}){
  return<div style={{display:"flex",gap:3,marginBottom:14,background:C.s1,border:`1px solid ${C.border}`,borderRadius:10,padding:3,overflowX:"auto"}}>
    {TABS.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{flex:"0 0 auto",padding:"8px 11px",border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:12,transition:"all .15s",background:active===t.id?C.s2:"transparent",color:active===t.id?C.hi:C.lo,whiteSpace:"nowrap",boxShadow:active===t.id?`0 0 0 1px ${C.border}`:"none"}}>{t.label}</button>)}
  </div>;
}

// ── HERO ───────────────────────────────────────────────────────────────────────
function Hero({income,fixed,extra,saving,debt,synced}){
  const out=fixed+extra+saving+debt,bal=income-out;
  const pct=income>0?Math.min(100,(out/income)*100):0;
  const barColor=pct>90?C.red:pct>70?C.amber:C.accent;
  return<div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 16px",marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
      <div style={{fontSize:10,letterSpacing:1.5,color:C.mid,textTransform:"uppercase",fontWeight:600}}>Balance mensual</div>
      <div style={{fontSize:10,color:synced?C.green:C.lo}}>{synced?"● sync":"○ ..."}</div>
    </div>
    <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:32,letterSpacing:-1,marginBottom:14,color:bal>=0?C.accent:C.red,lineHeight:1}}>{fmt(bal)}</div>
    <div style={{height:2,background:C.border,borderRadius:99,marginBottom:14}}>
      <div style={{height:"100%",width:`${pct}%`,borderRadius:99,background:barColor,transition:"width .4s"}}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:5}}>
      {[{l:"Ingresos",v:income,c:C.green},{l:"Fijos",v:fixed,c:C.hi},{l:"Extra",v:extra,c:C.amber},{l:"Ahorro",v:saving,c:C.teal},{l:"Deudas",v:debt,c:C.pink}].map(s=><div key={s.l} style={{borderLeft:`2px solid ${C.border}`,paddingLeft:7}}>
        <div style={{fontSize:9,color:C.mid,marginBottom:2,letterSpacing:.4}}>{s.l}</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:10,color:s.c}}>{fmt(s.v)}</div>
      </div>)}
    </div>
  </div>;
}

// ── CATORCENA ─────────────────────────────────────────────────────────────────
function CatorcenaTab({fixed,incomes,extras,savingGoals,debts,totalIncome}){
  const dates=useMemo(()=>nextCatorcenas(4),[]);
  const [selIdx,setSelIdx]=useState(0);
  const payDate=dates[selIdx];
  const dias=daysUntil(payDate);

  // Half of monthly fixed goes per catorcena
  const fixedCat=fixed.filter(r=>r.active).reduce((s,r)=>s+r.amount,0)/2;
  const incomeCat=totalIncome/2;
  const extrasCat=extras.reduce((s,r)=>s+r.amount,0);
  const savingCat=savingGoals.reduce((s,g)=>s+Math.max(incomeCat*(g.pct/100),(g.target||0)/2),0);
  const debtCat=debts.filter(d=>d.active).reduce((s,d)=>s+(d.monthly||0)/2,0);
  const balCat=incomeCat-fixedCat-extrasCat-savingCat-debtCat;

  return<div>
    {/* date selector */}
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>Próximos pagos catorcenal (viernes sí/no)</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {dates.map((d,i)=>{
          const d2=daysUntil(d);
          return<button key={i} onClick={()=>setSelIdx(i)} style={{padding:"6px 12px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,background:selIdx===i?C.accent:C.s2,color:selIdx===i?C.bg:C.mid,outline:selIdx===i?`none`:`1px solid ${C.border}`}}>
            {fmtDate(d)}<br/><span style={{fontSize:10,fontWeight:400,color:selIdx===i?C.bg+"aa":C.lo}}>{d2===0?"hoy":d2>0?`en ${d2}d`:`hace ${-d2}d`}</span>
          </button>;
        })}
      </div>
    </div>

    {/* next payment highlight */}
    <div style={{background:C.s1,border:`1px solid ${C.accent}44`,borderRadius:14,padding:"14px 16px",marginBottom:14}}>
      <div style={{fontSize:10,color:C.accent,letterSpacing:1,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>
        Catorcena — {fmtDate(payDate)} {dias>0?`(en ${dias} días)`:dias===0?"(hoy)":"(pasada)"}
      </div>
      <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:28,color:balCat>=0?C.accent:C.red,marginBottom:12}}>{fmt(balCat)}</div>
      {[{l:"Ingreso estimado",v:incomeCat,c:C.green,s:"+"},{l:"Gastos fijos (½)",v:fixedCat,c:C.hi,s:"−"},{l:"Esporádicos",v:extrasCat,c:C.amber,s:"−"},{l:"Ahorro (½)",v:savingCat,c:C.teal,s:"−"},{l:"Deudas (½)",v:debtCat,c:C.pink,s:"−"}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:12,color:C.mid}}>{r.l}</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:r.c}}>{r.s} {fmt(r.v)}</span>
      </div>)}
    </div>
  </div>;
}

// ── CUENTAS ───────────────────────────────────────────────────────────────────
function CuentasTab(){
  const [accounts,setAccounts]=useSynced("accounts",DEFAULT_ACCOUNTS);
  const debito=accounts.filter(a=>a.type==="debito");
  const credito=accounts.filter(a=>a.type==="credito");
  const totalDebito=debito.reduce((s,a)=>s+a.balance,0);
  const totalCredito=credito.reduce((s,a)=>s+a.balance,0);

  function upd(id,f,v){setAccounts(p=>p.map(a=>a.id===id?{...a,[f]:v}:a));}
  function add(type){setAccounts(p=>[...p,{id:uid(),name:"Nueva cuenta",type,balance:0}]);}
  function del(id){setAccounts(p=>p.filter(a=>a.id!==id));}

  return<div>
    <Block label="Débito" total={totalDebito} totalColor={C.green} accent={C.green}
      footer={<AddBtn label="Agregar cuenta débito" onClick={()=>add("debito")} color={C.green}/>}>
      {debito.map(a=><TR key={a.id}>
        <TxtIn value={a.name} onChange={v=>upd(a.id,"name",v)} placeholder="Nombre"/>
        <MoneyInput value={a.balance} onChange={v=>upd(a.id,"balance",v)}/>
        <XBtn onClick={()=>del(a.id)}/>
      </TR>)}
    </Block>
    <Block label="Crédito" total={totalCredito} totalColor={C.pink} accent={C.pink}
      footer={<AddBtn label="Agregar tarjeta crédito" onClick={()=>add("credito")} color={C.pink}/>}>
      {credito.map(a=><TR key={a.id}>
        <TxtIn value={a.name} onChange={v=>upd(a.id,"name",v)} placeholder="Nombre"/>
        <MoneyInput value={a.balance} onChange={v=>upd(a.id,"balance",v)}/>
        <XBtn onClick={()=>del(a.id)}/>
      </TR>)}
      <div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`}}>
        <div style={{fontSize:11,color:C.lo}}>Saldo disponible neto: <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:totalDebito-totalCredito>=0?C.green:C.red}}>{fmt(totalDebito-totalCredito)}</span></div>
      </div>
    </Block>
  </div>;
}

// ── GASTOS ESPORADICOS ─────────────────────────────────────────────────────────
function GastosTab({extras,setExtras,cats,setCats}){
  const [name,setName]=useState("");const [where,setWhere]=useState("");const [cat,setCat]=useState(cats[0]);const [amount,setAmount]=useState("");

  function commit(){
    const a=parseFloat(amount);if(!name.trim()||!a)return;
    // add new cat if custom
    if(!cats.includes(cat))setCats(p=>[...p,cat]);
    setExtras(p=>[...p,{id:uid(),name:name.trim(),where:where.trim(),cat,amount:a,date:new Date().toISOString().slice(0,10)}]);
    setName("");setWhere("");setAmount("");
  }

  const total=extras.reduce((s,r)=>s+r.amount,0);
  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"8px 10px",fontFamily:"inherit",outline:"none",width:"100%"};

  return<Block label="Gastos esporádicos" total={total} totalColor={C.amber} accent={C.amber}>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",gap:8}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="¿Qué?" onKeyDown={e=>e.key==="Enter"&&commit()} style={{...inp,flex:2}}/>
        <input value={where} onChange={e=>setWhere(e.target.value)} placeholder="¿Dónde?" onKeyDown={e=>e.key==="Enter"&&commit()} style={{...inp,flex:1}}/>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <CatSelect value={cat} onChange={setCat} cats={cats}/>
        <div style={{position:"relative",flexShrink:0}}>
          <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
          <input type="number" min="0" value={amount} placeholder="0" onChange={e=>setAmount(e.target.value)} onKeyDown={e=>e.key==="Enter"&&commit()}
            style={{width:100,paddingLeft:18,paddingRight:6,paddingTop:8,paddingBottom:8,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,fontFamily:"'DM Mono',monospace",textAlign:"right",outline:"none"}}/>
        </div>
        <button onClick={commit} style={{background:C.amber,color:C.bg,border:"none",borderRadius:7,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>+</button>
      </div>
    </div>
    {extras.length===0&&<div style={{padding:"12px 16px",color:C.lo,fontStyle:"italic"}}>Sin gastos registrados</div>}
    {extras.length>0&&<div style={{overflowY:"auto",maxHeight:300}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 24px",gap:6,padding:"6px 16px",borderBottom:`1px solid ${C.border}`}}>
        {["Concepto / Lugar","Cat.","Monto",""].map(h=><span key={h} style={{fontSize:10,color:C.lo,fontWeight:600,letterSpacing:.8,textTransform:"uppercase"}}>{h}</span>)}
      </div>
      {extras.map(r=><div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 24px",gap:6,alignItems:"center",padding:"7px 16px",borderBottom:`1px solid ${C.border}`,transition:"background .1s"}}
        onMouseEnter={e=>e.currentTarget.style.background=C.s2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{minWidth:0}}>
          <div style={{color:C.hi,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}}>{r.name}</div>
          {r.where&&<div style={{color:C.lo,fontSize:11}}>{r.where}{r.date?` · ${r.date}`:""}</div>}
        </div>
        <span style={{fontSize:11,color:C.mid,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.cat}</span>
        <span style={{fontFamily:"'DM Mono',monospace",color:C.amber,textAlign:"right"}}>{fmt(r.amount)}</span>
        <XBtn onClick={()=>setExtras(p=>p.filter(x=>x.id!==r.id))}/>
      </div>)}
    </div>}
  </Block>;
}

// ── DEUDAS ────────────────────────────────────────────────────────────────────
function DeudasTab(){
  const [debts,setDebts]=useSynced("debts",[]);
  const [name,setName]=useState("");const [total,setTotal]=useState("");const [monthly,setMonthly]=useState("");const [note,setNote]=useState("");

  function add(){
    if(!name.trim()||!total)return;
    setDebts(p=>[...p,{id:uid(),name:name.trim(),total:parseFloat(total)||0,paid:0,monthly:parseFloat(monthly)||0,note:note.trim(),active:true}]);
    setName("");setTotal("");setMonthly("");setNote("");
  }
  function pay(id,amt){setDebts(p=>p.map(d=>d.id===id?{...d,paid:Math.min(d.total,d.paid+amt)}:d));}
  function del(id){setDebts(p=>p.filter(d=>d.id!==id));}
  function tog(id){setDebts(p=>p.map(d=>d.id===id?{...d,active:!d.active}:d));}

  const totalDebt=debts.filter(d=>d.active).reduce((s,d)=>s+(d.total-d.paid),0);
  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"8px 10px",fontFamily:"inherit",outline:"none",width:"100%"};

  return<Block label="Deudas" total={totalDebt} totalColor={C.pink} accent={C.pink}
    footer={<AddBtn label="Agregar deuda / cargo único" onClick={add} color={C.pink}/>}>
    {/* add form */}
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Concepto (ej. Brenda, UVEG, Dentista)" style={inp}/>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
          <input type="number" min="0" value={total} onChange={e=>setTotal(e.target.value)} placeholder="Monto total"
            style={{...inp,paddingLeft:18,textAlign:"right"}}/>
        </div>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
          <input type="number" min="0" value={monthly} onChange={e=>setMonthly(e.target.value)} placeholder="Abono/mes (opt.)"
            style={{...inp,paddingLeft:18,textAlign:"right"}}/>
        </div>
      </div>
      <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Nota (opcional)" style={{...inp,color:C.mid,border:`1px solid ${C.border}`}}/>
    </div>

    {debts.length===0&&<div style={{padding:"12px 16px",color:C.lo,fontStyle:"italic"}}>Sin deudas registradas</div>}
    {debts.map(d=>{
      const remaining=d.total-d.paid;
      const pct=d.total>0?Math.min(100,(d.paid/d.total)*100):0;
      const [payAmt,setPayAmt]=useState("");
      return<div key={d.id} style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,opacity:d.active?1:.4}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Toggle on={d.active} onChange={()=>tog(d.id)}/>
            <span style={{color:C.hi,fontWeight:600,fontSize:13}}>{d.name}</span>
            {d.note&&<span style={{fontSize:11,color:C.lo}}>{d.note}</span>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {d.monthly>0&&<Badge label={`${fmt(d.monthly)}/mes`} color={C.pink}/>}
            <XBtn onClick={()=>del(d.id)}/>
          </div>
        </div>
        <div style={{height:4,background:C.border,borderRadius:99,marginBottom:6}}>
          <div style={{height:"100%",width:`${pct}%`,borderRadius:99,background:remaining<=0?C.green:C.pink,transition:"width .4s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <span style={{fontSize:11,color:C.mid}}>{fmt(d.paid)} pagado · {fmt(remaining)} pendiente ({pct.toFixed(0)}%)</span>
          {remaining>0&&<div style={{display:"flex",gap:6,alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",fontSize:10,color:C.mid,pointerEvents:"none"}}>$</span>
              <input type="number" min="0" value={payAmt} onChange={e=>setPayAmt(e.target.value)} placeholder="0"
                style={{width:80,paddingLeft:14,paddingRight:4,paddingTop:5,paddingBottom:5,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:6,color:C.hi,fontFamily:"'DM Mono',monospace",fontSize:12,textAlign:"right",outline:"none"}}/>
            </div>
            <button onClick={()=>{const a=parseFloat(payAmt);if(a)pay(d.id,a);setPayAmt("");}} style={{background:C.pink+"22",color:C.pink,border:`1px solid ${C.pink}44`,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Abonar</button>
          </div>}
          {remaining<=0&&<Badge label="✓ Pagada" color={C.green}/>}
        </div>
      </div>;
    })}
  </Block>;
}

// ── AHORRO ────────────────────────────────────────────────────────────────────
function AhorroTab({totalIncome}){
  const [goals,setGoals]=useSynced("saving_goals",[]);
  const [name,setName]=useState("");const [target,setTarget]=useState("");const [pct,setPct]=useState("");const [months,setMonths]=useState("");

  function add(){
    if(!name.trim())return;
    setGoals(p=>[...p,{id:uid(),name:name.trim(),target:parseFloat(target)||0,pct:parseFloat(pct)||0,months:parseInt(months)||0,saved:0}]);
    setName("");setTarget("");setPct("");setMonths("");
  }
  function deposit(id,amt){setGoals(p=>p.map(g=>g.id===id?{...g,saved:(g.saved||0)+amt}:g));}
  function del(id){setGoals(p=>p.filter(g=>g.id!==id));}

  const incomeCat=totalIncome/2;
  const totalSaving=goals.reduce((s,g)=>s+Math.max(incomeCat*(g.pct/100),(g.target&&g.months?g.target/g.months/2:0)),0);

  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"8px 10px",fontFamily:"inherit",outline:"none",width:"100%"};

  return<Block label="Objetivos de ahorro" total={totalSaving*2} totalColor={C.teal} accent={C.teal}
    footer={<AddBtn label="Nuevo objetivo" onClick={add} color={C.teal}/>}>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre (ej. Vacaciones, Emergencia)" style={inp}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:90,position:"relative"}}>
          <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
          <input type="number" min="0" value={target} onChange={e=>setTarget(e.target.value)} placeholder="Meta $"
            style={{...inp,paddingLeft:18,textAlign:"right"}}/>
        </div>
        <div style={{flex:1,minWidth:80,position:"relative"}}>
          <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>%</span>
          <input type="number" min="0" max="100" value={pct} onChange={e=>setPct(e.target.value)} placeholder="% ingreso"
            style={{...inp,paddingRight:24,textAlign:"right"}}/>
        </div>
        <div style={{flex:1,minWidth:80}}>
          <input type="number" min="1" value={months} onChange={e=>setMonths(e.target.value)} placeholder="En # meses"
            style={{...inp,textAlign:"right"}}/>
        </div>
      </div>
    </div>
    {goals.length===0&&<div style={{padding:"12px 16px",color:C.lo,fontStyle:"italic"}}>Sin objetivos de ahorro</div>}
    {goals.map(g=>{
      const catAmt=Math.max(incomeCat*(g.pct/100),(g.target&&g.months?g.target/(g.months*2):0));
      const monthlyAmt=catAmt*2;
      const catorcesDone=catAmt>0?Math.round((g.saved||0)/catAmt):0;
      const catorcesNeeded=g.target&&catAmt>0?Math.ceil(g.target/catAmt):0;
      const pct2=g.target>0?Math.min(100,((g.saved||0)/g.target)*100):0;
      const [dep,setDep]=useState("");
      return<div key={g.id} style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{color:C.hi,fontWeight:600}}>{g.name}</span>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Badge label={`${fmt(catAmt)}/cat`} color={C.teal}/>
            <XBtn onClick={()=>del(g.id)}/>
          </div>
        </div>
        {g.target>0&&<>
          <div style={{height:4,background:C.border,borderRadius:99,marginBottom:6}}>
            <div style={{height:"100%",width:`${pct2}%`,borderRadius:99,background:C.teal,transition:"width .4s"}}/>
          </div>
          <div style={{fontSize:11,color:C.mid,marginBottom:8}}>{fmt(g.saved||0)} / {fmt(g.target)} · {pct2.toFixed(0)}% · {catorcesNeeded} catorcenas</div>
        </>}
        {g.pct>0&&<div style={{fontSize:11,color:C.mid,marginBottom:8}}>{g.pct}% de ingresos = {fmt(monthlyAmt)}/mes</div>}
        {g.months>0&&g.target>0&&<div style={{fontSize:11,color:C.teal,marginBottom:8}}>Plan: {fmt(catAmt)}/catorcena × {catorcesNeeded} catorcenas = {fmt(g.target)}</div>}
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{position:"relative",flex:1}}>
            <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
            <input type="number" min="0" value={dep} onChange={e=>setDep(e.target.value)} placeholder="Depositar"
              style={{width:"100%",paddingLeft:18,paddingRight:6,paddingTop:6,paddingBottom:6,background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:6,color:C.hi,fontFamily:"'DM Mono',monospace",fontSize:12,textAlign:"right",outline:"none"}}/>
          </div>
          <button onClick={()=>{const a=parseFloat(dep);if(a)deposit(g.id,a);setDep("");}} style={{background:C.teal+"22",color:C.teal,border:`1px solid ${C.teal}44`,borderRadius:6,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Depositar</button>
        </div>
      </div>;
    })}
  </Block>;
}

// ── TRANSPORTE ────────────────────────────────────────────────────────────────
function TransporteTab(){
  const [cfg,setCfg]=useSynced("camiones_config",{costoBase:11,transbordo:5.50,transbordosDiarios:1,extra:0});
  const [fechas,setFechas]=useSynced("camiones_fechas",{inicio:"",fin:""});
  const [periodo,setPeriodo]=useState("catorcena");
  const periodos={semana:5,catorcena:10,quincena:12,mes:22};

  const diasHabiles=useMemo(()=>{
    if(!fechas.inicio||!fechas.fin)return 0;
    let cur=new Date(fechas.inicio+"T12:00:00"),end=new Date(fechas.fin+"T12:00:00"),n=0;
    while(cur<=end){if(cur.getDay()!==0&&cur.getDay()!==6)n++;cur.setDate(cur.getDate()+1);}
    return n;
  },[fechas]);

  const dias=fechas.inicio&&fechas.fin?diasHabiles:periodos[periodo];
  const costoDia=(cfg.costoBase*2)+(cfg.transbordo*cfg.transbordosDiarios*2);
  const total=dias*costoDia+(cfg.extra||0)*cfg.costoBase;
  const viajes=dias*2+(cfg.transbordosDiarios*dias*2)+(cfg.extra||0);

  const inp={background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.hi,padding:"7px 10px",fontFamily:"'DM Mono',monospace",outline:"none"};

  return<Block label="Calculadora de transporte" accent={C.blue}>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>Config base</div>
      {[{l:"Costo camión",k:"costoBase",step:0.5},{l:"Costo transbordo",k:"transbordo",step:0.5},{l:"Transbordos/día",k:"transbordosDiarios",step:1},{l:"Viajes extra (manual)",k:"extra",step:1}].map(({l,k,step})=><div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{flex:1,fontSize:12,color:C.mid}}>{l}</span>
        <div style={{position:"relative",flexShrink:0}}>
          <span style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
          <input type="number" min="0" step={step} value={cfg[k]} onChange={e=>setCfg(p=>({...p,[k]:parseFloat(e.target.value)||0}))}
            style={{...inp,width:90,paddingLeft:18,textAlign:"right"}}/>
        </div>
      </div>)}
    </div>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontSize:10,color:C.lo,letterSpacing:.8,textTransform:"uppercase",marginBottom:8,fontWeight:600}}>Período</div>
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        {Object.keys(periodos).map(p=><button key={p} onClick={()=>{setPeriodo(p);setFechas({inicio:"",fin:""}); }} style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,background:periodo===p&&!fechas.inicio?C.blue+"22":"transparent",color:periodo===p&&!fechas.inicio?C.blue:C.lo,outline:periodo===p&&!fechas.inicio?`1px solid ${C.blue}44`:"none"}}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>)}
      </div>
      <div style={{fontSize:11,color:C.mid,marginBottom:6}}>O elige fechas (L-V):</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[{l:"Inicio",k:"inicio"},{l:"Fin",k:"fin"}].map(({l,k})=><div key={k} style={{flex:1,minWidth:120}}>
          <div style={{fontSize:10,color:C.lo,marginBottom:4}}>{l}</div>
          <input type="date" value={fechas[k]} onChange={e=>setFechas(p=>({...p,[k]:e.target.value}))} style={{...inp,width:"100%",colorScheme:"dark"}}/>
        </div>)}
      </div>
    </div>
    <div style={{padding:"14px 16px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[{l:"Costo/día",v:fmtD(costoDia),c:C.hi},{l:"Días calculados",v:`${dias} días`,c:C.mid},{l:"Total viajes",v:`${viajes} viajes`,c:C.blue},{l:"Costo total",v:fmtD(total),c:C.accent}].map(s=><div key={s.l} style={{background:C.s2,borderRadius:10,padding:"10px 12px"}}>
          <div style={{fontSize:10,color:C.lo,marginBottom:4}}>{s.l}</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:14,color:s.c}}>{s.v}</div>
        </div>)}
      </div>
      <div style={{marginTop:10,fontSize:11,color:C.lo,background:C.s2,borderRadius:8,padding:"8px 12px"}}>({fmtD(cfg.costoBase)}×2) + ({fmtD(cfg.transbordo)}×{cfg.transbordosDiarios}×2) = {fmtD(costoDia)}/día</div>
    </div>
  </Block>;
}

// ── WISHLIST ──────────────────────────────────────────────────────────────────
function WishlistTab(){
  const [items,setItems]=useSynced("wish_items",[]);
  const [name,setName]=useState("");const [price,setPrice]=useState("");const [prio,setPrio]=useState("media");const [url,setUrl]=useState("");const [cat,setCat]=useState("General");
  const cats=["General","Ropa","Tecnología","Hogar","Salud","Otro"];

  function add(){if(!name.trim())return;setItems(p=>[...p,{id:uid(),name:name.trim(),price:parseFloat(price)||0,prio,url:url.trim(),cat,bought:false}]);setName("");setPrice("");setUrl("");}
  function tog(id){setItems(p=>p.map(r=>r.id===id?{...r,bought:!r.bought}:r));}
  function del(id){setItems(p=>p.filter(r=>r.id!==id));}
  const prioColor=id=>PRIO.find(p=>p.id===id)?.color||C.mid;
  const sorted=[...items].sort((a,b)=>(a.bought===b.bought)?({alta:0,media:1,baja:2}[a.prio]-{alta:0,media:1,baja:2}[b.prio]):(a.bought?1:-1));
  const total=items.filter(r=>!r.bought).reduce((s,r)=>s+r.price,0);
  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,color:C.hi,padding:"8px 10px",fontFamily:"inherit",outline:"none",width:"100%"};

  return<Block label="Wishlist" total={total} totalColor={C.purple} accent={C.purple}>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="¿Qué quieres?" onKeyDown={e=>e.key==="Enter"&&add()} style={inp}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:100}}>
          <span style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
          <input type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Precio est." onKeyDown={e=>e.key==="Enter"&&add()} style={{...inp,paddingLeft:18,textAlign:"right"}}/>
        </div>
        <select value={prio} onChange={e=>setPrio(e.target.value)} style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.mid,padding:"8px 6px",fontFamily:"inherit",outline:"none",flexShrink:0}}>
          {PRIO.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <select value={cat} onChange={e=>setCat(e.target.value)} style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.mid,padding:"8px 6px",fontFamily:"inherit",outline:"none",flexShrink:0}}>
          {cats.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Link (opcional)" style={{...inp,color:C.mid,border:`1px solid ${C.border}`}}/>
      <button onClick={add} style={{background:C.purple,color:C.bg,border:"none",borderRadius:7,padding:"9px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Agregar</button>
    </div>
    {items.length===0&&<div style={{padding:"14px 16px",color:C.lo,fontStyle:"italic"}}>Tu wishlist está vacía</div>}
    <div style={{overflowY:"auto",maxHeight:400}}>
      {sorted.map(r=><div key={r.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 16px",borderBottom:`1px solid ${C.border}`,opacity:r.bought?0.4:1,transition:"opacity .2s,background .1s"}}
        onMouseEnter={e=>e.currentTarget.style.background=C.s2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <button onClick={()=>tog(r.id)} style={{width:18,height:18,borderRadius:4,flexShrink:0,cursor:"pointer",marginTop:2,background:r.bought?C.green:"transparent",border:`1.5px solid ${r.bought?C.green:C.borderHi}`,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
          {r.bought&&<span style={{fontSize:10,color:C.bg,fontWeight:900,lineHeight:1}}>✓</span>}
        </button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:r.bought?C.lo:C.hi,textDecoration:r.bought?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
          <div style={{fontSize:11,color:C.lo}}>{r.cat}{r.url&&<> · <a href={r.url} target="_blank" rel="noopener noreferrer" style={{color:C.blue,textDecoration:"none"}}>↗ link</a></>}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
          {r.price>0&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:r.bought?C.lo:C.purple}}>{fmt(r.price)}</span>}
          <Badge label={PRIO.find(p=>p.id===r.prio)?.label} color={prioColor(r.prio)}/>
        </div>
        <XBtn onClick={()=>del(r.id)}/>
      </div>)}
    </div>
  </Block>;
}

// ── RESUMEN ───────────────────────────────────────────────────────────────────
function ResumenTab({totalIncome,totalFixed,totalExtra,totalSaving,totalDebt,incomes,setIncomes,fixed,setFixed,cats}){
  const updI=(id,f,v)=>setIncomes(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const updF=(id,f,v)=>setFixed(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const bal=totalIncome-totalFixed-totalExtra-totalSaving-totalDebt;
  const selSt={background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,color:C.mid,padding:"5px 6px",fontFamily:"inherit",outline:"none",flexShrink:0,fontSize:12};

  return<div>
    <Block label="Ingresos" total={totalIncome} totalColor={C.green}
      footer={<AddBtn label="Agregar fuente" onClick={()=>setIncomes(p=>[...p,{id:uid(),name:"Nuevo ingreso",amount:0}])}/>}>
      {incomes.map(r=><TR key={r.id}>
        <TxtIn value={r.name} onChange={v=>updI(r.id,"name",v)} placeholder="Fuente"/>
        <MoneyInput value={r.amount} onChange={v=>updI(r.id,"amount",v)}/>
        <XBtn onClick={()=>setIncomes(p=>p.filter(x=>x.id!==r.id))}/>
      </TR>)}
    </Block>

    <Block label="Gastos fijos mensuales" total={totalFixed} totalColor={C.hi}
      footer={<AddBtn label="Agregar gasto fijo" onClick={()=>setFixed(p=>[...p,{id:uid(),name:"Nuevo gasto",cat:cats[0],amount:0,active:true}])}/>}>
      {fixed.map(r=><TR key={r.id} dimmed={!r.active}>
        <Toggle on={r.active} onChange={()=>setFixed(p=>p.map(x=>x.id===r.id?{...x,active:!x.active}:x))}/>
        <TxtIn value={r.name} onChange={v=>updF(r.id,"name",v)} dimmed={!r.active}/>
        <CatSelect value={r.cat} onChange={v=>updF(r.id,"cat",v)} cats={cats}/>
        <MoneyInput value={r.amount} onChange={v=>updF(r.id,"amount",v)} dimmed={!r.active}/>
        <XBtn onClick={()=>setFixed(p=>p.filter(x=>x.id!==r.id))}/>
      </TR>)}
    </Block>

    <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",marginBottom:14}}>
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:C.mid,textTransform:"uppercase"}}>Resumen mensual</span>
      </div>
      {[{l:"Ingresos",v:totalIncome,s:"+",c:C.green},{l:"Gastos fijos",v:totalFixed,s:"−",c:C.hi},{l:"Esporádicos",v:totalExtra,s:"−",c:C.amber},{l:"Ahorro",v:totalSaving,s:"−",c:C.teal},{l:"Deudas",v:totalDebt,s:"−",c:C.pink}].map(({l,v,s,c})=><div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 16px",borderBottom:`1px solid ${C.border}`}}>
        <span style={{color:C.mid,fontSize:13}}>{l}</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontWeight:600,color:c}}>{s} {fmt(v)}</span>
      </div>)}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px"}}>
        <span style={{fontSize:14,fontWeight:700,color:C.hi}}>Balance</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:bal>=0?C.accent:C.red}}>{fmt(bal)}</span>
      </div>
    </div>
  </div>;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState(()=>lsGet("tab","resumen"));
  const [incomes,setIncomes,incSynced]=useSynced("incomes",[{id:1,name:"Sueldo / Nómina",amount:0}]);
  const [fixed,setFixed,fixSynced]=useSynced("fixed",DEFAULT_FIXED);
  const [extras,setExtras,extSynced]=useSynced("extras",[]);
  const [savingGoals]=useSynced("saving_goals",[]);
  const [debts]=useSynced("debts",[]);
  const [cats,setCats]=useSynced("fixed_cats",DEFAULT_CATS);
  const [extraCats,setExtraCats]=useSynced("extra_cats",EXTRA_CATS_DEFAULT);

  const synced=incSynced&&fixSynced&&extSynced;
  useEffect(()=>lsSet("tab",tab),[tab]);

  const totalIncome=useMemo(()=>incomes.reduce((s,r)=>s+r.amount,0),[incomes]);
  const totalFixed=useMemo(()=>fixed.filter(r=>r.active).reduce((s,r)=>s+r.amount,0),[fixed]);
  const totalExtra=useMemo(()=>extras.reduce((s,r)=>s+r.amount,0),[extras]);
  const incomeCat=totalIncome/2;
  const totalSaving=useMemo(()=>savingGoals.reduce((s,g)=>s+Math.max(incomeCat*(g.pct/100),(g.target&&g.months?g.target/g.months:0)),0),[savingGoals,incomeCat]);
  const totalDebt=useMemo(()=>debts.filter(d=>d.active).reduce((s,d)=>s+(d.monthly||0),0),[debts]);

  return<div style={{background:C.bg,minHeight:"100vh",padding:"20px 14px",maxWidth:640,margin:"0 auto",fontFamily:"'Inter',system-ui,sans-serif",color:C.hi}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
      *{box-sizing:border-box;margin:0;} html{-webkit-text-size-adjust:100%;} body{background:#0a0a0a;}
      ::placeholder{color:#383838!important;}
      input:focus,select:focus{border-color:#e8ff47!important;outline:none;}
      input[type=number]::-webkit-inner-spin-button{display:none;}
      input[type=date]{color-scheme:dark;}
      select option{background:#181818;}
      ::-webkit-scrollbar{width:3px;background:#111;} ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:99px;}
      a:hover{opacity:.75;}
    `}</style>

    <div style={{marginBottom:14}}>
      <h1 style={{fontSize:17,fontWeight:700,color:C.hi,letterSpacing:-.3,marginBottom:2}}>Life 2.0</h1>
      <p style={{fontSize:11,color:C.lo}}>{synced?"☁ Sincronizado":"○ Conectando..."}</p>
    </div>

    <Hero income={totalIncome} fixed={totalFixed} extra={totalExtra} saving={totalSaving} debt={totalDebt} synced={synced}/>
    <Tabs active={tab} onChange={setTab}/>

    {tab==="resumen"&&<ResumenTab totalIncome={totalIncome} totalFixed={totalFixed} totalExtra={totalExtra} totalSaving={totalSaving} totalDebt={totalDebt} incomes={incomes} setIncomes={setIncomes} fixed={fixed} setFixed={setFixed} cats={cats}/>}
    {tab==="catorcena"&&<CatorcenaTab fixed={fixed} incomes={incomes} extras={extras} savingGoals={savingGoals} debts={debts} totalIncome={totalIncome}/>}
    {tab==="cuentas"&&<CuentasTab/>}
    {tab==="gastos"&&<GastosTab extras={extras} setExtras={setExtras} cats={extraCats} setCats={setExtraCats}/>}
    {tab==="deudas"&&<DeudasTab/>}
    {tab==="ahorro"&&<AhorroTab totalIncome={totalIncome}/>}
    {tab==="transporte"&&<TransporteTab/>}
    {tab==="wish"&&<WishlistTab/>}
  </div>;
}
