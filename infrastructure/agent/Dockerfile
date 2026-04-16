FROM node:22-alpine

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
