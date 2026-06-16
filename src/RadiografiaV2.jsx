import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("FULL URL:", SUPABASE_URL);
console.log("FULL KEY LENGTH:", SUPABASE_ANON_KEY?.length);
console.log("FIRST 20:", SUPABASE_ANON_KEY?.substring(0,20));

/* ============================================================
   STAGE 01 — RADIOGRAFÍA V2 · The V2 Project
   Black / white / gray · cinematic · premium
   ============================================================ */

const AREAS = ["ENERGÍA", "CONTROL", "CRECIMIENTO", "CAPITAL"];

const QUESTIONS = [
  // ENERGÍA 1-5
  { area: 0, q: "Si mañana tuvieras que correr 5 km sin previo aviso, ¿podrías hacerlo?", opts: ["Sí, sin problema.", "Sí, pero sufriría.", "Apenas terminaría.", "Probablemente no podría."] },
  { area: 0, q: "Cuando te ves al espejo sin ropa, ¿te sientes orgulloso de lo que has construido?", opts: ["Sí.", "Más o menos.", "No realmente.", "No."] },
  { area: 0, q: "¿Cuántas veces en los últimos 30 días prometiste cuidar tu cuerpo y terminaste haciendo lo contrario?", opts: ["Casi nunca.", "Algunas veces.", "Muchas veces.", "Demasiadas para contarlas."] },
  { area: 0, q: "Tu cuerpo actual es evidencia de:", opts: ["Disciplina sostenida.", "Esfuerzo inconsistente.", "Negociación constante.", "Años de abandono."] },
  { area: 0, q: "Si tu energía actual fuera permanente durante los próximos 10 años, ¿cómo te sentirías?", opts: ["Entusiasmado.", "Conforme.", "Preocupado.", "Aterrorizado."] },
  // CONTROL 6-10
  { area: 1, q: "Cuando dices «mañana empiezo», ¿qué suele pasar?", opts: ["Empiezo.", "Empiezo a veces.", "Lo pospongo.", "Ya ni me creo."] },
  { area: 1, q: "¿Cuántas promesas importantes te has roto a ti mismo durante el último año?", opts: ["Muy pocas.", "Algunas.", "Muchas.", "He perdido la cuenta."] },
  { area: 1, q: "¿Qué porcentaje de tus días se siente diseñado por ti y no por las circunstancias?", opts: ["Más del 80%.", "Entre 50% y 80%.", "Menos del 50%.", "Casi ninguno."] },
  { area: 1, q: "¿Quién tiene más control sobre tu día?", opts: ["Yo.", "Un poco yo, un poco mi entorno.", "Mi entorno (trabajo, familia, amigos).", "No lo sé."] },
  { area: 1, q: "Si alguien observara tu comportamiento durante una semana completa, ¿diría que eres una persona disciplinada?", opts: ["Sin duda.", "Probablemente sí.", "Probablemente no.", "Definitivamente no."] },
  // CRECIMIENTO 11-15
  { area: 2, q: "¿Eres hoy más valioso que hace un año?", opts: ["Mucho más.", "Algo más.", "Casi igual.", "No."] },
  { area: 2, q: "¿Cuándo fue la última vez que desarrollaste una habilidad importante?", opts: ["Este año.", "Hace más de un año.", "Hace varios años.", "No recuerdo."] },
  { area: 2, q: "¿Cuántas horas a la semana inviertes deliberadamente en crecer? (estudio, lectura, habilidades técnicas, cursos, mentores)", opts: ["Más de 10.", "Entre 5 y 10.", "Menos de 5.", "Casi ninguna."] },
  { area: 2, q: "¿Tu versión de hace 5 años estaría impresionada por quien eres hoy?", opts: ["Sí.", "En algunas cosas.", "No mucho.", "No."] },
  { area: 2, q: "¿Estás construyendo algo o simplemente consumiendo?", opts: ["Principalmente construyo.", "Mitad y mitad.", "Consumo más de lo que construyo.", "Solo consumo."] },
  // CAPITAL 16-20
  { area: 3, q: "Si mañana dejaras de trabajar, ¿cuánto tiempo podrías sostener tu vida actual?", opts: ["Más de un año.", "Entre 3 y 12 meses.", "Menos de 3 meses.", "Sería un problema inmediato."] },
  { area: 3, q: "Tu relación con el dinero se parece más a:", opts: ["Estrategia.", "Planeación básica.", "Improvisación.", "Supervivencia."] },
  { area: 3, q: "¿El dinero trabaja para ti mientras duermes?", opts: ["Sí.", "Un poco.", "Casi nada.", "No."] },
  { area: 3, q: "¿Sabes exactamente cuánto patrimonio neto tienes hoy?", opts: ["Sí.", "Aproximadamente.", "Tengo una idea vaga.", "No."] },
  { area: 3, q: "Si sigues tomando exactamente las mismas decisiones financieras durante los próximos 10 años, ¿te gusta el resultado?", opts: ["Sí.", "Más o menos.", "No.", "Ni de broma."] },
];

const OPEN_QUESTIONS = [
  { q: "¿Qué área de tu vida sabes que deberías arreglar y llevas demasiado tiempo evitando?", hint: "Algunas personas descubren que es su salud, su relación de pareja, sus finanzas, su disciplina, su carrera o su falta de dirección. ¿Cuál es la tuya?" },
  { q: "¿Cuál es la mentira que más te repites para justificar no cambiar?", hint: "«No estoy tan mal.» «Cuando tenga más tiempo.» «Todavía soy joven.» «Así soy yo.» ¿Cuál es la tuya?" },
  { q: "¿Qué evidencia tienes hoy de que realmente puedes confiar en ti?", hint: "Piensa en hechos, no en intenciones. Hábitos sostenidos, metas cumplidas, promesas mantenidas, momentos difíciles superados." },
  { q: "¿Qué promesa te duele más haber roto?", hint: "Puede ser con tu salud, tu familia, tu negocio, tus estudios o tus sueños. ¿Cuál todavía te pesa?" },
  { q: "Si todo sigue exactamente igual durante los próximos 5 años, ¿qué perderías?", hint: "Piensa más allá del dinero: salud, tiempo, relaciones, confianza, libertad, sueños que hoy todavía son posibles." },
  { q: "¿Qué estás tolerando hoy que, si sigue igual dentro de 5 años, te haría decir: «No puedo creer que permití esto tanto tiempo»?", hint: "Un hábito, una relación, una decisión postergada, un problema que esperas que se resuelva solo. Nombra el que más pesa." },
];

const TOTAL = 26;

const LEVELS = [
  { min: 20, max: 34, name: "V1 DOMINA", desc: "Tu versión anterior sigue tomando las decisiones. La evidencia lo confirma. Este es el punto de partida más honesto posible." },
  { min: 35, max: 49, name: "DESPERTANDO", desc: "Ya ves la brecha entre quien eres y quien dices que quieres ser. Verla es el primer acto de control." },
  { min: 50, max: 64, name: "CONSTRUYENDO V2", desc: "Hay estructura en formación. Falta consistencia para que la evidencia sea innegable." },
  { min: 65, max: 74, name: "V2 ACTIVA", desc: "Tu nueva versión opera la mayoría de los días. El siguiente nivel es sostenerla bajo presión." },
  { min: 75, max: 80, name: "CAMINO A V3", desc: "La evidencia está de tu lado. Tu trabajo ahora es elevar el estándar, no mantenerlo." },
];

const MISSIONS = {
  CONTROL: {
    title: "7 DÍAS SIN NEGOCIAR",
    objective: "Recuperar la autoridad sobre tu propia palabra. Durante 7 días, lo que decides se ejecuta. Sin renegociación interna.",
    rules: ["Cada noche defines máximo 3 compromisos para el día siguiente.", "Un compromiso definido no se renegocia. Se cumple o se reporta como fallado.", "Cero excepciones por estado de ánimo, clima o «no tener ganas»."],
    daily: ["Escribe tus 3 compromisos antes de dormir.", "Ejecuta el primero antes de las 9:00 am.", "Marca al final del día: cumplido o fallado. Sin justificaciones."],
  },
  "ENERGÍA": {
    title: "7 DÍAS DE ENERGÍA",
    objective: "Generar evidencia física innegable en una semana. No transformación: evidencia.",
    rules: ["Entrenamiento diario, mínimo 30 minutos. Sin días de descanso esta semana.", "Cero alcohol y cero azúcar añadida durante los 7 días.", "Dormido antes de las 10:30 pm todas las noches."],
    daily: ["Mueve tu cuerpo 30+ minutos.", "Registra qué comiste, sin editarlo para verte bien.", "Anota tu nivel de energía (1-10) al despertar."],
  },
  CAPITAL: {
    title: "7 DÍAS DE ORDEN FINANCIERO",
    objective: "Pasar de la niebla a los números. En 7 días conoces tu posición financiera real, al peso.",
    rules: ["Registras cada gasto el mismo día, sin excepción.", "Cero compras no planeadas durante los 7 días.", "Al día 7 tienes calculado tu patrimonio neto exacto."],
    daily: ["Registra todos los gastos del día.", "Dedica 15 minutos a mapear una cuenta, deuda o activo.", "Anota una decisión financiera que estás postergando."],
  },
  CRECIMIENTO: {
    title: "7 DÍAS DE EXPANSIÓN",
    objective: "Romper la inercia del consumo pasivo. Una semana donde construyes más de lo que consumes.",
    rules: ["90 minutos diarios de trabajo profundo en una sola habilidad.", "Cero contenido de entretenimiento antes de completar tu bloque.", "Cada día produces algo tangible: una página, un análisis, un prototipo."],
    daily: ["Bloque de 90 minutos sin teléfono.", "Documenta qué construiste hoy, en una línea.", "Define qué construirás mañana antes de cerrar el día."],
  },
};

const DIAGNOSIS = {
  "ENERGÍA": "Tu cuerpo está cobrando la factura de decisiones acumuladas. Sin energía, todo lo demás opera al 60%. La principal brecha está en convertir el cuidado físico en un sistema, no en un propósito.",
  CONTROL: "Sabes más de lo que ejecutas. La principal brecha está en la consistencia y el cumplimiento de acuerdos contigo mismo. Tu palabra hacia ti es el activo que más has devaluado.",
  CRECIMIENTO: "Estás operando con la versión de hace años. La principal brecha está en la inversión deliberada: consumes más de lo que construyes, y el mercado lo nota antes que tú.",
  CAPITAL: "Tu dinero refleja improvisación, no estrategia. La principal brecha está en la claridad: no puedes dirigir lo que no mides, y hoy estás navegando sin instrumentos.",
};

const ANALYSIS_PHRASES = [
  "Un cambio verdadero lleva tiempo. Sé paciente.",
  "Lo que se construye al vapor, se derrumba al vapor.",
  "Cruzando tus números con tus propias palabras.",
  "Detectando contradicciones entre lo que dices y lo que haces.",
  "Tu V1 se construyó en años. Verla con claridad toma unos segundos más.",
  "Los diagnósticos rápidos producen cambios falsos.",
  "Si buscas resultados inmediatos con esfuerzo mínimo, seguirás exactamente donde estás.",
  "La evidencia no se inventa. Se analiza.",
];

/* ---------- helpers ---------- */
const levelFor = (score) => LEVELS.find((l) => score >= l.min && score <= l.max) || LEVELS[0];

function computeScores(answers) {
  const area = [0, 0, 0, 0];
  answers.forEach((a, i) => { if (a != null) area[QUESTIONS[i].area] += 4 - a; });
  const total = area.reduce((s, x) => s + x, 0);
  const pct = area.map((s) => Math.round((s / 20) * 100));
  const order = [0, 1, 2, 3].sort((a, b) => area[b] - area[a]);
  return { area, total, pct, strongest: order[0], weakest: order[3] };
}

/* ---------- Radar (SVG, custom) ---------- */
function Radar({ pct, light }) {
  const cx = 160, cy = 150, R = 105;
  const grid = light ? "#D5D5D5" : "#222";
  const main = light ? "#111111" : "#FAFAFA";
  const muted = light ? "#777" : "#8A8A8A";
  const fill = light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)";
  const angles = [-90, 0, 90, 180].map((d) => (d * Math.PI) / 180);
  const pt = (i, r) => [cx + Math.cos(angles[i]) * r, cy + Math.sin(angles[i]) * r];
  const poly = (frac) => angles.map((_, i) => pt(i, R * frac).join(",")).join(" ");
  const dataPoly = pct.map((p, i) => pt(i, R * Math.max(p, 6) / 100).join(",")).join(" ");
  const labels = [
    { i: 0, x: cx, y: cy - R - 18, a: "middle" },
    { i: 1, x: cx + R + 14, y: cy + 4, a: "start" },
    { i: 2, x: cx, y: cy + R + 26, a: "middle" },
    { i: 3, x: cx - R - 14, y: cy + 4, a: "end" },
  ];
  return (
    <svg viewBox="0 0 320 300" style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={poly(f)} fill="none" stroke={grid} strokeWidth="1" />
      ))}
      {angles.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={grid} strokeWidth="1" />;
      })}
      <polygon points={dataPoly} fill={fill} stroke={main} strokeWidth="1.5" style={light ? {} : { filter: "drop-shadow(0 0 6px rgba(255,255,255,0.25))" }} />
      {pct.map((p, i) => {
        const [x, y] = pt(i, R * Math.max(p, 6) / 100);
        return <circle key={i} cx={x} cy={y} r="3" fill={main} />;
      })}
      {labels.map(({ i, x, y, a }) => (
        <g key={i}>
          <text x={x} y={y} textAnchor={a} fill={muted} fontSize="9" fontFamily="'JetBrains Mono', monospace" letterSpacing="2">{AREAS[i]}</text>
          <text x={x} y={y + 14} textAnchor={a} fill={main} fontSize="13" fontFamily="'JetBrains Mono', monospace" fontWeight="700">{pct[i]}%</text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- Scan line ---------- */
function ScanLine() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div className="v2-scan" />
    </div>
  );
}

/* ============================================================ */
export default function RadiografiaV2() {
  const [screen, setScreen] = useState("landing"); // landing | transition | quiz | analyzing | results
  const [email, setEmail] = useState("");
  const [leadId, setLeadId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [whats, setWhats] = useState("");
  const [nombre, setNombre] = useState("");
  const [fechaNac, setFechaNac] = useState("");

  const edad = useMemo(() => {
    if (!fechaNac) return null;
    const b = new Date(fechaNac), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a > 0 && a < 110 ? a : null;
  }, [fechaNac]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(20).fill(null));
  const [openAnswers, setOpenAnswers] = useState(Array(6).fill(""));
  const [picked, setPicked] = useState(null);
  const [fade, setFade] = useState(true);
  const [ai, setAi] = useState(null);
  const [aiError, setAiError] = useState(false);
  const [prog, setProg] = useState(0);
  const topRef = useRef(null);

  const scores = useMemo(() => computeScores(answers), [answers]);
  const level = levelFor(scores.total);
  const weakestName = AREAS[scores.weakest];
  const strongestName = AREAS[scores.strongest];
  const mission = MISSIONS[weakestName];

  const goTo = (next) => {
    setFade(false);
    setTimeout(() => { setIdx(next); setPicked(null); setFade(true); }, 220);
  };

  const pick = (qi, oi) => {
    if (picked !== null) return;
    setPicked(oi);
    const next = [...answers];
    next[qi] = oi;
    setAnswers(next);
    setTimeout(() => {
      if (qi < 19) goTo(qi + 1);
      else goTo(20);
    }, 380);
  };

  const runAnalysis = async () => {
    setScreen("analyzing");
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/radiografia-diagnostico`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          lead_id: leadId,
          nombre,
          fecha_nacimiento: fechaNac,
          respuestas: answers,
          abiertas: openAnswers,
        }),
      });
      if (!res.ok) throw new Error(`Edge function ${res.status}`);
      const data = await res.json();
      if (data.diagnostico) setAi(data.diagnostico);
      else setAiError(true);
    } catch (e) {
      console.error("radiografia-diagnostico:", e);
      setAiError(true);
    }
  };

  // Progreso del análisis: 45s con easing (rápido al inicio, lento al final)
  useEffect(() => {
    if (screen !== "analyzing") return;
    setProg(0);
    const start = Date.now();
    const DURATION = 45000;
    const t = setInterval(() => {
      const f = Math.min((Date.now() - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - f, 1.7);
      setProg(Math.min(99, Math.floor(eased * 100)));
      if (f >= 1) {
        clearInterval(t);
        setProg(100);
        setTimeout(() => setScreen("results"), 500);
      }
    }, 300);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => { topRef.current?.scrollIntoView?.({ behavior: "instant" }); }, [screen, idx]);

  /* ---------- styles ---------- */
  const S = {
    app: { minHeight: "100vh", background: "#060606", color: "#FAFAFA", fontFamily: "'Inter', sans-serif", position: "relative" },
    wrap: { maxWidth: 680, margin: "0 auto", padding: "0 24px" },
    mono: { fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.22em", fontSize: 11, color: "#8A8A8A", textTransform: "uppercase" },
    display: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" },
    btn: { background: "#FAFAFA", color: "#060606", border: "none", padding: "16px 36px", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", transition: "opacity .2s" },
    ghost: { background: "transparent", color: "#8A8A8A", border: "1px solid #262626", padding: "12px 24px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" },
    input: { width: "100%", background: "#0D0D0D", border: "1px solid #262626", color: "#FAFAFA", padding: "16px 18px", fontSize: 15, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" },
    card: (sel) => ({
      width: "100%", textAlign: "left", background: sel ? "#FAFAFA" : "#0C0C0C", color: sel ? "#060606" : "#E5E5E5",
      border: sel ? "1px solid #FAFAFA" : "1px solid #1F1F1F", padding: "20px 22px", fontSize: 15.5, lineHeight: 1.45,
      fontFamily: "'Inter', sans-serif", cursor: "pointer", transition: "all .18s ease", display: "flex", gap: 16, alignItems: "baseline", boxSizing: "border-box",
    }),
    label: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#8A8A8A" },
    section: { borderTop: "1px solid #1A1A1A", paddingTop: 36, marginTop: 48 },
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap');
    * { -webkit-font-smoothing: antialiased; }
    .v2-fade { transition: opacity .22s ease, transform .22s ease; }
    .v2-card:hover { border-color: #4A4A4A !important; }
    .v2-btn:hover { opacity: .85; }
    .v2-scan { position:absolute; left:0; right:0; height:1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent); animation: v2scan 3.2s ease-in-out infinite; }
    @keyframes v2scan { 0% { top: 8%; opacity:0 } 12% {opacity:1} 88% {opacity:1} 100% { top: 92%; opacity:0 } }
    .v2-pulse { animation: v2pulse 1.6s ease-in-out infinite; }
    @keyframes v2pulse { 0%,100% { opacity:.35 } 50% { opacity:1 } }
    .v2-phrase { animation: v2phrase .6s ease; }
    @keyframes v2phrase { from { opacity:0; transform: translateY(6px) } to { opacity:1; transform: translateY(0) } }
    textarea::placeholder, input::placeholder { color:#5A5A5A; }
    input:focus, textarea:focus { border-color:#4A4A4A !important; }
    @media (prefers-reduced-motion: reduce) { .v2-scan, .v2-pulse { animation:none } .v2-fade { transition:none } }
  `;

  /* ============ LANDING ============ */
  if (screen === "landing") {
const valid = email.trim().includes("@") && whats.trim().length >= 10;
    return (
      <div style={S.app}>
        <style>{css}</style>
        <div ref={topRef} />
        <div style={{ ...S.wrap, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 60, paddingBottom: 60 }}>
          <div style={S.mono}>THE V2 PROJECT</div>
          <h1 style={{ ...S.display, fontSize: "clamp(42px, 7vw, 72px)", margin: "28px 0 0", lineHeight: 1.02 }}>
            La evidencia<br />no miente.
          </h1>
          <p style={{ color: "#8A8A8A", fontSize: 16, lineHeight: 1.7, maxWidth: 460, margin: "28px 0 44px" }}>
            Antes de construir tu siguiente versión, necesitas ver la actual. Deja tus datos y desbloquea el Stage 01.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420 }}>
            <input style={S.input} type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={S.input} type="tel" placeholder="WhatsApp" value={whats} onChange={(e) => setWhats(e.target.value)} />
            <button className="v2-btn" style={{ ...S.btn, opacity: valid ? 1 : 0.35, cursor: valid ? "pointer" : "default", marginTop: 8 }} onClick={async () => {
              if (!valid || saving) return;
              setSaving(true);
              const { data, error } = await supabase
.from("leads")
.upsert(
  {
    email: email.trim().toLowerCase(),
    whatsapp: whats.trim()
  },
  { onConflict: "email" }
)
.select("id")
.single();
              setSaving(false);
              if (error) { console.error(error); return; }
              setLeadId(data.id);
              setScreen("transition");
            }}>
              {saving ? "Desbloqueando…" : "Desbloquear Stage 01"}
            </button>
          </div>
          <div style={{ ...S.mono, marginTop: 56, fontSize: 10 }}>STAGE 01 — RADIOGRAFÍA V2 · 26 PREGUNTAS · 5-7 MIN</div>
        </div>
      </div>
    );
  }

  /* ============ TRANSITION ============ */
  if (screen === "transition") {
    return (
      <div style={S.app}>
        <style>{css}</style>
        <ScanLine />
        <div ref={topRef} />
        <div style={{ ...S.wrap, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 60, paddingBottom: 60 }}>
          <div style={S.mono}>STAGE 01 — RADIOGRAFÍA V2</div>
          <h1 style={{ ...S.display, fontSize: "clamp(36px, 6vw, 58px)", margin: "26px 0 30px" }}>Bienvenido a V2.</h1>
          <div style={{ color: "#C8C8C8", fontSize: 17, lineHeight: 1.85, maxWidth: 520 }}>
            <p style={{ margin: "0 0 22px" }}>Antes de construir una nueva versión de ti, necesitamos ver la actual.</p>
            <p style={{ margin: "0 0 22px", color: "#8A8A8A" }}>
              No la versión que imaginas.<br />No la versión que justificas.<br />No la versión que prometes.
            </p>
            <p style={{ margin: "0 0 22px", color: "#FAFAFA", fontWeight: 600 }}>La versión real.</p>
            <p style={{ margin: "0 0 22px", color: "#8A8A8A" }}>
              La que se refleja en tu energía.<br />Tus hábitos.<br />Tus finanzas.<br />Tus decisiones.
            </p>
            <p style={{ ...S.display, fontSize: 22, margin: "36px 0 0" }}>La evidencia no miente.</p>
          </div>
          <div style={{ marginTop: 48 }}>
            <button className="v2-btn" style={S.btn} onClick={() => setScreen("perfil")}>Comenzar Radiografía</button>
          </div>
        </div>
      </div>
    );
  }

  /* ============ PERFIL ============ */
  if (screen === "perfil") {
    const valid = nombre.trim().length >= 2 && edad != null;
    return (
      <div style={S.app}>
        <style>{css}</style>
        <div ref={topRef} />
        <div style={{ ...S.wrap, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 60, paddingBottom: 60 }}>
          <div style={S.mono}>ANTES DE EMPEZAR</div>
          <h1 style={{ ...S.display, fontSize: "clamp(30px, 5vw, 46px)", margin: "26px 0 16px", lineHeight: 1.15 }}>Esta radiografía es tuya.<br />Y de nadie más.</h1>
          <p style={{ color: "#8A8A8A", fontSize: 16, lineHeight: 1.7, maxWidth: 460, margin: "0 0 40px" }}>
            Dos datos para que el análisis hable contigo, no con un usuario anónimo.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 420 }}>
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>TU NOMBRE</div>
              <input style={S.input} type="text" placeholder="¿Cómo te llamas?" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: 6 }}>FECHA DE NACIMIENTO</div>
              <input style={{ ...S.input, colorScheme: "dark" }} type="date" value={fechaNac} onChange={(e) => setFechaNac(e.target.value)} />
            </div>
            <button className="v2-btn" style={{ ...S.btn, opacity: valid ? 1 : 0.35, cursor: valid ? "pointer" : "default", marginTop: 8 }} onClick={() => valid && setScreen("quiz")}>
              Iniciar análisis
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============ QUIZ ============ */
  if (screen === "quiz") {
    const isOpen = idx >= 20;
    const progress = ((idx + 1) / TOTAL) * 100;
    const areaLabel = isOpen ? "REFLEXIÓN V1" : AREAS[QUESTIONS[idx].area];
    return (
      <div style={S.app}>
        <style>{css}</style>
        <div ref={topRef} />
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, background: "#1A1A1A", zIndex: 10 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#FAFAFA", transition: "width .3s ease" }} />
        </div>
        <div style={{ ...S.wrap, paddingTop: 72, paddingBottom: 80, minHeight: "100vh", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={S.mono}>{areaLabel}</div>
            <div style={{ ...S.mono, color: "#FAFAFA" }}>PREGUNTA {String(idx + 1).padStart(2, "0")} / {TOTAL}</div>
          </div>

          <div className="v2-fade" style={{ opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(8px)" }}>
            {!isOpen ? (
              <>
                <h2 style={{ ...S.display, fontSize: "clamp(24px, 4vw, 34px)", margin: "40px 0 40px", lineHeight: 1.25 }}>{QUESTIONS[idx].q}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {QUESTIONS[idx].opts.map((o, oi) => (
                    <button key={oi} className="v2-card" style={S.card(picked === oi || (picked === null && answers[idx] === oi))} onClick={() => pick(idx, oi)}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.55 }}>{["A", "B", "C", "D"][oi]}</span>
                      <span>{o}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ ...S.display, fontSize: "clamp(24px, 4vw, 32px)", margin: "40px 0 16px", lineHeight: 1.3 }}>{OPEN_QUESTIONS[idx - 20].q}</h2>
                <p style={{ color: "#7A7A7A", fontSize: 14.5, lineHeight: 1.7, margin: "0 0 28px", maxWidth: 540 }}>{OPEN_QUESTIONS[idx - 20].hint}</p>
                <textarea
                  style={{ ...S.input, minHeight: 170, resize: "vertical", lineHeight: 1.7, fontSize: 16 }}
                  placeholder="Escribe con honestidad. Nadie puede responder esto por ti."
                  value={openAnswers[idx - 20]}
                  onChange={(e) => { const n = [...openAnswers]; n[idx - 20] = e.target.value; setOpenAnswers(n); }}
                />
                <div style={{ marginTop: 28 }}>
                  {idx < 25 ? (
                    <button className="v2-btn" style={{ ...S.btn, opacity: openAnswers[idx - 20].trim().length > 2 ? 1 : 0.35 }} onClick={() => openAnswers[idx - 20].trim().length > 2 && goTo(idx + 1)}>Continuar</button>
                  ) : (
                    <button className="v2-btn" style={{ ...S.btn, opacity: openAnswers[5].trim().length > 2 ? 1 : 0.35 }} onClick={() => openAnswers[5].trim().length > 2 && setScreen("honesty")}>Ver mi Radiografía</button>
                  )}
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: 44 }}>
            {idx > 0 && <button style={S.ghost} onClick={() => goTo(idx - 1)}>← Anterior</button>}
          </div>
        </div>
      </div>
    );
  }

  /* ============ HONESTY CHECKPOINT ============ */
  if (screen === "honesty") {
    return (
      <div style={S.app}>
        <style>{css}</style>
        <div ref={topRef} />
        <div style={{ ...S.wrap, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 60, paddingBottom: 60 }}>
          <div style={S.mono}>ÚLTIMO FILTRO</div>
          <h1 style={{ ...S.display, fontSize: "clamp(32px, 5.5vw, 52px)", margin: "26px 0 30px", lineHeight: 1.1 }}>¿Realmente fuiste sincero?</h1>
          <div style={{ color: "#C8C8C8", fontSize: 17, lineHeight: 1.85, maxWidth: 540 }}>
            <p style={{ margin: "0 0 22px" }}>Este análisis no funciona si suavizaste tus respuestas.</p>
            <p style={{ margin: "0 0 22px", color: "#8A8A8A" }}>
              Si al responder pensaste <span style={{ color: "#FAFAFA", fontStyle: "italic" }}>"ok, sí era así... pero ya no"</span> — esa es tu V1 tomando el control. No tú.
            </p>
            <p style={{ margin: "0 0 22px", color: "#8A8A8A" }}>
              Tu mente justifica. Es su trabajo. El trabajo de esta radiografía es ver lo que la justificación esconde.
            </p>
            <p style={{ ...S.display, fontSize: 20, margin: "32px 0 0" }}>La evidencia que entregues es la evidencia que verás.</p>
          </div>
          <div style={{ marginTop: 48, display: "flex", flexWrap: "wrap", gap: 16 }}>
            <button className="v2-btn" style={S.btn} onClick={() => runAnalysis()}>Fui honesto. Continuar</button>
            <button style={{ ...S.ghost, padding: "16px 28px" }} onClick={() => { setScreen("quiz"); setIdx(0); setPicked(null); }}>Quiero replantear mis respuestas</button>
          </div>
        </div>
      </div>
    );
  }

  /* ============ ANALYZING ============ */
  if (screen === "analyzing") {
    return (
      <div style={S.app}>
        <style>{css}</style>
        <ScanLine />
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, padding: "0 24px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 56, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {prog}<span style={{ color: "#5A5A5A", fontSize: 28 }}>%</span>
          </div>
          <div style={{ width: "100%", maxWidth: 360, height: 1, background: "#1F1F1F" }}>
            <div style={{ height: "100%", width: `${prog}%`, background: "#FAFAFA", transition: "width .4s ease" }} />
          </div>
          <div style={{ ...S.display, fontSize: 22, marginTop: 8 }}>Procesando evidencia</div>
          <div key={Math.floor(prog / 13)} className="v2-phrase" style={{ color: "#8A8A8A", fontSize: 15, lineHeight: 1.6, textAlign: "center", maxWidth: 440, minHeight: 48 }}>
            {ANALYSIS_PHRASES[Math.min(Math.floor(prog / 13), ANALYSIS_PHRASES.length - 1)]}
          </div>
        </div>
      </div>
    );
  }

  /* ============ INFORME (PDF imprimible) ============ */
  if (screen === "informe") {
    const L = {
      label: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: "#888", textTransform: "uppercase" },
      h: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "-0.02em", color: "#111" },
      p: { fontSize: 14.5, lineHeight: 1.75, color: "#222" },
      sec: { borderTop: "1px solid #DDD", paddingTop: 26, marginTop: 34, breakInside: "avoid" },
    };
    const fecha = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
    const handlePrint = () => {
      try {
        window.print();
      } catch (e) {
        console.error("Error al generar el PDF:", e);
        window.alert("No se pudo generar el PDF. Intenta de nuevo o usa Ctrl/Cmd+P para imprimir esta página.");
      }
    };
    return (
      <div style={{ minHeight: "100vh", background: "#EDEDED", fontFamily: "'Inter', sans-serif", padding: "32px 16px" }}>
        <style>{css}</style>
        <style>{`@media print { .no-print { display:none !important } .informe-page { box-shadow:none !important; margin:0 !important } body { background:#fff } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
        <div ref={topRef} />
        <div className="no-print" style={{ maxWidth: 760, margin: "0 auto 20px", display: "flex", gap: 12 }}>
          <button className="v2-btn" style={{ ...S.btn, padding: "12px 24px", fontSize: 12 }} onClick={handlePrint}>Imprimir / Guardar PDF</button>
          <button style={{ ...S.ghost, color: "#555", borderColor: "#BBB" }} onClick={() => setScreen("results")}>← Volver a resultados</button>
        </div>

        <div className="informe-page" style={{ maxWidth: 760, margin: "0 auto", background: "#FFFFFF", padding: "56px 56px 40px", boxShadow: "0 2px 24px rgba(0,0,0,0.12)", boxSizing: "border-box" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid #111", paddingBottom: 18 }}>
            <div>
              <div style={L.label}>THE V2 PROJECT · STAGE 01</div>
              <div style={{ ...L.h, fontSize: 32, marginTop: 6 }}>Informe — Radiografía V2</div>
            </div>
            <div style={{ ...L.label, textAlign: "right" }}>{fecha}</div>
          </div>

          {/* Perfil */}
          <div style={{ marginTop: 26, display: "flex", gap: 40, flexWrap: "wrap" }}>
            <div><div style={L.label}>NOMBRE</div><div style={{ ...L.h, fontSize: 18, marginTop: 4 }}>{nombre || "—"}</div></div>
            <div><div style={L.label}>EDAD</div><div style={{ ...L.h, fontSize: 18, marginTop: 4 }}>{edad != null ? `${edad} años` : "—"}</div></div>
            <div><div style={L.label}>NIVEL V2</div><div style={{ ...L.h, fontSize: 18, marginTop: 4 }}>{level.name}</div></div>
            <div><div style={L.label}>PUNTAJE</div><div style={{ ...L.h, fontSize: 18, marginTop: 4 }}>{scores.total} / 80 · {Math.round((scores.total / 80) * 100)}%</div></div>
          </div>
          {(email || whats) && (
            <div style={{ marginTop: 14, display: "flex", gap: 40, flexWrap: "wrap" }}>
              {email && <div><div style={L.label}>EMAIL</div><div style={{ ...L.p, marginTop: 4 }}>{email}</div></div>}
              {whats && <div><div style={L.label}>WHATSAPP</div><div style={{ ...L.p, marginTop: 4 }}>{whats}</div></div>}
            </div>
          )}

          {/* Mensaje */}
          <div style={L.sec}>
            <div style={L.label}>RESUMEN PERSONAL</div>
            <p style={{ ...L.p, fontSize: 15.5, marginTop: 12 }}>
              {ai?.mensaje_personal || `${nombre}, la evidencia marca el siguiente paso: es momento de tomar el control en ${weakestName.toLowerCase()}. No todo está mal, pero de aquí para arriba: no te permitas seguir cayendo ni justificando.`}
            </p>
          </div>

          {/* Desempeño */}
          <div style={L.sec}>
            <div style={L.label}>DESEMPEÑO POR ÁREA</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center", marginTop: 16 }}>
              <div style={{ flex: "1 1 280px" }}><Radar pct={scores.pct} light /></div>
              <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 12 }}>
                {AREAS.map((a, i) => (
                  <div key={a}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={L.label}>{a}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "#111" }}>{scores.pct[i]}%</span>
                    </div>
                    <div style={{ height: 4, background: "#E5E5E5" }}><div style={{ height: "100%", width: `${scores.pct[i]}%`, background: "#111" }} /></div>
                  </div>
                ))}
                <div style={{ marginTop: 8, display: "flex", gap: 24 }}>
                  <div><div style={L.label}>MÁS FUERTE</div><div style={{ ...L.h, fontSize: 14, marginTop: 2 }}>{strongestName}</div></div>
                  <div><div style={L.label}>PRIORITARIA</div><div style={{ ...L.h, fontSize: 14, marginTop: 2, borderBottom: "2px solid #111", display: "inline-block" }}>{weakestName}</div></div>
                </div>
              </div>
            </div>
          </div>

          {/* Hallazgos */}
          {ai?.hallazgos?.length ? (
            <div style={L.sec}>
              <div style={L.label}>HALLAZGOS</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {ai.hallazgos.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, ...L.p }}>
                    <span style={{ ...L.label, minWidth: 92, paddingTop: 3 }}>{AREAS[i]}</span>{h}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Diagnóstico completo */}
          <div style={L.sec}>
            <div style={L.label}>DIAGNÓSTICO COMPLETO</div>
            <p style={{ ...L.p, marginTop: 12 }}>{ai?.diagnostico_narrativo || DIAGNOSIS[weakestName]}</p>
            {ai?.patron_dominante && (
              <p style={{ ...L.p, marginTop: 10, fontStyle: "italic", color: "#444" }}>Patrón dominante: {ai.patron_dominante}</p>
            )}
          </div>

          {/* V1 */}
          {ai && (
            <div style={L.sec}>
              <div style={L.label}>TU V1 IDENTIFICADO</div>
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[["ÁREA EVITADA", ai.area_evitada], ["MIEDO PRINCIPAL", ai.miedo_principal], ["EXCUSA PRINCIPAL", ai.excusa_principal], ["PROMESA ROTA", ai.promesa_rota]].map(([k, v]) => (
                  <div key={k}><div style={L.label}>{k}</div><div style={{ ...L.p, marginTop: 4 }}>{v}</div></div>
                ))}
              </div>
              {(ai.frases_v1 || []).length > 0 && (
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  {ai.frases_v1.map((f, i) => (
                    <div key={i} style={{ borderLeft: "2px solid #111", paddingLeft: 14, fontStyle: "italic", color: "#111", fontSize: 14.5 }}>"{f}"</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Misión */}
          <div style={L.sec}>
            <div style={L.label}>TU PRIMERA MISIÓN V2</div>
            <div style={{ ...L.h, fontSize: 22, marginTop: 8 }}>{mission.title}</div>
            <p style={{ ...L.p, marginTop: 8 }}>{mission.objective}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginTop: 14 }}>
              <div>
                <div style={L.label}>REGLAS</div>
                {mission.rules.map((r, i) => <div key={i} style={{ ...L.p, marginTop: 6, display: "flex", gap: 10 }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#888" }}>{String(i + 1).padStart(2, "0")}</span>{r}</div>)}
              </div>
              <div>
                <div style={L.label}>ACCIONES DIARIAS</div>
                {mission.daily.map((r, i) => <div key={i} style={{ ...L.p, marginTop: 6, display: "flex", gap: 10 }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#888" }}>{String(i + 1).padStart(2, "0")}</span>{r}</div>)}
              </div>
            </div>
            {ai?.recomendacion_inmediata && (
              <div style={{ marginTop: 20, border: "1px solid #CCC", padding: "14px 18px" }}>
                <div style={L.label}>PRÓXIMAS 24 HORAS</div>
                <p style={{ ...L.p, marginTop: 6, marginBottom: 0 }}>{ai.recomendacion_inmediata}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: "2px solid #111", marginTop: 44, paddingTop: 14, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={L.label}>THEV2PROJECT.COM</span>
            <span style={L.label}>LA EVIDENCIA NO MIENTE.</span>
          </div>
        </div>
      </div>
    );
  }

  /* ============ RESULTS ============ */
  return (
    <div style={S.app}>
      <style>{css}</style>
      <div ref={topRef} />
      <div style={{ ...S.wrap, paddingTop: 80, paddingBottom: 100 }}>
        <div style={S.mono}>STAGE 01 — COMPLETADO</div>
        <h1 style={{ ...S.display, fontSize: "clamp(38px, 6vw, 60px)", margin: "24px 0 8px" }}>Tu Radiografía V2</h1>
        <div style={{ ...S.mono, color: "#FAFAFA", marginBottom: 10 }}>LA EVIDENCIA NO MIENTE.</div>

        {/* Personal */}
        <div style={S.section}>
          <div style={S.label}>{(nombre || "—").toUpperCase()}{edad != null ? ` · ${edad} AÑOS` : ""}</div>
          <p style={{ fontSize: 18, lineHeight: 1.8, color: "#E5E5E5", maxWidth: 560, marginTop: 16 }}>
            {ai?.mensaje_personal || `${nombre}, ve hasta dónde has llegado — seguramente no ha sido fácil. Pero la evidencia marca el siguiente paso: es momento de tomar el control en ${weakestName.toLowerCase()}. No todo está mal. Pero de aquí para arriba: no te permitas seguir cayendo, seguir justificando. Toma el control.`}
          </p>
        </div>

        {/* Level */}
        <div style={{ ...S.section, display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-end" }}>
          <div>
            <div style={S.label}>NIVEL V2</div>
            <div style={{ ...S.display, fontSize: "clamp(30px, 5vw, 44px)", marginTop: 8 }}>{level.name}</div>
          </div>
          <div>
            <div style={S.label}>PUNTAJE GENERAL</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 34, fontWeight: 700, marginTop: 8 }}>{scores.total}<span style={{ color: "#5A5A5A", fontSize: 18 }}> / 80</span></div>
          </div>
        </div>
        <p style={{ color: "#A8A8A8", fontSize: 16, lineHeight: 1.75, maxWidth: 540, marginTop: 20 }}>{level.desc}</p>

        {/* Radar */}
        <div style={S.section}>
          <div style={S.label}>DESEMPEÑO POR ÁREA</div>
          <div style={{ marginTop: 24 }}><Radar pct={scores.pct} /></div>
        </div>

        {/* Strong / weak */}
        <div style={{ ...S.section, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 28 }}>
          <div>
            <div style={S.label}>ÁREA MÁS FUERTE</div>
            <div style={{ ...S.display, fontSize: 24, marginTop: 8 }}>{strongestName}</div>
          </div>
          <div>
            <div style={S.label}>ÁREA MÁS DÉBIL</div>
            <div style={{ ...S.display, fontSize: 24, marginTop: 8 }}>{weakestName}</div>
          </div>
          <div>
            <div style={S.label}>ÁREA PRIORITARIA</div>
            <div style={{ ...S.display, fontSize: 24, marginTop: 8, borderBottom: "2px solid #FAFAFA", display: "inline-block", paddingBottom: 4 }}>{weakestName}</div>
          </div>
        </div>

        {/* Hallazgos (resumen) */}
        <div style={S.section}>
          <div style={S.label}>HALLAZGOS</div>
          {ai?.hallazgos?.length ? (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 }}>
              {ai.hallazgos.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 14, fontSize: 15.5, color: "#E5E5E5", lineHeight: 1.6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#5A5A5A", fontSize: 10, paddingTop: 4, letterSpacing: "0.1em", minWidth: 86 }}>{AREAS[i]}</span>{h}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 17, lineHeight: 1.8, color: "#E5E5E5", maxWidth: 560, marginTop: 16 }}>{DIAGNOSIS[weakestName]}</p>
          )}
        </div>

        {/* AI — V1 identificado (compacto) */}
        <div style={S.section}>
          <div style={S.label}>TU V1 IDENTIFICADO</div>
          {ai ? (
            <div style={{ marginTop: 20, maxWidth: 560 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "0 0 22px" }}>
                {(ai.frases_v1 || []).slice(0, 2).map((f, i) => (
                  <div key={i} style={{ borderLeft: "2px solid #FAFAFA", paddingLeft: 16, fontStyle: "italic", color: "#FAFAFA", fontSize: 16 }}>"{f}"</div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {(ai.dominios_v1 || []).map((d, i) => (
                  <span key={i} style={{ border: "1px solid #2A2A2A", padding: "8px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E5E5E5" }}>{d}</span>
                ))}
              </div>
              {ai.recomendacion_inmediata && (
                <div style={{ marginTop: 28, border: "1px solid #2A2A2A", padding: "20px 22px" }}>
                  <div style={S.label}>PRÓXIMAS 24 HORAS</div>
                  <p style={{ marginTop: 8, fontSize: 16, lineHeight: 1.7, color: "#FAFAFA", marginBottom: 0 }}>{ai.recomendacion_inmediata}</p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "#7A7A7A", fontSize: 15, marginTop: 16 }}>
              {aiError ? "El análisis profundo no está disponible en este momento. Tus respuestas quedaron registradas para tu revisión personal." : "Analizando tus respuestas…"}
            </p>
          )}
        </div>

        {/* Informe completo */}
        <div style={{ ...S.section, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <button className="v2-btn" style={S.btn} onClick={() => setScreen("informe")}>Ver informe completo (PDF)</button>
          <span style={{ color: "#7A7A7A", fontSize: 13.5 }}>El desglose completo también llegará a {email || "tu correo"}.</span>
        </div>

        {/* Mission */}
        <div style={{ ...S.section, border: "1px solid #2A2A2A", padding: "40px 36px", marginTop: 56 }}>
          <div style={S.label}>TU PRIMERA MISIÓN V2</div>
          <h2 style={{ ...S.display, fontSize: "clamp(28px, 5vw, 40px)", margin: "14px 0 18px" }}>{mission.title}</h2>
          <p style={{ color: "#C8C8C8", fontSize: 16, lineHeight: 1.75, maxWidth: 540 }}>{mission.objective}</p>
          <div style={{ marginTop: 32 }}>
            <div style={S.label}>REGLAS</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {mission.rules.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 14, fontSize: 15.5, color: "#E5E5E5", lineHeight: 1.6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#5A5A5A", fontSize: 12, paddingTop: 3 }}>{String(i + 1).padStart(2, "0")}</span>{r}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 28 }}>
            <div style={S.label}>ACCIONES DIARIAS</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {mission.daily.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 14, fontSize: 15.5, color: "#E5E5E5", lineHeight: 1.6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#5A5A5A", fontSize: 12, paddingTop: 3 }}>{String(i + 1).padStart(2, "0")}</span>{r}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...S.mono, marginTop: 60, fontSize: 10 }}>
          PRÓXIMO: STAGE 02 — MISIÓN V2 · {email || "—"}
        </div>
      </div>
    </div>
  );
}
