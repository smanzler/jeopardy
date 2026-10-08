import { formatValue } from "@/lib/board"
import type { QuestionResult } from "@/lib/db"

export const buildScores = (teamCount: number): Array<number> =>
  Array.from({ length: teamCount }, () => 0)

export const setScore = ({
  score,
  scores,
  teamIndex,
}: {
  score: number
  scores: Array<number>
  teamIndex: number
}): Array<number> =>
  scores.map((existing, index) => (index === teamIndex ? score : existing))

export const adjustScore = ({
  delta,
  scores,
  teamIndex,
}: {
  delta: number
  scores: Array<number>
  teamIndex: number
}): Array<number> =>
  setScore({ score: scores[teamIndex] + delta, scores, teamIndex })

type ScoredQuestion = {
  questionResults: Array<QuestionResult>
  scores: Array<number>
}

export const findResult = ({
  questionResults,
  teamIndex,
}: {
  questionResults: Array<QuestionResult>
  teamIndex: number
}): QuestionResult | undefined =>
  questionResults.find((result) => result.teamIndex === teamIndex)

/** Scores one team on the open question. A team that has a result keeps it. */
export const applyResult = ({
  result,
  ...question
}: ScoredQuestion & { result: QuestionResult }): ScoredQuestion => {
  if (findResult({ ...question, teamIndex: result.teamIndex })) return question
  return {
    questionResults: [...question.questionResults, result],
    scores: adjustScore({ ...result, scores: question.scores }),
  }
}

/** Takes back the result of one team on the open question. */
export const undoResult = ({
  teamIndex,
  ...question
}: ScoredQuestion & { teamIndex: number }): ScoredQuestion => {
  const result = findResult({ ...question, teamIndex })
  if (!result) return question
  return {
    questionResults: question.questionResults.filter(
      (other) => other !== result
    ),
    scores: adjustScore({
      delta: -result.delta,
      scores: question.scores,
      teamIndex,
    }),
  }
}

/** A whole number of points, below 0 too, or `undefined` for other text. */
export const toScore = (text: string): number | undefined => {
  if (!/^-?\d+$/.test(text.trim())) return
  return Number(text)
}

export const formatTeamName = (teamIndex: number): string =>
  `Team ${teamIndex + 1}`

/** Gives a team with a blank name its number in place of the name. */
export const buildTeamNames = (names: Array<string>): Array<string> =>
  names.map((name, teamIndex) => name.trim() || formatTeamName(teamIndex))

/** A team in the order that the scores put it. Teams that draw share a rank. */
export type Standing = { rank: number; score: number; teamIndex: number }

export const buildStandings = (scores: Array<number>): Array<Standing> =>
  scores
    .map((score, teamIndex) => ({
      rank: scores.filter((other) => other > score).length + 1,
      score,
      teamIndex,
    }))
    .sort((a, b) => a.rank - b.rank || a.teamIndex - b.teamIndex)

/** The teams on the top rank, or none while every team shares it. */
export const listLeaderIndexes = (scores: Array<number>): Array<number> => {
  const leaders = buildStandings(scores).filter(
    (standing) => standing.rank === 1
  )
  if (leaders.length === scores.length) return []
  return leaders.map((standing) => standing.teamIndex)
}

const nameFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
})

type Teams = { scores: Array<number>; teamNames: Array<string> }

const listLeaders = ({ scores, teamNames }: Teams): Array<string> =>
  buildStandings(scores)
    .filter((standing) => standing.rank === 1)
    .map((standing) => teamNames[standing.teamIndex])

/** Names the teams on the top rank, and says if they win or draw. */
export const formatWinners = (teams: Teams): string => {
  const names = listLeaders(teams)
  if (names.length === 1) return `${names[0]} wins`
  return `${nameFormat.format(names)} draw`
}

/** Names the teams on the top rank of a game that still runs, and their score. */
export const formatLeaders = (teams: Teams): string => {
  const top = Math.max(...teams.scores)
  if (teams.scores.every((score) => score === 0)) return "No points yet"
  const names = listLeaders(teams)
  const standing = names.length === 1 ? "ahead" : "tied"
  return `${nameFormat.format(names)} ${standing} · ${formatValue(top)}`
}
