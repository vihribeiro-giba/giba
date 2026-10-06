-- Modulo Producao: operacao de eventos, equipe, tarefas, cronograma e documentos.
create extension if not exists pgcrypto;

create table if not exists public.productions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  name text not null,
  client_name text not null default '',
  event_type text not null default '',
  event_date date,
  start_time time,
  end_time time,
  venue text not null default '',
  address text not null default '',
  city text not null default '',
  estimated_audience integer check (estimated_audience is null or estimated_audience >= 0),
  format_name text not null default '',
  manager_collaborator_id uuid references public.collaborators(id) on delete set null,
  status text not null default 'planejamento' check (status in (
    'planejamento', 'em_producao', 'aguardando_confirmacao',
    'pronto', 'em_execucao', 'finalizado', 'cancelado'
  )),
  internal_notes text not null default '',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create table if not exists public.production_tasks (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'Outros',
  assignee_collaborator_id uuid references public.collaborators(id) on delete set null,
  due_at timestamptz,
  priority text not null default 'normal' check (priority in ('baixa', 'normal', 'alta', 'urgente')),
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida')),
  notes text not null default '',
  completed_at timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_schedule_items (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  scheduled_date date not null,
  start_time time not null,
  end_time time,
  location text not null default '',
  responsible_collaborator_id uuid references public.collaborators(id) on delete set null,
  notes text not null default '',
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_members (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  collaborator_id uuid not null references public.collaborators(id) on delete cascade,
  event_role text not null default '',
  phone text not null default '',
  notes text not null default '',
  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_manage_tasks boolean not null default false,
  can_manage_schedule boolean not null default false,
  can_manage_team boolean not null default false,
  can_manage_documents boolean not null default false,
  can_view_financial boolean not null default false,
  can_finalize boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (production_id, collaborator_id)
);

create table if not exists public.production_documents (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Outros',
  storage_path text not null,
  mime_type text not null default '',
  file_size bigint check (file_size is null or file_size >= 0),
  notes text not null default '',
  uploaded_by uuid not null default auth.uid(),
  uploader_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_activity_logs (
  id uuid primary key default gen_random_uuid(),
  production_id uuid not null references public.productions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null default auth.uid(),
  actor_name text not null default '',
  action text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists productions_user_date_idx on public.productions(user_id, event_date);
create index if not exists productions_user_status_idx on public.productions(user_id, status);
create index if not exists productions_manager_idx on public.productions(manager_collaborator_id);
create index if not exists production_tasks_production_status_idx on public.production_tasks(production_id, status);
create index if not exists production_tasks_due_idx on public.production_tasks(due_at) where status <> 'concluida';
create index if not exists production_schedule_order_idx on public.production_schedule_items(production_id, scheduled_date, start_time);
create index if not exists production_members_collaborator_idx on public.production_members(collaborator_id, production_id);
create index if not exists production_documents_production_idx on public.production_documents(production_id, created_at desc);
create index if not exists production_logs_production_idx on public.production_activity_logs(production_id, created_at desc);

create or replace function public.set_production_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists productions_set_updated_at on public.productions;
create trigger productions_set_updated_at before update on public.productions
for each row execute function public.set_production_updated_at();
drop trigger if exists production_tasks_set_updated_at on public.production_tasks;
create trigger production_tasks_set_updated_at before update on public.production_tasks
for each row execute function public.set_production_updated_at();
drop trigger if exists production_schedule_set_updated_at on public.production_schedule_items;
create trigger production_schedule_set_updated_at before update on public.production_schedule_items
for each row execute function public.set_production_updated_at();
drop trigger if exists production_members_set_updated_at on public.production_members;
create trigger production_members_set_updated_at before update on public.production_members
for each row execute function public.set_production_updated_at();
drop trigger if exists production_documents_set_updated_at on public.production_documents;
create trigger production_documents_set_updated_at before update on public.production_documents
for each row execute function public.set_production_updated_at();

create or replace function public.giba_is_production_owner(production_uuid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.productions p
    where p.id = production_uuid
      and p.user_id = auth.uid()
  );
$$;

create or replace function public.giba_production_permission(production_uuid uuid, permission_name text default 'view')
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    public.giba_is_production_owner(production_uuid)
    or exists (
      select 1
      from public.productions p
      join public.production_members pm on pm.production_id = p.id
      join public.collaborators c on c.id = pm.collaborator_id
      where p.id = production_uuid
        and p.user_id = public.giba_current_account_user_id()
        and c.auth_user_id = auth.uid()
        and c.status = 'Ativo'
        and pm.can_view
        and case permission_name
          when 'view' then pm.can_view
          when 'edit' then pm.can_edit
          when 'tasks' then pm.can_manage_tasks
          when 'schedule' then pm.can_manage_schedule
          when 'team' then pm.can_manage_team
          when 'documents' then pm.can_manage_documents
          when 'financial' then pm.can_view_financial
          when 'finalize' then pm.can_finalize
          else false
        end
    )
    or exists (
      select 1 from public.productions p
      where p.id = production_uuid
        and p.created_by = auth.uid()
        and p.user_id = public.giba_current_account_user_id()
        and public.giba_has_module_access('producao')
    );
$$;

revoke all on function public.giba_is_production_owner(uuid) from public;
revoke all on function public.giba_production_permission(uuid, text) from public;
grant execute on function public.giba_is_production_owner(uuid) to authenticated;
grant execute on function public.giba_production_permission(uuid, text) to authenticated;

alter table public.productions enable row level security;
alter table public.production_tasks enable row level security;
alter table public.production_schedule_items enable row level security;
alter table public.production_members enable row level security;
alter table public.production_documents enable row level security;
alter table public.production_activity_logs enable row level security;

grant select, insert, update, delete on table public.productions to authenticated;
grant select, insert, update, delete on table public.production_tasks to authenticated;
grant select, insert, update, delete on table public.production_schedule_items to authenticated;
grant select, insert, update, delete on table public.production_members to authenticated;
grant select, insert, update, delete on table public.production_documents to authenticated;
grant select, insert on table public.production_activity_logs to authenticated;

drop policy if exists productions_read on public.productions;
create policy productions_read on public.productions for select to authenticated
using (public.giba_production_permission(id, 'view'));
drop policy if exists productions_create on public.productions;
create policy productions_create on public.productions for insert to authenticated
with check (
  user_id = public.giba_current_account_user_id()
  and created_by = auth.uid()
  and (
    auth.uid() = user_id
    or public.giba_has_module_access('producao')
  )
);
drop policy if exists productions_update on public.productions;
create policy productions_update on public.productions for update to authenticated
using (public.giba_production_permission(id, 'edit') or public.giba_production_permission(id, 'finalize'))
with check (user_id = public.giba_current_account_user_id());
drop policy if exists productions_delete on public.productions;
create policy productions_delete on public.productions for delete to authenticated
using (public.giba_is_production_owner(id));

drop policy if exists production_tasks_read on public.production_tasks;
create policy production_tasks_read on public.production_tasks for select to authenticated
using (public.giba_production_permission(production_id, 'view'));
drop policy if exists production_tasks_write on public.production_tasks;
create policy production_tasks_write on public.production_tasks for all to authenticated
using (public.giba_production_permission(production_id, 'tasks'))
with check (user_id = public.giba_current_account_user_id() and public.giba_production_permission(production_id, 'tasks'));

drop policy if exists production_schedule_read on public.production_schedule_items;
create policy production_schedule_read on public.production_schedule_items for select to authenticated
using (public.giba_production_permission(production_id, 'view'));
drop policy if exists production_schedule_write on public.production_schedule_items;
create policy production_schedule_write on public.production_schedule_items for all to authenticated
using (public.giba_production_permission(production_id, 'schedule'))
with check (user_id = public.giba_current_account_user_id() and public.giba_production_permission(production_id, 'schedule'));

drop policy if exists production_members_read on public.production_members;
create policy production_members_read on public.production_members for select to authenticated
using (public.giba_production_permission(production_id, 'view'));
drop policy if exists production_members_write on public.production_members;
create policy production_members_write on public.production_members for all to authenticated
using (public.giba_production_permission(production_id, 'team'))
with check (user_id = public.giba_current_account_user_id() and public.giba_production_permission(production_id, 'team'));

drop policy if exists production_documents_read on public.production_documents;
create policy production_documents_read on public.production_documents for select to authenticated
using (public.giba_production_permission(production_id, 'view'));
drop policy if exists production_documents_write on public.production_documents;
create policy production_documents_write on public.production_documents for all to authenticated
using (public.giba_production_permission(production_id, 'documents'))
with check (user_id = public.giba_current_account_user_id() and public.giba_production_permission(production_id, 'documents'));

drop policy if exists production_logs_read on public.production_activity_logs;
create policy production_logs_read on public.production_activity_logs for select to authenticated
using (public.giba_production_permission(production_id, 'view'));
drop policy if exists production_logs_create on public.production_activity_logs;
create policy production_logs_create on public.production_activity_logs for insert to authenticated
with check (user_id = public.giba_current_account_user_id() and public.giba_production_permission(production_id, 'view'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('production-documents', 'production-documents', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists production_files_read on storage.objects;
create policy production_files_read on storage.objects for select to authenticated
using (
  bucket_id = 'production-documents'
  and (storage.foldername(name))[1] = public.giba_current_account_user_id()::text
  and public.giba_production_permission(((storage.foldername(name))[2])::uuid, 'view')
);
drop policy if exists production_files_insert on storage.objects;
create policy production_files_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'production-documents'
  and (storage.foldername(name))[1] = public.giba_current_account_user_id()::text
  and public.giba_production_permission(((storage.foldername(name))[2])::uuid, 'documents')
);
drop policy if exists production_files_update on storage.objects;
create policy production_files_update on storage.objects for update to authenticated
using (bucket_id = 'production-documents' and public.giba_production_permission(((storage.foldername(name))[2])::uuid, 'documents'))
with check (
  bucket_id = 'production-documents'
  and (storage.foldername(name))[1] = public.giba_current_account_user_id()::text
  and public.giba_production_permission(((storage.foldername(name))[2])::uuid, 'documents')
);
drop policy if exists production_files_delete on storage.objects;
create policy production_files_delete on storage.objects for delete to authenticated
using (bucket_id = 'production-documents' and public.giba_production_permission(((storage.foldername(name))[2])::uuid, 'documents'));

insert into public.plan_features (plano, modulo, ativo)
select desired.plano, 'producao', true
from (values ('profissional'), ('expertise'), ('owner')) as desired(plano)
where not exists (
  select 1 from public.plan_features existing
  where existing.plano = desired.plano and existing.modulo = 'producao'
);

notify pgrst, 'reload schema';
