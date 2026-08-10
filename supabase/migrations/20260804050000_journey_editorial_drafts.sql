CREATE TABLE public.journey_editorial_drafts (
  draft_key text PRIMARY KEY,
  book_slug text NOT NULL,
  chapter_number smallint NOT NULL,
  language text NOT NULL,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.journey_editorial_drafts ENABLE ROW LEVEL SECURITY;
CREATE INDEX journey_editorial_drafts_updated_idx ON public.journey_editorial_drafts(updated_at DESC);

CREATE OR REPLACE FUNCTION public.admin_save_journey_draft(
  _admin_email text, _admin_password text, _draft_key text, _book_slug text,
  _chapter_number smallint, _language text, _payload jsonb
) RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE saved_at timestamptz := now();
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  INSERT INTO public.journey_editorial_drafts(draft_key, book_slug, chapter_number, language, payload, updated_at)
  VALUES (_draft_key, _book_slug, _chapter_number, _language, _payload, saved_at)
  ON CONFLICT (draft_key) DO UPDATE SET payload=EXCLUDED.payload, book_slug=EXCLUDED.book_slug,
    chapter_number=EXCLUDED.chapter_number, language=EXCLUDED.language, updated_at=saved_at;
  RETURN saved_at;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_journey_drafts(_admin_email text, _admin_password text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(jsonb_build_object('item', d.payload, 'serverUpdatedAt', d.updated_at) ORDER BY d.updated_at DESC)
    FROM public.journey_editorial_drafts d), '[]'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_journey_draft(_admin_email text, _admin_password text, _draft_key text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE removed integer;
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  DELETE FROM public.journey_editorial_drafts WHERE draft_key=_draft_key;
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed > 0;
END; $$;
