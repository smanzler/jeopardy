type Move = { from: number; to: number }

/** Puts the item at `from` at `to`. The items between them shift by one. */
export const moveItem = <T>({
  from,
  items,
  to,
}: Move & { items: Array<T> }): Array<T> => {
  const rest = items.filter((_, index) => index !== from)
  return [...rest.slice(0, to), items[from], ...rest.slice(to)]
}

/** Gives the index that an item at `index` gets from the same `moveItem`. */
export const toMovedIndex = ({
  from,
  index,
  to,
}: Move & { index: number }): number => {
  if (index === from) return to
  if (from < to && index > from && index <= to) return index - 1
  if (from > to && index >= to && index < from) return index + 1
  return index
}
