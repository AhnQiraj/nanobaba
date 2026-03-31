# Docker Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production Docker image, local `docker compose` runtime, and Git tag-triggered GitHub Actions publishing to Docker Hub for `ahnqiraj/nanobanana`.

**Architecture:** Use a multi-stage `Dockerfile` based on `node:22-bookworm-slim` so `better-sqlite3` remains compatible. Keep runtime state outside the image by mounting `./data` into the container, and publish images only when a `v*` git tag is pushed using a GitHub Actions workflow that pushes both version and `latest` tags.

**Tech Stack:** Docker, Docker Compose, GitHub Actions, Next.js 16, Node.js 22, Docker Hub

---

## File Structure

- Create: `/root/nanobaba/Dockerfile`
  Purpose: Production multi-stage image build and runtime entrypoint.
- Create: `/root/nanobaba/.dockerignore`
  Purpose: Exclude local artifacts and secrets from build context.
- Create: `/root/nanobaba/docker-compose.yml`
  Purpose: Local and VPS container startup with port mapping and volume mount.
- Create: `/root/nanobaba/.github/workflows/docker-publish.yml`
  Purpose: Publish `v*` tags to Docker Hub as both version and `latest`.
- Modify: `/root/nanobaba/README.md`
  Purpose: Document local Docker use and Git tag release flow.

### Task 1: Add Docker build files

**Files:**
- Create: `/root/nanobaba/Dockerfile`
- Create: `/root/nanobaba/.dockerignore`

- [ ] **Step 1: Write the failing Docker build smoke script**

```bash
# Run from /root/nanobaba
docker build -t ahnqiraj/nanobanana:local .
```

- [ ] **Step 2: Run build to verify it fails before files exist**

Run: `docker build -t ahnqiraj/nanobanana:local .`
Expected: FAIL because `Dockerfile` does not exist yet

- [ ] **Step 3: Create `.dockerignore`**

```dockerignore
# /root/nanobaba/.dockerignore
.git
.github
.next
.worktrees
node_modules
test-results
playwright-report
data
.env
npm-debug.log
```

- [ ] **Step 4: Create production `Dockerfile`**

```dockerfile
# /root/nanobaba/Dockerfile
FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts

RUN mkdir -p /app/data/images

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
```

- [ ] **Step 5: Run Docker build to verify it passes**

Run: `docker build -t ahnqiraj/nanobanana:local .`
Expected: PASS with a built local image

- [ ] **Step 6: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add production docker build files"
```

### Task 2: Add local and VPS compose runtime

**Files:**
- Create: `/root/nanobaba/docker-compose.yml`

- [ ] **Step 1: Write the failing compose startup command**

```bash
# Run from /root/nanobaba
docker compose up -d
```

- [ ] **Step 2: Run compose to verify it fails before file exists**

Run: `docker compose up -d`
Expected: FAIL because `docker-compose.yml` does not exist yet

- [ ] **Step 3: Create `docker-compose.yml`**

```yaml
# /root/nanobaba/docker-compose.yml
services:
  nanobaba:
    build:
      context: .
      dockerfile: Dockerfile
    image: ahnqiraj/nanobanana:local
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

- [ ] **Step 4: Run compose to verify it starts**

Run: `docker compose up -d`
Expected: PASS with one running container

- [ ] **Step 5: Verify the app responds**

Run: `docker compose ps`
Expected: SHOW `nanobaba` service as `running`

Run: `docker compose down`
Expected: PASS with the service stopped and removed

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker compose runtime"
```

### Task 3: Add Git tag-triggered Docker Hub publishing

**Files:**
- Create: `/root/nanobaba/.github/workflows/docker-publish.yml`

- [ ] **Step 1: Write the workflow file**

```yaml
# /root/nanobaba/.github/workflows/docker-publish.yml
name: Publish Docker Image

on:
  push:
    tags:
      - "v*"

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract tag name
        id: meta
        run: echo "version=${GITHUB_REF_NAME}" >> "$GITHUB_OUTPUT"

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ahnqiraj/nanobanana:${{ steps.meta.outputs.version }}
            ahnqiraj/nanobanana:latest
```

- [ ] **Step 2: Validate workflow syntax locally**

Run: `sed -n '1,240p' .github/workflows/docker-publish.yml`
Expected: SHOW trigger `push.tags: ['v*']` and tags for both `${{ steps.meta.outputs.version }}` and `latest`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/docker-publish.yml
git commit -m "feat: add docker hub publish workflow"
```

### Task 4: Document Docker usage and run end-to-end verification

**Files:**
- Modify: `/root/nanobaba/README.md`

- [ ] **Step 1: Update README with Docker build, run, and release instructions**

```md
# /root/nanobaba/README.md

## Docker

### Build locally

`docker build -t ahnqiraj/nanobanana:local .`

### Run with Docker Compose

`docker compose up -d`

`docker compose ps`

`docker compose down`

容器运行时会把 `./data` 挂载到 `/app/data`，因此请保持：

- `DATABASE_URL=file:./data/app.db`
- `IMAGE_STORAGE_DIR=./data/images`

## Publish to Docker Hub

推送 `v*` tag 时，GitHub Actions 会自动发布：

- `ahnqiraj/nanobanana:<tag>`
- `ahnqiraj/nanobanana:latest`

示例：

`git tag v1.0.0`

`git push origin v1.0.0`
```

- [ ] **Step 2: Run full verification**

Run: `docker build -t ahnqiraj/nanobanana:local .`
Expected: PASS with a local image build

Run: `docker compose up -d`
Expected: PASS with the application container running

Run: `docker compose ps`
Expected: SHOW the `nanobaba` service as `running`

Run: `docker compose down`
Expected: PASS with the container removed

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add docker release instructions"
```
