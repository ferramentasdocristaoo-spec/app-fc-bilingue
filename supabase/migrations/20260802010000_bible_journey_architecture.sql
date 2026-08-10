-- Bible Journey content model. Content is public-read; personal progress requires Supabase Auth.

CREATE TABLE public.journey_testaments (
  id smallint PRIMARY KEY,
  slug text NOT NULL UNIQUE CHECK (slug IN ('old-testament', 'new-testament')),
  position smallint NOT NULL UNIQUE
);

CREATE TABLE public.journey_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  testament_id smallint NOT NULL REFERENCES public.journey_testaments(id) ON DELETE CASCADE,
  slug text NOT NULL,
  position smallint NOT NULL,
  accent_key text NOT NULL DEFAULT 'gold',
  UNIQUE (testament_id, slug), UNIQUE (testament_id, position)
);

CREATE TABLE public.journey_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.journey_categories(id) ON DELETE RESTRICT,
  bible_book_id smallint NOT NULL UNIQUE CHECK (bible_book_id BETWEEN 1 AND 66),
  slug text NOT NULL UNIQUE,
  chapter_count smallint NOT NULL CHECK (chapter_count > 0),
  position smallint NOT NULL,
  cover_key text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.journey_book_translations (
  book_id uuid NOT NULL REFERENCES public.journey_books(id) ON DELETE CASCADE,
  language text NOT NULL CHECK (language IN ('pt-PT', 'en', 'es', 'fr', 'it', 'de')),
  title text NOT NULL, description text NOT NULL DEFAULT '', author text NOT NULL DEFAULT '',
  date_label text NOT NULL DEFAULT '', name_origin text NOT NULL DEFAULT '', context text NOT NULL DEFAULT '',
  themes jsonb NOT NULL DEFAULT '[]', characters jsonb NOT NULL DEFAULT '[]', principles jsonb NOT NULL DEFAULT '[]',
  PRIMARY KEY (book_id, language)
);

CREATE TABLE public.journey_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.journey_books(id) ON DELETE CASCADE,
  slug text NOT NULL, start_chapter smallint NOT NULL, end_chapter smallint NOT NULL,
  position smallint NOT NULL, icon_key text NOT NULL DEFAULT 'book',
  CHECK (start_chapter > 0 AND end_chapter >= start_chapter),
  UNIQUE (book_id, slug), UNIQUE (book_id, position)
);

CREATE TABLE public.journey_section_translations (
  section_id uuid NOT NULL REFERENCES public.journey_sections(id) ON DELETE CASCADE,
  language text NOT NULL CHECK (language IN ('pt-PT', 'en', 'es', 'fr', 'it', 'de')),
  title text NOT NULL, description text NOT NULL DEFAULT '',
  PRIMARY KEY (section_id, language)
);

CREATE TABLE public.journey_chapters (
  book_id uuid NOT NULL REFERENCES public.journey_books(id) ON DELETE CASCADE,
  chapter_number smallint NOT NULL CHECK (chapter_number > 0),
  section_id uuid REFERENCES public.journey_sections(id) ON DELETE SET NULL,
  PRIMARY KEY (book_id, chapter_number)
);

CREATE TABLE public.journey_chapter_translations (
  book_id uuid NOT NULL,
  chapter_number smallint NOT NULL,
  language text NOT NULL CHECK (language IN ('pt-PT', 'en', 'es', 'fr', 'it', 'de')),
  title text NOT NULL, summary text NOT NULL DEFAULT '', reflection_prompt text NOT NULL DEFAULT '',
  PRIMARY KEY (book_id, chapter_number, language),
  FOREIGN KEY (book_id, chapter_number) REFERENCES public.journey_chapters(book_id, chapter_number) ON DELETE CASCADE
);

CREATE TABLE public.user_journey_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL,
  chapter_number smallint NOT NULL,
  last_opened_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
  PRIMARY KEY (user_id, book_id, chapter_number),
  FOREIGN KEY (book_id, chapter_number) REFERENCES public.journey_chapters(book_id, chapter_number) ON DELETE CASCADE
);

CREATE TABLE public.user_journey_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL, chapter_number smallint NOT NULL, content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id, chapter_number),
  FOREIGN KEY (book_id, chapter_number) REFERENCES public.journey_chapters(book_id, chapter_number) ON DELETE CASCADE
);

ALTER TABLE public.journey_testaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_book_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_section_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_chapter_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journey_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Journey content is readable" ON public.journey_testaments FOR SELECT USING (true);
CREATE POLICY "Journey categories are readable" ON public.journey_categories FOR SELECT USING (true);
CREATE POLICY "Active journey books are readable" ON public.journey_books FOR SELECT USING (active = true);
CREATE POLICY "Journey book translations are readable" ON public.journey_book_translations FOR SELECT USING (true);
CREATE POLICY "Journey sections are readable" ON public.journey_sections FOR SELECT USING (true);
CREATE POLICY "Journey section translations are readable" ON public.journey_section_translations FOR SELECT USING (true);
CREATE POLICY "Journey chapters are readable" ON public.journey_chapters FOR SELECT USING (true);
CREATE POLICY "Journey chapter translations are readable" ON public.journey_chapter_translations FOR SELECT USING (true);

CREATE POLICY "Users read own journey progress" ON public.user_journey_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own journey progress" ON public.user_journey_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own journey progress" ON public.user_journey_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own journey progress" ON public.user_journey_progress FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users read own journey notes" ON public.user_journey_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own journey notes" ON public.user_journey_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own journey notes" ON public.user_journey_notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own journey notes" ON public.user_journey_notes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX journey_books_category_idx ON public.journey_books(category_id, position);
CREATE INDEX journey_sections_book_idx ON public.journey_sections(book_id, position);
CREATE INDEX journey_progress_user_idx ON public.user_journey_progress(user_id, last_opened_at DESC);

INSERT INTO public.journey_testaments (id, slug, position) VALUES (1, 'old-testament', 1), (2, 'new-testament', 2);
INSERT INTO public.journey_categories (testament_id, slug, position) VALUES
  (1, 'pentateuch', 1), (1, 'history', 2), (1, 'poetry', 3), (1, 'prophecy', 4),
  (2, 'gospels', 1), (2, 'history', 2), (2, 'pauline-letters', 3), (2, 'general-letters', 4), (2, 'prophecy', 5);
