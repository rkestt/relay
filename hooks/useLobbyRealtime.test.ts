import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ── Mock Supabase channel ──────────────────────────────────────

const registeredHandlers: Array<{
  config: Record<string, unknown>;
  callback: (...args: unknown[]) => void;
}> = [];

const mockChannel = {
  on: vi.fn((_type: string, config: Record<string, unknown>, callback: (...args: unknown[]) => void) => {
    registeredHandlers.push({ config, callback });
    return mockChannel;
  }),
  subscribe: vi.fn((cb: (status: string) => void) => {
    cb("SUBSCRIBED");
    return mockChannel;
  }),
};

const mockSupabaseClient = {
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}));

// ── Mock lobby store ───────────────────────────────────────────

const storeActions = {
  // state (selectors might request these)
  connectionStatus: "disconnected" as string,
  // actions
  setConnectionStatus: vi.fn(),
  upsertMember: vi.fn(),
  removeMember: vi.fn(),
  upsertSelection: vi.fn(),
  addBan: vi.fn(),
  removeBan: vi.fn(),
  upsertRound: vi.fn(),
};

vi.mock("@/stores/lobbyStore", () => ({
  useLobbyStore: vi.fn((selector: (s: typeof storeActions) => unknown) =>
    selector(storeActions),
  ),
}));

// ── SUT ────────────────────────────────────────────────────────

import { useLobbyRealtime } from "./useLobbyRealtime";

// ── Helpers ────────────────────────────────────────────────────

function findHandler(table: string, event: string) {
  return registeredHandlers.find(
    (h) => h.config.table === table && h.config.event === event,
  );
}

const fakeMember = {
  id: "member-1",
  lobby_id: "lobby-1",
  user_id: "user-1",
  joined_at: new Date().toISOString(),
};

const fakeSelection = {
  id: "sel-1",
  lobby_id: "lobby-1",
  user_id: "user-1",
  round_id: "round-1",
  map_id: null,
  site_id: null,
  operator_id: null,
  locked_at: null,
};

const fakeBan = {
  id: "ban-1",
  lobby_id: "lobby-1",
  operator_id: "op-1",
  side: "attacker" as const,
  round_id: "round-1",
  created_at: new Date().toISOString(),
};

const fakeRound = {
  id: "round-1",
  lobby_id: "lobby-1",
  round_number: 1,
  status: "active" as const,
  team_side: null,
  created_at: new Date().toISOString(),
};

// ── Tests ──────────────────────────────────────────────────────

describe("useLobbyRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registeredHandlers.length = 0;
    // Restore default subscribe implementation
    mockChannel.subscribe.mockReset();
    mockChannel.subscribe.mockImplementation((cb) => {
      cb("SUBSCRIBED");
      return mockChannel;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── lifecycle ──────────────────────────────────────────────

  it("does nothing when lobbyId is null", () => {
    renderHook(() => useLobbyRealtime(null));

    expect(mockSupabaseClient.channel).not.toHaveBeenCalled();
    expect(storeActions.setConnectionStatus).toHaveBeenCalledWith("disconnected");
  });

  it("subscribes to the correct channel name", () => {
    renderHook(() => useLobbyRealtime("lobby-xyz"));

    expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
      "lobby:lobby-xyz",
      expect.objectContaining({
        config: { broadcast: { self: true }, presence: { key: "" } },
      }),
    );
    expect(mockChannel.subscribe).toHaveBeenCalledTimes(1);
  });

  it("registers 9 postgres_changes listeners across 5 tables", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));

    expect(registeredHandlers).toHaveLength(9);

    const tables = registeredHandlers.map((h) => h.config.table);
    expect(tables.filter((t) => t === "lobby_members")).toHaveLength(2);
    expect(tables.filter((t) => t === "lobby_selections")).toHaveLength(2);
    expect(tables.filter((t) => t === "lobby_bans")).toHaveLength(2);
    expect(tables.filter((t) => t === "rounds")).toHaveLength(2);
    expect(tables.filter((t) => t === "lobbies")).toHaveLength(1);
  });

  // ── payload callbacks ──────────────────────────────────────

  it("calls upsertMember on lobby_members INSERT", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("lobby_members", "INSERT");
    expect(handler).toBeDefined();

    act(() => {
      handler!.callback({ new: fakeMember });
    });

    expect(storeActions.upsertMember).toHaveBeenCalledWith(fakeMember);
  });

  it("calls removeMember on lobby_members DELETE", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("lobby_members", "DELETE");
    expect(handler).toBeDefined();

    act(() => {
      handler!.callback({ old: fakeMember });
    });

    expect(storeActions.removeMember).toHaveBeenCalledWith(fakeMember.user_id);
  });

  it("calls upsertSelection on lobby_selections INSERT", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("lobby_selections", "INSERT");
    expect(handler).toBeDefined();

    act(() => {
      handler!.callback({ new: fakeSelection });
    });

    expect(storeActions.upsertSelection).toHaveBeenCalledWith(fakeSelection);
  });

  it("calls upsertSelection on lobby_selections UPDATE", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("lobby_selections", "UPDATE");
    expect(handler).toBeDefined();

    act(() => {
      handler!.callback({ new: fakeSelection });
    });

    expect(storeActions.upsertSelection).toHaveBeenCalledWith(fakeSelection);
  });

  it("calls addBan on lobby_bans INSERT", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("lobby_bans", "INSERT");
    expect(handler).toBeDefined();

    act(() => {
      handler!.callback({ new: fakeBan });
    });

    expect(storeActions.addBan).toHaveBeenCalledWith(fakeBan);
  });

  it("calls removeBan on lobby_bans DELETE", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("lobby_bans", "DELETE");
    expect(handler).toBeDefined();

    act(() => {
      handler!.callback({ old: fakeBan });
    });

    expect(storeActions.removeBan).toHaveBeenCalledWith(fakeBan.id);
  });

  it("calls upsertRound on rounds INSERT", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("rounds", "INSERT");
    expect(handler).toBeDefined();

    act(() => {
      handler!.callback({ new: fakeRound });
    });

    expect(storeActions.upsertRound).toHaveBeenCalledWith(fakeRound);
  });

  it("calls upsertRound on rounds UPDATE", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("rounds", "UPDATE");
    expect(handler).toBeDefined();

    act(() => {
      handler!.callback({ new: fakeRound });
    });

    expect(storeActions.upsertRound).toHaveBeenCalledWith(fakeRound);
  });

  it("updates lastEventAt on lobbies UPDATE (no data store action)", () => {
    const { result } = renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("lobbies", "UPDATE");
    expect(handler).toBeDefined();
    expect(result.current.lastEventAt).toBeNull();

    act(() => {
      handler!.callback({ new: { id: "lobby-1", status: "playing" } });
    });

    expect(result.current.lastEventAt).toBeGreaterThan(0);
    // lobbies UPDATE only updates lastEventAt, not any data store action
    expect(storeActions.upsertMember).not.toHaveBeenCalled();
    expect(storeActions.removeMember).not.toHaveBeenCalled();
    expect(storeActions.upsertSelection).not.toHaveBeenCalled();
    expect(storeActions.addBan).not.toHaveBeenCalled();
    expect(storeActions.removeBan).not.toHaveBeenCalled();
    expect(storeActions.upsertRound).not.toHaveBeenCalled();
  });

  // ── skip callback when payload is empty ────────────────────

  it("does not call upsertMember when lobby_members INSERT payload.new is falsy", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("lobby_members", "INSERT");
    act(() => {
      handler!.callback({ new: null });
    });
    expect(storeActions.upsertMember).not.toHaveBeenCalled();
  });

  it("does not call removeMember when lobby_members DELETE payload.old is falsy", () => {
    renderHook(() => useLobbyRealtime("lobby-1"));
    const handler = findHandler("lobby_members", "DELETE");
    act(() => {
      handler!.callback({ old: null });
    });
    expect(storeActions.removeMember).not.toHaveBeenCalled();
  });

  // ── cleanup ────────────────────────────────────────────────

  it("calls removeChannel and sets disconnected on unmount", () => {
    const { unmount } = renderHook(() => useLobbyRealtime("lobby-1"));

    unmount();

    expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(mockChannel);
    // last call to setConnectionStatus should be "disconnected"
    const calls = storeActions.setConnectionStatus.mock.calls as string[][];
    expect(calls[calls.length - 1][0]).toBe("disconnected");
  });

  it("cleans up previous subscription on lobbyId change", () => {
    const { rerender } = renderHook(
      (id: string | null) => useLobbyRealtime(id),
      { initialProps: "lobby-1" },
    );

    // Sanity – first subscription was created
    expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(1);
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
      "lobby:lobby-1",
      expect.any(Object),
    );

    // Change lobbyId
    rerender("lobby-2");

    // Should have removed the old channel and created a new one
    expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(mockChannel);
    expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(2);
    expect(mockSupabaseClient.channel).toHaveBeenLastCalledWith(
      "lobby:lobby-2",
      expect.any(Object),
    );
  });

  // ── reconnect ──────────────────────────────────────────────

  it("reconnects on CHANNEL_ERROR with exponential backoff", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    let callCount = 0;
    mockChannel.subscribe.mockReset();
    mockChannel.subscribe.mockImplementation((cb) => {
      callCount++;
      if (callCount === 1) cb("CHANNEL_ERROR");
      else cb("SUBSCRIBED");
      return mockChannel;
    });

    renderHook(() => useLobbyRealtime("lobby-1"));

    // First subscribe triggered CHANNEL_ERROR → scheduleReconnect called
    expect(storeActions.setConnectionStatus).toHaveBeenCalledWith("error");
    expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(1);

    // Advance by initial reconnect delay (1 000 ms)
    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    // Second subscribe should have fired
    expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(2);
    expect(storeActions.setConnectionStatus).toHaveBeenLastCalledWith("connected");
  });

  it("reconnects on TIMED_OUT with exponential backoff", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    let callCount = 0;
    mockChannel.subscribe.mockReset();
    mockChannel.subscribe.mockImplementation((cb) => {
      callCount++;
      if (callCount === 1) cb("TIMED_OUT");
      else cb("SUBSCRIBED");
      return mockChannel;
    });

    renderHook(() => useLobbyRealtime("lobby-1"));

    expect(storeActions.setConnectionStatus).toHaveBeenCalledWith("error");

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(2);
    expect(storeActions.setConnectionStatus).toHaveBeenLastCalledWith("connected");
  });

  it("doubles reconnect delay on repeated errors (exponential backoff)", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    let callCount = 0;
    mockChannel.subscribe.mockReset();
    mockChannel.subscribe.mockImplementation((cb) => {
      callCount++;
      if (callCount <= 2) cb("CHANNEL_ERROR");
      else cb("SUBSCRIBED");
      return mockChannel;
    });

    renderHook(() => useLobbyRealtime("lobby-1"));

    // 1st error → retryCount 1, delay 1000
    expect(storeActions.setConnectionStatus).toHaveBeenCalledWith("error");
    expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1_000); // 1st reconnect fires
    });
    expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(2);

    // 2nd error → retryCount 2, delay 2000
    expect(storeActions.setConnectionStatus).toHaveBeenCalledWith("error");

    act(() => {
      vi.advanceTimersByTime(2_000); // 2nd reconnect fires
    });
    expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(3);

    // 3rd connect succeeds
    expect(storeActions.setConnectionStatus).toHaveBeenLastCalledWith("connected");
  });

  it("caps reconnect delay at 30 seconds", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    // Simulate many errors to push delay to max
    let callCount = 0;
    mockChannel.subscribe.mockReset();
    mockChannel.subscribe.mockImplementation((cb) => {
      callCount++;
      if (callCount <= 6) cb("CHANNEL_ERROR");
      else cb("SUBSCRIBED");
      return mockChannel;
    });

    renderHook(() => useLobbyRealtime("lobby-1"));

    // After 6 errors the delay should be capped at 30s
    // error 1→ 1s, error 2→ 2s, error 3→ 4s, error 4→ 8s, error 5→ 16s, error 6→ 30s
    for (let i = 0; i < 5; i++) {
      const delay = Math.min(1000 * 2 ** i, 30000);
      act(() => {
        vi.advanceTimersByTime(delay);
      });
    }
    // 6th reconnect (succeeds), waiting 30s
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(mockSupabaseClient.channel).toHaveBeenCalledTimes(7);
    expect(storeActions.setConnectionStatus).toHaveBeenLastCalledWith("connected");
  });
});
