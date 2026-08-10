import type { EditorialGenerationResult } from "./editorial-generator";
import type { JourneyLanguage } from "./types";

export interface AdminCredentials { _admin_email: string; _admin_password: string }
export interface PublishedEditorialSummary {
  bookSlug: string; chapter: number; language: JourneyLanguage; title: string; publishedAt: string; updatedAt: string;
}
export interface EditorialHistorySummary {
  id: string; bookSlug: string; chapter: number; language: JourneyLanguage; action: "published" | "updated" | "unpublished" | "restored"; title: string; createdAt: string;
}
const config = () => ({ url: import.meta.env.VITE_SUPABASE_URL as string, key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string });
const requestHeaders = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" });

export async function publishJourneyEditorial(credentials: AdminCredentials, item: { bookSlug: string; chapter: number; language: JourneyLanguage; result: EditorialGenerationResult }): Promise<void> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/admin_publish_journey_editorial`, { method: "POST", headers: requestHeaders(key), body: JSON.stringify({
    ...credentials, _book_slug: item.bookSlug, _chapter_number: item.chapter, _language: item.language,
    _title: item.result.title, _summary: item.result.summary, _key_theme: item.result.keyTheme,
    _characters: item.result.characters, _places: item.result.places, _related_references: item.result.relatedReferences,
    _reflection_prompt: item.result.reflectionPrompt, _previous_connection: item.result.previousConnection, _next_connection: item.result.nextConnection,
  }) });
  if (!response.ok) throw new Error(response.status === 404 ? "A migration editorial ainda não foi publicada." : "Não foi possível publicar este capítulo.");
}

export async function getPublishedJourneyEditorial(bookSlug: string, chapter: number, language: JourneyLanguage): Promise<EditorialGenerationResult | null> {
  const { url, key } = config();
  const query = new URLSearchParams({ select: "title,summary,key_theme,characters,places,related_references,reflection_prompt,previous_connection,next_connection", book_slug: `eq.${bookSlug}`, chapter_number: `eq.${chapter}`, language: `eq.${language}`, limit: "1" });
  const response = await fetch(`${url}/rest/v1/journey_published_editorials?${query}`, { headers: requestHeaders(key) });
  if (!response.ok) return null;
  const [row] = await response.json() as Array<Record<string, unknown>>;
  if (!row) return null;
  return { title: String(row.title || ""), summary: String(row.summary || ""), keyTheme: String(row.key_theme || ""), characters: Array.isArray(row.characters) ? row.characters.map(String) : [], places: Array.isArray(row.places) ? row.places.map(String) : [], relatedReferences: Array.isArray(row.related_references) ? row.related_references.map(String) : [], reflectionPrompt: String(row.reflection_prompt || ""), previousConnection: String(row.previous_connection || ""), nextConnection: String(row.next_connection || "") };
}

export async function listPublishedJourneyEditorials(credentials: AdminCredentials): Promise<PublishedEditorialSummary[]> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/admin_list_journey_editorials`, { method: "POST", headers: requestHeaders(key), body: JSON.stringify(credentials) });
  if (!response.ok) throw new Error("Não foi possível carregar as publicações.");
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows.map(row => ({ bookSlug: String(row.book_slug), chapter: Number(row.chapter_number), language: String(row.language) as JourneyLanguage, title: String(row.title), publishedAt: String(row.published_at), updatedAt: String(row.updated_at) }));
}

export async function unpublishJourneyEditorial(credentials: AdminCredentials, item: Pick<PublishedEditorialSummary, "bookSlug" | "chapter" | "language">): Promise<void> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/admin_unpublish_journey_editorial`, { method: "POST", headers: requestHeaders(key), body: JSON.stringify({ ...credentials, _book_slug: item.bookSlug, _chapter_number: item.chapter, _language: item.language }) });
  if (!response.ok) throw new Error("Não foi possível retirar este capítulo do ar.");
}

export async function listJourneyEditorialHistory(credentials: AdminCredentials): Promise<EditorialHistorySummary[]> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/admin_list_journey_history`, { method: "POST", headers: requestHeaders(key), body: JSON.stringify(credentials) });
  if (!response.ok) throw new Error("Não foi possível carregar o histórico editorial.");
  const rows = await response.json() as Array<Record<string, unknown>>;
  return rows.map(row => ({ id: String(row.id), bookSlug: String(row.book_slug), chapter: Number(row.chapter_number), language: String(row.language) as JourneyLanguage, action: String(row.action) as EditorialHistorySummary["action"], title: String(row.title), createdAt: String(row.created_at) }));
}

export async function restoreJourneyEditorialHistory(credentials: AdminCredentials, historyId: string): Promise<void> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/admin_restore_journey_history`, { method: "POST", headers: requestHeaders(key), body: JSON.stringify({ ...credentials, _history_id: historyId }) });
  if (!response.ok) throw new Error("Não foi possível restaurar esta versão.");
}
