// ============================================================
// THE V2 PROJECT · Edge Function: radiografia-diagnostico
// Deploy: supabase functions deploy radiografia-diagnostico
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ============================================================
// Recibe: { lead_id, nombre, fecha_nacimiento, respuestas (20 índices 0-3), abiertas (6 textos) }
// Hace:   valida → calcula scores (server-side) → llama a Claude
//         → valida marcas de género (1 reintento) → guarda → responde
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const AREAS = ["ENERGÍA", "CONTROL", "CRECIMIENTO", "CAPITAL"];

const QUESTIONS: { area: number; q: string; opts: string[] }[] = [
  { area: 0, q: "Si mañana tuvieras que correr 5 km sin previo aviso, ¿podrías hacerlo?", opts: ["Sí, sin problema.", "Sí, pero sufriría.", "Apenas terminaría.", "Probablemente no podría."] },
  { area: 0, q: "Cuando te ves al espejo sin ropa, ¿te sientes orgulloso de lo que has construido?", opts: ["Sí.", "Más o menos.", "No realmente.", "No."] },
  { area: 0, q: "¿Cuántas veces en los últimos 30 días prometiste cuidar tu cuerpo y terminaste haciendo lo contrario?", opts: ["Casi nunca.", "Algunas veces.", "Muchas veces.", "Demasiadas para contarlas."] },
  { area: 0, q: "Tu cuerpo actual es evidencia de:", opts: ["Disciplina sostenida.", "Esfuerzo inconsistente.", "Negociación constante.", "Años de abandono."] },
  { area: 0, q: "Si tu energía actual fuera permanente durante los próximos 10 años, ¿cómo te sentirías?", opts: ["Entusiasmado.", "Conforme.", "Preocupado.", "Aterrorizado."] },
  { area: 1, q: "Cuando dices «mañana empiezo», ¿qué suele pasar?", opts: ["Empiezo.", "Empiezo a veces.", "Lo pospongo.", "Ya ni me creo."] },
  { area: 1, q: "¿Cuántas promesas importantes te has roto a ti mismo durante el último año?", opts: ["Muy pocas.", "Algunas.", "Muchas.", "He perdido la cuenta."] },
  { area: 1, q: "¿Qué porcentaje de tus días se siente diseñado por ti y no por las circunstancias?", opts: ["Más del 80%.", "Entre 50% y 80%.", "Menos del 50%.", "Casi ninguno."] },
  { area: 1, q: "¿Quién tiene más control sobre tu día?", opts: ["Yo.", "Un poco yo, un poco mi entorno.", "Mi entorno (trabajo, familia, amigos).", "No lo sé."] },
  { area: 1, q: "Si alguien observara tu comportamiento durante una semana completa, ¿diría que eres una persona disciplinada?", opts: ["Sin duda.", "Probablemente sí.", "Probablemente no.", "Definitivamente no."] },
  { area: 2, q: "¿Eres hoy más valioso que hace un año?", opts: ["Mucho más.", "Algo más.", "Casi igual.", "No."] },
  { area: 2, q: "¿Cuándo fue la última vez que desarrollaste una habilidad importante?", opts: ["Este año.", "Hace más de un año.", "Hace varios años.", "No recuerdo."] },
  { area: 2, q: "¿Cuántas horas a la semana inviertes deliberadamente en crecer? (estudio, lectura, habilidades técnicas, cursos, mentores)", opts: ["Más de 10.", "Entre 5 y 10.", "Menos de 5.", "Casi ninguna."] },
  { area: 2, q: "¿Tu versión de hace 5 años estaría impresionada por quien eres hoy?", opts: ["Sí.", "En algunas cosas.", "No mucho.", "No."] },
  { area: 2, q: "¿Estás construyendo algo o simplemente consumiendo?", opts: ["Principalmente construyo.", "Mitad y mitad.", "Consumo más de lo que construyo.", "Solo consumo."] },
  { area: 3, q: "Si mañana dejaras de trabajar, ¿cuánto tiempo podrías sostener tu vida actual?", opts: ["Más de un año.", "Entre 3 y 12 meses.", "Menos de 3 meses.", "Sería un problema inmediato."] },
  { area: 3, q: "Tu relación con el dinero se parece más a:", opts: ["Estrategia.", "Planeación básica.", "Improvisación.", "Supervivencia."] },
  { area: 3, q: "¿El dinero trabaja para ti mientras duermes?", opts: ["Sí.", "Un poco.", "Casi nada.", "No."] },
  { area: 3, q: "¿Sabes exactamente cuánto patrimonio neto tienes hoy?", opts: ["Sí.", "Aproximadamente.", "Tengo una idea vaga.", "No."] },
  { area: 3, q: "Si sigues tomando exactamente las mismas decisiones financieras durante los próximos 10 años, ¿te gusta el resultado?", opts: ["Sí.", "Más o menos.", "No.", "Ni de broma."] },
];

const LEVELS = [
  { min: 20, max: 34, name: "V1 DOMINA" },
  { min: 35, max: 49, name: "DESPERTANDO" },
  { min: 50, max: 64, name: "CONSTRUYENDO V2" },
  { min: 65, max: 74, name: "V2 ACTIVA" },
  { min: 75, max: 80, name: "CAMINO A V3" },
];

const MISSION_TYPES: Record<string, string> = {
  "ENERGÍA": "7_dias_energia",
  CONTROL: "7_dias_sin_negociar",
  CRECIMIENTO: "7_dias_expansion",
  CAPITAL: "7_dias_orden_financiero",
};

// Marcas de género prohibidas en el output de la IA
const GENDER_PATTERNS = /\b(tú mism[oa]|ti mism[oa]|una mujer|un hombre|cansad[oa]\b|orgullos[oa]\b|sol[oa]\b|list[oa] para|preparad[oa]\b|decidid[oa]\b)/i;

function edad(fecha: string | null): number | null {
  if (!fecha) return null;
  const b = new Date(fecha), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a > 0 && a < 110 ? a : null;
}

function computeScores(answers: number[]) {
  const area = [0, 0, 0, 0];
  answers.forEach((a, i) => { area[QUESTIONS[i].area] += 4 - a; });
  const total = area.reduce((s, x) => s + x, 0);
  const order = [0, 1, 2, 3].sort((a, b) => area[b] - area[a]);
  return { area, total, strongest: order[0], weakest: order[3] };
}

function buildPrompt(nombre: string, years: number | null, answers: number[], abiertas: string[], sc: ReturnType<typeof computeScores>, fix = "") {
  const letters = ["A", "B", "C", "D"];
  const closed = QUESTIONS.map((qq, i) => `[${AREAS[qq.area]}] ${qq.q} → ${letters[answers[i]]}) ${qq.opts[answers[i]]}`).join("\n");
  const nivel = LEVELS.find((l) => sc.total >= l.min && sc.total <= l.max)?.name ?? "V1 DOMINA";
  return `Eres el motor de diagnóstico de "The V2 Project", una metodología seria de transformación personal. Tu tono es directo, honesto, sin crueldad pero sin suavizar. Hablas en segunda persona. No usas frases motivacionales genéricas: todo lo que digas debe estar anclado en la evidencia que el usuario entregó.

PERFIL:
Nombre: ${nombre || "(no proporcionado)"} · Edad: ${years != null ? years + " años" : "(no proporcionada)"}

REGLAS ESTRICTAS DE EVIDENCIA (obligatorias):
1. SOLO puedes afirmar cosas que el usuario escribió textualmente o que seleccionó en sus respuestas. Nada más.
2. PROHIBIDO inventar o asumir: profesión, familia, hijos, pareja, logros, circunstancias, motivaciones o emociones que el usuario no mencionó. Si no lo dijo, no existe.
3. Cada afirmación que hagas debe ser rastreable a una respuesta específica. Si no puedes señalar de qué respuesta sale, elimínala.
4. El reconocimiento positivo sale EXCLUSIVAMENTE de: la respuesta abierta 3 (su evidencia de confianza) y las respuestas cerradas donde eligió A o B. Si la respuesta 3 es vacía o débil, NO inventes logros: reconoce únicamente que completó el análisis con honestidad.
5. Género: NUNCA lo asumas ni lo marques. Prohibido "mujer/hombre", "tú mismo/tú misma", y cualquier adjetivo con terminación de género (cansado/a, orgulloso/a, capaz de lograrlo solo/a). Usa siempre construcciones neutras: "tu propia descripción", "lo que has demostrado", "tienes la capacidad de".
6. Tono: directo y honesto. Ni halagos vacíos ni dureza teatral. La fuerza viene de citar su propia evidencia, no de dramatizar.
${fix}
EVIDENCIA CUANTITATIVA (escala A=4 mejor, D=1 peor):
Puntaje total: ${sc.total}/80 · Nivel: ${nivel}
Energía ${sc.area[0]}/20 · Control ${sc.area[1]}/20 · Crecimiento ${sc.area[2]}/20 · Capital ${sc.area[3]}/20
Área más fuerte: ${AREAS[sc.strongest]} · Área más débil (prioritaria): ${AREAS[sc.weakest]}

RESPUESTAS CERRADAS:
${closed}

RESPUESTAS ABIERTAS (Reflexión V1):
1. Área que evita arreglar: "${abiertas[0]}"
2. Mentira que más se repite: "${abiertas[1]}"
3. Evidencia de que puede confiar en sí: "${abiertas[2]}"
4. Promesa rota que más le duele: "${abiertas[3]}"
5. Qué perdería si nada cambia en 5 años: "${abiertas[4]}"
6. Qué tolera hoy que le generaría arrepentimiento en 5 años: "${abiertas[5]}"

TAREA: Cruza lo cuantitativo con lo cualitativo. Detecta contradicciones, patrones repetidos entre áreas, y la narrativa central de su V1. Cita o parafrasea sus propias palabras cuando refuerce el diagnóstico.

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin backticks, sin texto adicional, con esta estructura exacta:
{"mensaje_personal": "3 a 5 oraciones con esta estructura fija: (1) abre con su nombre y edad; (2) reconoce algo positivo tomado LITERALMENTE de su respuesta abierta 3 o de sus respuestas A/B; (3) señala con firmeza la brecha en su área más débil usando lo que respondió ahí; (4) cierra con un llamado directo a tomar el control en esa área. Cero datos inventados, cero marca de género", "hallazgos": ["exactamente 4 strings, uno por área en orden Energía/Control/Crecimiento/Capital, máximo 18 palabras cada uno, anclado a una respuesta específica"], "area_evitada": "frase corta", "miedo_principal": "frase corta", "excusa_principal": "paráfrasis corta de su mentira central", "promesa_rota": "frase corta", "frases_v1": ["2 a 3 frases cortas que su V1 usa, basadas en sus propias palabras"], "dominios_v1": ["2 a 4 palabras"], "patron_dominante": "1-2 oraciones", "diagnostico_narrativo": "4 a 6 oraciones que crucen números con palabras y cierren con qué cambia primero y por qué", "recomendacion_inmediata": "1 acción concreta para las próximas 24 horas"}`;
}

async function callClaude(prompt: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

Deno.serve(async (req) => {
  const cors = {
    // TODO antes de producción: cambiar "*" por "https://thev2project.com"
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { lead_id, nombre, fecha_nacimiento, respuestas, abiertas } = await req.json();

    // ---- Validación de entrada ----
    if (!lead_id || !Array.isArray(respuestas) || respuestas.length !== 20 || !Array.isArray(abiertas) || abiertas.length !== 6) {
      return new Response(JSON.stringify({ error: "payload inválido" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (respuestas.some((r: any) => !Number.isInteger(r) || r < 0 || r > 3)) {
      return new Response(JSON.stringify({ error: "respuestas fuera de rango" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ---- Actualizar lead con perfil ----
    await supabase.from("leads").update({ nombre, fecha_nacimiento }).eq("id", lead_id);

    // ---- Scores server-side (no se confía en el cliente) ----
    const sc = computeScores(respuestas);
    const nivel = LEVELS.find((l) => sc.total >= l.min && sc.total <= l.max)!.name;
    const years = edad(fecha_nacimiento);

    // ---- Diagnóstico IA con validación anti-género (1 reintento) ----
    let diagnostico: any = null;
    try {
      diagnostico = await callClaude(buildPrompt(nombre, years, respuestas, abiertas, sc));
      const flat = JSON.stringify(diagnostico);
      if (GENDER_PATTERNS.test(flat)) {
        diagnostico = await callClaude(buildPrompt(nombre, years, respuestas, abiertas, sc,
          "\nADVERTENCIA: tu intento anterior incluyó marcas de género prohibidas. Reescribe TODO con redacción 100% neutra.\n"));
      }
    } catch (_e) {
      diagnostico = null; // El frontend tiene fallback determinístico
    }

    // ---- Guardar radiografía ----
    const { count } = await supabase.from("radiografias").select("id", { count: "exact", head: true }).eq("lead_id", lead_id);
    const { data: radio, error } = await supabase.from("radiografias").insert({
      lead_id,
      respuestas_cerradas: respuestas,
      respuestas_abiertas: abiertas,
      score_total: sc.total,
      score_energia: sc.area[0],
      score_control: sc.area[1],
      score_crecimiento: sc.area[2],
      score_capital: sc.area[3],
      nivel,
      area_fuerte: AREAS[sc.strongest],
      area_debil: AREAS[sc.weakest],
      area_prioritaria: AREAS[sc.weakest],
      diagnostico_ia: diagnostico,
      numero_radiografia: (count ?? 0) + 1,
    }).select().single();
    if (error) throw error;

    // ---- Crear misión pendiente (Stage 02) y desbloquear progreso ----
    await supabase.from("misiones").insert({
      radiografia_id: radio.id,
      lead_id,
      tipo: MISSION_TYPES[AREAS[sc.weakest]],
    });
    await supabase.from("stage_progreso").upsert(
      [{ lead_id, stage: 1, estado: "completado" }, { lead_id, stage: 2, estado: "desbloqueado" }],
      { onConflict: "lead_id,stage" },
    );

    // TODO: Integrar Resend para envío del informe por correo.
    // supabase secrets set RESEND_API_KEY=re_...
    // Generar HTML del informe y enviarlo a leads.email.

    return new Response(JSON.stringify({
      radiografia_id: radio.id,
      scores: { area: sc.area, total: sc.total },
      nivel,
      area_fuerte: AREAS[sc.strongest],
      area_prioritaria: AREAS[sc.weakest],
      diagnostico,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
