# Timeweb Cloud Apps: деплой фронтенда из Git (путь к проекту: frontend).
# В панели Timeweb задайте переменную VITE_API_URL до сборки (см. docs/TIMEWEB_DEPLOY.md).

FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.timeweb.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
