
CREATE TABLE public.approved_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.approved_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check if email is approved"
ON public.approved_emails
FOR SELECT
TO public
USING (true);
