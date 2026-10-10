import Dexie from "dexie"
import type { GameDraft, SessionState } from "@jeopardy/shared/games/schemas"
import type { EntityTable } from "dexie"
import {
  toGameV3,
  toGameV4,
  toSessionV3,
  toSessionV4,
  toSessionV5,
  toSessionV6,
  toSessionV7,
} from "@/lib/migrations"

export type {
  Board,
  Category,
  CellPosition,
  DailyDoubles,
  GameDraft,
  Question,
  QuestionPosition,
  QuestionResult,
  Wager,
} from "@jeopardy/shared/games/schemas"

export type Game = GameDraft & { id: string; updatedAt: number }

/**
 * A game in progress. One game holds one session, so a reload keeps the
 * scores and the questions that the game showed already.
 */
export type Session = SessionState & { gameId: string }

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
db.version(7)
  .stores({ games: "id, updatedAt", sessions: "gameId" })
  .upgrade(async (tx) => {
    await tx
      .table("sessions")
      .toCollection()
      .modify((session, ref) => {
        ref.value = toSessionV7(session)
      })
  })

export { db }
