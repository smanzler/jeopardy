import { useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useLiveQuery } from "dexie-react-hooks"
import type { QuestionPosition } from "@/lib/db"
import { formatRowValue, getRowValue, isEveryQuestionUsed } from "@/lib/board"
import { getGame } from "@/lib/games"
import {
  adjustTeamScore,
  closeQuestion,
  getSession,
  openQuestion,
  revealAnswer,
  startSession,
} from "@/lib/sessions"
import { ButtonLink } from "@/components/button-link"
import { LoadingScreen } from "@/components/loading-screen"
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

  useQuestionKeys({
    isOpen: Boolean(openPosition),
    onClose: () => closeQuestion(gameId),
    onReveal: () => revealAnswer(gameId),
  })

  // The game ends when the host shuts the last question that the board holds.
  const isFinished = Boolean(
    game &&
    session &&
    !session.openPosition &&
    isEveryQuestionUsed({
      categories: game.categories,
      usedKeys: session.usedKeys,
    })
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
        <ButtonLink variant="outline" to="/play">
          Boards
        </ButtonLink>
      </div>
    )
  }

  const title = game.title || "Untitled board"

  if (session === null) {
    return (
      <div className="flex h-svh flex-col">
        <TeamSetup
          title={title}
          onStart={(teamCount) => startSession({ gameId, teamCount })}
        />
      </div>
    )
  }

  const handleSelect = (position: QuestionPosition) =>
    openQuestion({ gameId, position })

  const openValue = openPosition
    ? getRowValue(openPosition.rowIndex)
    : undefined

  return (
    <div className="flex h-svh flex-col">
      {openPosition ? (
        <QuestionView
          categoryName={game.categories[openPosition.categoryIndex].name}
          isAnswerShown={session.isAnswerShown}
          onClose={() => closeQuestion(gameId)}
          question={
            game.categories[openPosition.categoryIndex].questions[
              openPosition.rowIndex
            ]
          }
          value={formatRowValue(openPosition.rowIndex)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 p-4">
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex gap-2">
              <ButtonLink
                variant="outline"
                to="/play/$gameId/winner"
                params={{ gameId }}
              >
                End the game
              </ButtonLink>
              <ButtonLink variant="outline" to="/play">
                Boards
              </ButtonLink>
            </div>
          </div>
          <div className="flex flex-1 flex-col px-4 pb-2">
            <GameBoard
              categories={game.categories}
              usedKeys={session.usedKeys}
              onSelect={handleSelect}
            />
          </div>
        </>
      )}
      <ScoreBar
        scores={session.scores}
        value={openValue}
        onAdjust={({ delta, teamIndex }) =>
          adjustTeamScore({ delta, gameId, teamIndex })
        }
      />
    </div>
  )
}
