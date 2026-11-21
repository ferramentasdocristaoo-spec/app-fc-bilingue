-- 2026-11-21 · Noé (Tecnologia) · Admin pela sessão + Central de mensagens (push FCM).
-- MIGRAÇÃO SÓ ADITIVA E IDEMPOTENTE. Não rodar com `supabase db push`: o dono cola no SQL Editor do
-- projeto FC-Bilingue (rwyyggtsjbwnwzsnlkgy). Ver PENDENTE-JARVIS.md (21/11).
--
-- O que muda:
--  1) session_admin_email() / is_session_admin(): o usuário logado no Supabase Auth vira admin quando
--     o e-mail dele está em public.admin_users E o e-mail está confirmado (auth.users.email_confirmed_at).
--     Usamos auth.users, e não user_metadata.email_verified do JWT, porque o user_metadata o próprio
--     usuário consegue editar (supabase.auth.updateUser). O e-mail do JWT também precisa bater com o
--     de auth.users (troca de e-mail pendente não vale).
--  2) verify_admin(_email, _password): continua aceitando e-mail + senha (login antigo do painel) e
--     passa a aceitar a sessão admin quando _email vem vazio ou igual ao e-mail da sessão. Todas as
--     RPCs admin_* já chamam verify_admin, então passam a aceitar a sessão sem mudar de assinatura.
--  3) Tabelas push_inscricoes e push_envios (RLS ligada; só o admin da sessão lê; escrita só por RPC
--     SECURITY DEFINER ou pela função push-send com service_role) e RPCs push_inscrever,
--     push_desligar, push_marcar_aberto.
--
-- SEGURANÇA (revisão 21/11): o e-mail sozinho NÃO basta. Quem tem a anon key consegue chamar /auth/v1/signup
-- com o e-mail do dono antes dele; por isso o admin da sessão exige admin_users.user_id = id da conta em
-- auth.users, preenchido À MÃO pelo dono depois de criar e conferir a própria conta:
--   UPDATE public.admin_users SET user_id = (SELECT id FROM auth.users WHERE lower(email) = 'email-do-dono@exemplo.com')
--   WHERE email = 'email-do-dono@exemplo.com';
-- Sem user_id, a linha só vale para o login antigo (e-mail + senha). Ver PENDENTE-JARVIS.md.
--
-- Trocar/acrescentar admin = só um INSERT (nada fixo no front):
--   INSERT INTO public.admin_users (email, password_hash)
--   VALUES ('email-do-dono@exemplo.com', extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')))
--   ON CONFLICT (email) DO NOTHING;
-- (a senha aleatória só serve para o login antigo do painel; quem entra pela sessão não usa senha.)

-- ── 1) Admin pela sessão ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;

CREATE OR REPLACE FUNCTION public.session_admin_email()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT lower(u.email)
  FROM auth.users u
  JOIN public.admin_users a ON a.user_id = u.id AND lower(a.email) = lower(u.email)
  WHERE u.id = auth.uid()
    AND coalesce(auth.jwt() ->> 'role', '') = 'authenticated'
    AND coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    AND lower(coalesce(auth.jwt() ->> 'email', '')) = lower(u.email)
    AND u.email_confirmed_at IS NOT NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_session_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.session_admin_email() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.session_admin_email() FROM public;
REVOKE ALL ON FUNCTION public.is_session_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.session_admin_email() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_session_admin() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.verify_admin(_email text, _password text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE lower(email) = lower(trim(coalesce(_email, '')))
        AND coalesce(_password, '') <> ''
        AND password_hash = extensions.crypt(_password, password_hash)
    )
    OR (
      public.session_admin_email() IS NOT NULL
      AND (coalesce(trim(_email), '') = '' OR lower(trim(_email)) = public.session_admin_email())
    );
$$;

-- Trocar a senha do login antigo continua exigindo a senha atual (a sessão não basta: protege a senha
-- mesmo que alguém consiga uma sessão de admin).
CREATE OR REPLACE FUNCTION public.admin_change_password(_admin_email text, _admin_password text, _new_password text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF coalesce(_admin_password, '') = '' OR NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE lower(email) = lower(trim(coalesce(_admin_email, '')))
      AND password_hash = extensions.crypt(_admin_password, password_hash)
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  UPDATE public.admin_users
  SET password_hash = extensions.crypt(_new_password, extensions.gen_salt('bf'))
  WHERE lower(email) = lower(trim(_admin_email));
END;
$$;

-- ── 2) Push: inscrições (um token FCM por aparelho) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_inscricoes (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  lang text,
  plataforma text,
  ativo boolean NOT NULL DEFAULT true,
  verificado boolean NOT NULL DEFAULT false, -- true = inscrito com sessão Supabase (e-mail comprovado)
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  ultimo_envio timestamptz
);
ALTER TABLE public.push_inscricoes ADD COLUMN IF NOT EXISTS verificado boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_push_inscricoes_email ON public.push_inscricoes (email);
CREATE INDEX IF NOT EXISTS idx_push_inscricoes_lang ON public.push_inscricoes (lang);

CREATE TABLE IF NOT EXISTS public.push_envios (
  id bigserial PRIMARY KEY,
  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por text,
  titulo text NOT NULL,
  texto text NOT NULL,
  link text,
  publico jsonb NOT NULL DEFAULT '{}'::jsonb,
  publico_rotulo text,
  pessoas integer NOT NULL DEFAULT 0,
  aparelhos integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'enviando',
  enviados integer NOT NULL DEFAULT 0,
  falhas integer NOT NULL DEFAULT 0,
  removidos integer NOT NULL DEFAULT 0,
  abertos integer NOT NULL DEFAULT 0,
  concluido_em timestamptz,
  chave text UNIQUE -- idempotência: o mesmo "Sim, enviar" não sai duas vezes (duas abas, clique repetido)
);
ALTER TABLE public.push_envios ADD COLUMN IF NOT EXISTS chave text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_push_envios_criado ON public.push_envios (criado_em DESC);

ALTER TABLE public.push_inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_envios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_inscricoes FROM anon, authenticated;
REVOKE ALL ON public.push_envios FROM anon, authenticated;
GRANT SELECT ON public.push_inscricoes TO authenticated;
GRANT SELECT ON public.push_envios TO authenticated;

DROP POLICY IF EXISTS "push_inscricoes: admin da sessão lê" ON public.push_inscricoes;
CREATE POLICY "push_inscricoes: admin da sessão lê" ON public.push_inscricoes
  FOR SELECT TO authenticated USING (public.is_session_admin());
DROP POLICY IF EXISTS "push_envios: admin da sessão lê" ON public.push_envios;
CREATE POLICY "push_envios: admin da sessão lê" ON public.push_envios
  FOR SELECT TO authenticated USING (public.is_session_admin());
-- Sem policy de INSERT/UPDATE/DELETE: anon e authenticated não escrevem direto. Quem escreve:
-- as RPCs abaixo (SECURITY DEFINER) e a função push-send (service_role, que ignora RLS).

-- ── 3) RPCs do app ────────────────────────────────────────────────────────────────────────────────────
-- Inscreve (ou atualiza) o token do aparelho. Com sessão Supabase, vale o e-mail confirmado da sessão;
-- no login antigo (modo "email", sem JWT) vale o e-mail informado, que precisa ter acesso liberado.
CREATE OR REPLACE FUNCTION public.push_inscrever(_email text, _token text, _antigo text DEFAULT NULL, _lang text DEFAULT NULL, _plataforma text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_sessao boolean := auth.uid() IS NOT NULL;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT lower(u.email) INTO v_email
    FROM auth.users u
    WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL;
    IF v_email IS NULL THEN RETURN 'sem_acesso'; END IF;
  ELSE
    v_email := lower(trim(coalesce(_email, '')));
  END IF;

  IF _token IS NULL OR length(_token) NOT BETWEEN 100 AND 4096 OR _token !~ '^[A-Za-z0-9_:-]+$' THEN RETURN 'token_invalido'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.approved_emails a
    WHERE a.email = v_email AND NOT a.bloqueado AND (a.expires_at IS NULL OR a.expires_at > now())
  ) THEN
    RETURN 'sem_acesso';
  END IF;

  -- Sem sessão (login antigo, modo "email"), o e-mail não é comprovado: nunca apaga aparelhos de ninguém;
  -- se o e-mail já tem 10 aparelhos, recusa (tokens falsos saem no próximo envio, como token morto).
  IF NOT v_sessao THEN
    IF NOT EXISTS (SELECT 1 FROM public.push_inscricoes WHERE token = _token)
       AND (SELECT count(*) FROM public.push_inscricoes WHERE email = v_email) >= 10 THEN
      RETURN 'limite';
    END IF;
  ELSIF _antigo IS NOT NULL AND _antigo <> _token THEN
    DELETE FROM public.push_inscricoes WHERE token = _antigo AND email = v_email;
  END IF;

  INSERT INTO public.push_inscricoes (email, token, lang, plataforma, ativo, verificado, atualizado_em)
  VALUES (v_email, _token, left(_lang, 8), left(_plataforma, 16), true, v_sessao, now())
  ON CONFLICT (token) DO UPDATE
    SET email = EXCLUDED.email, lang = EXCLUDED.lang, plataforma = EXCLUDED.plataforma, ativo = true,
        verificado = EXCLUDED.verificado, atualizado_em = now()
    -- sem sessão não toma token que já é de outro e-mail comprovado
    WHERE v_sessao OR NOT public.push_inscricoes.verificado;

  -- Com sessão: no máximo 10 aparelhos por e-mail (os mais antigos saem).
  IF v_sessao THEN
    DELETE FROM public.push_inscricoes
    WHERE email = v_email AND id NOT IN (
      SELECT id FROM public.push_inscricoes WHERE email = v_email ORDER BY atualizado_em DESC LIMIT 10
    );
  END IF;
  RETURN 'ok';
END;
$$;

-- Desliga: quem tem o token (o próprio aparelho) pode apagá-lo.
CREATE OR REPLACE FUNCTION public.push_desligar(_token text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  WITH d AS (DELETE FROM public.push_inscricoes WHERE token = _token RETURNING 1)
  SELECT EXISTS (SELECT 1 FROM d);
$$;

-- Toque na notificação (o service worker avisa a função push-send, que chama com service_role): soma 1, nunca passa do número de entregues.
CREATE OR REPLACE FUNCTION public.push_marcar_aberto(_envio bigint)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.push_envios SET abertos = abertos + 1
  WHERE id = _envio AND abertos < enviados;
$$;

REVOKE ALL ON FUNCTION public.push_inscrever(text, text, text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.push_desligar(text) FROM public;
REVOKE ALL ON FUNCTION public.push_marcar_aberto(bigint) FROM public;
GRANT EXECUTE ON FUNCTION public.push_inscrever(text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.push_desligar(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.push_marcar_aberto(bigint) TO service_role;
