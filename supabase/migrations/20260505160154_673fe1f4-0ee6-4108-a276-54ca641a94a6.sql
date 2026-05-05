
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.approved_emails
  ADD COLUMN IF NOT EXISTS bloqueado boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_users (email, password_hash)
VALUES ('ferramentasdocristaoo@gmail.com', extensions.crypt('Fc_2026.#', extensions.gen_salt('bf')))
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

INSERT INTO public.approved_emails (email)
VALUES ('ferramentasdocristaoo@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.verify_admin(_email text, _password text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = lower(trim(_email))
      AND password_hash = extensions.crypt(_password, password_hash)
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_list_emails(_admin_email text, _admin_password text)
RETURNS TABLE(id uuid, email text, bloqueado boolean, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT a.id, a.email, a.bloqueado, a.created_at
    FROM public.approved_emails a
    ORDER BY a.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_add_email(_admin_email text, _admin_password text, _new_email text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  INSERT INTO public.approved_emails (email)
  VALUES (lower(trim(_new_email)))
  ON CONFLICT (email) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_email(_admin_email text, _admin_password text, _id uuid, _new_email text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  UPDATE public.approved_emails SET email = lower(trim(_new_email)) WHERE id = _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_block(_admin_email text, _admin_password text, _id uuid, _bloqueado boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  UPDATE public.approved_emails SET bloqueado = _bloqueado WHERE id = _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_email(_admin_email text, _admin_password text, _id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  DELETE FROM public.approved_emails WHERE id = _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_password(_admin_email text, _admin_password text, _new_password text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  UPDATE public.admin_users
  SET password_hash = extensions.crypt(_new_password, extensions.gen_salt('bf'))
  WHERE email = lower(trim(_admin_email));
END;
$$;
