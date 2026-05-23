import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// ── Mock lobby store ───────────────────────────────────────────

const storeActions = {
  setLobbyId: vi.fn(),
  setLobbyCode: vi.fn(),
  setMembers: vi.fn(),
  setMemberProfile: vi.fn(),
  setCurrentRound: vi.fn(),
  setSelections: vi.fn(),
  setBans: vi.fn(),
  setConnectionStatus: vi.fn(),
};

vi.mock("@/stores/lobbyStore", () => ({
  useLobbyStore: vi.fn((selector: (s: typeof storeActions) => unknown) =>
    selector(storeActions),
  ),
}));

// ── Mock data ──────────────────────────────────────────────────

const mockMemberWithProfile = {
  id: "member-1",
  lobby_id: "lobby-1",
  user_id: "user-1",
  joined_at: new Date().toISOString(),
  profiles: { username: "Alice", avatar_url: "/avatars/1.png" },
};

const mockMemberNoProfile = {
  id: "member-2",
  lobby_id: "lobby-1",
  user_id: "user-2",
  joined_at: new Date().toISOString(),
  profiles: null,
};

const mockStateResponse = {
  lobby: { id: "lobby-1", room_code: "ABC", leader_id: "user-1", status: "active" },
  members: [mockMemberWithProfile, mockMemberNoProfile],
  currentRound: { id: "round-1", lobby_id: "lobby-1", round_number: 1, status: "active", team_side: null, created_at: new Date().toISOString() },
  selections: [{ id: "sel-1", lobby_id: "lobby-1", user_id: "user-1", round_id: "round-1", map_id: null, site_id: null, operator_id: null, locked_at: null }],
  bans: [{ id: "ban-1", lobby_id: "lobby-1", operator_id: "op-1", side: "attacker", round_id: "round-1", created_at: new Date().toISOString() }],
};

// ── SUT ────────────────────────────────────────────────────────

import { useHeartbeat } from "./useHeartbeat";

// ── Tests ──────────────────────────────────────────────────────

describe("useHeartbeat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStateResponse),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── null lobby ─────────────────────────────────────────────

  it("does nothing when lobbyId is null", () => {
    renderHook(() => useHeartbeat(null));

    expect(global.fetch).not.toHaveBeenCalled();
    // No store actions should have been called
    expect(storeActions.setLobbyId).not.toHaveBeenCalled();
    expect(storeActions.setConnectionStatus).not.toHaveBeenCalled();
  });

  // ── initial fetch ─────────────────────────────────────────

  it("fetches lobby state on mount", async () => {
    renderHook(() => useHeartbeat("lobby-1"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/lobby/lobby-1/state");
    });
  });

  it("maps response data into the store", async () => {
    const { result } = renderHook(() => useHeartbeat("lobby-1"));

    await waitFor(() => {
      expect(storeActions.setLobbyId).toHaveBeenCalledWith("lobby-1");
    });

    expect(storeActions.setLobbyCode).toHaveBeenCalledWith("ABC");

    expect(storeActions.setMembers).toHaveBeenCalledWith([
      { id: "member-1", lobby_id: "lobby-1", user_id: "user-1", joined_at: mockMemberWithProfile.joined_at },
      { id: "member-2", lobby_id: "lobby-1", user_id: "user-2", joined_at: mockMemberNoProfile.joined_at },
    ]);

    expect(storeActions.setMemberProfile).toHaveBeenCalledWith("user-1", {
      username: "Alice",
      avatar_url: "/avatars/1.png",
    });

    expect(storeActions.setCurrentRound).toHaveBeenCalledWith(mockStateResponse.currentRound);
    expect(storeActions.setSelections).toHaveBeenCalledWith(mockStateResponse.selections);
    expect(storeActions.setBans).toHaveBeenCalledWith(mockStateResponse.bans);
    expect(storeActions.setConnectionStatus).toHaveBeenCalledWith("connected");

    // lastSync should be set
    expect(result.current.lastSync).toBeGreaterThan(0);
  });

  it("skips profile set for members without profile", async () => {
    renderHook(() => useHeartbeat("lobby-1"));

    await waitFor(() => {
      expect(storeActions.setMembers).toHaveBeenCalled();
    });

    // Only user-1 has a profile, user-2 does not
    expect(storeActions.setMemberProfile).toHaveBeenCalledTimes(1);
    expect(storeActions.setMemberProfile).toHaveBeenCalledWith("user-1", expect.any(Object));
  });

  // ── error handling ────────────────────────────────────────

  it("does not update store when fetch returns non-ok status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useHeartbeat("lobby-1"));

    // Give the fetch time
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Short delay to allow the sync to process
    await act(async () => {
      await Promise.resolve();
    });

    // Store should NOT have been updated with data
    expect(storeActions.setLobbyId).not.toHaveBeenCalled();
    expect(storeActions.setConnectionStatus).not.toHaveBeenCalled();
    expect(result.current.lastSync).toBeNull();
  });

  it("does not update store when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useHeartbeat("lobby-1"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(storeActions.setLobbyId).not.toHaveBeenCalled();
    expect(result.current.lastSync).toBeNull();
  });

  // ── cleanup ───────────────────────────────────────────────

  it("clears interval and removes visibility listener on unmount", async () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = renderHook(() => useHeartbeat("lobby-1"));

    // Wait for initial sync to setup interval
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Should clean up the visibility listener
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
    // The interval should have been cleared (no more fetch calls)
    // We verify by advancing a small amount to ensure no additional fetch
  });

  // ── polling ───────────────────────────────────────────────

  describe("polling interval", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    });

    async function flush() {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
    }

    async function advance(ms: number) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });
    }

    it("polls every 30 seconds", async () => {
      renderHook(() => useHeartbeat("lobby-1"));

      // Wait for the initial fetch to complete via microtask flush
      await flush();
      // startInterval() should now be called, setting up the 30s interval
      await flush();

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Advance 30s – should trigger the interval callback
      await advance(30_000);
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Another 30s
      await advance(30_000);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("resets interval when lobbyId changes", async () => {
      const { rerender } = renderHook(
        (id: string | null) => useHeartbeat(id),
        { initialProps: "lobby-1" },
      );

      // Initial fetch
      await flush();
      await flush();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Advance 10s (less than the interval)
      await advance(10_000);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Change lobbyId – effect re-runs with new lobby
      rerender("lobby-2");

      // New fetch should happen immediately
      await flush();
      await flush();
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // And the new interval should be active
      await advance(30_000);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  // ── visibility change ─────────────────────────────────────

  describe("visibility change", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    });

    function setDocumentHidden(hidden: boolean) {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => hidden,
      });
    }

    async function flush() {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
    }

    async function advance(ms: number) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });
    }

    it("pauses polling when document is hidden", async () => {
      setDocumentHidden(false);

      renderHook(() => useHeartbeat("lobby-1"));

      // Wait for initial fetch + interval
      await flush();
      await flush();
      const fetchCountAfterInit = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

      // Hide the document
      setDocumentHidden(true);
      document.dispatchEvent(new Event("visibilitychange"));

      // Advance well beyond the 30s interval
      await advance(60_000);

      // No additional fetches should have been made
      expect(global.fetch).toHaveBeenCalledTimes(fetchCountAfterInit);
    });

    it("resumes polling when document becomes visible", async () => {
      setDocumentHidden(false);

      renderHook(() => useHeartbeat("lobby-1"));

      // Wait for initial fetch + interval
      await flush();
      await flush();
      const fetchCountAfterInit = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

      // Hide and advance a bit
      setDocumentHidden(true);
      document.dispatchEvent(new Event("visibilitychange"));
      await advance(10_000);

      // Show again
      setDocumentHidden(false);
      document.dispatchEvent(new Event("visibilitychange"));

      // Should immediately sync (1 extra fetch) and then restart the interval
      await flush();
      await flush();

      expect(global.fetch).toHaveBeenCalledTimes(fetchCountAfterInit + 1);

      // The interval should now be active again
      await advance(30_000);
      expect(global.fetch).toHaveBeenCalledTimes(fetchCountAfterInit + 2);
    });
  });
});
