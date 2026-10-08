import type { GameDraft } from "@/lib/db"
import type { ConfirmPrompt } from "@/components/confirm-dialog"
import {
  formatValue,
  hasBoardContent,
  hasCategoryContent,
  hasRowContent,
  removeBoard,
  removeCategory,
  removeRow,
  setBoard,
} from "@/lib/board"

export type RemovalType = "board" | "category" | "row"

/** A part of the game that the editor removes. `index` counts in that part. */
export type Removal = { index: number; type: RemovalType }

type RemovalContext = { boardIndex: number; draft: GameDraft; index: number }

type RemovalDispatch = {
  buildPrompt: (context: RemovalContext) => ConfirmPrompt
  /** True when the removal deletes work, so it must wait for a confirmation. */
  hasContent: (context: RemovalContext) => boolean
  remove: (context: RemovalContext) => GameDraft
}

const buildRemovalPrompt = ({
  description,
  title,
}: {
  description: string
  title: string
}): ConfirmPrompt => ({
  cancelLabel: "Keep it",
  confirmLabel: "Remove",
  description,
  title,
})

const PART_WARNING = "This deletes the questions and the answers in it."

const boardDispatch: RemovalDispatch = {
  buildPrompt: ({ index }) =>
    buildRemovalPrompt({
      description: "This deletes the categories, questions and answers on it.",
      title: `Remove board ${index + 1}?`,
    }),
  hasContent: ({ draft, index }) => hasBoardContent(draft.boards[index]),
  remove: ({ draft, index }) => removeBoard({ boardIndex: index, draft }),
}

const categoryDispatch: RemovalDispatch = {
  buildPrompt: ({ boardIndex, draft, index }) =>
    buildRemovalPrompt({
      description: PART_WARNING,
      title: `Remove ${draft.boards[boardIndex].categories[index].name || `category ${index + 1}`}?`,
    }),
  hasContent: ({ boardIndex, draft, index }) =>
    hasCategoryContent(draft.boards[boardIndex].categories[index]),
  remove: ({ boardIndex, draft, index }) =>
    setBoard({
      board: removeCategory({
        board: draft.boards[boardIndex],
        categoryIndex: index,
      }),
      boardIndex,
      draft,
    }),
}

const rowDispatch: RemovalDispatch = {
  buildPrompt: ({ boardIndex, draft, index }) =>
    buildRemovalPrompt({
      description: PART_WARNING,
      title: `Remove the ${formatValue(draft.boards[boardIndex].values[index])} row?`,
    }),
  hasContent: ({ boardIndex, draft, index }) =>
    hasRowContent({ board: draft.boards[boardIndex], rowIndex: index }),
  remove: ({ boardIndex, draft, index }) =>
    setBoard({
      board: removeRow({ board: draft.boards[boardIndex], rowIndex: index }),
      boardIndex,
      draft,
    }),
}

export const removalDispatches: Record<RemovalType, RemovalDispatch> = {
  board: boardDispatch,
  category: categoryDispatch,
  row: rowDispatch,
}
