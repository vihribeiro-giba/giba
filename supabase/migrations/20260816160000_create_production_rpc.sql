-- Criação transacional e segura de uma produção.
-- A conta e o autor são obtidos do JWT; o cliente não escolhe esses identificadores.
create or replace function public.giba_create_production(production_payload jsonb)
returns setof public.productions
language plpgsql
security definer
set search_path = public
as $$
declare
  account_user_id uuid;
  auth_role text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  account_user_id := public.giba_current_account_user_id();
  auth_role := coalesce(auth.jwt() -> 'user_metadata' ->> 'giba_role', '');

  if account_user_id is null then
    raise exception 'Conta do GIBA não identificada.' using errcode = '42501';
  end if;

  if auth_role = 'collaborator' and not public.giba_has_module_access('producao') then
    raise exception 'Colaborador sem acesso ao módulo Produção.' using errcode = '42501';
  end if;

  return query
  insert into public.productions (
    user_id,
    event_id,
    contract_id,
    name,
    client_name,
    event_type,
    event_date,
    start_time,
    end_time,
    venue,
    address,
    city,
    estimated_audience,
    format_name,
    manager_collaborator_id,
    status,
    internal_notes,
    created_by
  ) values (
    account_user_id,
    nullif(production_payload ->> 'event_id', '')::uuid,
    nullif(production_payload ->> 'contract_id', '')::uuid,
    btrim(coalesce(production_payload ->> 'name', '')),
    coalesce(production_payload ->> 'client_name', ''),
    coalesce(production_payload ->> 'event_type', ''),
    nullif(production_payload ->> 'event_date', '')::date,
    nullif(production_payload ->> 'start_time', '')::time,
    nullif(production_payload ->> 'end_time', '')::time,
    coalesce(production_payload ->> 'venue', ''),
    coalesce(production_payload ->> 'address', ''),
    coalesce(production_payload ->> 'city', ''),
    nullif(production_payload ->> 'estimated_audience', '')::integer,
    coalesce(production_payload ->> 'format_name', ''),
    nullif(production_payload ->> 'manager_collaborator_id', '')::uuid,
    coalesce(nullif(production_payload ->> 'status', ''), 'planejamento'),
    coalesce(production_payload ->> 'internal_notes', ''),
    auth.uid()
  )
  returning *;
end;
$$;

revoke all on function public.giba_create_production(jsonb) from public;
grant execute on function public.giba_create_production(jsonb) to authenticated;

notify pgrst, 'reload schema';
