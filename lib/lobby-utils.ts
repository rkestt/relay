/**
 * Returns the team side for a given round number based on the starting side.
 * In R6S ranked, sides alternate every round.
 * Round 1: starting_side, Round 2: opposite, Round 3: starting_side, etc.
 */
export function getTeamSide(
  startingSide: "attacker" | "defender",
  roundNumber: number,
): "attacker" | "defender" {
  const isOdd = roundNumber % 2 === 1;
  if (isOdd) return startingSide;
  return startingSide === "attacker" ? "defender" : "attacker";
}
