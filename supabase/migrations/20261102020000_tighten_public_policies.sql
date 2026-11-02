-- Reforma backend — PASSO POSTERIOR (só depois que o app novo estiver no ar usando
-- app_access_status e o Worker fc-content para imagens do mural).
-- 1) A lista inteira de e-mails liberados deixa de ser legível por qualquer visitante.
DROP POLICY IF EXISTS "Anyone can check if email is approved" ON public.approved_emails;

-- 2) Pedidos de oração: qualquer um ainda lê e cria, mas o UPDATE aberto (que deixava
--    reescrever qualquer pedido) vira uma RPC que só soma 1 amém.
DROP POLICY IF EXISTS "Anyone can update prayer requests" ON public.prayer_requests;

CREATE OR REPLACE FUNCTION public.add_prayer_amen(_id uuid)
RETURNS integer
LANGUAGE sql VOLATILE SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.prayer_requests SET amens = amens + 1 WHERE id = _id RETURNING amens;
$$;
GRANT EXECUTE ON FUNCTION public.add_prayer_amen(uuid) TO anon, authenticated;

-- 3) Novas imagens vão para o R2; o bucket antigo para de aceitar upload anônimo.
DROP POLICY IF EXISTS "Anyone can upload prayer images" ON storage.objects;
