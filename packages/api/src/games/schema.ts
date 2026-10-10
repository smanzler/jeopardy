import { sql } from "drizzle-orm"
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import type { Board, SessionState } from "@jeopardy/shared/games/schemas"
import { users } from "@/auth/schema"

export const games = pgTable(
  "games",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    boards: jsonb("boards").$type<Array<Board>>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("games_user_id_updated_at_idx").on(table.userId, table.updatedAt),
  ]
)

/** One game in progress for each game. */
export const gameSessions = pgTable("game_sessions", {
  gameId: uuid("game_id")
    .primaryKey()
    .references(() => games.id, { onDelete: "cascade" }),
  state: jsonb("state").$type<SessionState>().notNull(),
  /** Goes up by one on each write. A write must name the version it read. */
  version: integer("version").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
