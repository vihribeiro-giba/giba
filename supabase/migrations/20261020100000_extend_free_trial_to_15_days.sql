-- Amplia o teste gratuito para 15 dias e estende testes ainda elegiveis.
update public.subscriptions
set
  trial_dias = 15,
  data_fim = case
    when data_inicio is not null then greatest(
      coalesce(data_fim, data_inicio),
      data_inicio + interval '15 days'
    )
    else greatest(
      coalesce(data_fim, now()),
      now() + interval '15 days'
    )
  end,
  status = case
    when status = 'vencido'
      and data_inicio is not null
      and data_inicio + interval '15 days' >= now()
    then 'ativo'
    else status
  end,
  updated_at = now()
where plano = 'teste'
  and coalesce(trial_finalizado, false) = false
  and coalesce(trial_dias, 0) < 15;
