import type {
  HostMessage,
  PlayerMessage,
  Room,
  ServerMessage,
} from "@jeopardy/shared/buzzers/messages"

/** Time to wait after the first buzz for a faster one from a slower phone. */
export const BUZZ_WINDOW_MS = 250

type Buzz = { playerId: string; teamIndex: number; reactionMs: number }

type Round =
  | { status: "closed" }
  | {
      status: "open"
      roundId: number
      excludedTeamIndexes: Array<number>
      buzzes: Array<Buzz>
    }
  | { status: "won"; roundId: number; teamIndex: number }

export type RoomState = {
  teamNames: Array<string>
  players: Room["players"]
  round: Round
  nextRoundId: number
  final: Room["final"]
}

export const createRoomState = (): RoomState => ({
  teamNames: [],
  players: [],
  round: { status: "closed" },
  nextRoundId: 1,
  final: { step: "off" },
})

export const toRoom = ({
  teamNames,
  players,
  round,
  final,
}: RoomState): Room => ({
  teamNames,
  players,
  final,
  buzzer:
    round.status === "open"
      ? {
          status: "open",
          roundId: round.roundId,
          excludedTeamIndexes: round.excludedTeamIndexes,
        }
      : round,
})

type MessageMap<TMessage extends { type: string }> = {
  [TType in TMessage["type"]]: Extract<TMessage, { type: TType }>
}

type HostMessageMap = MessageMap<HostMessage>

type HostHandlers = {
  [K in keyof HostMessageMap]: (
    state: RoomState,
    message: HostMessageMap[K]
  ) => RoomState
}

const hostHandlers: HostHandlers = {
  setTeams: (state, { teamNames }) => ({
    ...state,
    teamNames,
    players: state.players.filter(
      ({ teamIndex }) => teamIndex < teamNames.length
    ),
  }),
  // The round holds team indexes that change, so it closes.
  removeTeam: (state, { teamIndex }) => ({
    ...state,
    teamNames: state.teamNames.filter((_, index) => index !== teamIndex),
    players: state.players
      .filter((player) => player.teamIndex !== teamIndex)
      .map((player) =>
        player.teamIndex > teamIndex
          ? { ...player, teamIndex: player.teamIndex - 1 }
          : player
      ),
    round: { status: "closed" },
  }),
  open: (state, { excludedTeamIndexes }) => ({
    ...state,
    round: {
      status: "open",
      roundId: state.nextRoundId,
      excludedTeamIndexes,
      buzzes: [],
    },
    nextRoundId: state.nextRoundId + 1,
  }),
  close: (state) => ({ ...state, round: { status: "closed" } }),
  setFinal: (state, { final }) => ({ ...state, final }),
  // The hub deletes the room, so the state stays as it is.
  end: (state) => state,
}

export const applyHostMessage = <TType extends keyof HostMessageMap>(
  state: RoomState,
  message: HostMessageMap[TType] & { type: TType }
): RoomState => hostHandlers[message.type](state, message)

type PlayerMessageMap = MessageMap<PlayerMessage>

type PlayerHandlers = {
  [K in keyof PlayerMessageMap]: (
    state: RoomState,
    playerId: string,
    message: PlayerMessageMap[K]
  ) => RoomState
}

const playerHandlers: PlayerHandlers = {
  join: (state, playerId, { teamIndex }) => {
    if (teamIndex >= state.teamNames.length) return state

    return {
      ...state,
      players: [
        ...state.players.filter(({ id }) => id !== playerId),
        { id: playerId, teamIndex },
      ],
    }
  },
  buzz: (state, playerId, { roundId, reactionMs }) => {
    const { round } = state
    const player = state.players.find(({ id }) => id === playerId)

    if (round.status !== "open" || round.roundId !== roundId || !player) {
      return state
    }
    if (round.excludedTeamIndexes.includes(player.teamIndex)) return state
    if (round.buzzes.some((buzz) => buzz.playerId === playerId)) return state

    return {
      ...state,
      round: {
        ...round,
        buzzes: [
          ...round.buzzes,
          { playerId, teamIndex: player.teamIndex, reactionMs },
        ],
      },
    }
  },
  // The host keeps the wagers and the answers, so the room only sends them on.
  wager: (state) => state,
  answer: (state) => state,
}

export const applyPlayerMessage = <TType extends keyof PlayerMessageMap>(
  state: RoomState,
  playerId: string,
  message: PlayerMessageMap[TType] & { type: TType }
): RoomState => playerHandlers[message.type](state, playerId, message)

type HostForwards = {
  [K in keyof PlayerMessageMap]: (
    state: RoomState,
    teamIndex: number,
    message: PlayerMessageMap[K]
  ) => ServerMessage | undefined
}

const hostForwards: HostForwards = {
  join: () => undefined,
  buzz: () => undefined,
  wager: ({ final }, teamIndex, { points }) => {
    if (final.step !== "wagering") return undefined
    const team = final.teams.at(teamIndex)
    if (team?.status !== "in" || team.hasWagered) return undefined
    if (points > team.maxWager) return undefined
    return { type: "finalWager", teamIndex, points }
  },
  answer: ({ final }, teamIndex, { answer }) => {
    if (final.step !== "answering") return undefined
    if (final.teams.at(teamIndex)?.status !== "in") return undefined
    return { type: "finalAnswer", teamIndex, answer }
  },
}

/** Gives the message for the host that a player message makes, if any. */
export const buildHostForward = <TType extends keyof PlayerMessageMap>(
  state: RoomState,
  playerId: string,
  message: PlayerMessageMap[TType] & { type: TType }
): ServerMessage | undefined => {
  const player = state.players.find(({ id }) => id === playerId)
  if (!player) return undefined
  return hostForwards[message.type](state, player.teamIndex, message)
}

/** Tells if this state has the first buzz of a round, so the window starts. */
export const startsBuzzWindow = ({ round }: RoomState): boolean =>
  round.status === "open" && round.buzzes.length === 1

/**
 * Gives the round to the buzz with the shortest reaction time. On a tie, the
 * buzz that came first wins.
 */
export const settleBuzzes = (state: RoomState): RoomState => {
  const { round } = state
  if (round.status !== "open" || round.buzzes.length === 0) return state

  const winner = round.buzzes.reduce((best, buzz) =>
    buzz.reactionMs < best.reactionMs ? buzz : best
  )

  return {
    ...state,
    round: {
      status: "won",
      roundId: round.roundId,
      teamIndex: winner.teamIndex,
    },
  }
}

export const removePlayer = (
  state: RoomState,
  playerId: string
): RoomState => ({
  ...state,
  players: state.players.filter(({ id }) => id !== playerId),
})
