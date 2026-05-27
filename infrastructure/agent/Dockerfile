FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache bash curl git postgresql-client

# file:../shared requires the sibling package at build time
COPY shared /shared
COPY agent/package.json agent/package-lock.json* ./
RUN cd /shared && npm ci --omit=dev
# Copy shared into node_modules (Windows lockfiles symlink to host paths that break in Linux).
RUN npm ci --omit=dev \
    && rm -rf node_modules/@komatik \
    && mkdir -p node_modules/@komatik \
    && cp -a /shared node_modules/@komatik/shared

COPY agent/ .

RUN mkdir -p /workspace/output /workspace/context/.circuit-breaker \
    && chown -R node:node /workspace

USER node

ENV NODE_ENV=production \
    WORKSPACE_PATH=/workspace

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=30s \
  CMD node -e "fetch(process.env.GATEWAY_URL + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "runner.js"]
