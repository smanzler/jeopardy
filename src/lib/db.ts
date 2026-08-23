import Dexie from "dexie"
import type { EntityTable } from "dexie"

export type Question = { answer: string; question: string }

export type Category = { name: string; questions: Array<Question> }

/** Where a question sits on the board. */
export type QuestionPosition = { categoryIndex: number; rowIndex: number }

/** A board that is still in the editor and has no database identity yet. */
export type GameDraft = { categories: Array<Category>; title: string }

export type Game = GameDraft & { id: string; updatedAt: number }

/**
 * A game in progress. One board holds one session, so a reload keeps the
 * scores and the questions that the game showed already.
 */
export type Session = {
  gameId: string
  isAnswerShown: boolean
  openPosition: QuestionPosition | null
  scores: Array<number>
  /** Keys from `buildQuestionKey`, for the questions that the game showed. */
  usedKeys: Array<string>
}

const db = new Dexie("jeopardy") as Dexie & {
  games: EntityTable<Game, "id">
  sessions: EntityTable<Session, "gameId">
}

db.version(1).stores({ games: "id, updatedAt" })
db.version(2).stores({ games: "id, updatedAt", sessions: "gameId" })

export { db }
