import { describe, expect, it } from "vitest"
import { buildPodium } from "@/features/game/lib/podium"

const toTeams = (standings: Array<{ teamIndex: number }>) =>
  standings.map((standing) => standing.teamIndex)

describe("buildPodium", () => {
  it("puts first in the middle and the teams after third below", () => {
    const { podium, rest } = buildPodium([1600, 3400, -200, 2200, 900])
    expect(toTeams(podium)).toEqual([3, 1, 0])
    expect(toTeams(rest)).toEqual([4, 2])
  })

  it("puts second on the right of first for two teams", () => {
    const { podium, rest } = buildPodium([200, 600])
    expect(toTeams(podium)).toEqual([1, 0])
    expect(rest).toEqual([])
  })

  it("keeps the shared rank of teams that draw", () => {
    const { podium } = buildPodium([800, 800, 100])
    expect(podium.map((standing) => standing.rank)).toEqual([1, 1, 3])
  })
})
