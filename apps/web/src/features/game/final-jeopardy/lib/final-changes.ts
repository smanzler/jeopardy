import type { FinalReveal, FinalState } from "@jeopardy/shared/games/schemas"
import type { BuildSessionChanges } from "@/lib/game-store"
import { adjustScore } from "@/lib/score"

export type FinalStep<TStep extends FinalState["step"]> = Extract<
  FinalState,
  { step: TStep }
>

type WageringTeam = FinalStep<"wagering">["teams"][number]

type WageredTeam = FinalStep<"clue">["teams"][number]

type RevealTeam = FinalStep<"reveal">["teams"][number]

const isWagered = (team: WageringTeam): team is WageredTeam =>
  team.status === "out" || team.wager !== null

/** True when each team that plays has a wager, so the clue can show. */
export const isWageringDone = (final: FinalStep<"wagering">): boolean =>
  final.teams.every(isWagered)

/** True when the host scored each team that plays, so the game can end. */
export const isRevealDone = (final: FinalStep<"reveal" | "done">): boolean =>
  final.teams.every(
    (team) => team.status === "out" || team.reveal.status === "scored"
  )

const getDelta = (team: RevealTeam): number =>
  team.status === "in" && team.reveal.status === "scored"
    ? team.reveal.delta
    : 0

/**
 * The teams that play, in the order that the host reveals them: the lowest
 * score before Final Jeopardy first.
 */
export const listRevealOrder = ({
  final,
  scores,
}: {
  final: FinalStep<"reveal" | "done">
  scores: Array<number>
}): Array<number> =>
  final.teams
    .map((team, teamIndex) => ({
      score: scores[teamIndex] - getDelta(team),
      team,
      teamIndex,
    }))
    .filter(({ team }) => team.status === "in")
    .sort((a, b) => a.score - b.score || a.teamIndex - b.teamIndex)
    .map(({ teamIndex }) => teamIndex)

const buildWageringFinal = (scores: Array<number>): FinalStep<"wagering"> => ({
  step: "wagering",
  teams: scores.map((score) =>
    score > 0
      ? { maxWager: score, status: "in", wager: null }
      : { status: "out" }
  ),
})

const isValidWager = ({
  maxWager,
  points,
}: {
  maxWager: number
  points: number | null
}) =>
  points === null ||
  (Number.isInteger(points) && points >= 0 && points <= maxWager)

/**
 * Changes the reveal of one team that plays. `buildReveal` gives `undefined`
 * when the reveal cannot change.
 */
const changeReveal = ({
  buildReveal,
  final,
  teamIndex,
}: {
  buildReveal: (
    team: Extract<RevealTeam, { status: "in" }>
  ) => FinalReveal | undefined
  final: FinalStep<"reveal">
  teamIndex: number
}): FinalStep<"reveal"> | undefined => {
  const team = final.teams.at(teamIndex)
  if (team?.status !== "in") return undefined
  const reveal = buildReveal(team)
  if (!reveal) return undefined
  return {
    ...final,
    teams: final.teams.map((existing, index) =>
      index === teamIndex ? { ...team, reveal } : existing
    ),
  }
}

/** The changes that a host makes during Final Jeopardy. */
export const finalChanges = {
  /** Fixes which teams play and the most that each one can wager. */
  start: (): BuildSessionChanges => (session) =>
    session.final
      ? {}
      : { final: buildWageringFinal(session.scores), isAnswerShown: false },
  /** `null` takes the wager back, so the team can wager again. */
  setWager:
    ({
      points,
      teamIndex,
    }: {
      points: number | null
      teamIndex: number
    }): BuildSessionChanges =>
    ({ final }) => {
      if (final?.step !== "wagering") return {}
      const team = final.teams.at(teamIndex)
      if (team?.status !== "in") return {}
      if (!isValidWager({ maxWager: team.maxWager, points })) return {}
      return {
        final: {
          ...final,
          teams: final.teams.map((existing, index) =>
            index === teamIndex ? { ...team, wager: points } : existing
          ),
        },
      }
    },
  showClue:
    (): BuildSessionChanges =>
    ({ final }) => {
      if (final?.step !== "wagering") return {}
      const { teams } = final
      if (!teams.every(isWagered)) return {}
      return { final: { step: "clue", teams } }
    },
  startReveal:
    (): BuildSessionChanges =>
    ({ final }) => {
      if (final?.step !== "clue") return {}
      return {
        final: {
          step: "reveal",
          teams: final.teams.map((team) =>
            team.status === "in"
              ? { ...team, reveal: { status: "hidden" } }
              : team
          ),
        },
      }
    },
  revealTeam:
    (teamIndex: number): BuildSessionChanges =>
    ({ final }) => {
      if (final?.step !== "reveal") return {}
      const next = changeReveal({
        buildReveal: ({ reveal }) =>
          reveal.status === "hidden" ? { status: "shown" } : undefined,
        final,
        teamIndex,
      })
      return next ? { final: next } : {}
    },
  /** Adds the wager of the team to its score, or takes it away. */
  scoreTeam:
    ({
      isCorrect,
      teamIndex,
    }: {
      isCorrect: boolean
      teamIndex: number
    }): BuildSessionChanges =>
    ({ final, scores }) => {
      if (final?.step !== "reveal") return {}
      const team = final.teams.at(teamIndex)
      if (team?.status !== "in" || team.reveal.status !== "shown") return {}
      // A wager of 0 gives 0 either way, not -0.
      const delta = isCorrect || team.wager === 0 ? team.wager : -team.wager
      const next = changeReveal({
        buildReveal: () => ({ delta, status: "scored" }),
        final,
        teamIndex,
      })
      return next
        ? { final: next, scores: adjustScore({ delta, scores, teamIndex }) }
        : {}
    },
  undoScore:
    (teamIndex: number): BuildSessionChanges =>
    ({ final, scores }) => {
      if (final?.step !== "reveal") return {}
      const team = final.teams.at(teamIndex)
      if (team?.status !== "in" || team.reveal.status !== "scored") return {}
      const delta = -team.reveal.delta
      const next = changeReveal({
        buildReveal: () => ({ status: "shown" }),
        final,
        teamIndex,
      })
      return next
        ? { final: next, scores: adjustScore({ delta, scores, teamIndex }) }
        : {}
    },
  finish:
    (): BuildSessionChanges =>
    ({ final }) => {
      if (final?.step !== "reveal" || !isRevealDone(final)) return {}
      return { final: { ...final, step: "done" } }
    },
}
