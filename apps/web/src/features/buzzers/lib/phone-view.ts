import type { Buzzer, Room, RoomFinal } from "@jeopardy/shared/buzzers/messages"

/** What the phone of a player shows. */
export type PhoneView =
  | { kind: "pickTeam"; teamNames: Array<string> }
  | { kind: "waiting"; teamName: string }
  | { kind: "ready"; teamName: string }
  | { kind: "buzzed"; teamName: string }
  | { kind: "excluded"; teamName: string }
  | { kind: "won"; teamName: string }
  | { kind: "lost"; teamName: string; winnerName: string }
  | { kind: "finalOut"; teamName: string }
  | { kind: "finalWager"; category: string; maxWager: number; teamName: string }
  | { kind: "finalWagered"; category: string; teamName: string }
  | {
      kind: "finalAnswer"
      category: string
      /** True when a phone of the team sent an answer. */
      hasAnswered: boolean
      question: string
      teamName: string
    }
  | { kind: "finalClosed"; teamName: string }

type ViewInput<TStatus extends Buzzer["status"]> = {
  buzzer: Extract<Buzzer, { status: TStatus }>
  buzzedRoundId: number | null
  teamIndex: number
  teamNames: Array<string>
}

type ViewBuilders = {
  [TStatus in Buzzer["status"]]: (input: ViewInput<TStatus>) => PhoneView
}

const viewBuilders: ViewBuilders = {
  closed: ({ teamIndex, teamNames }) => ({
    kind: "waiting",
    teamName: teamNames[teamIndex],
  }),
  open: ({ buzzer, buzzedRoundId, teamIndex, teamNames }) => {
    const teamName = teamNames[teamIndex]
    if (buzzer.excludedTeamIndexes.includes(teamIndex)) {
      return { kind: "excluded", teamName }
    }
    if (buzzedRoundId === buzzer.roundId) return { kind: "buzzed", teamName }
    return { kind: "ready", teamName }
  },
  won: ({ buzzer, teamIndex, teamNames }) =>
    buzzer.teamIndex === teamIndex
      ? { kind: "won", teamName: teamNames[teamIndex] }
      : {
          kind: "lost",
          teamName: teamNames[teamIndex],
          winnerName: teamNames[buzzer.teamIndex],
        },
}

const buildForStatus = <TStatus extends Buzzer["status"]>(
  input: ViewInput<TStatus> & { buzzer: { status: TStatus } }
): PhoneView => viewBuilders[input.buzzer.status](input)

type FinalInput<TStep extends RoomFinal["step"]> = {
  final: Extract<RoomFinal, { step: TStep }>
  /** The view of the buzzer, for when Final Jeopardy is off. */
  buildBuzzerView: () => PhoneView
  teamIndex: number
  teamName: string
}

type FinalViewBuilders = {
  [TStep in RoomFinal["step"]]: (input: FinalInput<TStep>) => PhoneView
}

const finalViewBuilders: FinalViewBuilders = {
  off: ({ buildBuzzerView }) => buildBuzzerView(),
  wagering: ({ final, teamIndex, teamName }) => {
    const team = final.teams.at(teamIndex)
    if (team?.status !== "in") return { kind: "finalOut", teamName }
    if (team.hasWagered) {
      return { kind: "finalWagered", category: final.category, teamName }
    }
    return {
      kind: "finalWager",
      category: final.category,
      maxWager: team.maxWager,
      teamName,
    }
  },
  answering: ({ final, teamIndex, teamName }) => {
    const team = final.teams.at(teamIndex)
    if (team?.status !== "in") return { kind: "finalOut", teamName }
    return {
      kind: "finalAnswer",
      category: final.category,
      hasAnswered: team.hasAnswered,
      question: final.question,
      teamName,
    }
  },
  closed: ({ teamName }) => ({ kind: "finalClosed", teamName }),
}

const buildForFinal = <TStep extends RoomFinal["step"]>(
  input: FinalInput<TStep> & { final: { step: TStep } }
): PhoneView => finalViewBuilders[input.final.step](input)

/**
 * @param buzzedRoundId The round that this phone buzzed in last.
 * @param teamIndex No team, or a team the room does not have, asks the
 * player to pick one.
 */
export const buildPhoneView = ({
  buzzedRoundId,
  room,
  teamIndex,
}: {
  buzzedRoundId: number | null
  room: Room
  teamIndex: number | undefined
}): PhoneView => {
  if (teamIndex === undefined || teamIndex >= room.teamNames.length) {
    return { kind: "pickTeam", teamNames: room.teamNames }
  }
  return buildForFinal({
    final: room.final,
    buildBuzzerView: () =>
      buildForStatus({
        buzzer: room.buzzer,
        buzzedRoundId,
        teamIndex,
        teamNames: room.teamNames,
      }),
    teamIndex,
    teamName: room.teamNames[teamIndex],
  })
}
