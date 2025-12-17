ARG BUILDER_IMAGE=oven/bun:1.3
ARG RUNNER_IMAGE=oven/bun:1.3-distroless

FROM ${BUILDER_IMAGE} AS base

WORKDIR /app

COPY package.json bun.lockb ./
COPY application/*/package.json ./packages/
COPY packages/*/package.json ./packages/



FROM base AS deps

ARG APPLICATION_NAME

RUN bun install --frozen-lockfile --filter=${APPLICATION_NAME}




FROM base AS prepare
ARG APP_NAME
COPY --from=deps /app/node_modules ./node_modules
COPY packages/${APP_NAME} ./packages/${APP_NAME}
COPY tsconfig.json ./

# Étape 4: Runner avec distroless
FROM gcr.io/distroless/base-debian12:nonroot AS runner

# Copier Bun depuis l'image officielle
COPY --from=oven/bun:1-debian /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

# Copier les fichiers nécessaires
ARG APP_NAME
COPY --from=prepare --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=prepare --chown=nonroot:nonroot /app/packages/${APP_NAME} ./packages/${APP_NAME}
COPY --from=prepare --chown=nonroot:nonroot /app/tsconfig.json ./tsconfig.json

# Copier uniquement les fichiers nécessaires
ARG APP_NAME
COPY --from=builder --chown=nonroot:nonroot /app/packages/${APP_NAME}/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/packages/${APP_NAME}/package.json ./package.json
COPY --from=deps --chown=nonroot:nonroot /app/node_modules ./node_modules


ENV NODE_ENV=production
ENV HTTP_PORT=4000

EXPOSE 4000

USER nonroot

CMD ["/usr/local/bin/bun", "run", "/app/src/index.ts"]
