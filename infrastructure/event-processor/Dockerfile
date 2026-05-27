# Event processor image (STUB — build from infrastructure/ project directory)
#
#   docker compose --project-directory infrastructure \
#     -f infrastructure/compose.yaml \
#     -f seeds/002-homelessness-la/config/compose.prod.yaml \
#     build event-processor
#
# Compose service must use:
#   build:
#     context: .
#     dockerfile: event-processor/Dockerfile

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache bash curl

COPY shared /shared
COPY event-processor/package.json event-processor/package-lock.json* ./
RUN cd /shared && npm ci --omit=dev
RUN npm ci --omit=dev \
    && rm -rf node_modules/@komatik \
    && mkdir -p node_modules/@komatik \
    && cp -a /shared node_modules/@komatik/shared

COPY event-processor/ .

USER node

ENV NODE_ENV=production

# TODO: healthcheck — processor polls Supabase, no HTTP server today
# HEALTHCHECK ...

CMD ["node", "index.js"]
