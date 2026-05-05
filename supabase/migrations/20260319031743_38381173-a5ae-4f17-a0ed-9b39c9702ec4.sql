
-- Prayer requests table (shared for all users, no auth required)
CREATE TABLE public.prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'Anônimo',
  pedido text NOT NULL,
  categoria text NOT NULL DEFAULT 'Geral',
  amens integer NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prayer requests"
  ON public.prayer_requests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert prayer requests"
  ON public.prayer_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update prayer requests"
  ON public.prayer_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Storage bucket for prayer images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prayer-images', 'prayer-images', true);

CREATE POLICY "Anyone can upload prayer images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'prayer-images');

CREATE POLICY "Anyone can view prayer images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prayer-images');
