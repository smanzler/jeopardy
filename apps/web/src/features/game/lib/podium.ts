import { buildStandings } from "@/lib/score"
import type { Standing } from "@/lib/score"

const PODIUM_SIZE = 3

/** Three teams stand second, first, third. Two teams stand first, second. */
const PODIUM_ORDERS: Record<number, Array<number>> = {
  1: [0],
  2: [0, 1],
  3: [1, 0, 2],
}

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
    podium: PODIUM_ORDERS[top.length].map((index) => top[index]),
    rest: standings.slice(PODIUM_SIZE),
  }
}
