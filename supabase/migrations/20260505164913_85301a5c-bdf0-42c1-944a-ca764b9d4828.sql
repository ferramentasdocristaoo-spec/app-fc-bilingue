-- Usage by day
CREATE OR REPLACE FUNCTION public.admin_usage_by_day(_admin_email text, _admin_password text, _days int DEFAULT 30)
RETURNS TABLE(day date, uses bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT (u.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day, count(*)::bigint
    FROM public.usage_logs u
    WHERE u.created_at >= now() - (_days || ' days')::interval
    GROUP BY day
    ORDER BY day ASC;
END;
$$;

-- Usage by hour of day
CREATE OR REPLACE FUNCTION public.admin_usage_by_hour(_admin_email text, _admin_password text, _days int DEFAULT 30)
RETURNS TABLE(hour int, uses bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT EXTRACT(HOUR FROM (u.created_at AT TIME ZONE 'America/Sao_Paulo'))::int AS hour, count(*)::bigint
    FROM public.usage_logs u
    WHERE u.created_at >= now() - (_days || ' days')::interval
    GROUP BY hour
    ORDER BY hour ASC;
END;
$$;

-- Usage by weekday (0=Sunday)
CREATE OR REPLACE FUNCTION public.admin_usage_by_weekday(_admin_email text, _admin_password text, _days int DEFAULT 30)
RETURNS TABLE(weekday int, uses bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT EXTRACT(DOW FROM (u.created_at AT TIME ZONE 'America/Sao_Paulo'))::int AS weekday, count(*)::bigint
    FROM public.usage_logs u
    WHERE u.created_at >= now() - (_days || ' days')::interval
    GROUP BY weekday
    ORDER BY weekday ASC;
END;
$$;

-- New users per day
CREATE OR REPLACE FUNCTION public.admin_user_growth(_admin_email text, _admin_password text, _days int DEFAULT 30)
RETURNS TABLE(day date, new_users bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT (a.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day, count(*)::bigint
    FROM public.approved_emails a
    WHERE a.created_at >= now() - (_days || ' days')::interval
    GROUP BY day
    ORDER BY day ASC;
END;
$$;

-- Retention stats: how many users used 1x, 2-5x, 6-20x, 20+x
CREATE OR REPLACE FUNCTION public.admin_retention_stats(_admin_email text, _admin_password text, _days int DEFAULT 30)
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

  WITH user_counts AS (
    SELECT email, count(*) AS c
    FROM public.usage_logs
    WHERE created_at >= now() - (_days || ' days')::interval
    GROUP BY email
  )
  SELECT jsonb_build_object(
    'one_time', count(*) FILTER (WHERE c = 1),
    'casual', count(*) FILTER (WHERE c BETWEEN 2 AND 5),
    'regular', count(*) FILTER (WHERE c BETWEEN 6 AND 20),
    'power', count(*) FILTER (WHERE c > 20),
    'total_active', count(*),
    'avg_uses', COALESCE(round(avg(c)::numeric, 1), 0),
    'inactive_users', (SELECT count(*) FROM public.approved_emails) - count(*)
  ) INTO result FROM user_counts;
  RETURN result;
END;
$$;