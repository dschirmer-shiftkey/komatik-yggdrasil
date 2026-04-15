FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache bash curl

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

RUN mkdir -p /workspace/output /workspace/config \
    && chown -R node:node /workspace

USER node

ENV NODE_ENV=production \
    WORKSPACE_PATH=/workspace \
    PORT=18789

EXPOSE 18789

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD node -e "fetch('http://localhost:18789/health').then(r => process.exit(r.ok ? 0 : 1))"

CMD ["node", "server.js"]
