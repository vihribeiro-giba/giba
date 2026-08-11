-- Snapshots independentes dos contratos gerados a partir da Agenda.
-- O conteúdo salvo aqui pode ser editado sem alterar o modelo global.
create extension if not exists pgcrypto;

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  contract_number text not null,
  title text not null,
  status text not null default 'gerado' check (status in ('pendente', 'gerado', 'enviado', 'assinado', 'cancelado')),
  content text not null default '',
  client_name text not null default '',
  format_name text not null default '',
  event_date date,
  location text not null default '',
  client_snapshot jsonb not null default '{}'::jsonb,
  company_snapshot jsonb not null default '{}'::jsonb,
  event_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id),
  unique (user_id, contract_number)
);

create index if not exists contracts_user_status_idx on public.contracts(user_id, status);
create index if not exists contracts_user_event_date_idx on public.contracts(user_id, event_date);

create or replace function public.set_contracts_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at before update on public.contracts
for each row execute function public.set_contracts_updated_at();

alter table public.contracts enable row level security;

drop policy if exists contracts_account_read on public.contracts;
create policy contracts_account_read on public.contracts
for select to authenticated
using (
  user_id = public.giba_current_account_user_id()
  and public.giba_has_any_module_access(array['contratos'])
);

drop policy if exists contracts_account_write on public.contracts;
create policy contracts_account_write on public.contracts
for all to authenticated
using (
  user_id = public.giba_current_account_user_id()
  and public.giba_has_module_access('contratos')
)
with check (
  user_id = public.giba_current_account_user_id()
  and public.giba_has_module_access('contratos')
);

notify pgrst, 'reload schema';
