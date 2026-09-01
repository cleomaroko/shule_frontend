# Stage 1: build the Vite SPA
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Inlined into the bundle at build time. `/api` stays same-origin on the VPS
# so the existing nginx `location /` backend proxy (and no CORS) still work.
ARG VITE_API_BASE_URL=/api
ARG VITE_BASE_PATH=/
ARG VITE_APP_NAME=Dira
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_GOOGLE_API_KEY=
ARG VITE_GOOGLE_APP_ID=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_API_KEY=$VITE_GOOGLE_API_KEY
ENV VITE_GOOGLE_APP_ID=$VITE_GOOGLE_APP_ID

RUN npm run build

# Stage 2: static nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
