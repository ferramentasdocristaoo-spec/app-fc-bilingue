
CREATE TABLE public.ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  cache_key text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (action, cache_key)
);

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ai_cache" ON public.ai_cache FOR SELECT TO public USING (true);
CREATE POLICY "Service role can insert ai_cache" ON public.ai_cache FOR INSERT TO public WITH CHECK (true);
