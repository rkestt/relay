import { describe, it, expect } from "vitest";
import { getTeamSide } from "./lobby-utils";

describe("getTeamSide()", () => {
  it("returns starting side for odd rounds", () => {
    expect(getTeamSide("attacker", 1)).toBe("attacker");
    expect(getTeamSide("defender", 1)).toBe("defender");
    expect(getTeamSide("attacker", 3)).toBe("attacker");
    expect(getTeamSide("defender", 5)).toBe("defender");
  });

  it("returns opposite side for even rounds", () => {
    expect(getTeamSide("attacker", 2)).toBe("defender");
    expect(getTeamSide("defender", 2)).toBe("attacker");
    expect(getTeamSide("attacker", 4)).toBe("defender");
    expect(getTeamSide("defender", 6)).toBe("attacker");
  });

  it("alternates correctly for a sequence", () => {
    const startingSide = "attacker";
    const rounds = [1, 2, 3, 4, 5, 6];
    const expected = ["attacker", "defender", "attacker", "defender", "attacker", "defender"];
    const actual = rounds.map((r) => getTeamSide(startingSide, r));
    expect(actual).toEqual(expected);
  });
});
