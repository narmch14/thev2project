import { useState, useEffect, useRef } from "react";
import { LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const SUPA_URL = "https://whumlhvssvkjzvdafumc.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodW1saHZzc3Zranp2ZGFmdW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MDE0NzYsImV4cCI6MjA5NDk3NzQ3Nn0.vIIr2V77kW2iKEvtQKF0Gs6aaUa805IpOVclx9Bi5RU";

const C = {
  bg:"#08090D", card:"#10121A", card2:"#161923", border:"#1E2235",
  accent:"#6EE7B7", accent2:"#818CF8", accent3:"#F472B6", accent4:"#FB923C",
  warn:"#FCD34D", text:"#F1F5F9", muted:"#64748B", muted2:"#94A3B8",
};

const tip = { background:"#161923", border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", fontSize:12, color:C.text };

const METRIC_INFO = {
  hrv: { label:"HRV", unit:"ms", icon:"❤️", what:"Heart Rate Variability — variación entre latidos. Más alto = mejor recuperación.", source:"Garmin, Apple Watch, Oura, Whoop, o app Welltory (gratis)" },
  sleep_hours: { label:"Horas de sueño", unit:"h", icon:"😴", what:"Promedio de horas dormidas por noche esta semana.", source:"Garmin, Apple Watch, Oura, o registra manualmente" },
  rhr: { label:"RHR", unit:"bpm", icon:"💓", what:"Resting Heart Rate — frecuencia cardíaca en reposo. Más bajo = mejor condición cardiovascular.", source:"Garmin, Apple Watch, Fitbit, o tómalo manualmente por la mañana" },
  body_battery: { label:"Body Battery", unit:"%", icon:"🔋", what:"Nivel de energía calculado por Garmin (0-100). Si no tienes Garmin, usa tu nivel de energía subjetivo (1-10) × 10.", source:"Exclusivo Garmin. Alternativa: multiplica tu energía subjetiva × 10" },
  readiness: { label:"Readiness", unit:"%", icon:"✅", what:"Qué tan listo estás para entrenar hoy. Score compuesto de sueño + HRV + RHR.", source:"Garmin, Oura, Whoop. Alternativa: calcula (HRV/80×50 + Sleep/9×50)" },
  stress: { label:"Estrés", unit:"/10", icon:"🧘", what:"Nivel de estrés percibido durante la semana. 1 = muy tranquilo, 10 = muy estresado.", source:"Subjetivo — tú mismo lo evalúas" },
  vo2_max: { label:"VO2 Max", unit:"ml/kg/min", icon:"🫁", what:"Capacidad máxima de oxígeno. Indica tu condición aeróbica. Promedio hombre 30s: 40-45.", source:"Garmin, Apple Watch (modo entrenamiento), Polar. Mejora corriendo en Zona 2" },
  zone2_pace: { label:"Pace Zona 2", unit:"min/km", icon:"⏱️", what:"Ritmo al que corres en Zona 2 (60-70% FC máx). Al mejorar tu condición, este pace baja.", source:"Garmin Connect, Strava, Apple Watch. Corre sintiendo que puedes hablar cómodamente" },
  weekly_km: { label:"Kilómetros semanales", unit:"km", icon:"🛣️", what:"Total de kilómetros corridos esta semana.", source:"Garmin, Strava, Apple Watch, o registra manualmente" },
  bench_press: { label:"Press Banca", unit:"kg", icon:"🏋️", what:"Peso máximo levantado en press de banca esta semana.", source:"Everfit, tu app de gym, o registro manual" },
  squat: { label:"Sentadilla", unit:"kg", icon:"🦵", what:"Peso máximo en sentadilla esta semana.", source:"Everfit o registro manual" },
  deadlift: { label:"Peso Muerto / RDL", unit:"kg", icon:"⛓️", what:"Peso máximo en peso muerto o RDL esta semana.", source:"Everfit o registro manual" },
  military_press: { label:"Press Militar", unit:"kg", icon:"💪", what:"Peso máximo en press militar (overhead press) esta semana.", source:"Everfit o registro manual" },
  pullups: { label:"Dominadas", unit:"reps", icon:"🔝", what:"Máximo de dominadas consecutivas en una serie esta semana.", source:"Registro manual" },
  workouts_completed: { label:"Entrenamientos", unit:"esta semana", icon:"📅", what:"Número de sesiones de entrenamiento completadas esta semana.", source:"Everfit, tu app de gym, o registro manual" },
  weight: { label:"Peso", unit:"kg", icon:"⚖️", what:"Peso corporal en ayunas, por la mañana.", source:"Báscula cualquiera. Idealmente siempre a la misma hora" },
  body_fat: { label:"Grasa corporal", unit:"%", icon:"📊", what:"Porcentaje de grasa corporal. No obsesionarse con la precisión — lo importante es la tendencia.", source:"Báscula Omron, InBody, o estimación visual" },
  muscle_mass: { label:"Masa muscular", unit:"kg", icon:"💪", what:"Kilogramos de músculo. Subir músculo mientras bajas grasa = recomposición corporal.", source:"Báscula Omron, InBody" },
  adherence: { label:"Apego al plan", unit:"%", icon:"🎯", what:"Qué porcentaje de tu plan semanal cumpliste. Incluye entrenamientos, nutrición y hábitos.", source:"Evaluación subjetiva tuya" },
  energy: { label:"Energía", unit:"/10", icon:"⚡", what:"Nivel de energía general durante la semana. 1 = agotado, 10 = al máximo.", source:"Evaluación subjetiva" },
  cigarettes: { label:"Cigarrillos", unit:"esta semana", icon:"🚭", what:"Número total de cigarrillos fumados esta semana. Objetivo = 0.", source:"Registro manual" },
};

async function supaFetch(path, opts={}) {
  const token = localStorage.getItem("v2_token");
  const headers = {
    "apikey": SUPA_KEY, "Content-Type": "application/json",
    "Authorization": `Bearer ${token || SUPA_KEY}`,
    ...(opts.headers||{})
  };
  const r = await fetch(`${SUPA_URL}${path}`, { ...opts, headers });
  if (!r.ok) { let e={}; try{e=await r.json()}catch(_){} throw new Error(e.message||e.error_description||`Error ${r.status}`); }
  const text = await r.text();
  return text ? JSON.parse(text) : {};
}

const RANKS = ["Rookie","Operator","Warrior","Hybrid Elite","Savage","Apex"];
const RANK_COLORS = ["#94A3B8","#60A5FA","#A78BFA","#34D399","#F97316","#EC4899"];
const XP_LEVELS = [0,500,1500,3000,5000,8000,12000];
const MOTIVATIONAL = ["LOCKED IN 🔒","MOMENTUM BUILDING 📈","DISCIPLINE > MOTIVATION","RECOVERY IMPROVING 💚","V2 IN PROGRESS ⚡"];
const TABS = ["Dashboard","Recovery","Performance","Body","Strength","Check-In","Reporte"];

function calcXP(metrics) {
  return metrics.reduce((acc,m) => {
    let xp = 50;
    if ((m.workouts_completed||0) >= 4) xp += 250; else if ((m.workouts_completed||0) >= 3) xp += 150;
    if ((m.adherence||0) >= 90) xp += 150; else if ((m.adherence||0) >= 75) xp += 75;
    if ((m.cigarettes||0) === 0) xp += 100;
    if ((m.sleep_hours||0) >= 7.5) xp += 75;
    return acc + xp;
  }, 0);
}
function rankFromXP(xp) { for(let i=XP_LEVELS.length-1;i>=0;i--) if(xp>=XP_LEVELS[i]) return Math.min(i,RANKS.length-1); return 0; }
function calcScore(m) {
  if(!m) return 0;
  const rec = Math.min(25,((m.hrv||50)-40)/40*25) + Math.min(25,((m.sleep_hours||6)-5)/4*25);
  const perf = Math.min(25,((m.vo2_max||40)-38)/12*25) + Math.min(25,(m.adherence||0)/100*25);
  const body = Math.min(25,((90-(m.weight||85))/10)*25) + Math.min(25,((25-(m.body_fat||20))/10)*25);
  const cons = Math.min(50,(m.adherence||0)/100*50);
  return Math.min(100,Math.round((rec+perf+body+cons)/4));
}
function parsePace(v) {
  if(String(v).includes(":")) { const [min,sec]=String(v).split(":"); return Number(min)+Number(sec)/60; }
  return Number(v);
}
function fmtPace(v) {
  if(!v) return "—";
  const min = Math.floor(v); const sec = Math.round((v-min)*60);
  return `${min}:${sec.toString().padStart(2,"0")}`;
}
function delta(last,first,key,invert=false) {
  if(!last||!first||last[key]==null||first[key]==null) return null;
  const d = +(last[key]-first[key]).toFixed(1);
  return invert ? -d : d;
}

// ── TOOLTIP ───────────────────────────────────────────────────────────────────
function InfoTooltip({ metricKey }) {
  const [open, setOpen] = useState(false);
  const info = METRIC_INFO[metricKey];
  if(!info) return null;
  return (
    <span style={{ position:"relative", display:"inline-block", marginLeft:6 }}>
      <span onClick={()=>setOpen(o=>!o)} style={{ cursor:"pointer", fontSize:11, color:C.muted2, border:`1px solid ${C.border}`, borderRadius:"50%", width:16, height:16, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>?</span>
      {open && (
        <div style={{ position:"absolute", left:0, top:20, zIndex:100, background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", width:220, boxShadow:"0 8px 24px #00000080" }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text, marginBottom:4 }}>{info.label}</div>
          <div style={{ fontSize:11, color:C.muted2, lineHeight:1.5, marginBottom:6 }}>{info.what}</div>
          <div style={{ fontSize:10, color:C.accent, lineHeight:1.4 }}>📱 {info.source}</div>
          <div onClick={()=>setOpen(false)} style={{ marginTop:8, fontSize:10, color:C.muted, cursor:"pointer", textAlign:"right" }}>cerrar ✕</div>
        </div>
      )}
    </span>
  );
}

// ── RING ──────────────────────────────────────────────────────────────────────
const Ring = ({ value, max, color, size=72, stroke=7, label, sub }) => {
  const r=(size-stroke*2)/2, circ=2*Math.PI*r, pct=Math.min(1,(value||0)/max);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{ position:"relative", width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E2235" strokeWidth={stroke}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"/>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:size>70?13:11, fontWeight:700, color:C.text }}>{label}</span>
        </div>
      </div>
      {sub && <span style={{ fontSize:10, color:C.muted, textAlign:"center" }}>{sub}</span>}
    </div>
  );
};

// ── KCARD ─────────────────────────────────────────────────────────────────────
const KCard = ({ label, value, unit, change, icon, metricKey }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
      <span style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1, display:"flex", alignItems:"center" }}>
        {label}{metricKey && <InfoTooltip metricKey={metricKey}/>}
      </span>
      <span style={{ fontSize:14 }}>{icon}</span>
    </div>
    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
      <span style={{ fontSize:22, fontWeight:700, color:C.text }}>{value ?? "—"}</span>
      {unit && <span style={{ fontSize:11, color:C.muted }}>{unit}</span>}
    </div>
    {change !== undefined && change !== null && (
      <span style={{ fontSize:10, color: change >= 0 ? C.accent : "#F87171" }}>
        {change >= 0 ? "▲" : "▼"} {Math.abs(change)}{unit} vs inicio
      </span>
    )}
  </div>
);

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState("");
  const inp = { width:"100%", background:"#161923", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14, boxSizing:"border-box", marginTop:4, outline:"none" };
  async function handle() {
    setLoading(true); setMsg("");
    try {
      if(mode==="register") {
        const d = await supaFetch("/auth/v1/signup",{method:"POST",body:JSON.stringify({email,password})});
        if(d.user) { localStorage.setItem("v2_token",d.access_token); await supaFetch("/rest/v1/profiles",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({id:d.user.id,full_name:name})}); onAuth(d.user,d.access_token); }
        else setMsg("Revisa tu email para confirmar tu cuenta.");
      } else {
        const d = await supaFetch("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})});
        localStorage.setItem("v2_token",d.access_token); onAuth(d.user,d.access_token);
      }
    } catch(e) { setMsg(e.message); }
    setLoading(false);
  }
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:380 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:28, fontWeight:900, background:`linear-gradient(135deg,${C.accent},${C.accent2})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:2 }}>THE V2 PROJECT</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:4, letterSpacing:1 }}>BECOME YOUR BEST VERSION</div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:28 }}>
          <div style={{ display:"flex", background:"#161923", borderRadius:10, padding:4, marginBottom:24 }}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"8px", borderRadius:8, border:"none", background:mode===m?C.accent2:"transparent", color:mode===m?"#fff":C.muted, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {m==="login"?"Iniciar sesión":"Registrarse"}
              </button>
            ))}
          </div>
          {mode==="register"&&<div style={{ marginBottom:14 }}><label style={{ fontSize:11,color:C.muted }}>Nombre completo</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={inp}/></div>}
          <div style={{ marginBottom:14 }}><label style={{ fontSize:11,color:C.muted }}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" style={inp}/></div>
          <div style={{ marginBottom:20 }}><label style={{ fontSize:11,color:C.muted }}>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={inp}/></div>
          {msg&&<div style={{ fontSize:12,color:msg.includes("email")?C.accent:"#F87171",marginBottom:12,textAlign:"center" }}>{msg}</div>}
          <button onClick={handle} disabled={loading} style={{ width:"100%", background:`linear-gradient(135deg,${C.accent},${C.accent2})`, border:"none", borderRadius:10, padding:"13px", color:"#08090D", fontSize:14, fontWeight:800, cursor:"pointer", opacity:loading?0.7:1 }}>
            {loading?"...":mode==="login"?"Entrar →":"Crear cuenta →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CHECK-IN ──────────────────────────────────────────────────────────────────
function CheckIn({ userId, onSaved }) {
  const [step, setStep] = useState(0); const [saving, setSaving] = useState(false); const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    week_label:"", weight:"", body_fat:"", muscle_mass:"",
    hrv:"", sleep_hours:"", rhr:"", body_battery:"", readiness:"", stress:"",
    vo2_max:"", zone2_pace:"", weekly_km:"",
    bench_press:"", squat:"", deadlift:"", military_press:"", pullups:"", workouts_completed:"",
    adherence:"", energy:"", cigarettes:"",
    custom1_label:"", custom1_value:"", custom2_label:"", custom2_value:""
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = { width:"100%", background:"#161923", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, marginTop:4, boxSizing:"border-box" };

  const row = (key, placeholder) => {
    const info = METRIC_INFO[key];
    return (
      <div style={{ marginBottom:12 }} key={key}>
        <label style={{ fontSize:11, color:C.muted, display:"flex", alignItems:"center" }}>
          {info?.icon} {info?.label || key} {info?.unit ? `(${info.unit})` : ""}
          {info && <InfoTooltip metricKey={key}/>}
        </label>
        <input value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={placeholder} style={inp}/>
      </div>
    );
  };

  const steps = [
    { title:"⚖️ Físico", content:<>{row("weight","85.0")}{row("body_fat","20.0")}{row("muscle_mass","67.0")}</> },
    { title:"❤️ Recuperación", content:<>{row("hrv","65")}{row("sleep_hours","7.5")}{row("rhr","62")}{row("body_battery","80")}{row("readiness","75")}{row("stress","4")}</> },
    { title:"🏃 Running", content:<>{row("vo2_max","44.0")}{row("zone2_pace","6:00")}{row("weekly_km","30")}</> },
    { title:"💪 Fuerza", content:<>{row("bench_press","90")}{row("squat","115")}{row("deadlift","125")}{row("military_press","70")}{row("pullups","8")}{row("workouts_completed","5")}</> },
    { title:"🎯 Hábitos", content:<>
      {row("adherence","90")}{row("energy","8")}{row("cigarettes","0")}
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, color:C.muted }}>Etiqueta de semana</label>
        <input value={form.week_label} onChange={e=>set("week_label",e.target.value)} placeholder="Wk 9" style={inp}/>
      </div>
    </> },
    { title:"⭐ KPIs personalizados", content:<>
      <div style={{ fontSize:12, color:C.muted2, marginBottom:12, lineHeight:1.5 }}>Define hasta 2 métricas propias. Ejemplos: vasos de agua/día, calorías, pasos, meditación, etc.</div>
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, color:C.muted }}>KPI 1 — Nombre</label>
        <input value={form.custom1_label} onChange={e=>set("custom1_label",e.target.value)} placeholder="Vasos de agua / día" style={inp}/>
        <input value={form.custom1_value} onChange={e=>set("custom1_value",e.target.value)} placeholder="8" style={{ ...inp, marginTop:6 }}/>
      </div>
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, color:C.muted }}>KPI 2 — Nombre</label>
        <input value={form.custom2_label} onChange={e=>set("custom2_label",e.target.value)} placeholder="Pasos diarios promedio" style={inp}/>
        <input value={form.custom2_value} onChange={e=>set("custom2_value",e.target.value)} placeholder="8500" style={{ ...inp, marginTop:6 }}/>
      </div>
    </> },
  ];

  async function save() {
    setSaving(true); setMsg("");
    try {
      const payload = { user_id: userId };
      Object.keys(form).forEach(k => {
        if(form[k]==="") return;
        if(k==="zone2_pace") { payload[k]=parsePace(form[k]); }
        else if(k.endsWith("_label")) { payload[k]=form[k]; }
        else { payload[k]=isNaN(form[k])?form[k]:Number(form[k]); }
      });
      await supaFetch("/rest/v1/weekly_metrics",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify(payload)});
      setMsg("✅ Check-in guardado"); setTimeout(()=>onSaved(),1500);
    } catch(e) { setMsg("❌ "+e.message); }
    setSaving(false);
  }

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Weekly Check-In</div>
        <div style={{ fontSize:11, color:C.muted }}>Paso {step+1} de {steps.length} · Solo llena lo que tengas</div>
      </div>
      <div style={{ height:4, background:"#1E2235", borderRadius:4, marginBottom:20 }}>
        <div style={{ height:"100%", width:`${((step+1)/steps.length)*100}%`, background:`linear-gradient(90deg,${C.accent},${C.accent2})`, borderRadius:4 }}/>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:14 }}>{steps[step].title}</div>
        {steps[step].content}
      </div>
      {msg&&<div style={{ fontSize:13, textAlign:"center", marginBottom:12, color:msg.includes("✅")?C.accent:"#F87171" }}>{msg}</div>}
      <div style={{ display:"flex", gap:10 }}>
        {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{ flex:1, background:"#161923", border:`1px solid ${C.border}`, borderRadius:10, padding:12, color:C.muted, fontSize:13, cursor:"pointer" }}>← Atrás</button>}
        {step<steps.length-1
          ?<button onClick={()=>setStep(s=>s+1)} style={{ flex:2, background:`linear-gradient(135deg,${C.accent},${C.accent2})`, border:"none", borderRadius:10, padding:12, color:"#08090D", fontSize:13, fontWeight:700, cursor:"pointer" }}>Siguiente →</button>
          :<button onClick={save} disabled={saving} style={{ flex:2, background:`linear-gradient(135deg,${C.accent},${C.accent2})`, border:"none", borderRadius:10, padding:12, color:"#08090D", fontSize:13, fontWeight:700, cursor:"pointer" }}>{saving?"Guardando...":"✓ Guardar Check-In"}</button>
        }
      </div>
    </div>
  );
}

// ── REPORTE ───────────────────────────────────────────────────────────────────
function Reporte({ metrics, userEmail }) {
  const last = metrics[metrics.length-1];
  const first = metrics[0];
  const score = calcScore(last);
  const weeks = metrics.length;
  const xp = calcXP(metrics);
  const rank = RANKS[rankFromXP(xp)];

  const lines = [
    `THE V2 PROJECT — Reporte de Progreso`,
    `Generado: ${new Date().toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric"})}`,
    `Usuario: ${userEmail}`,
    `Semanas tracked: ${weeks}`,
    ``,
    `━━ HYBRID SCORE ━━`,
    `Score actual: ${score}/100`,
    `Rango: ${rank}`,
    `XP Total: ${xp.toLocaleString()}`,
    ``,
    `━━ FÍSICO ━━`,
    `Peso inicial: ${first?.weight ?? "—"} kg  →  Actual: ${last?.weight ?? "—"} kg  (${first&&last?((last.weight-first.weight)>=0?"+":("")):""} ${first&&last?(+(last.weight-first.weight).toFixed(1)):""} kg)`,
    `Grasa inicial: ${first?.body_fat ?? "—"}%  →  Actual: ${last?.body_fat ?? "—"}%`,
    `Músculo inicial: ${first?.muscle_mass ?? "—"} kg  →  Actual: ${last?.muscle_mass ?? "—"} kg`,
    ``,
    `━━ RECUPERACIÓN ━━`,
    `HRV: ${first?.hrv ?? "—"} → ${last?.hrv ?? "—"} ms`,
    `Sueño promedio: ${first?.sleep_hours ?? "—"} → ${last?.sleep_hours ?? "—"} h`,
    `RHR: ${first?.rhr ?? "—"} → ${last?.rhr ?? "—"} bpm`,
    `Body Battery: ${first?.body_battery ?? "—"} → ${last?.body_battery ?? "—"}`,
    ``,
    `━━ RENDIMIENTO ━━`,
    `VO2 Max: ${first?.vo2_max ?? "—"} → ${last?.vo2_max ?? "—"} ml/kg/min`,
    `Pace Zona 2: ${fmtPace(first?.zone2_pace)} → ${fmtPace(last?.zone2_pace)} min/km`,
    `Km semanales: ${first?.weekly_km ?? "—"} → ${last?.weekly_km ?? "—"} km`,
    ``,
    `━━ FUERZA ━━`,
    `Press Banca: ${first?.bench_press ?? "—"} → ${last?.bench_press ?? "—"} kg`,
    `Sentadilla: ${first?.squat ?? "—"} → ${last?.squat ?? "—"} kg`,
    `Peso Muerto: ${first?.deadlift ?? "—"} → ${last?.deadlift ?? "—"} kg`,
    `Press Militar: ${first?.military_press ?? "—"} → ${last?.military_press ?? "—"} kg`,
    `Dominadas: ${first?.pullups ?? "—"} → ${last?.pullups ?? "—"} reps`,
    ``,
    `━━ HÁBITOS (última semana) ━━`,
    `Apego al plan: ${last?.adherence ?? "—"}%`,
    `Energía: ${last?.energy ?? "—"}/10`,
    `Cigarrillos: ${last?.cigarettes ?? "—"}`,
    last?.custom1_label ? `${last.custom1_label}: ${last.custom1_value ?? "—"}` : "",
    last?.custom2_label ? `${last.custom2_label}: ${last.custom2_value ?? "—"}` : "",
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `thev2project.com`,
  ].filter(l=>l!==undefined);

  const text = lines.join("\n");

  function copyText() {
    navigator.clipboard.writeText(text).then(()=>alert("¡Reporte copiado! Pégalo en WhatsApp, email o donde quieras."));
  }

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url,"_blank");
  }

  if(metrics.length===0) return (
    <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted }}>
      <div style={{ fontSize:32, marginBottom:12 }}>📄</div>
      <div style={{ fontSize:14, color:C.text }}>Sin datos para reportar</div>
      <div style={{ fontSize:12, marginTop:4 }}>Haz tu primer Check-In primero</div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4 }}>Reporte de Progreso</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:16 }}>Comparte con tu nutriólogo, coach, o quien quieras</div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:16, fontFamily:"monospace", fontSize:12, color:C.muted2, lineHeight:1.7, whiteSpace:"pre-wrap", maxHeight:400, overflowY:"auto" }}>
        {text}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <button onClick={copyText} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px", color:C.text, fontSize:13, fontWeight:600, cursor:"pointer" }}>
          📋 Copiar texto
        </button>
        <button onClick={shareWhatsApp} style={{ background:`linear-gradient(135deg,#25D366,#128C7E)`, border:"none", borderRadius:10, padding:"12px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          💬 WhatsApp
        </button>
      </div>
      <div style={{ marginTop:10, fontSize:11, color:C.muted, textAlign:"center" }}>También puedes copiar el texto y pegarlo en un email a tu nutriólogo o coach</div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null); const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true); const [tab, setTab] = useState(0); const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = localStorage.getItem("v2_token");
    if(t) { supaFetch("/auth/v1/user").then(u=>{setUser(u);setLoading(false);}).catch(()=>{localStorage.removeItem("v2_token");setLoading(false);}); }
    else setLoading(false);
  },[]);

  useEffect(()=>{ if(user) loadMetrics(); },[user]);
  useEffect(()=>{ const t=setInterval(()=>setMsgIdx(i=>(i+1)%MOTIVATIONAL.length),4000); return()=>clearInterval(t); },[]);

  async function loadMetrics() {
    try { const d=await supaFetch("/rest/v1/weekly_metrics?select=*&order=week_date.asc"); setMetrics(Array.isArray(d)?d:[]); } catch(e){console.error(e);}
  }
  function logout(){ localStorage.removeItem("v2_token"); setUser(null); setMetrics([]); }

  if(loading) return <div style={{ minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:14 }}>Cargando...</div>;
  if(!user) return <AuthScreen onAuth={(u,t)=>{setUser(u);}}/>;

  const last = metrics[metrics.length-1];
  const first = metrics[0];
  const xp = calcXP(metrics);
  const rankIdx = rankFromXP(xp);
  const xpToNext = XP_LEVELS[rankIdx+1]-XP_LEVELS[rankIdx];
  const xpInRank = xp-XP_LEVELS[rankIdx];
  const xpPct = xpToNext?Math.round((xpInRank/xpToNext)*100):100;
  const score = calcScore(last);
  const chartData = metrics.map(m=>({...m, w:m.week_label||m.week_date?.slice(5,10)}));
  const radarData = last ? [
    {axis:"Recovery",val:Math.min(100,Math.round(((last.hrv||50)/80)*100))},
    {axis:"Endurance",val:Math.min(100,Math.round(((last.vo2_max||40)/55)*100))},
    {axis:"Strength",val:Math.min(100,Math.round(((last.bench_press||60)/120)*100))},
    {axis:"Body",val:Math.min(100,Math.round(((90-(last.weight||85))/20)*100+50))},
    {axis:"Habits",val:last.adherence||0},
    {axis:"Sleep",val:Math.min(100,Math.round(((last.sleep_hours||6)/9)*100))},
  ] : [];

  const tabStyle = (i) => ({ padding:"8px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:tab===i?C.accent:"transparent", color:tab===i?"#08090D":C.muted, whiteSpace:"nowrap" });

  const empty = (
    <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted }}>
      <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
      <div style={{ fontSize:14, color:C.text, marginBottom:4 }}>Sin datos aún</div>
      <div style={{ fontSize:12 }}>Haz tu primer Check-In para ver tu dashboard</div>
      <button onClick={()=>setTab(5)} style={{ marginTop:16, background:`linear-gradient(135deg,${C.accent},${C.accent2})`, border:"none", borderRadius:10, padding:"10px 20px", color:"#08090D", fontSize:13, fontWeight:700, cursor:"pointer" }}>Hacer Check-In →</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'Inter',system-ui,sans-serif", fontSize:14 }}>
      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"11px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${C.accent},${C.accent2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⚡</div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:1 }}>THE V2 PROJECT</div>
            <div style={{ fontSize:10, color:C.muted }}>{user.email?.split("@")[0]} · {RANKS[rankIdx]}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {metrics.length>0&&<div style={{ textAlign:"right" }}><div style={{ fontSize:10,color:C.muted }}>XP</div><div style={{ fontSize:13,fontWeight:700,color:C.accent }}>{xp.toLocaleString()}</div></div>}
          <button onClick={logout} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px", color:C.muted, fontSize:11, cursor:"pointer" }}>Salir</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"8px 12px", overflowX:"auto", display:"flex", gap:4 }}>
        {TABS.map((t,i)=><button key={i} style={tabStyle(i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      <div style={{ padding:"18px 14px", maxWidth:740, margin:"0 auto" }}>

        {/* DASHBOARD */}
        {tab===0 && (metrics.length===0 ? empty : (
          <div>
            <div style={{ background:"#0F1220", border:`1px solid ${C.border}`, borderRadius:18, padding:"22px 18px", marginBottom:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:4 }}>Hybrid Score</div>
                  <div style={{ fontSize:52,fontWeight:900,background:`linear-gradient(135deg,${C.accent},${C.accent2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1 }}>{score}</div>
                  <div style={{ fontSize:10,color:C.muted,marginTop:2 }}>semana {metrics.length} de {metrics.length} · base: semana 1</div>
                  <div style={{ marginTop:10,display:"inline-block",background:`${C.accent}22`,border:`1px solid ${C.accent}44`,borderRadius:6,padding:"4px 10px",fontSize:10,fontWeight:700,color:C.accent,letterSpacing:1 }}>{MOTIVATIONAL[msgIdx]}</div>
                </div>
                {last&&(
                  <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                    <Ring value={last.hrv||0} max={80} color={C.accent} size={70} stroke={7} label={last.hrv||"—"} sub="HRV"/>
                    <Ring value={last.sleep_hours||0} max={9} color={C.accent2} size={70} stroke={7} label={last.sleep_hours?.toFixed(1)||"—"} sub="Sleep"/>
                    <Ring value={last.readiness||0} max={100} color={C.accent3} size={70} stroke={7} label={last.readiness||"—"} sub="Readiness"/>
                  </div>
                )}
              </div>
              <div style={{ marginTop:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:10,color:C.muted }}>{RANKS[rankIdx]}</span>
                  <span style={{ fontSize:10,color:RANK_COLORS[rankIdx] }}>{xp.toLocaleString()} XP · {xpPct}% → {RANKS[rankIdx+1]||"MAX"}</span>
                </div>
                <div style={{ height:5,background:"#1E2235",borderRadius:4 }}>
                  <div style={{ height:"100%",width:`${xpPct}%`,background:`linear-gradient(90deg,${C.accent},${C.accent2})`,borderRadius:4 }}/>
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:8, marginBottom:18 }}>
              <KCard label="HRV" value={last?.hrv} unit="ms" change={delta(last,first,"hrv")} icon="❤️" metricKey="hrv"/>
              <KCard label="Sleep" value={last?.sleep_hours?.toFixed(1)} unit="h" change={delta(last,first,"sleep_hours")} icon="😴" metricKey="sleep_hours"/>
              <KCard label="VO2 Max" value={last?.vo2_max?.toFixed(1)} unit="ml/kg" change={delta(last,first,"vo2_max")} icon="🫁" metricKey="vo2_max"/>
              <KCard label="Peso" value={last?.weight?.toFixed(1)} unit="kg" change={delta(last,first,"weight")} icon="⚖️" metricKey="weight"/>
            </div>

            {last?.custom1_label && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18 }}>
                <KCard label={last.custom1_label} value={last.custom1_value} icon="⭐"/>
                {last.custom2_label && <KCard label={last.custom2_label} value={last.custom2_value} icon="⭐"/>}
              </div>
            )}

            {chartData.length>1&&(
              <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:18 }}>
                <div style={{ fontSize:11,color:C.muted,marginBottom:8 }}>Hybrid Score — Evolución desde semana 1</div>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={chartData.map(m=>({w:m.w,score:calcScore(m)}))}>
                    <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.3}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="w" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={tip}/>
                    <Area type="monotone" dataKey="score" stroke={C.accent} fill="url(#sg)" strokeWidth={2} dot={{r:3,fill:C.accent}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {radarData.length>0&&(
              <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16 }}>
                <div style={{ fontSize:11,color:C.muted,marginBottom:8 }}>Athletic Profile — semana actual</div>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={C.border}/>
                    <PolarAngleAxis dataKey="axis" tick={{fill:C.muted2,fontSize:10}}/>
                    <Radar dataKey="val" stroke={C.accent2} fill={C.accent2} fillOpacity={0.25}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}

        {/* RECOVERY */}
        {tab===1&&(metrics.length===0?empty:(
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Recovery Center</div>
            {last&&<div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,marginBottom:18,display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:14 }}>
              <Ring value={last.hrv||0} max={80} color={C.accent} size={78} stroke={8} label={last.hrv||"—"} sub="HRV"/>
              <Ring value={last.sleep_hours||0} max={9} color={C.accent2} size={78} stroke={8} label={last.sleep_hours?.toFixed(1)||"—"} sub="Sleep"/>
              <Ring value={last.rhr||0} max={80} color={C.accent3} size={78} stroke={8} label={last.rhr||"—"} sub="RHR"/>
              <Ring value={last.body_battery||0} max={100} color={C.accent4} size={78} stroke={8} label={last.body_battery||"—"} sub="Battery"/>
              <Ring value={last.readiness||0} max={100} color={C.warn} size={78} stroke={8} label={last.readiness||"—"} sub="Readiness"/>
            </div>}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:18 }}>
              <KCard label="HRV" value={last?.hrv} unit="ms" change={delta(last,first,"hrv")} icon="❤️" metricKey="hrv"/>
              <KCard label="Sleep" value={last?.sleep_hours?.toFixed(1)} unit="h" change={delta(last,first,"sleep_hours")} icon="😴" metricKey="sleep_hours"/>
              <KCard label="RHR" value={last?.rhr} unit="bpm" change={delta(last,first,"rhr",true)} icon="💓" metricKey="rhr"/>
              <KCard label="Body Battery" value={last?.body_battery} unit="%" change={delta(last,first,"body_battery")} icon="🔋" metricKey="body_battery"/>
              <KCard label="Readiness" value={last?.readiness} unit="%" change={delta(last,first,"readiness")} icon="✅" metricKey="readiness"/>
              <KCard label="Estrés" value={last?.stress} unit="/10" change={delta(last,first,"stress",true)} icon="🧘" metricKey="stress"/>
            </div>
            {chartData.length>1&&<div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16 }}>
              <div style={{ fontSize:11,color:C.muted,marginBottom:8 }}>HRV & Sleep — tendencia desde semana 1</div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartData}>
                  <XAxis dataKey="w" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tip}/>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3"/>
                  <Line type="monotone" dataKey="hrv" stroke={C.accent} strokeWidth={2} name="HRV" dot={{r:3,fill:C.accent}}/>
                  <Line type="monotone" dataKey="sleep_hours" stroke={C.accent2} strokeWidth={2} name="Sleep h" dot={{r:3,fill:C.accent2}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>}
          </div>
        ))}

        {/* PERFORMANCE */}
        {tab===2&&(metrics.length===0?empty:(
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Performance Analytics</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:18 }}>
              <KCard label="VO2 Max" value={last?.vo2_max?.toFixed(1)} unit="ml/kg" change={delta(last,first,"vo2_max")} icon="🫁" metricKey="vo2_max"/>
              <KCard label="Pace Z2" value={fmtPace(last?.zone2_pace)} unit="min/km" icon="⏱️" metricKey="zone2_pace"/>
              <KCard label="Km semanales" value={last?.weekly_km} unit="km" change={delta(last,first,"weekly_km")} icon="🛣️" metricKey="weekly_km"/>
              <KCard label="Adherencia" value={last?.adherence} unit="%" change={delta(last,first,"adherence")} icon="🎯" metricKey="adherence"/>
            </div>
            {chartData.length>1&&<div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16 }}>
              <div style={{ fontSize:11,color:C.muted,marginBottom:8 }}>VO2 Max — progresión desde semana 1</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <XAxis dataKey="w" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tip}/>
                  <Line type="monotone" dataKey="vo2_max" stroke={C.accent4} strokeWidth={2.5} name="VO2 Max" dot={{r:4,fill:C.accent4}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>}
          </div>
        ))}

        {/* BODY */}
        {tab===3&&(metrics.length===0?empty:(
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Body Composition</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:18 }}>
              <KCard label="Peso" value={last?.weight?.toFixed(1)} unit="kg" change={delta(last,first,"weight")} icon="⚖️" metricKey="weight"/>
              <KCard label="Grasa %" value={last?.body_fat?.toFixed(1)} unit="%" change={delta(last,first,"body_fat")} icon="📊" metricKey="body_fat"/>
              <KCard label="Músculo" value={last?.muscle_mass?.toFixed(1)} unit="kg" change={delta(last,first,"muscle_mass")} icon="💪" metricKey="muscle_mass"/>
              <KCard label="Δ Total" value={first&&last?(+(last.weight-first.weight).toFixed(1)):null} unit="kg" icon="📉"/>
            </div>
            {chartData.length>1&&<div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16 }}>
              <div style={{ fontSize:11,color:C.muted,marginBottom:8 }}>Peso & Composición — desde semana 1</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <XAxis dataKey="w" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tip}/>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3"/>
                  <Line type="monotone" dataKey="weight" stroke={C.accent4} strokeWidth={2} name="Peso"/>
                  <Line type="monotone" dataKey="body_fat" stroke={C.accent3} strokeWidth={2} name="Grasa %"/>
                  <Line type="monotone" dataKey="muscle_mass" stroke={C.accent} strokeWidth={2} name="Músculo"/>
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:"flex",gap:14,marginTop:8,fontSize:10 }}>
                <span style={{color:C.accent4}}>● Peso</span>
                <span style={{color:C.accent3}}>● Grasa %</span>
                <span style={{color:C.accent}}>● Músculo</span>
              </div>
            </div>}
          </div>
        ))}

        {/* STRENGTH */}
        {tab===4&&(metrics.length===0?empty:(
          <div>
            <div style={{ fontSize:13,fontWeight:700,color:C.text,marginBottom:14 }}>Strength Progress</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:18 }}>
              <KCard label="Bench Press" value={last?.bench_press} unit="kg" change={delta(last,first,"bench_press")} icon="🏋️" metricKey="bench_press"/>
              <KCard label="Sentadilla" value={last?.squat} unit="kg" change={delta(last,first,"squat")} icon="🦵" metricKey="squat"/>
              <KCard label="Peso Muerto" value={last?.deadlift} unit="kg" change={delta(last,first,"deadlift")} icon="⛓️" metricKey="deadlift"/>
              <KCard label="Press Militar" value={last?.military_press} unit="kg" change={delta(last,first,"military_press")} icon="💪" metricKey="military_press"/>
              <KCard label="Pull-Ups" value={last?.pullups} unit="reps" change={delta(last,first,"pullups")} icon="🔝" metricKey="pullups"/>
              <KCard label="Workouts" value={last?.workouts_completed} unit="esta semana" icon="📅" metricKey="workouts_completed"/>
            </div>
            {chartData.length>1&&<div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16 }}>
              <div style={{ fontSize:11,color:C.muted,marginBottom:8 }}>Big 3 — desde semana 1</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <XAxis dataKey="w" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tip}/>
                  <CartesianGrid stroke={C.border} strokeDasharray="3 3"/>
                  <Line type="monotone" dataKey="bench_press" stroke={C.accent} strokeWidth={2} name="Bench"/>
                  <Line type="monotone" dataKey="squat" stroke={C.accent2} strokeWidth={2} name="Squat"/>
                  <Line type="monotone" dataKey="deadlift" stroke={C.accent4} strokeWidth={2} name="Deadlift"/>
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:"flex",gap:14,marginTop:8,fontSize:10 }}>
                <span style={{color:C.accent}}>● Bench</span>
                <span style={{color:C.accent2}}>● Squat</span>
                <span style={{color:C.accent4}}>● Deadlift</span>
              </div>
            </div>}
          </div>
        ))}

        {tab===5&&<CheckIn userId={user.id} onSaved={()=>{loadMetrics();setTab(0);}}/>}
        {tab===6&&<Reporte metrics={metrics} userEmail={user.email}/>}

      </div>
    </div>
  );
}