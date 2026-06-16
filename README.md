# StudyFlow

StudyFlow - учебный full-stack проект для управления задачами, дедлайнами и статусами работ по курсам.

## Что реализовано

- Клиент: React, TypeScript, Vite, React Router, Zustand, TanStack Query, PWA и компонентные тесты Vitest.
- Сервер: Fastify, TypeScript, REST API, Prisma ORM, PostgreSQL и полный CRUD для сущности `Task`.
- Авторизация: OpenID Connect через Keycloak в Docker Compose.
- Инфраструктура сервера: конфигурация из файла с переопределением через env, структурные логи, глобальная обработка ошибок, Prometheus-метрики и фоновая задача обработки просроченных задач.
- Кэширование: Redis используется для часто запрашиваемой статистики `/api/tasks/stats`.
- Очередь: RabbitMQ принимает события задач, consumer сохраняет обработанные события в таблицу `TaskEvent`.
- Мониторинг: Prometheus собирает метрики, Grafana автоматически поднимает dashboard с успешными и ошибочными запросами в минуту.
- DevOps: Dockerfile для клиента и сервера, Docker Compose, PowerShell-скрипты, GitHub Actions CI и Kubernetes-манифесты с несколькими репликами клиента/API.

## Docker Compose

```powershell
npm install
npm run docker:up
```

После запуска:

- Клиент: `http://localhost:5173`
- API health: `http://localhost:4000/health`
- Keycloak: `http://localhost:8080`, admin `admin` / `admin`
- Demo user: `student` / `student`
- RabbitMQ Management: `http://localhost:15672`, `studyflow` / `studyflow`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`, `admin` / `admin`

Остановить стек:

```powershell
npm run docker:down
```

## Локальная разработка без контейнеров приложения

Поднимите инфраструктуру:

```powershell
docker compose up -d postgres redis rabbitmq keycloak prometheus grafana
```

Затем примените миграции и запустите приложения:

```powershell
npm run db:migrate --workspace @studyflow/server
npm run db:seed --workspace @studyflow/server
npm run dev:server
```

Во втором терминале:

```powershell
npm run dev:client
```

## Проверки

```powershell
npm run test
npm run build
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/metrics
```

Если OIDC включен через Docker Compose, запросы к `/api/tasks/*` требуют Bearer access token. Без токена сервер должен возвращать `401`.

## Kubernetes

Для локального Kubernetes-кластера сначала соберите образы:

```powershell
.\scripts\build-images.ps1
.\scripts\deploy-k8s.ps1 -Wait
```

Манифесты находятся в `infra/k8s`. По умолчанию поднимаются:

- `studyflow-server` в 2 репликах
- `studyflow-client` в 2 репликах
- PostgreSQL, Redis и RabbitMQ

Локальные NodePort-адреса:

- Клиент: `http://localhost:30080`
- API health: `http://localhost:30040/health`

## Полезные скрипты

```powershell
.\scripts\build-images.ps1
.\scripts\deploy-compose.ps1
.\scripts\deploy-k8s.ps1 -Wait
```
