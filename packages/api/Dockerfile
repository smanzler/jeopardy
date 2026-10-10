FROM node:22-slim AS base
WORKDIR /app
RUN corepack enable

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/api/package.json ./packages/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile --filter @jeopardy/api...
COPY packages/api ./packages/api
COPY packages/shared ./packages/shared
RUN pnpm --filter @jeopardy/api build
RUN pnpm --filter @jeopardy/api deploy --prod --legacy /prod/api

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /prod/api .
EXPOSE 8080
CMD ["node", "dist/index.js"]
