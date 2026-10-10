import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useLiveQuery } from "dexie-react-hooks"
import type { QuestionPosition, QuestionResult } from "@/lib/db"
import {
  buildQuestionKey,
  countQuestions,
  countQuestionsLeft,
  findQuestion,
  formatGameSummary,
  formatValue,
  getNextBoardIndex,
  isGameDone,
} from "@/lib/board"
import { getGame } from "@/lib/games"
import type { Stake } from "@/lib/score"
import {
  closeQuestion,
  getSession,
  openQuestion,
  revealAnswer,
  scoreTeam,
  setTeamScore,
  setWager,
  showBoard,
  startSession,
  undoTeamScore,
} from "@/lib/sessions"
import { ButtonLink } from "@/components/button-link"
import { LoadingScreen } from "@/components/loading-screen"
import { DailyDoubleWager } from "@/features/game/components/daily-double-wager"
import { GameBoard } from "@/features/game/components/game-board"
import { HostStrip } from "@/features/game/components/host-strip"
import { QuestionView } from "@/features/game/components/question-view"
import { ScoreBar } from "@/features/game/components/score-bar"
import { TeamSetup } from "@/features/game/components/team-setup"
import { useQuestionKeys } from "@/features/game/hooks/use-question-keys"
import { BuzzersDialog } from "@/features/buzzers/components/buzzers-dialog"
import { useHostRoom } from "@/features/buzzers/hooks/use-host-room"
import {
  buildMessageAfterScore,
  describeBuzzer,
  listExcludedTeams,
} from "@/features/buzzers/lib/buzzer-status"

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
  const {
    hostRoom,
    send: sendToRoom,
    start: startBuzzers,
  } = useHostRoom({
    gameId,
    teamNames: session?.teamNames ?? [],
  })
  const [isBuzzersOpen, setIsBuzzersOpen] = useState(false)
  const openPosition = session?.openPosition
  const isDailyDouble = Boolean(
    openPosition &&
    session.dailyDoubleKeys.includes(buildQuestionKey(openPosition))
  )
  // The question of a daily double waits for the wager of the team.
  const isWagering = isDailyDouble && session?.wager === null
  const buzzer = hostRoom.status === "live" ? hostRoom.room.buzzer : undefined
  // A daily double belongs to one team, so nobody buzzes on it.
  const canOpenBuzzers = Boolean(
    buzzer &&
    buzzer.status !== "open" &&
    openPosition &&
    !isDailyDouble &&
    !session.isAnswerShown
  )

  const handleOpenBuzzers = () => {
    if (!session || !canOpenBuzzers) return
    sendToRoom({
      type: "open",
      excludedTeamIndexes: listExcludedTeams(session.questionResults),
    })
  }

  const closeBuzzers = () => {
    if (buzzer && buzzer.status !== "closed") sendToRoom({ type: "close" })
  }

  const handleReveal = () => {
    closeBuzzers()
    return revealAnswer(gameId)
  }

  const handleScore = (result: QuestionResult) => {
    if (session && buzzer) {
      const message = buildMessageAfterScore({
        buzzer,
        delta: result.delta,
        questionResults: [...session.questionResults, result],
        teamCount: session.teamNames.length,
      })
      if (message) sendToRoom(message)
    }
    return scoreTeam({ gameId, result })
  }

  const handleClose = () => {
    if (!game || !session) return
    closeBuzzers()
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
    onOpenBuzzers: handleOpenBuzzers,
    onReveal: handleReveal,
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
  const buildStake = (): Stake | undefined => {
    if (!openQuestionView) return
    if (!isDailyDouble) return { points: openQuestionView.value, type: "all" }
    // A daily double scores the wager in place of the value of its row.
    if (session.wager) return { ...session.wager, type: "team" }
  }
  const stake = buildStake()

  return (
    <div className="flex h-svh flex-col">
      {openQuestionView && isWagering && (
        <DailyDoubleWager
          categoryName={openQuestionView.categoryName}
          onClose={handleClose}
          scores={session.scores}
          teamNames={session.teamNames}
          onWager={(wager) => setWager({ gameId, wager })}
        />
      )}
      {openQuestionView && !isWagering && stake !== undefined && (
        <QuestionView
          buzzerStatus={buzzer && describeBuzzer(buzzer, session.teamNames)}
          canOpenBuzzers={canOpenBuzzers}
          categoryName={openQuestionView.categoryName}
          isAnswerShown={session.isAnswerShown}
          onClose={handleClose}
          question={openQuestionView.question}
          value={formatValue(stake.points)}
        />
      )}
      {!openQuestionView && (
        <>
          <HostStrip
            boardCount={game.boards.length}
            boardIndex={boardIndex}
            gameId={gameId}
            phoneCount={
              hostRoom.status === "live"
                ? hostRoom.room.players.length
                : undefined
            }
            questionsLeft={countQuestionsLeft({
              board: game.boards[boardIndex],
              boardIndex,
              usedKeys: session.usedKeys,
            })}
            questionTotal={countQuestions({
              boards: [game.boards[boardIndex]],
            })}
            title={title}
            onOpenBuzzers={() => setIsBuzzersOpen(true)}
            onSelectBoard={(index) => showBoard({ boardIndex: index, gameId })}
          />
          <div className="flex flex-1 flex-col px-3.5 py-2.5">
            <GameBoard
              board={game.boards[boardIndex]}
              boardIndex={boardIndex}
              usedKeys={session.usedKeys}
              onSelect={handleSelect}
            />
          </div>
        </>
      )}
      <BuzzersDialog
        hostRoom={hostRoom}
        isOpen={isBuzzersOpen}
        onOpenChange={setIsBuzzersOpen}
        onStart={startBuzzers}
      />
      <ScoreBar
        buzzedTeamIndex={
          openQuestionView && buzzer?.status === "won"
            ? buzzer.teamIndex
            : undefined
        }
        questionResults={session.questionResults}
        scores={session.scores}
        stake={stake}
        teamNames={session.teamNames}
        onScore={handleScore}
        onSetScore={({ score, teamIndex }) =>
          setTeamScore({ gameId, score, teamIndex })
        }
        onUndo={(teamIndex) => undoTeamScore({ gameId, teamIndex })}
      />
    </div>
  )
}
