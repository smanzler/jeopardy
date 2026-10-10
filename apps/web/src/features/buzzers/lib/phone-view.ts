import type { Buzzer, Room } from "@jeopardy/shared/buzzers/messages"

/** What the phone of a player shows. */
export type PhoneView =
  | { kind: "pickTeam"; teamNames: Array<string> }
  | { kind: "waiting"; teamName: string }
  | { kind: "ready"; teamName: string }
  | { kind: "buzzed"; teamName: string }
  | { kind: "excluded"; teamName: string }
  | { kind: "won"; teamName: string }
  | { kind: "lost"; teamName: string; winnerName: string }

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
  return buildForStatus({
    buzzer: room.buzzer,
    buzzedRoundId,
    teamIndex,
    teamNames: room.teamNames,
  })
}
