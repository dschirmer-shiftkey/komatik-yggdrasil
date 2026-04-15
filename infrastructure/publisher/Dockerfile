FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache bash curl git

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

RUN mkdir -p /tmp/publisher-staging \
    && chown -R node:node /tmp/publisher-staging

USER node

ENV NODE_ENV=production

CMD ["node", "index.js"]
