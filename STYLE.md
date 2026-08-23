# Style Guide

## Coding Principles

**Don't future-proof.** Build only what's needed for near-term goals. "Build assuming your code will be deleted in six months." Still build for reliability and quality — just don't develop toward unscheduled future use cases.

**Reuse code.** When 2+ things use the same logic, create an abstraction. Shared helpers go in `src/lib`; shared UI goes in `src/components`.

**Avoid unnecessary abstractions.** Don't abstract until 2+ things reuse the code. When that point arrives, don't copy-paste — create an abstraction instead.

**Prefer built-ins, then libraries.** Reach for the platform first (`fetch`, `crypto.randomUUID`, `Intl`, `structuredClone`). For common infrastructural work with no built-in — retries with backoff, date math, collection manipulation — use a well-established library rather than hand-rolling. Only write it yourself when nothing suitable exists, and unit-test it when you do.

**Avoid mutable state.** Utility functions that change state should return a copy with modified properties. Prefer:

- `filter`/`map` over `for` loops with `push`
- Spread (`[...a, ...b]`, `{...a, ...b}`) over clone + mutate
- Early returns over `let data; try { data = ... }` patterns

**Functions, not classes.** React components are `function` declarations (`function Button(...)`, `export default function Board()`); everything else is a `const` arrow function. Classes come from SDKs only — construct them once as a module-level singleton under `src/lib` and export the configured instance rather than constructing at call sites.

| Use case          | Solution                         |
| ----------------- | -------------------------------- |
| Data              | Plain objects and inferred types |
| Configured client | Module-level singleton in `lib/` |
| Behavior          | Arrow function                   |
| React component   | `function` declaration           |

**Use named arguments past 4 positional parameters, or for repeated types.** Once a function's argument list would run over 4 positional parameters, or whenever it takes multiple arguments of the same type (e.g. two `string` arguments), group the trailing arguments into a single destructured options object instead. This avoids call-site ambiguity between same-typed positional args and keeps call sites self-documenting.

```ts
// Avoid: which string is which at the call site?
const buildClue = (category, prompt, answer, value) => { ... }
buildClue("History", "This king signed Magna Carta", "Who is John?", 200)

// Prefer:
const buildClue = ({ category, prompt, answer, value }: { ... }) => { ... }
buildClue({ category: "History", prompt: "...", answer: "...", value: 200 })
```

**Avoid type-narrowing casts.** Use (in order of preference):

- Type guards returning `v is T`
- Type inference with the `ts-expect-error` directive (e.g. `// @ts-expect-error <reason>`)
- Schema validation, if data arrives from outside the app. No validation library is installed yet — add `zod` when the first such boundary appears, rather than hand-rolling a parser

**Testing.** Happy path for deep functionality; complete unit tests for modular functionality. Pure, branchy logic is the target — scoring, wagers, board state, turn order. Don't test thin wrappers over a client library or a JSX tree with no logic in it. Tests are Vitest, named `<subject>.test.ts` beside the code they cover.

## Frontend UI components

**Use the local component library.** In app code, import UI components from `@/components/ui` — never `@base-ui/react` directly. The wrappers carry the shared `cva` variants and theme tokens and give us one place to change styling globally. Raw Base UI primitives are fine inside `components/ui` itself, that's where they get wrapped.

**Get components from the registry.** Run `pnpm dlx shadcn@latest add <component>` before you write a new primitive by hand. `components.json` pins the style (`base-nova`), the icon library (`lucide-react`), and the `@/` aliases.

**Style with `className`, not `style`.** Reserve the `style` prop for the handful of things Tailwind can't express. Prettier sorts the class list; don't hand-order it.

**Use theme tokens, not raw colors.** Style against the semantic tokens declared in `src/styles.css` (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`). A raw color (`bg-neutral-800`, `#1b1b1b`) breaks dark mode. A new colour that the palette lacks belongs in `src/styles.css` as a token, in both `:root` and `.dark`.

**Variants over one-off classes.** When a component needs a new visual treatment, add a `cva` variant to the component in `components/ui` rather than passing a pile of classes at the call site.

**Compose classes with `cn`.** `cn` from `@/lib/utils` merges conflicting Tailwind classes correctly. Never join class strings with template literals.

## Structure

**Routes hold routing.** `src/routes` holds route files only — a route is either a couple of lines that re-export a screen, or a small screen with no reusable parts. Real screens live in `src/features/<feature>/screens`, with that feature's `components/` and `hooks/` beside them. Cross-feature UI goes in `src/components`, cross-feature helpers in `src/lib`.

**`src/routeTree.gen.ts` is generated.** The router plugin rewrites it on each dev/build run. Never edit it, and never import from it outside `src/router.tsx`.

**Route modules export `Route`.** Each file calls `createFileRoute("/path")({ component: Screen })` and exports the result as `Route`. Loaders, search-param schemas, and error components attach to that same object rather than running inside the component.

**File names are kebab-case**, matching the exported symbol (`clue-card.tsx` → `ClueCard`, `use-buzzer.ts` → `useBuzzer`). Route files are the exception: their names are the URL segments TanStack Router expects (`index.tsx`, `__root.tsx`, `$gameId.tsx`).

## Patterns

**Selectively mapping a collection.** Define a type-guard predicate, then chain `filter` + `map`.

```ts
const isAnswered = (c: Clue): c is AnsweredClue => c.state === "answered"
clues.filter(isAnswered).map((clue) => ...)
```

**Exhaustive switch/ternary.** Switch on the discriminant of a union with no `default` branch, and give the function an explicit return type — `noFallthroughCasesInSwitch` in `tsconfig.json` plus the return type make an unhandled variant a type error.

**Derive, don't duplicate, state.** Compute values from the state you already hold instead of holding a second copy in `useState`. Reach for `useMemo` only when the computation is measurably expensive.

**Event handlers are named `handle*`** and are declared inside the component, above the returned JSX.

## Naming

**Prefixes:**

| Prefix   | Use                                                                            |
| -------- | ------------------------------------------------------------------------------ |
| `build`  | Assembles a value from parts; pure                                             |
| `create` | Creates a resource that didn't exist                                           |
| `fetch`  | Retrieves from an external system (not caches); see `send`                     |
| `filter` | Returns all values in a collection fulfilling a predicate                      |
| `find`   | Returns first matching value or `undefined`                                    |
| `format` | Value → display string (see `render` for anything richer)                      |
| `from`   | Inverts a `to` function                                                        |
| `get`    | Reads a single value (`undefined` if missing); see `set`                       |
| `handle` | Event handler bound to a UI element (`handleSubmit`)                           |
| `has`    | Boolean ownership or collection membership                                     |
| `is`     | Boolean type check or type-guard function; return type should be `is T`        |
| `list`   | Reads a collection from a store; use `query` if selected by complex conditions |
| `parse`  | String/unknown → structured data, throwing on failure; see `render`            |
| `render` | Structured data → string/markup                                                |
| `send`   | Sends to an external system (not caches); see `fetch`                          |
| `set`    | Sets a value in a store; succeeds regardless of existing value                 |
| `to`     | Translates a value to another representation                                   |
| `update` | Updates an existing store value                                                |
| `use`    | React hook — required by the rules of hooks                                    |

**Suffixes:**

| Suffix     | Use                                                                         |
| ---------- | --------------------------------------------------------------------------- |
| `Client`   | Object whose properties are functions that call an API                      |
| `Context`  | Object whose properties are references to shared data used across functions |
| `Provider` | React context provider component                                            |
| `Props`    | A component's prop type (`ClueCardProps`)                                   |
| `Variants` | A `cva` result (`buttonVariants`)                                           |

**No Hungarian notation.** Don't suffix types with `Type` or values with their type name. VSCode already communicates symbol kinds. Exceptions — use these specific shorthands only:

```ts
const listLength = list.length    // interning array length
const objectSize = object.size    // interning object size
for (let iArray = 0; ...) { ... } // array index variable
```

## Comments

Comments split by _what_/_how_/_why_, each in a different form. Keep every form concise — a comment that repeats what the code already shows is worse than no comment.

- **What.** A symbol's name should say what it does or is for. Don't add a comment restating the name (`// gets the user` above `getUser`) — rename the symbol instead if it needs explaining.
- **How.** Use JSDoc/TSDoc (`/** ... */`) on exported symbols to describe how to use them: parameters, return value, preconditions, thrown errors. Reserve it for things a call site can't infer from the signature — a multi-step protocol, or an extension point such as a payload union.
- **Why.** Use inline `//` comments to explain why a non-obvious choice was made — a workaround, a constraint from another system, a tradeoff. Don't use them to narrate what the next line does.

```ts
if (!clue) return null // already revealed — the board renders the empty cell
```

## Textual Style

Prettier owns formatting and is configured in `.prettierrc`: no semicolons, double quotes, 2-space indent, 80-column width, ES5 trailing commas, and Tailwind class sorting through `prettier-plugin-tailwindcss`. Don't hand-format around it — run `pnpm format`. The rules below cover what Prettier leaves to you.

**Destructuring.** Destructure on a single line when extracting from objects/tuples. Use multiple destructuring statements when unnesting would create a multi-line statement. Always destructure tuples; inline field access is OK for objects accessed only a couple of times.

```ts
const [round, setRound] = useState(1)
const { gameId } = Route.useParams()
```

**Single-line when it fits.** Remove newlines after opening `{`/`[` so Prettier can collapse object/array literals onto one line. Omit braces on single-line `if`; use braces if the body doesn't fit on one line.

```ts
const obj = { x: 1, y: "a" }
if (!key) return
```

**Newlines between functions.** Separate functions with a blank line. Exception: a closure variable may be grouped with its closure (no blank line between them).

**Sort object properties.** Sort properties in objects when doing so would not change the resulting value. Do not reorder across spread operations.
