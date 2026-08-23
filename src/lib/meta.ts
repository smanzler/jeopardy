const SITE_NAME = "Jeopardy"

export const SITE_DESCRIPTION =
  "Make a Jeopardy board and run the game from your browser. Every board stays on the device that made it."

/** The head of a page keeps the name of the site behind the name of the page. */
export const buildPageMeta = (title: string) => [
  { title: `${title} · ${SITE_NAME}` },
]
