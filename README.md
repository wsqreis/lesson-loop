# LessonLoop

LessonLoop helps schools activate more teachers through guided trials, classroom engagement tools, answer ingestion, and clear conversion analytics.

## What it includes

- Nuxt 3 teacher-facing web app for trials, onboarding, growth dashboards, classroom sessions, and AI recommendations
- NestJS API for trial/subscription flows, teacher activation, classroom sessions, answer ingestion, experiments, and analytics
- Flutter classroom app for students to join a session and submit answers
- Prisma with SQLite for local development
- Docker, docker-compose, Kubernetes manifests, and CI workflow examples

## Requirements

- Node.js 20.11+
- npm
- Flutter SDK for mobile runtime/testing
- Docker for containerized local runs

## Local API and web setup

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The API runs on `http://localhost:3001`. Nuxt will print the web URL when it starts.

## Mobile setup

```bash
cd apps/mobile
flutter pub get
flutter run
```

Use `http://10.0.2.2:3001` as the API base URL on an Android emulator, or `http://localhost:3001` for desktop/web targets that can reach the local host directly.

## Docker

```bash
docker compose up --build
```

The compose setup exposes:

- API: `http://localhost:3001`
- Web: `http://localhost:3000`

## Kubernetes

Example manifests live in `infra/k8s`:

```bash
kubectl apply -f infra/k8s/config.yaml
kubectl apply -f infra/k8s/api.yaml
kubectl apply -f infra/k8s/web.yaml
```

## Useful scripts

```bash
npm run typecheck
npm run test
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
```

For Nuxt typechecking on memory-constrained Windows environments:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run typecheck -w @lesson-loop/web
```

## Golden path

1. Seed the database.
2. Open the web app and start or inspect a school trial.
3. Invite another teacher from the activation dashboard.
4. Create a classroom session and note the join code.
5. Open the Flutter app, load sessions, and submit an answer.
6. Refresh the dashboard to see answer volume, activation metrics, experiments, and AI recommendations update.
