import Dexie from "dexie"
import type { EntityTable } from "dexie"
import {
  toGameV3,
  toGameV4,
  toSessionV3,
  toSessionV4,
  toSessionV5,
  toSessionV6,
} from "@/lib/migrations"

export type Question = { answer: string; question: string }

export type Category = { name: string; questions: Array<Question> }

/** Where a question sits on a board. */
export type CellPosition = { categoryIndex: number; rowIndex: number }

/**
 * The daily doubles of a board. The editor picks `chosen` positions. A game
 * picks `count` random positions when it starts.
 */
export type DailyDoubles =
  | { positions: Array<CellPosition>; type: "chosen" }
  | { count: number; type: "random" }

/**
 * One round of a game. `values` holds the points of each row, top to bottom,
 * so it has one entry for each question in a category.
 */
export type Board = {
  categories: Array<Category>
  dailyDoubles: DailyDoubles
  values: Array<number>
}

/** The points that one team got on the open question, so the host can undo them. */
export type QuestionResult = { delta: number; teamIndex: number }

/** Where a question sits in a game. */
export type QuestionPosition = CellPosition & { boardIndex: number }

/** A game that is still in the editor and has no database identity yet. */
export type GameDraft = { boards: Array<Board>; title: string }

export type Game = GameDraft & { id: string; updatedAt: number }

/**
 * A game in progress. One game holds one session, so a reload keeps the
 * scores and the questions that the game showed already.
 */
export type Session = {
  /** The board that the host sees while no question is open. */
  boardIndex: number
  /** Keys from `buildQuestionKey`, fixed when the game starts. */
  dailyDoubleKeys: Array<string>
  gameId: string
  isAnswerShown: boolean
  openPosition: QuestionPosition | null
  /** At most one result for each team, for the open question only. */
  questionResults: Array<QuestionResult>
  scores: Array<number>
  /** One name for each entry of `scores`. */
  teamNames: Array<string>
  /** Keys from `buildQuestionKey`, for the questions that the game showed. */
  usedKeys: Array<string>
  /** The points that a team stakes on the open daily double, once it is set. */
  wager: number | null
}

const db = new Dexie("jeopardy") as Dexie & {
  games: EntityTable<Game, "id">
  sessions: EntityTable<Session, "gameId">
}

db.version(1).stores({ games: "id, updatedAt" })
db.version(2).stores({ games: "id, updatedAt", sessions: "gameId" })
db.version(3)
  .stores({ games: "id, updatedAt", sessions: "gameId" })
  .upgrade(async (tx) => {
    await tx
      .table("games")
      .toCollection()
      .modify((game, ref) => {
        ref.value = toGameV3(game)
      })
    await tx
      .table("sessions")
      .toCollection()
      .modify((session, ref) => {
        ref.value = toSessionV3(session)
      })
  })
db.version(4)
  .stores({ games: "id, updatedAt", sessions: "gameId" })
  .upgrade(async (tx) => {
    await tx
      .table("games")
      .toCollection()
      .modify((game, ref) => {
        ref.value = toGameV4(game)
      })
    await tx
      .table("sessions")
      .toCollection()
      .modify((session, ref) => {
        ref.value = toSessionV4(session)
      })
  })
db.version(5)
  .stores({ games: "id, updatedAt", sessions: "gameId" })
  .upgrade(async (tx) => {
    await tx
      .table("sessions")
      .toCollection()
      .modify((session, ref) => {
        ref.value = toSessionV5(session)
      })
  })
db.version(6)
  .stores({ games: "id, updatedAt", sessions: "gameId" })
  .upgrade(async (tx) => {
    await tx
      .table("sessions")
      .toCollection()
      .modify((session, ref) => {
        ref.value = toSessionV6(session)
      })
  })

export { db }
