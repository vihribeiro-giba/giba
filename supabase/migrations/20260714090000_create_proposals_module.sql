-- Módulo Propostas — revisar no Supabase antes de executar.
create extension if not exists pgcrypto;

alter table public.company_settings add column if not exists instagram text;
alter table public.company_settings add column if not exists signature_url text;

create table if not exists public.proposal_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  last_value integer not null default 0 check (last_value >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, year)
);

create table if not exists public.proposal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  template_type text not null check (template_type in ('classico', 'fotografico')),
  is_default boolean not null default false,
  cover_background_path text not null default '',
  content_background_path text not null default '',
  default_photo_path text not null default '',
  logo_path text not null default '',
  signature_path text not null default '',
  primary_color text not null default '#7c3aed',
  secondary_color text not null default '#0ea5e9',
  text_color text not null default '#ffffff',
  layout_config jsonb not null default '{}'::jsonb,
  default_content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists proposal_templates_one_default_per_user
  on public.proposal_templates(user_id) where is_default;
create index if not exists proposal_templates_user_created_idx
  on public.proposal_templates(user_id, created_at desc);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.proposal_templates(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  format_id uuid references public.show_formats(id) on delete set null,
  proposal_number text not null,
  title text not null,
  status text not null default 'rascunho' check (status in ('rascunho','enviada','em_negociacao','aprovada','recusada','expirada')),
  issue_date date not null default current_date,
  expiration_date date not null,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  payment_terms text not null default '',
  content jsonb not null default '[]'::jsonb,
  visual_config jsonb not null default '{}'::jsonb,
  company_snapshot jsonb not null default '{}'::jsonb,
  client_snapshot jsonb not null default '{}'::jsonb,
  event_snapshot jsonb not null default '{}'::jsonb,
  format_snapshot jsonb not null default '{}'::jsonb,
  generated_pdf_path text,
  generated_cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, proposal_number)
);

create index if not exists proposals_user_status_idx on public.proposals(user_id, status);
create index if not exists proposals_user_updated_idx on public.proposals(user_id, updated_at desc);
create index if not exists proposals_client_idx on public.proposals(client_id);
create index if not exists proposals_event_idx on public.proposals(event_id);

create or replace function public.set_proposals_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists proposal_templates_set_updated_at on public.proposal_templates;
create trigger proposal_templates_set_updated_at before update on public.proposal_templates
for each row execute function public.set_proposals_updated_at();
drop trigger if exists proposals_set_updated_at on public.proposals;
create trigger proposals_set_updated_at before update on public.proposals
for each row execute function public.set_proposals_updated_at();

create or replace function public.reserve_proposal_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_year integer := extract(year from current_date)::integer;
  reserved_value integer;
begin
  if current_user_id is null then raise exception 'Usuário não autenticado'; end if;
  insert into public.proposal_counters(user_id, year, last_value)
  values (current_user_id, current_year, 1)
  on conflict (user_id, year) do update
    set last_value = public.proposal_counters.last_value + 1, updated_at = now()
  returning last_value into reserved_value;
  return 'PROP-' || current_year || '-' || lpad(reserved_value::text, 4, '0');
end;
$$;
revoke all on function public.reserve_proposal_number() from public;
grant execute on function public.reserve_proposal_number() to authenticated;

alter table public.proposal_counters enable row level security;
alter table public.proposal_templates enable row level security;
alter table public.proposals enable row level security;

create policy "proposal counters owner select" on public.proposal_counters for select to authenticated using (auth.uid() = user_id);
create policy "proposal templates owner all" on public.proposal_templates for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "proposals owner all" on public.proposals for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proposals', 'proposals', false, 12582912, array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "proposal files owner select" on storage.objects for select to authenticated
using (bucket_id = 'proposals' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proposal files owner insert" on storage.objects for insert to authenticated
with check (bucket_id = 'proposals' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proposal files owner update" on storage.objects for update to authenticated
using (bucket_id = 'proposals' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'proposals' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proposal files owner delete" on storage.objects for delete to authenticated
using (bucket_id = 'proposals' and (storage.foldername(name))[1] = auth.uid()::text);

update public.plan_features set ativo = true where modulo = 'propostas' and plano in ('profissional', 'expertise');
insert into public.plan_features (plano, modulo, ativo)
select desired.plano, 'propostas', true
from (values ('profissional'), ('expertise')) as desired(plano)
where not exists (
  select 1 from public.plan_features existing
  where existing.plano = desired.plano and existing.modulo = 'propostas'
);
