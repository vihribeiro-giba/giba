alter table public.show_formats
  add column if not exists input_list_path text,
  add column if not exists input_list_name text,
  add column if not exists input_list_size bigint,
  add column if not exists input_list_updated_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'show-format-documents',
  'show-format-documents',
  false,
  15728640,
  array['application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists show_format_files_read on storage.objects;
create policy show_format_files_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'show-format-documents'
    and (storage.foldername(name))[1] = public.giba_current_account_user_id()::text
    and exists (
      select 1
      from public.show_formats sf
      where sf.id = ((storage.foldername(name))[2])::uuid
        and sf.user_id = public.giba_current_account_user_id()
    )
  );

drop policy if exists show_format_files_insert on storage.objects;
create policy show_format_files_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'show-format-documents'
    and (storage.foldername(name))[1] = public.giba_current_account_user_id()::text
    and public.giba_has_module_access('formatos')
    and exists (
      select 1
      from public.show_formats sf
      where sf.id = ((storage.foldername(name))[2])::uuid
        and sf.user_id = public.giba_current_account_user_id()
    )
  );

drop policy if exists show_format_files_delete on storage.objects;
create policy show_format_files_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'show-format-documents'
    and (storage.foldername(name))[1] = public.giba_current_account_user_id()::text
    and public.giba_has_module_access('formatos')
    and exists (
      select 1
      from public.show_formats sf
      where sf.id = ((storage.foldername(name))[2])::uuid
        and sf.user_id = public.giba_current_account_user_id()
    )
  );

notify pgrst, 'reload schema';
