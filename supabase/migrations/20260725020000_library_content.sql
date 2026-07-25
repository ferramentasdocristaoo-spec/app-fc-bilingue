CREATE TABLE IF NOT EXISTS public.library_volumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES public.library_products(slug) ON DELETE CASCADE,
  volume_slug text NOT NULL,
  language text NOT NULL DEFAULT 'pt-BR',
  title text NOT NULL,
  content text NOT NULL,
  word_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_slug, volume_slug, language)
);

ALTER TABLE public.library_volumes ENABLE ROW LEVEL SECURITY;
