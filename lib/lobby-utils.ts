/**
 * Returns the team side for regulation rounds based on R6S ranked rules.
 * Rounds 1-3: startingSide (block 1)
 * Rounds 4-6: opposite (block 2)
 * Overtime (rounds 7-9): side chosen manually by the leader (random in real R6S)
 * This function is still used as fallback for OT but the actual side comes from user input.
 */
export function getTeamSide(
  startingSide: "attacker" | "defender",
  roundNumber: number,
): "attacker" | "defender" {
  const opposite = startingSide === "attacker" ? "defender" : "attacker";

  // Regulation: blocks of 3
  if (roundNumber <= 3) return startingSide;
  if (roundNumber <= 6) return opposite;

  // Overtime: alternate every round, start opposite of round 6
  if (roundNumber === 7) return startingSide;
  if (roundNumber === 8) return opposite;
  if (roundNumber === 9) return startingSide;

  // Fallback (should never happen in valid match)
  return startingSide;
}

/**
 * Calculate match score from completed rounds.
 */
export function getMatchScore(
  rounds: { winner_side: "attacker" | "defender" | null }[],
): {
  attacker: number;
  defender: number;
} {
  const score = { attacker: 0, defender: 0 };
  for (const round of rounds) {
    if (round.winner_side) {
      score[round.winner_side]++;
    }
  }
  return score;
}

/**
 * Determine match status based on score and round number.
 */
export function getMatchStatus(
  score: { attacker: number; defender: number },
  currentRoundNumber: number,
): {
  isOver: boolean;
  winner: "attacker" | "defender" | null;
  phase: "regulation" | "overtime" | "completed";
} {
  const { attacker, defender } = score;
  const maxScore = Math.max(attacker, defender);
  const isTied = attacker === defender;

  // Regulation (rounds 1-6): first to 4
  if (currentRoundNumber <= 6) {
    if (maxScore >= 4) {
      return {
        isOver: true,
        winner: attacker > defender ? "attacker" : "defender",
        phase: "completed",
      };
    }
    // Check if match can still reach 4 points
    // After round 6, if no one has 4, it's 3-3 → overtime
    if (currentRoundNumber === 6 && isTied) {
      // Match continues to overtime
    }
    return { isOver: false, winner: null, phase: "regulation" };
  }

  // Overtime (rounds 7-9): first to 5
  if (currentRoundNumber <= 9) {
    if (maxScore >= 5) {
      return {
        isOver: true,
        winner: attacker > defender ? "attacker" : "defender",
        phase: "completed",
      };
    }
    return { isOver: false, winner: null, phase: "overtime" };
  }

  // Round 9 completed → match must end
  return {
    isOver: true,
    winner: attacker > defender ? "attacker" : "defender",
    phase: "completed",
  };
}

/**
 * Check if a next round can be created.
 */
export function canCreateNextRound(
  score: { attacker: number; defender: number },
  currentRoundNumber: number,
): boolean {
  const status = getMatchStatus(score, currentRoundNumber);
  if (status.isOver) return false;
  if (currentRoundNumber >= 9) return false;
  return true;
}
