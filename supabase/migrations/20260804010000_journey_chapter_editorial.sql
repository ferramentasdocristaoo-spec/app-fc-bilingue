ALTER TABLE public.journey_chapter_translations
  ADD COLUMN IF NOT EXISTS key_theme text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS characters jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS places jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS previous_connection text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS next_connection text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS editorial_status text NOT NULL DEFAULT 'draft'
    CHECK (editorial_status IN ('draft', 'generated', 'reviewed', 'published')),
  ADD COLUMN IF NOT EXISTS generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS journey_chapter_translations_status_idx
  ON public.journey_chapter_translations(editorial_status, language);

CREATE TABLE IF NOT EXISTS public.journey_published_editorials (
  book_slug text NOT NULL, chapter_number smallint NOT NULL CHECK (chapter_number > 0),
  language text NOT NULL CHECK (language IN ('pt-PT', 'en', 'es', 'fr', 'it', 'de')),
  title text NOT NULL, summary text NOT NULL DEFAULT '', key_theme text NOT NULL DEFAULT '',
  characters jsonb NOT NULL DEFAULT '[]'::jsonb, places jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_references jsonb NOT NULL DEFAULT '[]'::jsonb, reflection_prompt text NOT NULL DEFAULT '',
  previous_connection text NOT NULL DEFAULT '', next_connection text NOT NULL DEFAULT '',
  published_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (book_slug, chapter_number, language)
);
ALTER TABLE public.journey_published_editorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published journey editorials are readable" ON public.journey_published_editorials FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.admin_publish_journey_editorial(
  _admin_email text, _admin_password text, _book_slug text, _chapter_number smallint,
  _language text, _title text, _summary text, _key_theme text, _characters jsonb,
  _places jsonb, _related_references jsonb, _reflection_prompt text,
  _previous_connection text, _next_connection text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  INSERT INTO public.journey_published_editorials
    (book_slug, chapter_number, language, title, summary, key_theme, characters, places, related_references, reflection_prompt, previous_connection, next_connection)
  VALUES (_book_slug, _chapter_number, _language, _title, _summary, _key_theme, _characters, _places, _related_references, _reflection_prompt, _previous_connection, _next_connection)
  ON CONFLICT (book_slug, chapter_number, language) DO UPDATE SET
    title=EXCLUDED.title, summary=EXCLUDED.summary, key_theme=EXCLUDED.key_theme,
    characters=EXCLUDED.characters, places=EXCLUDED.places, related_references=EXCLUDED.related_references,
    reflection_prompt=EXCLUDED.reflection_prompt, previous_connection=EXCLUDED.previous_connection,
    next_connection=EXCLUDED.next_connection, updated_at=now();
  RETURN jsonb_build_object('book_slug', _book_slug, 'chapter_number', _chapter_number, 'language', _language);
END; $$;
