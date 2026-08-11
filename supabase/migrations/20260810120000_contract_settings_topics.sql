alter table public.contract_settings
  add column if not exists topicos jsonb not null default '[]'::jsonb;

comment on column public.contract_settings.topicos is
  'Tópicos ordenados do modelo único de contrato, com título, conteúdo e variáveis automáticas.';

notify pgrst, 'reload schema';
