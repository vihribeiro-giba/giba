-- Permite que o titular autenticado crie producoes da propria conta.
-- Colaboradores continuam sujeitos aos modulos liberados e ao plano ativo.
drop policy if exists productions_create on public.productions;

create policy productions_create
on public.productions
for insert
to authenticated
with check (
  user_id = public.giba_current_account_user_id()
  and created_by = auth.uid()
  and (
    auth.uid() = user_id
    or public.giba_has_module_access('producao')
  )
);

notify pgrst, 'reload schema';
