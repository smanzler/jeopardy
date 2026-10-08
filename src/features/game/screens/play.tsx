import { useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useLiveQuery } from "dexie-react-hooks"
import type { QuestionPosition } from "@/lib/db"
import {
  buildQuestionKey,
  findQuestion,
  formatGameSummary,
  formatValue,
  getNextBoardIndex,
  isGameDone,
} from "@/lib/board"
import { getGame } from "@/lib/games"
import {
  adjustTeamScore,
  closeQuestion,
  getSession,
  openQuestion,
  revealAnswer,
  setTeamScore,
  setWager,
  showBoard,
  startSession,
} from "@/lib/sessions"
import { BoardTabs } from "@/components/board-tabs"
import { ButtonLink } from "@/components/button-link"
import { LoadingScreen } from "@/components/loading-screen"
import { DailyDoubleWager } from "@/features/game/components/daily-double-wager"
import { GameBoard } from "@/features/game/components/game-board"
import { QuestionView } from "@/features/game/components/question-view"
import { ScoreBar } from "@/features/game/components/score-bar"
import { TeamSetup } from "@/features/game/components/team-setup"
import { useQuestionKeys } from "@/features/game/hooks/use-question-keys"

export default function Play({ gameId }: { gameId: string }) {
  const navigate = useNavigate()
  // Dexie holds the board and the game in the browser, so the load waits for
  // the client. A live query then follows every write.
  const game = useLiveQuery(
    async () => (await getGame(gameId)) ?? null,
    [gameId]
  )
  const session = useLiveQuery(
    async () => (await getSession(gameId)) ?? null,
    [gameId]
  )
  const openPosition = session?.openPosition
  const isDailyDouble = Boolean(
    openPosition &&
    session.dailyDoubleKeys.includes(buildQuestionKey(openPosition))
  )
  // The question of a daily double waits for the wager of the team.
  const isWagering = isDailyDouble && session?.wager === null

  const handleClose = () => {
    if (!game || !session) return
    return closeQuestion({
      boardIndex: getNextBoardIndex({
        boardIndex: session.boardIndex,
        boards: game.boards,
        usedKeys: session.usedKeys,
      }),
      gameId,
    })
  }

  useQuestionKeys({
    // The keys stay free while the host types the wager.
    isOpen: Boolean(openPosition) && !isWagering,
    onClose: handleClose,
    onReveal: () => revealAnswer(gameId),
  })

  // The game ends when the host shuts the last question that the game holds.
  const isFinished = Boolean(
    game &&
    session &&
    !session.openPosition &&
    isGameDone({ boards: game.boards, usedKeys: session.usedKeys })
  )

  useEffect(() => {
    // The replace keeps the finished board out of the history, which would
    // otherwise send the host straight back here.
    if (isFinished) {
      void navigate({
        params: { gameId },
        replace: true,
        to: "/play/$gameId/winner",
      })
    }
  }, [gameId, isFinished, navigate])

  if (game === undefined || session === undefined) {
    return <LoadingScreen />
  }

  if (game === null) {
    return (
      <div className="flex flex-col items-start gap-4 p-6">
        <p>That board is not in this browser.</p>
        <ButtonLink variant="outline" to="/">
          Home
        </ButtonLink>
      </div>
    )
  }

  const title = game.title || "Untitled board"

  if (session === null) {
    return (
      <div className="flex h-svh flex-col">
        <TeamSetup
          summary={formatGameSummary(game)}
          title={title}
          onStart={(teamNames) =>
            startSession({ boards: game.boards, gameId, teamNames })
          }
        />
      </div>
    )
  }

  // The editor can remove the board that the game shows.
  const boardIndex = Math.min(session.boardIndex, game.boards.length - 1)

  const handleSelect = (position: QuestionPosition) =>
    openQuestion({ gameId, position })

  const openQuestionView =
    openPosition &&
    findQuestion({ boards: game.boards, position: openPosition })
  // A daily double scores the wager in place of the value of its row.
  const stake = isDailyDouble
    ? (session.wager ?? undefined)
    : openQuestionView?.value

  return (
    <div className="flex h-svh flex-col">
      {openQuestionView && isWagering && (
        <DailyDoubleWager
          categoryName={openQuestionView.categoryName}
          onClose={handleClose}
          onWager={(wager) => setWager({ gameId, wager })}
        />
      )}
      {openQuestionView && !isWagering && stake !== undefined && (
        <QuestionView
          categoryName={openQuestionView.categoryName}
          isAnswerShown={session.isAnswerShown}
          onClose={handleClose}
          question={openQuestionView.question}
          value={formatValue(stake)}
        />
      )}
      {!openQuestionView && (
        <>
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <h1 className="font-heading text-2xl font-semibold tracking-wide uppercase">
              {title}
            </h1>
            {game.boards.length > 1 && (
              <div className="flex gap-1 rounded-full bg-secondary p-1">
                <BoardTabs
                  boardCount={game.boards.length}
                  boardIndex={boardIndex}
                  className="rounded-full px-4 font-heading tracking-wider uppercase"
                  inactiveVariant="ghost"
                  onSelect={(index) => showBoard({ boardIndex: index, gameId })}
                />
              </div>
            )}
            <div className="flex gap-2">
              <ButtonLink
                variant="outline"
                className="font-heading tracking-wider uppercase"
                to="/play/$gameId/winner"
                params={{ gameId }}
              >
                End the game
              </ButtonLink>
              <ButtonLink
                variant="outline"
                className="font-heading tracking-wider uppercase"
                to="/"
              >
                Home
              </ButtonLink>
            </div>
          </div>
          <div className="flex flex-1 flex-col px-5 pb-3">
            <GameBoard
              board={game.boards[boardIndex]}
              boardIndex={boardIndex}
              usedKeys={session.usedKeys}
              onSelect={handleSelect}
            />
          </div>
        </>
      )}
      <ScoreBar
        scores={session.scores}
        teamNames={session.teamNames}
        value={stake}
        onAdjust={({ delta, teamIndex }) =>
          adjustTeamScore({ delta, gameId, teamIndex })
        }
        onSetScore={({ score, teamIndex }) =>
          setTeamScore({ gameId, score, teamIndex })
        }
      />
    </div>
  )
}
