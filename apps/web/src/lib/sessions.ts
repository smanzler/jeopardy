import { db } from "@/lib/db"
import type {
  Board,
  QuestionPosition,
  QuestionResult,
  Session,
  Wager,
} from "@/lib/db"
import { buildDailyDoubleKeys } from "@/lib/daily-doubles"
import { buildQuestionKey } from "@/lib/board"
import { applyResult, buildScores, setScore, undoResult } from "@/lib/score"

export const getSession = (gameId: string): Promise<Session | undefined> =>
  db.sessions.get(gameId)

export const listSessions = (): Promise<Array<Session>> => db.sessions.toArray()

export const startSession = async ({
  boards,
  gameId,
  teamNames,
}: {
  boards: Array<Board>
  gameId: string
  teamNames: Array<string>
}): Promise<void> => {
  await db.sessions.put({
    boardIndex: 0,
    dailyDoubleKeys: buildDailyDoubleKeys({ boards, random: Math.random }),
    gameId,
    isAnswerShown: false,
    openPosition: null,
    questionResults: [],
    scores: buildScores(teamNames.length),
    teamNames,
    usedKeys: [],
    wager: null,
  })
}

export const endSession = async (gameId: string): Promise<void> => {
  await db.sessions.delete(gameId)
}

/**
 * Reads and writes the session in one transaction, so two presses in quick
 * succession cannot lose the work of the first.
 */
const changeSession = ({
  buildChanges,
  gameId,
}: {
  buildChanges: (session: Session) => Partial<Session>
  gameId: string
}): Promise<void> =>
  db.transaction("rw", db.sessions, async () => {
    const session = await db.sessions.get(gameId)
    if (!session) return
    await db.sessions.put({ ...session, ...buildChanges(session) })
  })

export const openQuestion = ({
  gameId,
  position,
}: {
  gameId: string
  position: QuestionPosition
}): Promise<void> =>
  changeSession({
    buildChanges: (session) => ({
      isAnswerShown: false,
      openPosition: position,
      questionResults: [],
      wager: null,
      usedKeys: [...new Set([...session.usedKeys, buildQuestionKey(position)])],
    }),
    gameId,
  })

export const revealAnswer = (gameId: string): Promise<void> =>
  changeSession({ buildChanges: () => ({ isAnswerShown: true }), gameId })

/** Closes the open question and shows the board at `boardIndex`. */
export const closeQuestion = ({
  boardIndex,
  gameId,
}: {
  boardIndex: number
  gameId: string
}): Promise<void> =>
  changeSession({
    buildChanges: () => ({
      boardIndex,
      isAnswerShown: false,
      openPosition: null,
      questionResults: [],
      wager: null,
    }),
    gameId,
  })

export const showBoard = ({
  boardIndex,
  gameId,
}: {
  boardIndex: number
  gameId: string
}): Promise<void> =>
  changeSession({ buildChanges: () => ({ boardIndex }), gameId })

export const scoreTeam = ({
  gameId,
  result,
}: {
  gameId: string
  result: QuestionResult
}): Promise<void> =>
  changeSession({
    buildChanges: (session) => applyResult({ ...session, result }),
    gameId,
  })

export const undoTeamScore = ({
  gameId,
  teamIndex,
}: {
  gameId: string
  teamIndex: number
}): Promise<void> =>
  changeSession({
    buildChanges: (session) => undoResult({ ...session, teamIndex }),
    gameId,
  })

export const setTeamScore = ({
  gameId,
  score,
  teamIndex,
}: {
  gameId: string
  score: number
  teamIndex: number
}): Promise<void> =>
  changeSession({
    buildChanges: (session) => ({
      scores: setScore({ score, scores: session.scores, teamIndex }),
    }),
    gameId,
  })

export const setWager = ({
  gameId,
  wager,
}: {
  gameId: string
  wager: Wager
}): Promise<void> => changeSession({ buildChanges: () => ({ wager }), gameId })
