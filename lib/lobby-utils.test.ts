import { describe, it, expect } from "vitest";
import {
  getTeamSide,
  getMatchScore,
  getMatchStatus,
  canCreateNextRound,
} from "./lobby-utils";

describe("getTeamSide()", () => {
  it("returns starting side for rounds 1-3", () => {
    expect(getTeamSide("attacker", 1)).toBe("attacker");
    expect(getTeamSide("attacker", 2)).toBe("attacker");
    expect(getTeamSide("attacker", 3)).toBe("attacker");
    expect(getTeamSide("defender", 1)).toBe("defender");
    expect(getTeamSide("defender", 3)).toBe("defender");
  });

  it("returns opposite side for rounds 4-6", () => {
    expect(getTeamSide("attacker", 4)).toBe("defender");
    expect(getTeamSide("attacker", 5)).toBe("defender");
    expect(getTeamSide("attacker", 6)).toBe("defender");
    expect(getTeamSide("defender", 4)).toBe("attacker");
    expect(getTeamSide("defender", 6)).toBe("attacker");
  });

  it("returns correct sides for overtime rounds 7-9", () => {
    // Round 7 = switch from round 6 (opposite of starting)
    expect(getTeamSide("attacker", 7)).toBe("attacker");
    // Round 8 = switch back
    expect(getTeamSide("attacker", 8)).toBe("defender");
    // Round 9 = switch again
    expect(getTeamSide("attacker", 9)).toBe("attacker");

    // Mirror for defender start
    expect(getTeamSide("defender", 7)).toBe("defender");
    expect(getTeamSide("defender", 8)).toBe("attacker");
    expect(getTeamSide("defender", 9)).toBe("defender");
  });

  it("produces correct full sequence", () => {
    const seq = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) =>
      getTeamSide("attacker", r),
    );
    expect(seq).toEqual([
      "attacker",
      "attacker",
      "attacker",
      "defender",
      "defender",
      "defender",
      "attacker",
      "defender",
      "attacker",
    ]);
  });
});

describe("getMatchScore()", () => {
  it("counts wins per side", () => {
    const rounds: { winner_side: "attacker" | "defender" | null }[] = [
      { winner_side: "attacker" },
      { winner_side: "attacker" },
      { winner_side: "defender" },
      { winner_side: null },
    ];
    expect(getMatchScore(rounds)).toEqual({ attacker: 2, defender: 1 });
  });
});

describe("getMatchStatus()", () => {
  it("regulation: first to 4 wins", () => {
    expect(getMatchStatus({ attacker: 4, defender: 2 }, 6)).toEqual({
      isOver: true,
      winner: "attacker",
      phase: "completed",
    });
  });

  it("regulation: not over if no one has 4", () => {
    expect(getMatchStatus({ attacker: 3, defender: 2 }, 5)).toEqual({
      isOver: false,
      winner: null,
      phase: "regulation",
    });
  });

  it("overtime: first to 5 wins", () => {
    expect(getMatchStatus({ attacker: 5, defender: 3 }, 8)).toEqual({
      isOver: true,
      winner: "attacker",
      phase: "completed",
    });
  });

  it("overtime: not over if no one has 5", () => {
    expect(getMatchStatus({ attacker: 4, defender: 4 }, 8)).toEqual({
      isOver: false,
      winner: null,
      phase: "overtime",
    });
  });

  it("round 9 completed: match over", () => {
    expect(getMatchStatus({ attacker: 5, defender: 4 }, 9)).toEqual({
      isOver: true,
      winner: "attacker",
      phase: "completed",
    });
  });
});

describe("canCreateNextRound()", () => {
  it("allows next round in regulation if no one won", () => {
    expect(canCreateNextRound({ attacker: 2, defender: 1 }, 3)).toBe(true);
  });

  it("blocks next round if match over", () => {
    expect(canCreateNextRound({ attacker: 4, defender: 2 }, 6)).toBe(false);
  });

  it("blocks next round after round 9", () => {
    expect(canCreateNextRound({ attacker: 5, defender: 4 }, 9)).toBe(false);
  });
});
