FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json* ./
COPY apps/client/package.json apps/client/package.json
RUN npm install --workspace @studyflow/client

COPY apps/client apps/client
RUN npm run build --workspace @studyflow/client

FROM nginx:1.27-alpine

COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/client/dist /usr/share/nginx/html

EXPOSE 80

