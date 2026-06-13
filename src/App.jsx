import { useState, useMemo, useEffect, useRef } from "react";

// ── Supabase config ────────────────────────────────────────────────────────────
const SB_URL = "https://qswoavwqldksakyzudaq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzd29hdndxbGRrc2FreXp1ZGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDA3NjAsImV4cCI6MjA5Njg3Njc2MH0.DS7j8Mjxwm_O8v6P5g4R0ggmtcXa2KrdfLKpl6zXZyY";

async function sbGet(key) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/budget_data?key=eq.${key}&select=value`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const data = await r.json();
    return data?.[0]?.value ?? null;
  } catch { return null; }
}

async function sbSet(key, value) {
  try {
    await fetch(`${SB_URL}/rest/v1/budget_data`, {
      method: "POST",
      headers: {
        apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
    });
  } catch {}
}

// ── localStorage fallback ──────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg:"#0a0a0a",s1:"#111111",s2:"#181818",
  border:"#252525",borderHi:"#333333",
  hi:"#f0f0f0",mid:"#888888",lo:"#444444",
  accent:"#e8ff47",red:"#ff4545",green:"#3ddc84",
  amber:"#f59e0b",blue:"#60a5fa",purple:"#a78bfa",
};

const FIXED_CATS = [
  {id:"vivienda",     label:"Vivienda",     dot:C.accent},
  {id:"servicios",    label:"Servicios",     dot:C.blue},
  {id:"internet",     label:"Internet/Tel",  dot:C.purple},
  {id:"alimentacion", label:"Alimentación",  dot:"#fb923c"},
  {id:"transporte",   label:"Transporte",    dot:C.green},
  {id:"educacion",    label:"Educación",     dot:"#f472b6"},
  {id:"suscripciones",label:"Suscripciones", dot:"#facc15"},
];

const EXTRA_CATS = [
  {id:"ropa",            label:"Ropa / Calzado"},
  {id:"salidas",         label:"Salidas / Rest."},
  {id:"viajes",          label:"Viajes"},
  {id:"regalos",         label:"Regalos"},
  {id:"hogar",           label:"Hogar"},
  {id:"medico",          label:"Médico"},
  {id:"tecnologia",      label:"Tecnología"},
  {id:"entretenimiento", label:"Entret."},
  {id:"otro",            label:"Otro"},
];

const PRIO = [
  {id:"alta", label:"Alta", color:C.red},
  {id:"media",label:"Media",color:C.amber},
  {id:"baja", label:"Baja", color:C.mid},
];

const INITIAL_FIXED = [
  {id:1, name:"Renta / Hipoteca",    cat:"vivienda",      amount:0,active:true},
  {id:2, name:"Luz",                 cat:"servicios",     amount:0,active:true},
  {id:3, name:"Agua",                cat:"servicios",     amount:0,active:true},
  {id:4, name:"Gas",                 cat:"servicios",     amount:0,active:true},
  {id:5, name:"Internet",            cat:"internet",      amount:0,active:true},
  {id:6, name:"Teléfono",            cat:"internet",      amount:0,active:true},
  {id:7, name:"Despensa",            cat:"alimentacion",  amount:0,active:true},
  {id:8, name:"Gasolina/Transporte", cat:"transporte",    amount:0,active:true},
  {id:9, name:"Educación",           cat:"educacion",     amount:0,active:true},
  {id:10,name:"Suscripciones",       cat:"suscripciones", amount:0,active:true},
];

const INITIAL_INCOMES = [
  {id:1,name:"Sueldo / Nómina",amount:0},
  {id:2,name:"Otro ingreso",   amount:0},
];

let _id=300;
const uid=()=>++_id;
function fmt(n){
  return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n);
}

// ── Sync hook: load from Supabase, save with debounce ─────────────────────────
function useSynced(key, initial) {
  const [value, setValue] = useState(() => lsGet(key, initial));
  const [synced, setSynced] = useState(false);
  const timer = useRef(null);

  // Load from Supabase on mount
  useEffect(() => {
    sbGet(key).then(remote => {
      if (remote !== null) {
        setValue(remote);
        lsSet(key, remote);
      }
      setSynced(true);
    });
  }, [key]);

  // Save to both localStorage and Supabase (debounced 800ms)
  const set = (updater) => {
    setValue(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      lsSet(key, next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => sbSet(key, next), 800);
      return next;
    });
  };

  return [value, set, synced];
}

// ── Micro components ───────────────────────────────────────────────────────────

function Toggle({on,onChange}){
  return(
    <button onClick={onChange} style={{
      width:32,height:18,borderRadius:99,flexShrink:0,
      background:on?C.accent:C.border,border:"none",cursor:"pointer",position:"relative",
      transition:"background .15s",
    }}>
      <span style={{position:"absolute",top:3,left:on?15:3,width:12,height:12,borderRadius:"50%",
        background:on?C.bg:C.lo,transition:"left .15s",display:"block"}}/>
    </button>
  );
}

function MoneyInput({value,onChange,dimmed}){
  return(
    <div style={{position:"relative",display:"flex",alignItems:"center",flexShrink:0}}>
      <span style={{position:"absolute",left:8,fontSize:11,color:dimmed?C.lo:C.mid,pointerEvents:"none"}}>$</span>
      <input type="number" min="0" value={value||""} placeholder="0"
        onChange={e=>onChange(parseFloat(e.target.value)||0)} disabled={dimmed}
        style={{width:100,paddingLeft:18,paddingRight:6,paddingTop:7,paddingBottom:7,
          background:dimmed?"transparent":C.s2,
          border:`1px solid ${dimmed?C.border:C.borderHi}`,
          borderRadius:7,color:dimmed?C.lo:C.hi,
          fontFamily:"'DM Mono',monospace",fontWeight:500,
          textAlign:"right",outline:"none",transition:"border .15s"}}
      />
    </div>
  );
}

function TextInput({value,onChange,placeholder,dimmed}){
  return(
    <input value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder||""} disabled={dimmed}
      style={{flex:1,background:"transparent",border:"none",
        borderBottom:`1px solid ${dimmed?"transparent":C.border}`,
        color:dimmed?C.lo:C.hi,padding:"3px 0",
        outline:"none",fontFamily:"inherit",minWidth:0,transition:"color .15s"}}
    />
  );
}

function XBtn({onClick}){
  return(
    <button onClick={onClick} style={{
      background:"none",border:"none",color:C.lo,cursor:"pointer",
      fontSize:18,lineHeight:1,padding:"0 2px",flexShrink:0,transition:"color .15s",minWidth:24,
    }}
      onMouseEnter={e=>e.currentTarget.style.color=C.red}
      onMouseLeave={e=>e.currentTarget.style.color=C.lo}
    >×</button>
  );
}

function Block({label,total,totalColor,children,footer}){
  return(
    <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:14,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"11px 16px",borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:C.mid,textTransform:"uppercase"}}>{label}</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:totalColor||C.hi}}>{fmt(total)}</span>
      </div>
      {children}
      {footer&&<div style={{borderTop:`1px solid ${C.border}`}}>{footer}</div>}
    </div>
  );
}

function TR({children,dimmed}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",
      borderBottom:`1px solid ${C.border}`,opacity:dimmed?0.3:1,transition:"opacity .2s",flexWrap:"wrap"}}
    >{children}</div>
  );
}

function AddBtn({label,onClick}){
  return(
    <button onClick={onClick} style={{
      display:"flex",alignItems:"center",gap:7,width:"100%",
      background:"none",border:"none",padding:"10px 16px",
      color:C.lo,cursor:"pointer",fontFamily:"inherit",transition:"color .15s",
    }}
      onMouseEnter={e=>e.currentTarget.style.color=C.accent}
      onMouseLeave={e=>e.currentTarget.style.color=C.lo}
    >
      <span style={{fontSize:16,lineHeight:1}}>+</span>{label}
    </button>
  );
}

// ── Quick-add extras ───────────────────────────────────────────────────────────

function QuickAdd({onAdd}){
  const [name,setName]=useState("");
  const [cat,setCat]=useState("otro");
  const [amount,setAmount]=useState("");

  function commit(){
    const a=parseFloat(amount);
    if(!name.trim()||!a) return;
    onAdd({name:name.trim(),cat,amount:a});
    setName("");setAmount("");
  }

  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,
    color:C.hi,padding:"9px 10px",fontFamily:"inherit",outline:"none",width:"100%"};

  return(
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",gap:8}}>
      <input value={name} onChange={e=>setName(e.target.value)}
        placeholder="¿Qué fue?" onKeyDown={e=>e.key==="Enter"&&commit()} style={inp}/>
      <div style={{display:"flex",gap:8}}>
        <select value={cat} onChange={e=>setCat(e.target.value)}
          style={{flex:1,background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,
            color:C.mid,padding:"8px 6px",fontFamily:"inherit",outline:"none"}}>
          {EXTRA_CATS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <div style={{position:"relative",display:"flex",alignItems:"center",flexShrink:0}}>
          <span style={{position:"absolute",left:8,fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
          <input type="number" min="0" value={amount} placeholder="0"
            onChange={e=>setAmount(e.target.value)} onKeyDown={e=>e.key==="Enter"&&commit()}
            style={{width:100,paddingLeft:18,paddingRight:6,paddingTop:8,paddingBottom:8,
              background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,
              color:C.hi,fontFamily:"'DM Mono',monospace",fontWeight:500,
              textAlign:"right",outline:"none"}}
          />
        </div>
        <button onClick={commit} style={{
          background:C.accent,color:C.bg,border:"none",borderRadius:7,
          padding:"8px 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0,
        }}>Agregar</button>
      </div>
    </div>
  );
}

function ExtrasTable({extras,onDel}){
  if(!extras.length) return(
    <div style={{padding:"12px 16px",color:C.lo,fontStyle:"italic"}}>Sin gastos este mes</div>
  );
  return(
    <div style={{overflowY:"auto",maxHeight:240}}>
      {extras.map(r=>(
        <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,
          padding:"8px 16px",borderBottom:`1px solid ${C.border}`,transition:"background .1s"}}
          onMouseEnter={e=>e.currentTarget.style.background=C.s2}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
        >
          <span style={{flex:1,color:C.hi,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</span>
          <span style={{color:C.mid,flexShrink:0,fontSize:11}}>{EXTRA_CATS.find(c=>c.id===r.cat)?.label||r.cat}</span>
          <span style={{fontFamily:"'DM Mono',monospace",color:C.amber,flexShrink:0,textAlign:"right",minWidth:70}}>{fmt(r.amount)}</span>
          <XBtn onClick={()=>onDel(r.id)}/>
        </div>
      ))}
    </div>
  );
}

// ── Wishlist ───────────────────────────────────────────────────────────────────

function WishList(){
  const [items,setItems]=useSynced("wish_items",[]);
  const [name,setName]=useState("");
  const [price,setPrice]=useState("");
  const [prio,setPrio]=useState("media");
  const [url,setUrl]=useState("");

  function add(){
    if(!name.trim()) return;
    setItems(p=>[...p,{id:uid(),name:name.trim(),price:parseFloat(price)||0,prio,url:url.trim(),bought:false}]);
    setName("");setPrice("");setUrl("");setPrio("media");
  }
  function toggle(id){setItems(p=>p.map(r=>r.id===id?{...r,bought:!r.bought}:r));}
  function del(id){setItems(p=>p.filter(r=>r.id!==id));}

  const prioColor=id=>PRIO.find(p=>p.id===id)?.color||C.mid;
  const sorted=[...items].sort((a,b)=>{
    const o={alta:0,media:1,baja:2};
    return(a.bought===b.bought)?(o[a.prio]-o[b.prio]):(a.bought?1:-1);
  });
  const total=items.filter(r=>!r.bought).reduce((s,r)=>s+r.price,0);
  const inp={background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,
    color:C.hi,padding:"9px 10px",fontFamily:"inherit",outline:"none",width:"100%"};

  return(
    <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"11px 16px",borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:C.mid,textTransform:"uppercase"}}>Wishlist</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:C.purple}}>{fmt(total)}</span>
      </div>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8}}>
        <input value={name} onChange={e=>setName(e.target.value)}
          placeholder="¿Qué quieres?" onKeyDown={e=>e.key==="Enter"&&add()} style={inp}/>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <div style={{position:"relative",display:"flex",alignItems:"center",flex:1,minWidth:100}}>
            <span style={{position:"absolute",left:8,fontSize:11,color:C.mid,pointerEvents:"none"}}>$</span>
            <input type="number" min="0" value={price} placeholder="Precio est."
              onChange={e=>setPrice(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}
              style={{width:"100%",paddingLeft:18,paddingRight:6,paddingTop:8,paddingBottom:8,
                background:C.s2,border:`1px solid ${C.borderHi}`,borderRadius:7,
                color:C.hi,fontFamily:"'DM Mono',monospace",fontWeight:500,
                textAlign:"right",outline:"none"}}
            />
          </div>
          <select value={prio} onChange={e=>setPrio(e.target.value)}
            style={{background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,
              color:C.mid,padding:"8px 6px",fontFamily:"inherit",outline:"none",flexShrink:0}}>
            {PRIO.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        <input value={url} onChange={e=>setUrl(e.target.value)}
          placeholder="Link (opcional)" onKeyDown={e=>e.key==="Enter"&&add()}
          style={{...inp,border:`1px solid ${C.border}`,color:C.mid}}/>
        <button onClick={add} style={{
          background:C.purple,color:C.bg,border:"none",borderRadius:7,
          padding:"9px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",
        }}>Agregar</button>
      </div>
      {items.length===0&&<div style={{padding:"14px 16px",color:C.lo,fontStyle:"italic"}}>Tu wishlist está vacía</div>}
      {sorted.length>0&&(
        <div style={{overflowY:"auto",maxHeight:320}}>
          {sorted.map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 16px",
              borderBottom:`1px solid ${C.border}`,opacity:r.bought?0.4:1,transition:"opacity .2s,background .1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.s2}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            >
              <button onClick={()=>toggle(r.id)} style={{
                width:18,height:18,borderRadius:4,flexShrink:0,cursor:"pointer",marginTop:2,
                background:r.bought?C.green:"transparent",
                border:`1.5px solid ${r.bought?C.green:C.borderHi}`,
                display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",
              }}>
                {r.bought&&<span style={{fontSize:10,color:C.bg,fontWeight:900,lineHeight:1}}>✓</span>}
              </button>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:r.bought?C.lo:C.hi,textDecoration:r.bought?"line-through":"none",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                {r.url&&(
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    style={{fontSize:11,color:C.blue,textDecoration:"none",display:"block",
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>↗ ver link</a>
                )}
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                {r.price>0&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:r.bought?C.lo:C.purple}}>{fmt(r.price)}</span>}
                <span style={{fontSize:10,fontWeight:700,color:prioColor(r.prio),
                  background:prioColor(r.prio)+"18",borderRadius:5,padding:"2px 6px",letterSpacing:.3}}>
                  {PRIO.find(p=>p.id===r.prio)?.label}
                </span>
              </div>
              <XBtn onClick={()=>del(r.id)}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────────

function Hero({income,fixed,extra,synced}){
  const out=fixed+extra,bal=income-out;
  const pct=income>0?Math.min(100,(out/income)*100):0;
  const barColor=pct>90?C.red:pct>70?C.amber:C.accent;
  const ok=bal>=0;
  return(
    <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,
      padding:"20px 16px 18px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{fontSize:10,letterSpacing:1.5,color:C.mid,textTransform:"uppercase",fontWeight:600}}>
          Balance mensual
        </div>
        <div style={{fontSize:10,color:synced?C.green:C.lo,letterSpacing:.5}}>
          {synced?"● sincronizado":"○ cargando..."}
        </div>
      </div>
      <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:34,
        letterSpacing:-1,marginBottom:16,color:ok?C.accent:C.red,lineHeight:1}}>
        {fmt(bal)}
      </div>
      <div style={{height:2,background:C.border,borderRadius:99,marginBottom:16}}>
        <div style={{height:"100%",width:`${pct}%`,borderRadius:99,
          background:barColor,transition:"width .4s ease,background .3s"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[
          {label:"Ingresos",    value:income, color:C.green},
          {label:"Fijos",       value:fixed,  color:C.hi},
          {label:"Esporádicos", value:extra,  color:C.amber},
        ].map(s=>(
          <div key={s.label} style={{borderLeft:`2px solid ${C.border}`,paddingLeft:10}}>
            <div style={{fontSize:10,color:C.mid,marginBottom:3,letterSpacing:.5}}>{s.label}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:12,color:s.color}}>{fmt(s.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tabs({active,onChange}){
  const tabs=[{id:"budget",label:"Presupuesto"},{id:"wish",label:"Wishlist"}];
  return(
    <div style={{display:"flex",gap:4,marginBottom:14,background:C.s1,
      border:`1px solid ${C.border}`,borderRadius:10,padding:4}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onChange(t.id)} style={{
          flex:1,padding:"9px 0",border:"none",borderRadius:7,cursor:"pointer",
          fontFamily:"inherit",fontWeight:600,transition:"all .15s",
          background:active===t.id?C.s2:"transparent",
          color:active===t.id?C.hi:C.lo,
          boxShadow:active===t.id?`0 0 0 1px ${C.border}`:"none",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function App(){
  const [tab,setTab]=useState(()=>lsGet("tab","budget"));
  const [incomes,setIncomes,incomesSynced]=useSynced("incomes",INITIAL_INCOMES);
  const [fixed,setFixed,fixedSynced]=useSynced("fixed",INITIAL_FIXED);
  const [extras,setExtras,extrasSynced]=useSynced("extras",[]);

  const synced = incomesSynced && fixedSynced && extrasSynced;

  useEffect(()=>lsSet("tab",tab),[tab]);

  const totalIncome=useMemo(()=>incomes.reduce((s,r)=>s+r.amount,0),[incomes]);
  const totalFixed=useMemo(()=>fixed.filter(r=>r.active).reduce((s,r)=>s+r.amount,0),[fixed]);
  const totalExtra=useMemo(()=>extras.reduce((s,r)=>s+r.amount,0),[extras]);

  const updI=(id,f,v)=>setIncomes(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));
  const updF=(id,f,v)=>setFixed(p=>p.map(r=>r.id===id?{...r,[f]:v}:r));

  const selStyle={background:C.s2,border:`1px solid ${C.border}`,borderRadius:7,
    color:C.mid,padding:"6px 6px",fontFamily:"inherit",outline:"none",flexShrink:0};

  return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"20px 14px",
      maxWidth:640,margin:"0 auto",fontFamily:"'Inter',system-ui,sans-serif",color:C.hi}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@500;600&display=swap');
        *{box-sizing:border-box;margin:0;}
        html{-webkit-text-size-adjust:100%;}
        body{background:#0a0a0a;}
        ::placeholder{color:#383838!important;}
        input:focus,select:focus{border-color:#e8ff47!important;outline:none;}
        input[type=number]::-webkit-inner-spin-button{display:none;}
        select option{background:#181818;}
        ::-webkit-scrollbar{width:3px;background:#111;}
        ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:99px;}
        a:hover{opacity:.75;}
      `}</style>

      <div style={{marginBottom:16}}>
        <h1 style={{fontSize:17,fontWeight:700,color:C.hi,letterSpacing:-.3,marginBottom:3}}>Control de gastos</h1>
        <p style={{fontSize:11,color:C.lo}}>Desactiva un gasto para excluirlo del balance</p>
      </div>

      <Hero income={totalIncome} fixed={totalFixed} extra={totalExtra} synced={synced}/>
      <Tabs active={tab} onChange={setTab}/>

      {tab==="budget"&&(
        <>
          <Block label="Ingresos" total={totalIncome} totalColor={C.green}
            footer={<AddBtn label="Agregar fuente" onClick={()=>setIncomes(p=>[...p,{id:uid(),name:"Nuevo ingreso",amount:0}])}/>}
          >
            {incomes.map(r=>(
              <TR key={r.id}>
                <TextInput value={r.name} onChange={v=>updI(r.id,"name",v)} placeholder="Fuente"/>
                <MoneyInput value={r.amount} onChange={v=>updI(r.id,"amount",v)}/>
                <XBtn onClick={()=>setIncomes(p=>p.filter(x=>x.id!==r.id))}/>
              </TR>
            ))}
          </Block>

          <Block label="Gastos fijos" total={totalFixed} totalColor={C.hi}
            footer={<AddBtn label="Agregar gasto fijo" onClick={()=>setFixed(p=>[...p,{id:uid(),name:"Nuevo gasto",cat:"vivienda",amount:0,active:true}])}/>}
          >
            {fixed.map(r=>(
              <TR key={r.id} dimmed={!r.active}>
                <Toggle on={r.active} onChange={()=>setFixed(p=>p.map(x=>x.id===r.id?{...x,active:!x.active}:x))}/>
                <span style={{width:7,height:7,borderRadius:"50%",flexShrink:0,
                  background:r.active?FIXED_CATS.find(c=>c.id===r.cat)?.dot||C.mid:C.lo,
                  transition:"background .2s"}}/>
                <TextInput value={r.name} onChange={v=>updF(r.id,"name",v)} dimmed={!r.active}/>
                <select value={r.cat} onChange={e=>updF(r.id,"cat",e.target.value)}
                  disabled={!r.active} style={selStyle}>
                  {FIXED_CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <MoneyInput value={r.amount} onChange={v=>updF(r.id,"amount",v)} dimmed={!r.active}/>
                <XBtn onClick={()=>setFixed(p=>p.filter(x=>x.id!==r.id))}/>
              </TR>
            ))}
          </Block>

          <Block label="Gastos esporádicos" total={totalExtra} totalColor={C.amber}>
            <QuickAdd onAdd={item=>setExtras(p=>[...p,{id:uid(),...item}])}/>
            <ExtrasTable extras={extras} onDel={id=>setExtras(p=>p.filter(r=>r.id!==id))}/>
          </Block>

          <div style={{background:C.s1,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",marginBottom:14}}>
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:C.mid,textTransform:"uppercase"}}>Resumen</span>
            </div>
            {[
              {label:"Total ingresos", v:totalIncome, sign:"+",color:C.green},
              {label:"Gastos fijos",   v:totalFixed,  sign:"−",color:C.hi},
              {label:"Esporádicos",    v:totalExtra,  sign:"−",color:C.amber},
            ].map(({label,v,sign,color})=>(
              <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"9px 16px",borderBottom:`1px solid ${C.border}`}}>
                <span style={{color:C.mid}}>{label}</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontWeight:600,color}}>{sign} {fmt(v)}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px"}}>
              <span style={{fontSize:14,fontWeight:700,color:C.hi}}>Balance</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,
                color:totalIncome-totalFixed-totalExtra>=0?C.accent:C.red}}>
                {fmt(totalIncome-totalFixed-totalExtra)}
              </span>
            </div>
          </div>
        </>
      )}

      {tab==="wish"&&<WishList/>}

      <p style={{textAlign:"center",fontSize:10,color:C.lo,marginTop:16}}>
        {synced ? "☁ Sincronizado con la nube" : "○ Conectando..."}
      </p>
    </div>
  );
}
