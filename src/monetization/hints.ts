/** 1問（1挑戦）あたりの無料ヒント回数。超過分はリワード広告視聴で解放する。 */
export const freeHintsPerPuzzle = 3

export const canRevealHintFreely = (revealedThisPuzzle: number): boolean =>
  revealedThisPuzzle < freeHintsPerPuzzle
