import { beforeEach, describe, expect, it } from "vitest";
import { enqueueEditorialRange, getEditorialQueueState, saveEditorialQueueState, updateEditorialQueueItem } from "@/features/bible-journey/editorial-queue";
import { journeyCatalogRepository } from "@/features/bible-journey/catalog";

describe("editorial queue", () => {
  beforeEach(() => localStorage.clear());

  it("persists ranges without duplicating chapters", async () => {
    const genesis = await journeyCatalogRepository.getBook("genesis");
    expect(genesis).not.toBeNull();
    let state = enqueueEditorialRange(getEditorialQueueState(), genesis!, "fr", 1, 3);
    state = enqueueEditorialRange(state, genesis!, "fr", 2, 3);
    saveEditorialQueueState(state);
    expect(getEditorialQueueState().items).toHaveLength(3);
    expect(state.items[0]).toMatchObject({ id: "genesis:1:fr", sourceVersion: "FRLSG", status: "pending" });
  });

  it("updates one editorial state without changing its identity", async () => {
    const genesis = await journeyCatalogRepository.getBook("genesis");
    const state = enqueueEditorialRange(getEditorialQueueState(), genesis!, "pt-PT", 1, 1);
    const updated = updateEditorialQueueItem(state, state.items[0].id, { status: "reviewed" });
    expect(updated.items[0].id).toBe(state.items[0].id);
    expect(updated.items[0].status).toBe("reviewed");
  });
});
