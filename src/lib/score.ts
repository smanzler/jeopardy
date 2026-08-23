export const buildScores = (teamCount: number): Array<number> =>
  Array.from({ length: teamCount }, () => 0)

export const adjustScore = ({
  delta,
  scores,
  teamIndex,
}: {
  delta: number
  scores: Array<number>
  teamIndex: number
}): Array<number> =>
  scores.map((score, index) => (index === teamIndex ? score + delta : score))

export const formatTeamName = (teamIndex: number): string =>
  `Team ${teamIndex + 1}`
