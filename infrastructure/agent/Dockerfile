FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache bash curl git postgresql-client python3

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

RUN mkdir -p /workspace/output /workspace/context/.circuit-breaker

ENV NODE_ENV=production \
    WORKSPACE_PATH=/workspace

CMD ["node", "runner.js"]
