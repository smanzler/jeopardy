import { buildStandings } from "@/lib/score"
import type { Standing } from "@/lib/score"

const PODIUM_SIZE = 3

/** The podium puts first in the middle, second on its left and third on its right. */
const PODIUM_ORDER = [1, 0, 2]

/**
 * Splits the standings into the teams on the podium, in the order that it
 * shows them, and the teams after them.
 */
export const buildPodium = (
  scores: Array<number>
): { podium: Array<Standing>; rest: Array<Standing> } => {
  const standings = buildStandings(scores)
  const top = standings.slice(0, PODIUM_SIZE)
  return {
    podium: PODIUM_ORDER.filter((index) => index < top.length).map(
      (index) => top[index]
    ),
    rest: standings.slice(PODIUM_SIZE),
  }
}
