CREATE TABLE IF NOT EXISTS public.ai_request_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_key text NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_request_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_request_log_key_created_idx ON public.ai_request_log(request_key, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_request_log_action_created_idx ON public.ai_request_log(action, created_at DESC);
