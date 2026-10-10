import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
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
import type { Stake } from "@/lib/score"
import type { BuildSessionChanges, GameStorage } from "@/lib/game-store"
import { useGame, useGameActions, useSession } from "@/hooks/use-games"
import { LoadingScreen } from "@/components/loading-screen"
import { GameUnavailable } from "@/components/game-storage"
import { DailyDoubleWager } from "@/features/game/components/daily-double-wager"
import { GameBoard } from "@/features/game/components/game-board"
import { HostStrip } from "@/features/game/components/host-strip"
import { QuestionView } from "@/features/game/components/question-view"
import { ScoreBar } from "@/features/game/components/score-bar"
import { TeamSetup } from "@/features/game/components/team-setup"
import { useQuestionKeys } from "@/features/game/hooks/use-question-keys"
import {
  buildNewSession,
  sessionChanges,
} from "@/features/game/lib/session-changes"
import { BuzzersDialog } from "@/features/buzzers/components/buzzers-dialog"
import { useHostRoom } from "@/features/buzzers/hooks/use-host-room"
import {
  buildMessageAfterScore,
  describeBuzzer,
  listExcludedTeams,
} from "@/features/buzzers/lib/buzzer-status"

export default function Play({
  gameId,
  storage,
}: {
  gameId: string
  storage: GameStorage
}) {
  const navigate = useNavigate()
  // The game loads on the client, and each write updates the query.
  const gameQuery = useGame(storage, gameId)
  const sessionQuery = useSession(storage, gameId)
  const game = gameQuery.data
  const session = sessionQuery.data
  const { changeSession, putSession } = useGameActions(storage)
  const change = (buildChanges: BuildSessionChanges) =>
    changeSession({ buildChanges, gameId })
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
    return change(sessionChanges.revealAnswer())
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
    return change(sessionChanges.scoreTeam(result))
  }

  const handleClose = () => {
    if (!game || !session) return
    closeBuzzers()
    return change(
      sessionChanges.closeQuestion(
        getNextBoardIndex({
          boardIndex: session.boardIndex,
          boards: game.boards,
          usedKeys: session.usedKeys,
        })
      )
    )
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
        search: { storage },
        to: "/play/$gameId/winner",
      })
    }
  }, [gameId, isFinished, navigate, storage])

  if (gameQuery.isError || sessionQuery.isError || game === null) {
    return (
      <GameUnavailable
        isError={gameQuery.isError || sessionQuery.isError}
        storage={storage}
      />
    )
  }

  if (game === undefined || session === undefined) {
    return <LoadingScreen />
  }

  const title = game.title || "Untitled board"

  if (session === null) {
    return (
      <div className="flex h-svh flex-col">
        <TeamSetup
          summary={formatGameSummary(game)}
          title={title}
          onStart={(teamNames) =>
            putSession(
              buildNewSession({ boards: game.boards, gameId, teamNames })
            )
          }
        />
      </div>
    )
  }

  // The editor can remove the board that the game shows.
  const boardIndex = Math.min(session.boardIndex, game.boards.length - 1)

  const handleSelect = (position: QuestionPosition) =>
    change(sessionChanges.openQuestion(position))

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
          onWager={(wager) => change(sessionChanges.setWager(wager))}
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
            storage={storage}
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
            onSelectBoard={(index) => change(sessionChanges.showBoard(index))}
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
          change(sessionChanges.setTeamScore({ score, teamIndex }))
        }
        onUndo={(teamIndex) => change(sessionChanges.undoTeamScore(teamIndex))}
      />
    </div>
  )
}
