-- Usage logs table
CREATE TABLE public.usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  tool text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_logs_email ON public.usage_logs(email);
CREATE INDEX idx_usage_logs_tool ON public.usage_logs(tool);
CREATE INDEX idx_usage_logs_created ON public.usage_logs(created_at DESC);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert usage logs"
  ON public.usage_logs FOR INSERT
  WITH CHECK (true);

-- No public SELECT — only admin functions can read

-- Log tool usage (public, no auth required since site uses email-only auth)
CREATE OR REPLACE FUNCTION public.log_tool_usage(_email text, _tool text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _email IS NULL OR _email = '' OR _tool IS NULL OR _tool = '' THEN
    RETURN;
  END IF;
  INSERT INTO public.usage_logs (email, tool) VALUES (lower(trim(_email)), _tool);
END;
$$;

-- Dashboard stats
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats(_admin_email text, _admin_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.approved_emails),
    'blocked_users', (SELECT count(*) FROM public.approved_emails WHERE bloqueado = true),
    'total_cache', (SELECT count(*) FROM public.ai_cache),
    'total_prayers', (SELECT count(*) FROM public.prayer_requests),
    'total_usage', (SELECT count(*) FROM public.usage_logs),
    'usage_today', (SELECT count(*) FROM public.usage_logs WHERE created_at >= current_date),
    'usage_7d', (SELECT count(*) FROM public.usage_logs WHERE created_at >= now() - interval '7 days'),
    'active_users_7d', (SELECT count(DISTINCT email) FROM public.usage_logs WHERE created_at >= now() - interval '7 days')
  ) INTO result;
  RETURN result;
END;
$$;

-- Top tools
CREATE OR REPLACE FUNCTION public.admin_top_tools(_admin_email text, _admin_password text, _days int DEFAULT 30)
RETURNS TABLE(tool text, uses bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT u.tool, count(*)::bigint AS uses
    FROM public.usage_logs u
    WHERE u.created_at >= now() - (_days || ' days')::interval
    GROUP BY u.tool
    ORDER BY uses DESC
    LIMIT 20;
END;
$$;

-- Top users
CREATE OR REPLACE FUNCTION public.admin_top_users(_admin_email text, _admin_password text, _days int DEFAULT 30)
RETURNS TABLE(email text, uses bigint, last_seen timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT u.email, count(*)::bigint AS uses, max(u.created_at) AS last_seen
    FROM public.usage_logs u
    WHERE u.created_at >= now() - (_days || ' days')::interval
    GROUP BY u.email
    ORDER BY uses DESC
    LIMIT 20;
END;
$$;

-- Paginated users with search
CREATE OR REPLACE FUNCTION public.admin_list_emails_paginated(
  _admin_email text,
  _admin_password text,
  _search text DEFAULT '',
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
)
RETURNS TABLE(id uuid, email text, bloqueado boolean, created_at timestamptz, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT a.id, a.email, a.bloqueado, a.created_at,
      count(*) OVER ()::bigint AS total_count
    FROM public.approved_emails a
    WHERE _search = '' OR a.email ILIKE '%' || _search || '%'
    ORDER BY a.created_at DESC
    LIMIT _limit OFFSET _offset;
END;
$$;

-- Cache list paginated
CREATE OR REPLACE FUNCTION public.admin_list_cache(
  _admin_email text,
  _admin_password text,
  _search text DEFAULT '',
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
)
RETURNS TABLE(id uuid, action text, cache_key text, created_at timestamptz, expires_at timestamptz, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT c.id, c.action, c.cache_key, c.created_at, c.expires_at,
      count(*) OVER ()::bigint AS total_count
    FROM public.ai_cache c
    WHERE _search = '' OR c.action ILIKE '%' || _search || '%' OR c.cache_key ILIKE '%' || _search || '%'
    ORDER BY c.created_at DESC
    LIMIT _limit OFFSET _offset;
END;
$$;

-- Cache stats grouped by action
CREATE OR REPLACE FUNCTION public.admin_cache_stats(_admin_email text, _admin_password text)
RETURNS TABLE(action text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT c.action, count(*)::bigint AS total
    FROM public.ai_cache c
    GROUP BY c.action
    ORDER BY total DESC;
END;
$$;

-- Clear old cache
CREATE OR REPLACE FUNCTION public.admin_clear_old_cache(_admin_email text, _admin_password text, _days int DEFAULT 30)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  WITH d AS (
    DELETE FROM public.ai_cache WHERE created_at < now() - (_days || ' days')::interval RETURNING 1
  )
  SELECT count(*) INTO deleted_count FROM d;
  RETURN deleted_count;
END;
$$;

-- Delete single cache entry
CREATE OR REPLACE FUNCTION public.admin_delete_cache(_admin_email text, _admin_password text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  DELETE FROM public.ai_cache WHERE id = _id;
END;
$$;