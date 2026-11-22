# Build an application image from the monorepo:
#   docker build --build-arg APP_NAME=account .
#
# Applications run from source with Bun, so the image keeps the workspace layout: the application lives in
# /app/applications/<APP_NAME>, the workspace packages it imports in /app/packages and /app/domains, and the
# dependencies installed by Bun in /app/node_modules (workspace packages are linked there).

FROM oven/bun:1.3.9-slim AS dependencies

WORKDIR /app

# Every workspace manifest is needed for the lockfile to match the workspace list of the root manifest.
COPY package.json bun.lock tsconfig.json ./
COPY applications/ ./applications/
COPY domains/ ./domains/
COPY packages/ ./packages/
COPY kubernetes/package.json ./kubernetes/package.json

ARG APP_NAME
RUN test -n "${APP_NAME}" || (echo 'APP_NAME build argument is required' >&2 && exit 1)
RUN bun install --frozen-lockfile --production --ignore-scripts --filter="@application/${APP_NAME}"

FROM oven/bun:1.3.9-distroless AS runner

ARG APP_NAME

WORKDIR /app

COPY --from=dependencies /app/package.json /app/tsconfig.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages ./packages
COPY --from=dependencies /app/domains ./domains
COPY --from=dependencies /app/applications/${APP_NAME} ./applications/${APP_NAME}

WORKDIR /app/applications/${APP_NAME}

ENV NODE_ENV=production

EXPOSE 4000

# Matches the pod security context of the kubernetes workloads (user and group 1000).
USER 1000:1000

ENTRYPOINT ["/usr/local/bin/bun"]
CMD ["src/commands/start-api-server.ts"]
