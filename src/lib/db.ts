import Dexie from "dexie"
import type { EntityTable } from "dexie"

export type Question = { answer: string; question: string }

export type Category = { name: string; questions: Array<Question> }

/** A board that is still in the editor and has no database identity yet. */
export type GameDraft = { categories: Array<Category>; title: string }

export type Game = GameDraft & { id: string; updatedAt: number }

const db = new Dexie("jeopardy") as Dexie & {
  games: EntityTable<Game, "id">
}

db.version(1).stores({ games: "id, updatedAt" })

export { db }
