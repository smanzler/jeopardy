import { z } from "zod"

export const MAX_CATEGORY_COUNT = 8

export const MAX_ROW_COUNT = 8

export const MAX_BOARD_COUNT = 3

export const MAX_RANDOM_DAILY_DOUBLES = 3

const indexSchema = z.number().int().min(0)

export const questionSchema = z.object({
  answer: z.string(),
  question: z.string(),
})

export type Question = z.infer<typeof questionSchema>

export const categorySchema = z.object({
  name: z.string(),
  questions: z.array(questionSchema),
})

export type Category = z.infer<typeof categorySchema>

/** Where a question sits on a board. */
export const cellPositionSchema = z.object({
  categoryIndex: indexSchema,
  rowIndex: indexSchema,
})

export type CellPosition = z.infer<typeof cellPositionSchema>

/**
 * The daily doubles of a board. The editor picks `chosen` positions. A game
 * picks `count` random positions when it starts. A `none` board has none.
 */
export const dailyDoublesSchema = z.discriminatedUnion("type", [
  z.object({
    positions: z.array(cellPositionSchema),
    type: z.literal("chosen"),
  }),
  z.object({ type: z.literal("none") }),
  z.object({
    count: z.number().int().min(0).max(MAX_RANDOM_DAILY_DOUBLES),
    type: z.literal("random"),
  }),
])

export type DailyDoubles = z.infer<typeof dailyDoublesSchema>

/**
 * One round of a game. `values` holds the points of each row, top to bottom,
 * so it has one entry for each question in a category.
 */
export const boardSchema = z
  .object({
    categories: z.array(categorySchema).min(1).max(MAX_CATEGORY_COUNT),
    dailyDoubles: dailyDoublesSchema,
    values: z.array(indexSchema).min(1).max(MAX_ROW_COUNT),
  })
  .refine(
    (board) =>
      board.categories.every(
        (category) => category.questions.length === board.values.length
      ),
    "Each category needs one question for each row."
  )
  .refine(
    (board) =>
      board.dailyDoubles.type !== "chosen" ||
      board.dailyDoubles.positions.every(
        (position) =>
          position.categoryIndex < board.categories.length &&
          position.rowIndex < board.values.length
      ),
    "Each daily double must be on the board."
  )

export type Board = z.infer<typeof boardSchema>

/** A game that has no storage identity yet. */
export const gameDraftSchema = z.object({
  boards: z.array(boardSchema).min(1).max(MAX_BOARD_COUNT),
  title: z.string(),
})

export type GameDraft = z.infer<typeof gameDraftSchema>

/** The points that one team got on the open question, so the host can undo them. */
export const questionResultSchema = z.object({
  delta: z.number(),
  teamIndex: indexSchema,
})

export type QuestionResult = z.infer<typeof questionResultSchema>

/** The points that the team that chose a daily double stakes on it. */
export const wagerSchema = z.object({
  points: z.number(),
  teamIndex: indexSchema,
})

export type Wager = z.infer<typeof wagerSchema>

/** Where a question sits in a game. */
export const questionPositionSchema = cellPositionSchema.extend({
  boardIndex: indexSchema,
})

export type QuestionPosition = z.infer<typeof questionPositionSchema>

/** A game in progress, without the key of its game. */
export const sessionStateSchema = z.object({
  /** The board that the host sees while no question is open. */
  boardIndex: indexSchema,
  /** Keys from `buildQuestionKey`, fixed when the game starts. */
  dailyDoubleKeys: z.array(z.string()),
  isAnswerShown: z.boolean(),
  openPosition: questionPositionSchema.nullable(),
  /** At most one result for each team, for the open question only. */
  questionResults: z.array(questionResultSchema),
  scores: z.array(z.number()),
  /** One name for each entry of `scores`. */
  teamNames: z.array(z.string()),
  /** Keys from `buildQuestionKey`, for the questions that the game showed. */
  usedKeys: z.array(z.string()),
  /** The wager on the open daily double, once the host sets it. */
  wager: wagerSchema.nullable(),
})

export type SessionState = z.infer<typeof sessionStateSchema>
