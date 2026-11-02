-- Reforma backend (Cloudflare): status de acesso do app sem expor a tabela approved_emails.
-- Usada pelo Worker fc-content (upload de imagens do mural) e pelo login do app.
-- NÃO aplicada automaticamente: ver roteiro em Kawai-Jarvis/relatorios/2026-11-02-reforma-backend-fc.md.

CREATE OR REPLACE FUNCTION public.app_access_status(_email text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN a.id IS NULL THEN 'not_approved'
    WHEN a.bloqueado THEN 'blocked'
    WHEN a.expires_at IS NOT NULL AND a.expires_at < now() THEN 'expired'
    ELSE 'ok'
  END
  FROM (SELECT lower(trim(_email)) AS email) q
  LEFT JOIN public.approved_emails a ON a.email = q.email;
$$;

REVOKE ALL ON FUNCTION public.app_access_status(text) FROM public;
GRANT EXECUTE ON FUNCTION public.app_access_status(text) TO anon, authenticated;

-- Garante as colunas usadas pelo app (existem em produção, faltavam no histórico de migrações).
ALTER TABLE public.approved_emails ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.approved_emails ADD COLUMN IF NOT EXISTS plan text;
ALTER TABLE public.approved_emails ADD COLUMN IF NOT EXISTS sku text;
