-- ============================================================
-- THE V2 PROJECT · Esquema Supabase
-- Stage 01 (Radiografía) + estructura preparada para Stages 02-04
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ---------- LEADS (captura en landing: correo + whatsapp) ----------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  whatsapp text not null,
  nombre text,
  fecha_nacimiento date,
  origen text default 'landing',
  created_at timestamptz not null default now()
);

create unique index if not exists leads_email_unique on leads (lower(email));

-- ---------- RADIOGRAFÍAS (Stage 01) ----------
create table if not exists radiografias (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  respuestas_cerradas jsonb not null,   -- array de 20 índices (0=A..3=D)
  respuestas_abiertas jsonb not null,   -- array de 6 textos
  score_total int not null,
  score_energia int not null,
  score_control int not null,
  score_crecimiento int not null,
  score_capital int not null,
  nivel text not null,                  -- V1 DOMINA | DESPERTANDO | ...
  area_fuerte text not null,
  area_debil text not null,
  area_prioritaria text not null,
  diagnostico_ia jsonb,                 -- JSON completo devuelto por Claude
  numero_radiografia int not null default 1, -- 1=baseline, 2+=re-tomas (Stage 04)
  created_at timestamptz not null default now()
);

create index if not exists radiografias_lead_idx on radiografias (lead_id);

-- ---------- MISIONES (Stage 02) ----------
create table if not exists misiones (
  id uuid primary key default gen_random_uuid(),
  radiografia_id uuid not null references radiografias(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  tipo text not null,                   -- 7_dias_sin_negociar | 7_dias_energia | 7_dias_orden_financiero | 7_dias_expansion
  fecha_inicio date,
  fecha_fin date,
  estado text not null default 'pendiente', -- pendiente | activa | completada | fallida
  created_at timestamptz not null default now()
);

create table if not exists mision_checkins (
  id uuid primary key default gen_random_uuid(),
  mision_id uuid not null references misiones(id) on delete cascade,
  dia int not null check (dia between 1 and 7),
  cumplido boolean not null,
  nota text,
  canal text default 'web',             -- web | whatsapp (bot V2 - WhatsApp Cloud API)
  created_at timestamptz not null default now(),
  unique (mision_id, dia)
);

-- ---------- PROGRESO DE STAGES (03-04) ----------
create table if not exists stage_progreso (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  stage int not null check (stage between 1 and 4),
  estado text not null default 'desbloqueado', -- bloqueado | desbloqueado | en_curso | completado
  datos jsonb,                          -- payload flexible por stage
  actualizado_at timestamptz not null default now(),
  unique (lead_id, stage)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Principio: el navegador solo puede INSERTAR leads.
-- Todo lo demás pasa por la Edge Function (service role).
-- ============================================================
alter table leads enable row level security;
alter table radiografias enable row level security;
alter table misiones enable row level security;
alter table mision_checkins enable row level security;
alter table stage_progreso enable row level security;

-- Anónimos pueden crear leads (captura en landing)
create policy "anon_insert_leads" on leads
  for insert to anon with check (true);

-- Nada más es accesible con la anon key.
-- La Edge Function usa SERVICE_ROLE_KEY y bypassa RLS.

-- ============================================================
-- VISTA DE INTELIGENCIA (uso interno: contenido para marca personal)
-- Excusas y áreas evitadas más frecuentes en la base.
-- ============================================================
create or replace view inteligencia_v1 as
select
  diagnostico_ia->>'excusa_principal'  as excusa,
  diagnostico_ia->>'area_evitada'      as area_evitada,
  area_prioritaria,
  nivel,
  created_at
from radiografias
where diagnostico_ia is not null;
