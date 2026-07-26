-- Funções administrativas da Livraria: mapeamento de SKUs e liberação de acesso.

CREATE OR REPLACE FUNCTION public.admin_list_library_skus(_admin_email text, _admin_password text)
RETURNS TABLE (sku text, product_slug text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT s.sku, s.product_slug
    FROM public.library_sku_products s
    ORDER BY s.product_slug, s.sku;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_add_library_sku(_admin_email text, _admin_password text, _sku text, _product_slug text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  INSERT INTO public.library_sku_products (sku, product_slug)
  VALUES (trim(_sku), _product_slug)
  ON CONFLICT (sku) DO UPDATE SET product_slug = EXCLUDED.product_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_library_sku(_admin_email text, _admin_password text, _sku text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  DELETE FROM public.library_sku_products WHERE sku = _sku;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_library_entitlements(
  _admin_email text, _admin_password text,
  _search text DEFAULT '', _limit integer DEFAULT 50, _offset integer DEFAULT 0
)
RETURNS TABLE (id uuid, email text, product_slug text, source_sku text, created_at timestamptz, total_count bigint)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT e.id, e.email, e.product_slug, e.source_sku, e.created_at,
           count(*) OVER () AS total_count
    FROM public.library_entitlements e
    WHERE _search = '' OR e.email ILIKE '%' || _search || '%'
    ORDER BY e.created_at DESC
    LIMIT _limit OFFSET _offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_library_access(_admin_email text, _admin_password text, _email text, _product_slug text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  INSERT INTO public.library_entitlements (email, product_slug, source_sku)
  VALUES (lower(trim(_email)), _product_slug, 'admin')
  ON CONFLICT (email, product_slug) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_library_access(_admin_email text, _admin_password text, _id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  DELETE FROM public.library_entitlements WHERE id = _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_library_skus(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_library_sku(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_library_sku(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_library_entitlements(text, text, text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_library_access(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_library_access(text, text, uuid) TO anon, authenticated;
