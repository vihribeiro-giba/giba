-- Alinha a identificacao do titular e do colaborador com o perfil do Supabase Auth.
-- Apenas usuarios criados explicitamente como colaboradores usam a conta vinculada.
create or replace function public.giba_current_account_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when coalesce(auth.jwt() -> 'user_metadata' ->> 'giba_role', '') <> 'collaborator'
      then auth.uid()
    else coalesce(
      (
        select c.user_id
        from public.collaborators c
        where c.auth_user_id = auth.uid()
          and c.status = 'Ativo'
        limit 1
      ),
      auth.uid()
    )
  end;
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
  if auth.uid() is null then
    return false;
  end if;

  if coalesce(auth.jwt() -> 'user_metadata' ->> 'giba_role', '') <> 'collaborator' then
    return true;
  end if;

  select * into collaborator_row
  from public.collaborators
  where auth_user_id = auth.uid()
  limit 1;

  if not found or collaborator_row.status <> 'Ativo' then
    return false;
  end if;

  if required_module in ('assinatura', 'configuracoes', 'colaboradores') then
    return false;
  end if;

  if not (required_module = any(coalesce(collaborator_row.allowed_modules, '{}'::text[]))) then
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

grant execute on function public.giba_current_account_user_id() to authenticated;
grant execute on function public.giba_has_module_access(text) to authenticated;

notify pgrst, 'reload schema';
