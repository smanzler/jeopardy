import type {
  HostMessage,
  PlayerMessage,
  Room,
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
}

export const createRoomState = (): RoomState => ({
  teamNames: [],
  players: [],
  round: { status: "closed" },
  nextRoundId: 1,
})

export const toRoom = ({ teamNames, players, round }: RoomState): Room => ({
  teamNames,
  players,
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
}

export const applyPlayerMessage = <TType extends keyof PlayerMessageMap>(
  state: RoomState,
  playerId: string,
  message: PlayerMessageMap[TType] & { type: TType }
): RoomState => playerHandlers[message.type](state, playerId, message)

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
