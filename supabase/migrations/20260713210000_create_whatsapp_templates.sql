create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  message_type text not null check (length(trim(message_type)) > 0),
  content text not null check (length(trim(content)) > 0),
  is_default boolean not null default false,
  system_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, system_key)
);

create index if not exists whatsapp_templates_user_id_idx
  on public.whatsapp_templates (user_id);

create unique index if not exists whatsapp_templates_default_idx
  on public.whatsapp_templates (user_id, message_type)
  where is_default = true;

alter table public.whatsapp_templates enable row level security;

revoke all on public.whatsapp_templates from anon;
grant select, insert, update, delete on public.whatsapp_templates to authenticated;

drop policy if exists "whatsapp_templates_select_own" on public.whatsapp_templates;
drop policy if exists "whatsapp_templates_insert_own" on public.whatsapp_templates;
drop policy if exists "whatsapp_templates_update_own" on public.whatsapp_templates;
drop policy if exists "whatsapp_templates_delete_own" on public.whatsapp_templates;

create policy "whatsapp_templates_select_own"
  on public.whatsapp_templates
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "whatsapp_templates_insert_own"
  on public.whatsapp_templates
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "whatsapp_templates_update_own"
  on public.whatsapp_templates
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "whatsapp_templates_delete_own"
  on public.whatsapp_templates
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_whatsapp_templates_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists whatsapp_templates_updated_at on public.whatsapp_templates;
create trigger whatsapp_templates_updated_at
before update on public.whatsapp_templates
for each row
execute function public.set_whatsapp_templates_updated_at();

create or replace function public.replace_whatsapp_templates(p_templates jsonb)
returns setof public.whatsapp_templates
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  delete from public.whatsapp_templates
  where user_id = current_user_id;

  insert into public.whatsapp_templates (
    id,
    user_id,
    name,
    message_type,
    content,
    is_default,
    system_key,
    created_at,
    updated_at
  )
  select
    coalesce(nullif(item->>'id', '')::uuid, gen_random_uuid()),
    current_user_id,
    trim(item->>'name'),
    trim(item->>'message_type'),
    item->>'content',
    coalesce((item->>'is_default')::boolean, false),
    nullif(item->>'system_key', ''),
    coalesce(nullif(item->>'created_at', '')::timestamptz, now()),
    now()
  from jsonb_array_elements(coalesce(p_templates, '[]'::jsonb)) as item;

  return query
  select wt.*
  from public.whatsapp_templates as wt
  where wt.user_id = current_user_id
  order by wt.created_at asc;
end;
$$;

revoke all on function public.replace_whatsapp_templates(jsonb) from public;
grant execute on function public.replace_whatsapp_templates(jsonb) to authenticated;
