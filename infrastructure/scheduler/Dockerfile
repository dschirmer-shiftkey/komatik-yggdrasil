FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache bash curl

COPY package.json package-lock.json* ./
RUN npm ci --production

COPY . .

ENV NODE_ENV=production

CMD ["node", "index.js"]
