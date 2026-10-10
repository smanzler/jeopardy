import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import { Button } from "@/components/ui/button"
import { SITE_DESCRIPTION } from "@/lib/meta"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Jeopardy",
      },
      {
        name: "description",
        content: SITE_DESCRIPTION,
      },
      // The navy of the board, for the chrome that a phone puts round the page.
      {
        name: "theme-color",
        content: "#06144F",
      },
      {
        property: "og:title",
        content: "Jeopardy",
      },
      {
        property: "og:description",
        content: SITE_DESCRIPTION,
      },
      {
        property: "og:type",
        content: "website",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      // The legacy icon comes first and modern browsers prefer the vector.
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "16x16",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/icon.svg",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <h1 className="font-heading text-7xl font-medium tracking-wide text-primary uppercase">
        404
      </h1>
      <p className="text-muted-foreground">This page is not on the board.</p>
      <div className="flex gap-2">
        <Button size="lg" render={<Link to="/" />}>
          Home
        </Button>
      </div>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
