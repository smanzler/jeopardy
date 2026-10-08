import type { Game, Session } from "@/lib/db"
import {
  countCompleteQuestions,
  countQuestions,
  countQuestionsLeft,
  formatBoardCount,
  isGameDone,
} from "@/lib/board"

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

export const formatGameSummary = (game: Game): string => {
  const total = countQuestions(game)
  const complete = countCompleteQuestions(game)
  const questions =
    complete === total
      ? `${total} questions`
      : `${complete} of ${total} written`
  return `${formatBoardCount(game.boards.length)} · ${questions}`
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
  const total = countQuestions({ boards: [board], title: "" })
  const progress = `${left} of ${total} questions left`
  return game.boards.length > 1
    ? `Board ${boardIndex + 1} · ${progress}`
    : progress
}
