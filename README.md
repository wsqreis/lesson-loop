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

Example manifests live in `infra/k8s`. They include namespace, config, secret template, deployments, services, autoscaling, and ingress examples.

```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/config.yaml
cp infra/k8s/secret.example.yaml /tmp/lesson-loop-secret.yaml
# Edit /tmp/lesson-loop-secret.yaml with a real managed database URL before applying.
kubectl apply -f /tmp/lesson-loop-secret.yaml
kubectl apply -f infra/k8s/api.yaml
kubectl apply -f infra/k8s/web.yaml
kubectl apply -f infra/k8s/ingress.yaml
```

SQLite is intended for local development. A production Kubernetes environment should use a managed database and inject `DATABASE_URL` through a Secret.

## GKE deployment outline

```bash
PROJECT_ID="your-gcp-project"
REGION="europe-west4"
REPOSITORY="lesson-loop"
CLUSTER="lesson-loop"

gcloud artifacts repositories create "$REPOSITORY" --repository-format=docker --location="$REGION"
gcloud container clusters get-credentials "$CLUSTER" --region "$REGION" --project "$PROJECT_ID"

docker build -f apps/api/Dockerfile -t "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/api:latest" .
docker build -f apps/web/Dockerfile -t "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/web:latest" .
docker push "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/api:latest"
docker push "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/web:latest"

kubectl apply -f infra/k8s/
kubectl rollout status deployment/lesson-loop-api -n lesson-loop
kubectl rollout status deployment/lesson-loop-web -n lesson-loop
```

For a real release, replace `:latest` in the manifests with immutable image tags from CI and configure the ingress host/TLS for the target environment.

## Continuous delivery outline

A production pipeline should run these stages on `main`:

1. Install dependencies.
2. Generate Prisma client.
3. Typecheck API, shared package, and web app.
4. Run API and Flutter tests.
5. Build API and web Docker images with the commit SHA as the tag.
6. Push images to Artifact Registry.
7. Update Kubernetes manifests or GitOps values with the new image tags.
8. Apply manifests and wait for rollout.

Rollback examples:

```bash
kubectl rollout undo deployment/lesson-loop-api -n lesson-loop
kubectl rollout undo deployment/lesson-loop-web -n lesson-loop
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
5. Open the board mode for the session.
6. Open the Flutter app, join with the session code, and submit an answer.
7. Refresh the board and dashboard to see answer volume, activation checklist, experiments, and AI recommendations update.
