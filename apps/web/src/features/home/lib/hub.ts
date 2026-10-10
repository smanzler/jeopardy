import type { Game, Session } from "@/lib/db"
import {
  countCompleteQuestions,
  countQuestions,
  countQuestionsLeft,
  isGameDone,
} from "@/lib/board"
import { formatLeaders } from "@/lib/score"

export type GameInProgress = { game: Game; session: Session }

/** The games that a host can resume, in the order of `games`. */
export const findGamesInProgress = ({
  games,
  sessions,
}: {
  games: Array<Game>
  sessions: Array<Session>
}): Array<GameInProgress> =>
  games.flatMap((game) => {
    const session = sessions.find((other) => other.gameId === game.id)
    // A finished game waits on its winner screen, so it has nothing to resume.
    if (
      !session ||
      isGameDone({ boards: game.boards, usedKeys: session.usedKeys })
    )
      return []
    return [{ game, session }]
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
}: GameInProgress): string => {
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
