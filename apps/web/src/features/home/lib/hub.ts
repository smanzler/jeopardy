import type { Game, Session } from "@/lib/db"
import { gameStorageSchema } from "@/lib/game-store"
import type { GameList, GameStorage } from "@/lib/game-store"
import {
  countCompleteQuestions,
  countQuestions,
  countQuestionsLeft,
  isGameDone,
} from "@/lib/board"
import { formatLeaders } from "@/lib/score"

/** A game with its game in progress and the store that holds it. */
export type StoredGame = {
  game: Game
  session: Session | undefined
  storage: GameStorage
}

export type GameInProgress = StoredGame & { session: Session }

/** Puts the games of each store in one list, the last changed first. */
export const mergeGameLists = (
  lists: Partial<Record<GameStorage, GameList | undefined>>
): Array<StoredGame> =>
  gameStorageSchema.options
    .flatMap((storage) => {
      const list = lists[storage]
      // A list that has not loaded yet adds no games.
      if (!list) return []
      return list.games.map((game) => ({
        game,
        session: list.sessions.find((session) => session.gameId === game.id),
        storage,
      }))
    })
    .sort((a, b) => b.game.updatedAt - a.game.updatedAt)

/** The games that a host can resume, in the order of `games`. */
export const findGamesInProgress = (
  games: Array<StoredGame>
): Array<GameInProgress> =>
  games.flatMap((entry) => {
    const { game, session } = entry
    // A finished game waits on its winner screen, so it has nothing to resume.
    if (
      !session ||
      isGameDone({ boards: game.boards, usedKeys: session.usedKeys })
    )
      return []
    return [{ ...entry, session }]
  })

export type CardState = "in-progress" | "ready" | "unfinished"

/** What the card of a game says about it. `value` runs from 0 to 100. */
export type CardStatus = {
  detail: string
  progress: { label: string; value: number }
  state: CardState
}

const toPercent = ({ count, total }: { count: number; total: number }) =>
  total === 0 ? 0 : Math.round((count / total) * 100)

/**
 * A game in progress shows the questions that it played, and any other game
 * shows the questions that the editor holds.
 */
export const buildCardStatus = ({
  game,
  session,
}: {
  game: Game
  session: Session | undefined
}): CardStatus => {
  const total = countQuestions(game)
  if (
    session &&
    !isGameDone({ boards: game.boards, usedKeys: session.usedKeys })
  ) {
    const left = game.boards.reduce(
      (sum, board, boardIndex) =>
        sum +
        countQuestionsLeft({ board, boardIndex, usedKeys: session.usedKeys }),
      0
    )
    const played = total - left
    return {
      detail: formatLeaders(session),
      progress: {
        label: `${played} of ${total} played`,
        value: toPercent({ count: played, total }),
      },
      state: "in-progress",
    }
  }
  const complete = countCompleteQuestions(game)
  const written = `${complete} of ${total} written`
  if (complete === total) {
    return {
      detail: `All ${total} written`,
      progress: { label: written, value: 100 },
      state: "ready",
    }
  }
  return {
    detail: written,
    progress: { label: written, value: toPercent({ count: complete, total }) },
    state: "unfinished",
  }
}

export const formatGameProgress = ({
  game,
  session,
}: Pick<GameInProgress, "game" | "session">): string => {
  // The editor can remove the board that the session shows.
  const boardIndex = Math.min(session.boardIndex, game.boards.length - 1)
  const board = game.boards[boardIndex]
  const left = countQuestionsLeft({
    board,
    boardIndex,
    usedKeys: session.usedKeys,
  })
  const total = countQuestions({ boards: [board] })
  const progress = `${left} of ${total} questions left`
  return game.boards.length > 1
    ? `Board ${boardIndex + 1} · ${progress}`
    : progress
}
