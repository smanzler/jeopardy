import { db } from "@/lib/db"
import type { QuestionPosition, Session } from "@/lib/db"
import { buildQuestionKey } from "@/lib/board"
import { adjustScore, buildScores } from "@/lib/score"

export const getSession = (gameId: string): Promise<Session | undefined> =>
  db.sessions.get(gameId)

export const startSession = async ({
  gameId,
  teamCount,
}: {
  gameId: string
  teamCount: number
}): Promise<void> => {
  await db.sessions.put({
    boardIndex: 0,
    gameId,
    isAnswerShown: false,
    openPosition: null,
    scores: buildScores(teamCount),
    usedKeys: [],
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
      usedKeys: [...new Set([...session.usedKeys, buildQuestionKey(position)])],
    }),
    gameId,
  })

export const revealAnswer = (gameId: string): Promise<void> =>
  changeSession({ buildChanges: () => ({ isAnswerShown: true }), gameId })

export const closeQuestion = (gameId: string): Promise<void> =>
  changeSession({
    buildChanges: () => ({ isAnswerShown: false, openPosition: null }),
    gameId,
  })

export const adjustTeamScore = ({
  delta,
  gameId,
  teamIndex,
}: {
  delta: number
  gameId: string
  teamIndex: number
}): Promise<void> =>
  changeSession({
    buildChanges: (session) => ({
      scores: adjustScore({ delta, scores: session.scores, teamIndex }),
    }),
    gameId,
  })
