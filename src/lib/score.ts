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

/** A whole number of points, below 0 too, or `undefined` for other text. */
export const toScore = (text: string): number | undefined => {
  if (!/^-?\d+$/.test(text.trim())) return
  return Number(text)
}

export const formatTeamName = (teamIndex: number): string =>
  `Team ${teamIndex + 1}`

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

const nameFormat = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
})

/** Names the teams on the top rank, and says if they win or draw. */
export const formatWinners = (scores: Array<number>): string => {
  const names = buildStandings(scores)
    .filter((standing) => standing.rank === 1)
    .map((standing) => formatTeamName(standing.teamIndex))
  if (names.length === 1) return `${names[0]} wins`
  return `${nameFormat.format(names)} draw`
}
