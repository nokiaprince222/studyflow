# StudyFlow

StudyFlow - учебный full-stack проект для управления задачами, дедлайнами и статусами работ по курсам.

## Что сделано в первом инкременте

- Клиент: React, TypeScript, Vite, React Router, Zustand, TanStack Query, базовая PWA-настройка.
- Сервер: Fastify, TypeScript, REST API, Prisma ORM, SQLite, миграция БД.
- API: полный CRUD для сущности `Task`.
- Инфраструктурные элементы сервера: конфигурация из файла с переопределением через env, структурные логи, глобальная обработка ошибок, Prometheus-метрики, фоновая задача обработки просроченных задач.
- Тесты: базовый компонентный тест клиента и unit-тест серверной схемы.
- Подготовлены Dockerfile для клиента и сервера, а также `docker-compose.yml`.

## Запуск локально

```powershell
npm install
npm run db:migrate --workspace @studyflow/server
npm run db:seed --workspace @studyflow/server
npm run dev:server
```

Во втором терминале:

```powershell
npm run dev:client
```

Клиент по умолчанию откроется на `http://localhost:5173`, сервер - на `http://localhost:4000`.

## Полезные команды

```powershell
npm run build
npm run test
npm run db:migrate:prisma --workspace @studyflow/server
```

Команда `db:migrate` применяет SQL-файлы из `prisma/migrations` через локальный SQLite setup-скрипт. Это сделано как устойчивый путь для Windows/Node 24, где `prisma migrate dev` может падать на пустой SQLite-БД с `Schema engine error`. Нативная команда Prisma оставлена как `db:migrate:prisma`.

## Проверка API

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/api/tasks
Invoke-RestMethod http://localhost:4000/api/tasks/stats
Invoke-RestMethod http://localhost:4000/metrics
```

## Redis cache

`/api/tasks/stats` is cached through Redis when `REDIS_URL` is set. In `docker-compose.yml`, Redis is started as a separate `redis:7-alpine` service and the server receives `REDIS_URL=redis://redis:6379`.

## План следующих инкрементов

1. Добавить OAuth/OpenID Connect через Keycloak.
2. Перейти с SQLite на Postgres для контейнерного и Kubernetes-сценария.
3. Добавить Redis-кэш для часто запрашиваемой аналитики.
4. Добавить RabbitMQ и обработчик событий задач.
5. Подготовить Grafana dashboard для успешных и ошибочных запросов в минуту.
6. Добавить Kubernetes-манифесты с несколькими репликами.
