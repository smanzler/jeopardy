import type { Category, Game, Session } from "@/lib/db"

type GameV2 = {
  categories: Array<Category>
  id: string
  title: string
  updatedAt: number
}

type SessionV2 = {
  gameId: string
  isAnswerShown: boolean
  openPosition: { categoryIndex: number; rowIndex: number } | null
  scores: Array<number>
  usedKeys: Array<string>
}

/** Version 2 gave each row 200 points more than the row above it. */
const V2_ROW_VALUE_STEP = 200

/** Puts the one board of a version 2 game in the first round, at its old values. */
export const toGameV3 = ({ categories, ...game }: GameV2): Game => ({
  ...game,
  boards: [
    {
      categories,
      values: Array.from(
        { length: categories[0]?.questions.length ?? 0 },
        (_, rowIndex) => (rowIndex + 1) * V2_ROW_VALUE_STEP
      ),
    },
  ],
})

/** Puts the questions that a version 2 session showed on the first board. */
export const toSessionV3 = ({
  openPosition,
  usedKeys,
  ...session
}: SessionV2): Session => ({
  ...session,
  boardIndex: 0,
  openPosition: openPosition && { ...openPosition, boardIndex: 0 },
  // A version 2 key is "category-row". Version 3 puts the board in front.
  usedKeys: usedKeys.map((key) => `0-${key}`),
})
