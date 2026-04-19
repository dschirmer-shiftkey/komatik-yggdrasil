FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

USER node
ENV NODE_ENV=production

CMD ["node", "index.js"]
