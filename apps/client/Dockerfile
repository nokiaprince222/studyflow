FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:4000/api
ARG VITE_OIDC_AUTHORITY=
ARG VITE_OIDC_CLIENT_ID=studyflow-client
ARG VITE_OIDC_REDIRECT_URI=http://localhost:5173
ARG VITE_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
ENV VITE_OIDC_REDIRECT_URI=$VITE_OIDC_REDIRECT_URI
ENV VITE_OIDC_POST_LOGOUT_REDIRECT_URI=$VITE_OIDC_POST_LOGOUT_REDIRECT_URI

COPY package.json package-lock.json* ./
COPY apps/client/package.json apps/client/package.json
RUN npm install --workspace @studyflow/client

COPY apps/client apps/client
RUN npm run build --workspace @studyflow/client

FROM nginx:1.27-alpine

COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/client/dist /usr/share/nginx/html

EXPOSE 80
