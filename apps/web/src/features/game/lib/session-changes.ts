import type {
  Board,
  QuestionPosition,
  QuestionResult,
  Session,
  Wager,
} from "@/lib/db"
import type { BuildSessionChanges } from "@/lib/game-store"
import { buildDailyDoubleKeys } from "@/lib/daily-doubles"
import { buildQuestionKey } from "@/lib/board"
import { applyResult, buildScores, setScore, undoResult } from "@/lib/score"

export const buildNewSession = ({
  boards,
  gameId,
  teamNames,
}: {
  boards: Array<Board>
  gameId: string
  teamNames: Array<string>
}): Session => ({
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

/** The changes that a host makes to a game in progress. */
export const sessionChanges = {
  openQuestion:
    (position: QuestionPosition): BuildSessionChanges =>
    (session) => ({
      isAnswerShown: false,
      openPosition: position,
      questionResults: [],
      wager: null,
      usedKeys: [...new Set([...session.usedKeys, buildQuestionKey(position)])],
    }),
  revealAnswer: (): BuildSessionChanges => () => ({ isAnswerShown: true }),
  /** Closes the open question and shows the board at `boardIndex`. */
  closeQuestion:
    (boardIndex: number): BuildSessionChanges =>
    () => ({
      boardIndex,
      isAnswerShown: false,
      openPosition: null,
      questionResults: [],
      wager: null,
    }),
  showBoard:
    (boardIndex: number): BuildSessionChanges =>
    () => ({
      boardIndex,
    }),
  scoreTeam:
    (result: QuestionResult): BuildSessionChanges =>
    (session) =>
      applyResult({ ...session, result }),
  undoTeamScore:
    (teamIndex: number): BuildSessionChanges =>
    (session) =>
      undoResult({ ...session, teamIndex }),
  setTeamScore:
    ({
      score,
      teamIndex,
    }: {
      score: number
      teamIndex: number
    }): BuildSessionChanges =>
    (session) => ({
      scores: setScore({ score, scores: session.scores, teamIndex }),
    }),
  setWager:
    (wager: Wager): BuildSessionChanges =>
    () => ({ wager }),
}
