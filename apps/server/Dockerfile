FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/server/package.json apps/server/package.json
RUN npm install --workspace @studyflow/server

COPY apps/server apps/server
RUN npm run build --workspace @studyflow/server

FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY apps/server/package.json apps/server/package.json
COPY apps/server/prisma apps/server/prisma
COPY apps/server/scripts apps/server/scripts
RUN npm install --omit=dev --workspace @studyflow/server
RUN npm run db:generate --workspace @studyflow/server

COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/server/config apps/server/config

WORKDIR /app/apps/server

EXPOSE 4000

CMD ["sh", "-c", "npm run db:deploy && node dist/src/index.js"]
