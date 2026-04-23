# Pin to digest to guard against supply chain attacks (Docker Hub compromise Apr 22 2026)
# Current digest as of 2026-04-23. Re-validate on next dependency update.
FROM node:22-alpine@sha256:8ea2348b068a9544dae7317b4f3aafcdc032df1647bb7d768a05a5cad1a7683f

WORKDIR /app

RUN apk add --no-cache bash curl git postgresql-client

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

RUN mkdir -p /workspace/output /workspace/context/.circuit-breaker \
    && chown -R node:node /workspace

USER node

ENV NODE_ENV=production \
    WORKSPACE_PATH=/workspace

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=30s \
  CMD node -e "fetch(process.env.GATEWAY_URL + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "runner.js"]
