CREATE TABLE public.journey_editorial_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_slug text NOT NULL, chapter_number smallint NOT NULL, language text NOT NULL,
  action text NOT NULL CHECK (action IN ('published', 'updated', 'unpublished', 'restored')),
  snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.journey_editorial_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX journey_editorial_history_content_idx ON public.journey_editorial_history(book_slug, chapter_number, language, created_at DESC);

CREATE OR REPLACE FUNCTION public.admin_publish_journey_editorial(
  _admin_email text, _admin_password text, _book_slug text, _chapter_number smallint,
  _language text, _title text, _summary text, _key_theme text, _characters jsonb,
  _places jsonb, _related_references jsonb, _reflection_prompt text,
  _previous_connection text, _next_connection text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existed boolean; saved public.journey_published_editorials;
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.journey_published_editorials WHERE book_slug=_book_slug AND chapter_number=_chapter_number AND language=_language) INTO existed;
  INSERT INTO public.journey_published_editorials
    (book_slug, chapter_number, language, title, summary, key_theme, characters, places, related_references, reflection_prompt, previous_connection, next_connection)
  VALUES (_book_slug, _chapter_number, _language, _title, _summary, _key_theme, _characters, _places, _related_references, _reflection_prompt, _previous_connection, _next_connection)
  ON CONFLICT (book_slug, chapter_number, language) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary,
    key_theme=EXCLUDED.key_theme, characters=EXCLUDED.characters, places=EXCLUDED.places,
    related_references=EXCLUDED.related_references, reflection_prompt=EXCLUDED.reflection_prompt,
    previous_connection=EXCLUDED.previous_connection, next_connection=EXCLUDED.next_connection, updated_at=now()
  RETURNING * INTO saved;
  INSERT INTO public.journey_editorial_history(book_slug, chapter_number, language, action, snapshot)
  VALUES (_book_slug, _chapter_number, _language, CASE WHEN existed THEN 'updated' ELSE 'published' END, to_jsonb(saved));
  RETURN jsonb_build_object('book_slug', _book_slug, 'chapter_number', _chapter_number, 'language', _language);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_unpublish_journey_editorial(
  _admin_email text, _admin_password text, _book_slug text, _chapter_number smallint, _language text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE saved public.journey_published_editorials;
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  DELETE FROM public.journey_published_editorials WHERE book_slug=_book_slug AND chapter_number=_chapter_number AND language=_language RETURNING * INTO saved;
  IF saved IS NULL THEN RETURN false; END IF;
  INSERT INTO public.journey_editorial_history(book_slug, chapter_number, language, action, snapshot)
  VALUES (_book_slug, _chapter_number, _language, 'unpublished', to_jsonb(saved));
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_journey_history(_admin_email text, _admin_password text)
RETURNS TABLE(id uuid, book_slug text, chapter_number smallint, language text, action text, title text, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN QUERY SELECT h.id, h.book_slug, h.chapter_number, h.language, h.action, h.snapshot->>'title', h.created_at
    FROM public.journey_editorial_history h ORDER BY h.created_at DESC LIMIT 100;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_restore_journey_history(_admin_email text, _admin_password text, _history_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE historic public.journey_editorial_history; saved public.journey_published_editorials;
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO historic FROM public.journey_editorial_history WHERE id=_history_id;
  IF historic IS NULL THEN RETURN false; END IF;
  INSERT INTO public.journey_published_editorials(book_slug, chapter_number, language, title, summary, key_theme, characters, places, related_references, reflection_prompt, previous_connection, next_connection, published_at, updated_at)
  SELECT historic.book_slug, historic.chapter_number, historic.language, historic.snapshot->>'title', historic.snapshot->>'summary',
    historic.snapshot->>'key_theme', historic.snapshot->'characters', historic.snapshot->'places', historic.snapshot->'related_references',
    historic.snapshot->>'reflection_prompt', historic.snapshot->>'previous_connection', historic.snapshot->>'next_connection', now(), now()
  ON CONFLICT (book_slug, chapter_number, language) DO UPDATE SET title=EXCLUDED.title, summary=EXCLUDED.summary,
    key_theme=EXCLUDED.key_theme, characters=EXCLUDED.characters, places=EXCLUDED.places,
    related_references=EXCLUDED.related_references, reflection_prompt=EXCLUDED.reflection_prompt,
    previous_connection=EXCLUDED.previous_connection, next_connection=EXCLUDED.next_connection, updated_at=now()
  RETURNING * INTO saved;
  INSERT INTO public.journey_editorial_history(book_slug, chapter_number, language, action, snapshot)
  VALUES (saved.book_slug, saved.chapter_number, saved.language, 'restored', to_jsonb(saved));
  RETURN true;
END; $$;
