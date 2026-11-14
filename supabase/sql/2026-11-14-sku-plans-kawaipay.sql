-- 2026-11-14 · Linhas do mapa de planos para os produtos da KawaiPay (FC bilíngue).
-- ANTES DE RODAR: trocar cada <PLACEHOLDER> pelo ID (ou SKU) do produto na KawaiPay.
-- O webhook compara o valor da coluna `sku` com `product_sku` E com `product_id` do evento,
-- então pode colar qualquer um dos dois. Rodar depois da migration 20261114010000.
--
-- plan_name: br_* = Brasil (só pt-BR no plano base); intl_* = fora do Brasil (7 idiomas);
-- adicional_idiomas = order bump que libera os 7 idiomas sem mexer na validade (months = 0).

INSERT INTO public.sku_plans (sku, plan_name, months, unlocks_languages) VALUES
  ('<ID_PRODUTO_KAWAIPAY_MENSAL>',               'br_mensal',         1,  false),
  ('<ID_PRODUTO_KAWAIPAY_3M>',                   'br_3m',             3,  false),
  ('<ID_PRODUTO_KAWAIPAY_6M>',                   'br_6m',             6,  false),
  ('<ID_PRODUTO_KAWAIPAY_12M>',                  'br_12m',            12, false),
  ('<ID_PRODUTO_KAWAIPAY_ADICIONAL_IDIOMAS>',    'adicional_idiomas', 0,  true),
  ('<ID_PRODUTO_KAWAIPAY_INTERNACIONAL_MENSAL>', 'intl_mensal',       1,  true)
ON CONFLICT (sku) DO UPDATE
  SET plan_name = EXCLUDED.plan_name,
      months = EXCLUDED.months,
      unlocks_languages = EXCLUDED.unlocks_languages;

-- Conferir:
-- SELECT sku, plan_name, months, unlocks_languages FROM public.sku_plans ORDER BY plan_name;
