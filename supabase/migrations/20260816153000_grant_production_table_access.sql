-- Concede ao papel autenticado acesso SQL às tabelas do módulo.
-- As políticas RLS permanecem responsáveis por isolar cada conta e colaborador.
grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.productions to authenticated;
grant select, insert, update, delete on table public.production_tasks to authenticated;
grant select, insert, update, delete on table public.production_schedule_items to authenticated;
grant select, insert, update, delete on table public.production_members to authenticated;
grant select, insert, update, delete on table public.production_documents to authenticated;
grant select, insert on table public.production_activity_logs to authenticated;

grant execute on function public.giba_current_account_user_id() to authenticated;
grant execute on function public.giba_has_module_access(text) to authenticated;
grant execute on function public.giba_is_production_owner(uuid) to authenticated;
grant execute on function public.giba_production_permission(uuid, text) to authenticated;

notify pgrst, 'reload schema';
