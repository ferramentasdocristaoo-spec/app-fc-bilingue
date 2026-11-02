/** Respostas dos pontos de paragem (quiz por movimento), guardadas só no aparelho. */
const STORAGE_KEY = "fc-bible-journey-checkpoints-v1";

export interface CheckpointAnswer { choice: number; correct: boolean; answeredAt: string }
type CheckpointState = Record<string, CheckpointAnswer>;

const keyFor = (bookSlug: string, sectionSlug: string) => `${bookSlug}:${sectionSlug}`;

function read(): CheckpointState {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {}; }
  catch { return {}; }
}

export const journeyCheckpointRepository = {
  get(bookSlug: string, sectionSlug: string): CheckpointAnswer | undefined {
    return read()[keyFor(bookSlug, sectionSlug)];
  },
  answer(bookSlug: string, sectionSlug: string, choice: number, correct: boolean) {
    const state = read();
    state[keyFor(bookSlug, sectionSlug)] = { choice, correct, answeredAt: new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* armazenamento cheio ou bloqueado */ }
  },
  reset(bookSlug: string, sectionSlug: string) {
    const state = read();
    delete state[keyFor(bookSlug, sectionSlug)];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  },
};
