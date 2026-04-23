# Pin to digest to guard against supply chain attacks (Docker Hub compromise Apr 22 2026)
# Current digest as of 2026-04-23. Re-validate on next dependency update.
FROM node:22-alpine@sha256:8ea2348b068a9544dae7317b4f3aafcdc032df1647bb7d768a05a5cad1a7683f

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

USER node
ENV NODE_ENV=production

CMD ["node", "index.js"]
