import { create } from "zustand";
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

  setLobbyId: (id) => set({ lobbyId: id }),

  setLobbyCode: (code) => set({ lobbyCode: code }),

  setIsLeader: (isLeader) => set({ isLeader }),

  setMembers: (members) => set({ members }),

  upsertMember: (member) =>
    set((state) => {
      const idx = state.members.findIndex((m) => m.user_id === member.user_id);
      if (idx >= 0) {
        const updated = [...state.members];
        updated[idx] = member;
        return { members: updated };
      }
      return { members: [...state.members, member] };
    }),

  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => m.user_id !== userId),
    })),

  setMemberProfile: (userId, profile) =>
    set((state) => {
      const next = new Map(state.memberProfiles);
      next.set(userId, profile);
      return { memberProfiles: next };
    }),

  setCurrentRound: (round) => set({ currentRound: round }),

  setRounds: (rounds) => set({ rounds }),

  setSelections: (selections) => set({ selections }),

  upsertSelection: (selection) =>
    set((state) => {
      const idx = state.selections.findIndex(
        (s) => s.id === selection.id,
      );
      if (idx >= 0) {
        const updated = [...state.selections];
        updated[idx] = selection;
        return { selections: updated };
      }
      return { selections: [...state.selections, selection] };
    }),

  setBans: (bans) => set({ bans }),

  addBan: (ban) =>
    set((state) => ({ bans: [...state.bans, ban] })),

  removeBan: (banId) =>
    set((state) => ({
      bans: state.bans.filter((b) => b.id !== banId),
    })),

  upsertRound: (round) =>
    set((state) => {
      const idx = state.rounds.findIndex((r) => r.id === round.id);
      if (idx >= 0) {
        const updated = [...state.rounds];
        updated[idx] = round;
        return { rounds: updated, currentRound: round };
      }
      return { rounds: [...state.rounds, round], currentRound: round };
    }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  reset: () => set(initialState),
}));
