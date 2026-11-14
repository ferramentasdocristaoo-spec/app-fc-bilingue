-- 2026-11-14 · Planos por SKU da KawaiPay + trava de idiomas (FC bilíngue).
-- NÃO aplicada automaticamente: o dono roda (roteiro em PENDENTE-JARVIS.md).
-- Idempotente: pode rodar de novo sem estragar o que já existe em produção.

-- 1) Mapa SKU → plano. A tabela já existe em produção (o purchase-webhook lê plan_name/months);
--    aqui só garantimos a estrutura e a coluna nova.
CREATE TABLE IF NOT EXISTS public.sku_plans (
  sku text PRIMARY KEY,
  plan_name text NOT NULL,
  months integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sku_plans ADD COLUMN IF NOT EXISTS months integer NOT NULL DEFAULT 1;
ALTER TABLE public.sku_plans ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
-- Adicional de idiomas (order bump) e planos internacionais: liberam os 7 idiomas.
ALTER TABLE public.sku_plans ADD COLUMN IF NOT EXISTS unlocks_languages boolean NOT NULL DEFAULT false;
-- months = 0 → o SKU não dá validade própria (só o adicional de idiomas).
ALTER TABLE public.sku_plans DROP CONSTRAINT IF EXISTS sku_plans_months_check;
ALTER TABLE public.sku_plans ADD CONSTRAINT sku_plans_months_check CHECK (months >= 0);
-- Só o webhook (service role) lê e escreve; sem política pública.
ALTER TABLE public.sku_plans ENABLE ROW LEVEL SECURITY;

-- 2) Flag por usuário: idiomas além do pt-BR liberados (adicional pago ou plano internacional).
ALTER TABLE public.approved_emails ADD COLUMN IF NOT EXISTS idiomas_liberados boolean NOT NULL DEFAULT false;
ALTER TABLE public.approved_emails ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- 3) RPC lida pelo app no login: status + plano, sem expor a tabela.
--    app_access_status(text) continua igual (o Worker fc-content usa).
CREATE OR REPLACE FUNCTION public.app_access_info(_email text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'status', CASE
      WHEN a.id IS NULL THEN 'not_approved'
      WHEN a.bloqueado THEN 'blocked'
      WHEN a.expires_at IS NOT NULL AND a.expires_at < now() THEN 'expired'
      ELSE 'ok'
    END,
    'plan', a.plan,
    'expires_at', a.expires_at,
    'idiomas_liberados', COALESCE(a.idiomas_liberados, false)
  )
  FROM (SELECT lower(trim(_email)) AS email) q
  LEFT JOIN public.approved_emails a ON a.email = q.email;
$$;

REVOKE ALL ON FUNCTION public.app_access_info(text) FROM public;
GRANT EXECUTE ON FUNCTION public.app_access_info(text) TO anon, authenticated;
