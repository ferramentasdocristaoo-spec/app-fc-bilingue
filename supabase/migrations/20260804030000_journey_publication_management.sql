CREATE OR REPLACE FUNCTION public.admin_list_journey_editorials(_admin_email text, _admin_password text)
RETURNS TABLE (
  book_slug text, chapter_number smallint, language text, title text,
  published_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN QUERY
    SELECT p.book_slug, p.chapter_number, p.language, p.title, p.published_at, p.updated_at
    FROM public.journey_published_editorials p
    ORDER BY p.updated_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_unpublish_journey_editorial(
  _admin_email text, _admin_password text, _book_slug text, _chapter_number smallint, _language text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE removed_count integer;
BEGIN
  IF NOT public.verify_admin(_admin_email, _admin_password) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  DELETE FROM public.journey_published_editorials
  WHERE book_slug = _book_slug AND chapter_number = _chapter_number AND language = _language;
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  RETURN removed_count > 0;
END; $$;
