FROM node:24-alpine AS builder

RUN corepack enable

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build --filter=./packages/*
RUN pnpm --filter knowledge-portal build

FROM node:24-alpine AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

COPY --from=builder /app/apps/knowledge-portal/.next/standalone ./
COPY --from=builder /app/apps/knowledge-portal/.next/static ./apps/knowledge-portal/.next/static

EXPOSE 3000

CMD ["node", "apps/knowledge-portal/server.js"]
