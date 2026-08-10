import type { EditorialQueueItem } from "./editorial-queue";
import type { AdminCredentials } from "./published-editorial";

const config = () => ({ url: import.meta.env.VITE_SUPABASE_URL as string, key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string });
const headers = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" });

async function rpc(name: string, body: Record<string, unknown>): Promise<unknown> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, { method: "POST", headers: headers(key), body: JSON.stringify(body) });
  if (!response.ok) throw new Error("Falha ao sincronizar os rascunhos editoriais.");
  return response.json();
}

export async function saveJourneyEditorialDraft(credentials: AdminCredentials, item: EditorialQueueItem): Promise<void> {
  await rpc("admin_save_journey_draft", { ...credentials, _draft_key: item.id, _book_slug: item.bookSlug, _chapter_number: item.chapter, _language: item.language, _payload: item });
}

export async function listJourneyEditorialDrafts(credentials: AdminCredentials): Promise<EditorialQueueItem[]> {
  const rows = await rpc("admin_list_journey_drafts", credentials) as Array<{ item?: EditorialQueueItem }>;
  return Array.isArray(rows) ? rows.map(row => row.item).filter((item): item is EditorialQueueItem => Boolean(item?.id)) : [];
}

export async function deleteJourneyEditorialDraft(credentials: AdminCredentials, draftKey: string): Promise<void> {
  await rpc("admin_delete_journey_draft", { ...credentials, _draft_key: draftKey });
}
