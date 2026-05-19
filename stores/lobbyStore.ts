import { create } from "zustand";
import { logger } from "@/lib/logger";
import type {
  LobbyMember,
  LobbySelection,
  Round,
  LobbyBan,
} from "@/types";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface LobbyState {
  // ── Lobby metadata ──
  lobbyId: string | null;
  lobbyCode: string | null;
  isLeader: boolean;

  // ── Members ──
  members: LobbyMember[];
  memberProfiles: Map<string, { username: string; avatar_url: string | null }>;

  // ── Rounds ──
  currentRound: Round | null;
  rounds: Round[];

  // ── Selections & Bans ──
  selections: LobbySelection[];
  bans: LobbyBan[];

  // ── Connection ──
  connectionStatus: ConnectionStatus;

  // ── Actions ──
  setLobbyId: (id: string) => void;
  setLobbyCode: (code: string) => void;
  setIsLeader: (isLeader: boolean) => void;
  setMembers: (members: LobbyMember[]) => void;
  upsertMember: (member: LobbyMember) => void;
  removeMember: (userId: string) => void;
  setMemberProfile: (userId: string, profile: { username: string; avatar_url: string | null }) => void;
  setCurrentRound: (round: Round | null) => void;
  setRounds: (rounds: Round[]) => void;
  setSelections: (selections: LobbySelection[]) => void;
  upsertSelection: (selection: LobbySelection) => void;
  setBans: (bans: LobbyBan[]) => void;
  addBan: (ban: LobbyBan) => void;
  removeBan: (banId: string) => void;
  upsertRound: (round: Round) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  reset: () => void;
}

const initialState = {
  lobbyId: null,
  lobbyCode: null,
  isLeader: false,
  members: [],
  memberProfiles: new Map(),
  currentRound: null,
  rounds: [],
  selections: [],
  bans: [],
  connectionStatus: "disconnected" as ConnectionStatus,
};

export const useLobbyStore = create<LobbyState>()((set) => ({
  ...initialState,

  setLobbyId: (id) => {
    logger.debug("lobbyStore", "setLobbyId", { id });
    set({ lobbyId: id });
  },

  setLobbyCode: (code) => {
    logger.debug("lobbyStore", "setLobbyCode", { code });
    set({ lobbyCode: code });
  },

  setIsLeader: (isLeader) => {
    logger.debug("lobbyStore", "setIsLeader", { isLeader });
    set({ isLeader });
  },

  setMembers: (members) => {
    logger.debug("lobbyStore", "setMembers", { count: members.length });
    set({ members });
  },

  upsertMember: (member) => {
    logger.debug("lobbyStore", "upsertMember", { user_id: member.user_id });
    return set((state) => {
      const idx = state.members.findIndex((m) => m.user_id === member.user_id);
      if (idx >= 0) {
        const updated = [...state.members];
        updated[idx] = member;
        return { members: updated };
      }
      return { members: [...state.members, member] };
    });
  },

  removeMember: (userId) => {
    logger.debug("lobbyStore", "removeMember", { userId });
    return set((state) => ({
      members: state.members.filter((m) => m.user_id !== userId),
    }));
  },

  setMemberProfile: (userId, profile) => {
    logger.debug("lobbyStore", "setMemberProfile", { userId, username: profile.username });
    return set((state) => {
      const next = new Map(state.memberProfiles);
      next.set(userId, profile);
      return { memberProfiles: next };
    });
  },

  setCurrentRound: (round) => {
    logger.debug("lobbyStore", "setCurrentRound", { roundId: round?.id ?? null });
    set({ currentRound: round });
  },

  setRounds: (rounds) => {
    logger.debug("lobbyStore", "setRounds", { count: rounds.length });
    set({ rounds });
  },

  setSelections: (selections) => {
    logger.debug("lobbyStore", "setSelections", { count: selections.length });
    set({ selections });
  },

  upsertSelection: (selection) => {
    logger.debug("lobbyStore", "upsertSelection", { id: selection.id });
    return set((state) => {
      const idx = state.selections.findIndex(
        (s) => s.id === selection.id,
      );
      if (idx >= 0) {
        const updated = [...state.selections];
        updated[idx] = selection;
        return { selections: updated };
      }
      return { selections: [...state.selections, selection] };
    });
  },

  setBans: (bans) => {
    logger.debug("lobbyStore", "setBans", { count: bans.length });
    set({ bans });
  },

  addBan: (ban) => {
    logger.debug("lobbyStore", "addBan", { id: ban.id });
    return set((state) => ({ bans: [...state.bans, ban] }));
  },

  removeBan: (banId) => {
    logger.debug("lobbyStore", "removeBan", { banId });
    return set((state) => ({
      bans: state.bans.filter((b) => b.id !== banId),
    }));
  },

  upsertRound: (round) => {
    logger.debug("lobbyStore", "upsertRound", { id: round.id });
    return set((state) => {
      const idx = state.rounds.findIndex((r) => r.id === round.id);
      const nextRounds =
        idx >= 0
          ? state.rounds.map((r, i) => (i === idx ? round : r))
          : [...state.rounds, round];

      // currentRound = active round with highest round_number
      const active = nextRounds
        .filter((r) => r.status === "active")
        .sort((a, b) => b.round_number - a.round_number);
      const nextCurrentRound = active[0] ?? null;

      return { rounds: nextRounds, currentRound: nextCurrentRound };
    });
  },

  setConnectionStatus: (connectionStatus) => {
    logger.debug("lobbyStore", "setConnectionStatus", { connectionStatus });
    set({ connectionStatus });
  },

  reset: () => {
    logger.debug("lobbyStore", "reset");
    set(initialState);
  },
}));
