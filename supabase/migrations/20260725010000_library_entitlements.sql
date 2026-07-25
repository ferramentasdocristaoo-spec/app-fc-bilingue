CREATE TABLE IF NOT EXISTS public.library_products (
  slug text PRIMARY KEY,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_sku_products (
  sku text PRIMARY KEY,
  product_slug text NOT NULL REFERENCES public.library_products(slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.library_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  product_slug text NOT NULL REFERENCES public.library_products(slug) ON DELETE CASCADE,
  source_sku text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, product_slug)
);

ALTER TABLE public.library_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_sku_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_entitlements ENABLE ROW LEVEL SECURITY;

INSERT INTO public.library_products (slug)
VALUES ('apocalipse-revelado')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.library_entitlements (email, product_slug)
VALUES ('ferramentasdocristaoo@gmail.com', 'apocalipse-revelado')
ON CONFLICT (email, product_slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.has_library_access(_email text, _product_slug text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.library_entitlements e
    JOIN public.library_products p ON p.slug = e.product_slug
    WHERE e.email = lower(trim(_email))
      AND e.product_slug = _product_slug
      AND p.active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_library_access(text, text) TO anon, authenticated;
