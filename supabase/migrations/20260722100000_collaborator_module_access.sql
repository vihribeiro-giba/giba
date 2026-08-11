-- Acesso modular dos colaboradores da Plataforma GIBA.
-- Mantém colaboradores legados na Agenda do Colaborador e não promove ninguém a administrador.

alter table public.company_settings
  add column if not exists professional_domain text;

alter table public.collaborators
  add column if not exists contact_email text,
  add column if not exists access_profile text not null default 'personalizado',
  add column if not exists allowed_modules text[] not null default '{}',
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

alter table public.collaborators
  drop constraint if exists collaborators_access_profile_check;

alter table public.collaborators
  add constraint collaborators_access_profile_check
  check (access_profile in ('musico_tecnico', 'producao', 'vendas', 'financeiro', 'administrador', 'personalizado'));

update public.collaborators
set
  allowed_modules = array['agenda_colaborador']::text[],
  access_profile = 'musico_tecnico'
where coalesce(array_length(allowed_modules, 1), 0) = 0
  and coalesce(senha, '') <> '';

update public.collaborators collaborator
set auth_user_id = auth_user.id
from auth.users auth_user
where collaborator.auth_user_id is null
  and collaborator.email is not null
  and lower(auth_user.email) = lower(collaborator.email);

create unique index if not exists collaborators_auth_user_id_unique
  on public.collaborators(auth_user_id)
  where auth_user_id is not null;

create unique index if not exists collaborators_access_email_unique
  on public.collaborators(lower(email))
  where email is not null and btrim(email) <> '';

create index if not exists collaborators_owner_status_idx
  on public.collaborators(user_id, status);

create or replace function public.giba_current_account_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select c.user_id
      from public.collaborators c
      where c.auth_user_id = auth.uid()
        and c.status = 'Ativo'
      limit 1
    ),
    auth.uid()
  );
$$;

create or replace function public.giba_has_module_access(required_module text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  collaborator_row public.collaborators%rowtype;
  subscription_plan text;
  plan_module text;
begin
  select * into collaborator_row
  from public.collaborators
  where auth_user_id = auth.uid()
  limit 1;

  if not found then
    return auth.uid() is not null;
  end if;

  if collaborator_row.status <> 'Ativo' then
    return false;
  end if;

  if required_module in ('assinatura', 'configuracoes', 'colaboradores') then
    return false;
  end if;

  if not (required_module = any(collaborator_row.allowed_modules)) then
    return false;
  end if;

  select s.plano into subscription_plan
  from public.subscriptions s
  where s.user_id = collaborator_row.user_id
    and s.status = 'ativo'
    and (s.data_fim is null or s.data_fim >= now())
  order by s.created_at desc
  limit 1;

  if subscription_plan is null then
    return false;
  end if;

  if subscription_plan = 'owner' then
    return true;
  end if;

  plan_module := case required_module
    when 'agenda_colaborador' then 'agenda'
    when 'calculadora_show' then 'calculadora-show'
    else required_module
  end;

  return exists (
    select 1
    from public.plan_features feature
    where feature.plano = subscription_plan
      and feature.modulo = plan_module
      and feature.ativo = true
  );
end;
$$;

drop policy if exists proposals_storage_collaborator_read on storage.objects;
create policy proposals_storage_collaborator_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'proposals'
    and (storage.foldername(name))[1] = public.giba_current_account_user_id()::text
    and public.giba_has_module_access('propostas')
  );

drop policy if exists proposals_storage_collaborator_write on storage.objects;
create policy proposals_storage_collaborator_write on storage.objects
  for all to authenticated
  using (
    bucket_id = 'proposals'
    and (storage.foldername(name))[1] = public.giba_current_account_user_id()::text
    and public.giba_has_module_access('propostas')
  )
  with check (
    bucket_id = 'proposals'
    and (storage.foldername(name))[1] = public.giba_current_account_user_id()::text
    and public.giba_has_module_access('propostas')
  );

grant execute on function public.giba_current_account_user_id() to authenticated;
grant execute on function public.giba_has_module_access(text) to authenticated;

create or replace function public.giba_has_any_module_access(required_modules text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from unnest(required_modules) module_key
    where public.giba_has_module_access(module_key)
  );
$$;

grant execute on function public.giba_has_any_module_access(text[]) to authenticated;

alter table public.collaborators enable row level security;

drop policy if exists collaborators_self_read on public.collaborators;
create policy collaborators_self_read on public.collaborators
  for select to authenticated
  using (
    auth.uid() = auth_user_id
    or auth.uid() = user_id
  );

-- Adiciona uma política complementar apenas às tabelas existentes que possuem user_id.
-- As políticas atuais do titular são preservadas.
do $$
declare
  item record;
  policy_name text;
begin
  for item in
    select * from (values
      ('clients', 'clientes'),
      ('events', 'agenda'),
      ('finance', 'financeiro'),
      ('accounts_receivable', 'financeiro'),
      ('recurring_expenses', 'financeiro'),
      ('show_formats', 'formatos'),
      ('show_calculations', 'calculadora_show'),
      ('municipios', 'crm'),
      ('crm_oportunidades', 'crm'),
      ('proposal_templates', 'propostas'),
      ('proposals', 'propostas'),
      ('contract_settings', 'contratos')
    ) as access_table(table_name, module_key)
  loop
    if to_regclass(format('public.%I', item.table_name)) is not null
      and exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = item.table_name
          and column_name = 'user_id'
      ) then
      policy_name := format('%s_collaborator_module_access', item.table_name);
      execute format('drop policy if exists %I on public.%I', policy_name, item.table_name);
      execute format(
        'create policy %I on public.%I for all to authenticated using (user_id = public.giba_current_account_user_id() and public.giba_has_module_access(%L)) with check (user_id = public.giba_current_account_user_id() and public.giba_has_module_access(%L))',
        policy_name,
        item.table_name,
        item.module_key,
        item.module_key
      );
    end if;
  end loop;
end;
$$;

-- Refina as políticas complementares: leitura para módulos consumidores e escrita somente para o módulo responsável.
do $$
declare
  item record;
  old_policy text;
  read_policy text;
  write_policy text;
begin
  for item in
    select * from (values
      ('clients', 'dashboard,clientes,agenda,contratos,propostas,calculadora_show', 'clientes'),
      ('events', 'dashboard,agenda,agenda_colaborador,contratos,financeiro,relatorios,propostas', 'agenda'),
      ('finance', 'dashboard,agenda,financeiro,relatorios,calculadora_show', 'agenda,financeiro,calculadora_show'),
      ('accounts_receivable', 'financeiro,relatorios', 'financeiro'),
      ('recurring_expenses', 'financeiro,relatorios', 'financeiro'),
      ('show_formats', 'agenda,formatos,calculadora_show,propostas', 'formatos'),
      ('show_calculations', 'calculadora_show', 'calculadora_show'),
      ('municipios', 'crm', 'crm'),
      ('municipio_eventos', 'crm', 'crm'),
      ('crm_oportunidades', 'crm', 'crm'),
      ('crm_interacoes', 'crm', 'crm'),
      ('proposal_templates', 'propostas', 'propostas'),
      ('proposals', 'propostas', 'propostas'),
      ('contract_settings', 'contratos', 'contratos')
    ) as access_table(table_name, read_modules, write_modules)
  loop
    if to_regclass(format('public.%I', item.table_name)) is not null
      and exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = item.table_name and column_name = 'user_id'
      ) then
      old_policy := format('%s_collaborator_module_access', item.table_name);
      read_policy := format('%s_collaborator_module_read', item.table_name);
      write_policy := format('%s_collaborator_module_write', item.table_name);
      execute format('drop policy if exists %I on public.%I', old_policy, item.table_name);
      execute format('drop policy if exists %I on public.%I', read_policy, item.table_name);
      execute format('drop policy if exists %I on public.%I', write_policy, item.table_name);
      execute format(
        'create policy %I on public.%I for select to authenticated using (user_id = public.giba_current_account_user_id() and public.giba_has_any_module_access(string_to_array(%L, '','')))',
        read_policy, item.table_name, item.read_modules
      );
      execute format(
        'create policy %I on public.%I for all to authenticated using (user_id = public.giba_current_account_user_id() and public.giba_has_any_module_access(string_to_array(%L, '',''))) with check (user_id = public.giba_current_account_user_id() and public.giba_has_any_module_access(string_to_array(%L, '','')))',
        write_policy, item.table_name, item.write_modules, item.write_modules
      );
    end if;
  end loop;
end;
$$;

do $$
begin
  if to_regclass('public.event_collaborators') is not null
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'event_collaborators' and column_name = 'event_id') then
    execute 'alter table public.event_collaborators enable row level security';
    execute 'drop policy if exists event_collaborators_module_read on public.event_collaborators';
    execute 'drop policy if exists event_collaborators_module_write on public.event_collaborators';
    execute 'create policy event_collaborators_module_read on public.event_collaborators for select to authenticated using (exists (select 1 from public.events event where event.id = event_id and event.user_id = public.giba_current_account_user_id()) and public.giba_has_any_module_access(array[''agenda'', ''agenda_colaborador'']))';
    execute 'create policy event_collaborators_module_write on public.event_collaborators for all to authenticated using (exists (select 1 from public.events event where event.id = event_id and event.user_id = public.giba_current_account_user_id()) and public.giba_has_module_access(''agenda'')) with check (exists (select 1 from public.events event where event.id = event_id and event.user_id = public.giba_current_account_user_id()) and public.giba_has_module_access(''agenda''))';
  end if;
end;
$$;

drop policy if exists collaborators_account_team_read on public.collaborators;
create policy collaborators_account_team_read on public.collaborators
  for select to authenticated
  using (
    user_id = public.giba_current_account_user_id()
    and public.giba_has_any_module_access(array['agenda', 'agenda_colaborador', 'financeiro', 'calculadora_show'])
  );

do $$
begin
  if to_regclass('public.company_settings') is not null then
    execute 'drop policy if exists company_settings_collaborator_read on public.company_settings';
    execute 'create policy company_settings_collaborator_read on public.company_settings for select to authenticated using (user_id = public.giba_current_account_user_id() and public.giba_has_any_module_access(array[''dashboard'', ''contratos'', ''propostas'']))';
  end if;
end;
$$;

-- Garante que a API REST reconheça imediatamente as novas colunas.
notify pgrst, 'reload schema';
