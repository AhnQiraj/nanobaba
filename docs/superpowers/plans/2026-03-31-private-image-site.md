# Private Image Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VPS-hosted Chinese image generation site with password login, Gemini proxy integration via environment variables, local image storage, SQLite-backed history, and 30-day cleanup.

**Architecture:** A Next.js App Router application serves the login page and the main image-generation page. Server-side route handlers validate the password session, call the Gemini-compatible proxy with env-configured base URL and API key, decode returned data URLs into local files, store metadata in SQLite, and expose history for the UI.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, better-sqlite3, zod, jose, Vitest, Playwright

---

## File Structure

- Create: `/root/nanobaba/package.json`
- Create: `/root/nanobaba/tsconfig.json`
- Create: `/root/nanobaba/next.config.ts`
- Create: `/root/nanobaba/postcss.config.mjs`
- Create: `/root/nanobaba/eslint.config.mjs`
- Create: `/root/nanobaba/components.json`
- Create: `/root/nanobaba/.gitignore`
- Create: `/root/nanobaba/.env.example`
- Create: `/root/nanobaba/README.md`
- Create: `/root/nanobaba/app/globals.css`
- Create: `/root/nanobaba/app/layout.tsx`
- Create: `/root/nanobaba/app/login/page.tsx`
- Create: `/root/nanobaba/app/page.tsx`
- Create: `/root/nanobaba/app/api/auth/login/route.ts`
- Create: `/root/nanobaba/app/api/auth/logout/route.ts`
- Create: `/root/nanobaba/app/api/generate/route.ts`
- Create: `/root/nanobaba/app/api/history/route.ts`
- Create: `/root/nanobaba/components/ui/button.tsx`
- Create: `/root/nanobaba/components/ui/card.tsx`
- Create: `/root/nanobaba/components/ui/input.tsx`
- Create: `/root/nanobaba/components/ui/textarea.tsx`
- Create: `/root/nanobaba/components/ui/alert.tsx`
- Create: `/root/nanobaba/components/login-form.tsx`
- Create: `/root/nanobaba/components/prompt-composer.tsx`
- Create: `/root/nanobaba/components/image-result-card.tsx`
- Create: `/root/nanobaba/components/history-list.tsx`
- Create: `/root/nanobaba/components/logout-button.tsx`
- Create: `/root/nanobaba/lib/config.ts`
- Create: `/root/nanobaba/lib/session.ts`
- Create: `/root/nanobaba/lib/db.ts`
- Create: `/root/nanobaba/lib/history-repository.ts`
- Create: `/root/nanobaba/lib/gemini-client.ts`
- Create: `/root/nanobaba/lib/image-storage.ts`
- Create: `/root/nanobaba/lib/cleanup.ts`
- Create: `/root/nanobaba/lib/utils.ts`
- Create: `/root/nanobaba/scripts/cleanup.mjs`
- Create: `/root/nanobaba/tests/unit/config.test.ts`
- Create: `/root/nanobaba/tests/unit/session.test.ts`
- Create: `/root/nanobaba/tests/unit/image-storage.test.ts`
- Create: `/root/nanobaba/tests/unit/gemini-client.test.ts`
- Create: `/root/nanobaba/tests/unit/cleanup.test.ts`
- Create: `/root/nanobaba/tests/e2e/auth.spec.ts`
- Create: `/root/nanobaba/tests/e2e/generate.spec.ts`
- Create: `/root/nanobaba/playwright.config.ts`
- Create: `/root/nanobaba/vitest.config.ts`

### Task 1: Scaffold the Next.js application and environment contract

**Files:**
- Create: `/root/nanobaba/package.json`
- Create: `/root/nanobaba/tsconfig.json`
- Create: `/root/nanobaba/next.config.ts`
- Create: `/root/nanobaba/postcss.config.mjs`
- Create: `/root/nanobaba/eslint.config.mjs`
- Create: `/root/nanobaba/components.json`
- Create: `/root/nanobaba/.gitignore`
- Create: `/root/nanobaba/.env.example`
- Create: `/root/nanobaba/README.md`
- Create: `/root/nanobaba/app/globals.css`
- Create: `/root/nanobaba/app/layout.tsx`
- Test: `/root/nanobaba/tests/unit/config.test.ts`

- [ ] **Step 1: Write the failing config test**

```ts
// /root/nanobaba/tests/unit/config.test.ts
import { describe, expect, it } from "vitest";
import { loadConfig } from "@/lib/config";

describe("loadConfig", () => {
  it("reads all required env vars", () => {
    const config = loadConfig({
      APP_PASSWORD: "secret",
      SESSION_SECRET: "12345678901234567890123456789012",
      GEMINI_PROXY_BASE_URL: "https://mytoken.online",
      GEMINI_PROXY_API_KEY: "test-key",
      GEMINI_IMAGE_MODEL: "gemini-3.1-flash-image",
      DATABASE_URL: "file:/tmp/nanobaba.db",
      IMAGE_STORAGE_DIR: "/tmp/nanobaba-images",
    });

    expect(config.proxyBaseUrl).toBe("https://mytoken.online");
    expect(config.imageModel).toBe("gemini-3.1-flash-image");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/config.test.ts`
Expected: FAIL with `Cannot find module '@/lib/config'` or missing test runner configuration

- [ ] **Step 3: Create the project scaffold and env example**

```json
// /root/nanobaba/package.json
{
  "name": "nanobaba",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "cleanup": "node scripts/cleanup.mjs"
  },
  "dependencies": {
    "better-sqlite3": "^12.0.0",
    "clsx": "^2.1.1",
    "jose": "^6.0.12",
    "lucide-react": "^0.542.0",
    "next": "^16.0.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "tailwind-merge": "^3.3.1",
    "zod": "^4.1.5"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0",
    "@tailwindcss/postcss": "^4.1.12",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^24.3.0",
    "@types/react": "^19.1.12",
    "@types/react-dom": "^19.1.9",
    "eslint": "^9.34.0",
    "eslint-config-next": "^16.0.0",
    "tailwindcss": "^4.1.12",
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

```env
# /root/nanobaba/.env.example
APP_PASSWORD=change-me
SESSION_SECRET=replace-with-32-byte-random-string
GEMINI_PROXY_BASE_URL=https://mytoken.online
GEMINI_PROXY_API_KEY=replace-me
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
DATABASE_URL=file:./data/app.db
IMAGE_STORAGE_DIR=./data/images
```

```tsx
// /root/nanobaba/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "给老婆的生图小站",
  description: "私有 Gemini 生图网页",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Add TypeScript, Next.js, Tailwind, and ignore files**

```json
// /root/nanobaba/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```ts
// /root/nanobaba/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
```

```gitignore
# /root/nanobaba/.gitignore
.next
node_modules
playwright-report
test-results
.env
data
.superpowers
```

- [ ] **Step 5: Implement `loadConfig` and make the test pass**

```ts
// /root/nanobaba/lib/config.ts
import { z } from "zod";

const configSchema = z.object({
  APP_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  GEMINI_PROXY_BASE_URL: z.url(),
  GEMINI_PROXY_API_KEY: z.string().min(1),
  GEMINI_IMAGE_MODEL: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  IMAGE_STORAGE_DIR: z.string().min(1),
});

export type AppConfig = {
  password: string;
  sessionSecret: string;
  proxyBaseUrl: string;
  proxyApiKey: string;
  imageModel: string;
  databaseUrl: string;
  imageStorageDir: string;
};

export function loadConfig(input: Record<string, string | undefined> = process.env): AppConfig {
  const parsed = configSchema.parse(input);

  return {
    password: parsed.APP_PASSWORD,
    sessionSecret: parsed.SESSION_SECRET,
    proxyBaseUrl: parsed.GEMINI_PROXY_BASE_URL.replace(/\/$/, ""),
    proxyApiKey: parsed.GEMINI_PROXY_API_KEY,
    imageModel: parsed.GEMINI_IMAGE_MODEL,
    databaseUrl: parsed.DATABASE_URL,
    imageStorageDir: parsed.IMAGE_STORAGE_DIR,
  };
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- tests/unit/config.test.ts`
Expected: PASS with `1 passed`

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs components.json .gitignore .env.example README.md app/globals.css app/layout.tsx lib/config.ts tests/unit/config.test.ts
git commit -m "chore: scaffold next image site"
```

### Task 2: Add SQLite storage and 30-day cleanup services

**Files:**
- Create: `/root/nanobaba/lib/db.ts`
- Create: `/root/nanobaba/lib/history-repository.ts`
- Create: `/root/nanobaba/lib/cleanup.ts`
- Create: `/root/nanobaba/scripts/cleanup.mjs`
- Test: `/root/nanobaba/tests/unit/image-storage.test.ts`
- Test: `/root/nanobaba/tests/unit/cleanup.test.ts`

- [ ] **Step 1: Write the failing repository and cleanup tests**

```ts
// /root/nanobaba/tests/unit/cleanup.test.ts
import { describe, expect, it, vi } from "vitest";
import { buildCleanupPlan } from "@/lib/cleanup";

describe("buildCleanupPlan", () => {
  it("marks records older than 30 days for deletion", () => {
    const now = new Date("2026-03-31T12:00:00.000Z");
    const plan = buildCleanupPlan(
      [
        { id: "old", imagePath: "data/images/2026/02/old.jpg", createdAt: "2026-02-01T00:00:00.000Z" },
        { id: "new", imagePath: "data/images/2026/03/new.jpg", createdAt: "2026-03-25T00:00:00.000Z" },
      ],
      now,
    );

    expect(plan.deleteIds).toEqual(["old"]);
    expect(plan.deleteFiles).toEqual(["data/images/2026/02/old.jpg"]);
  });
});
```

```ts
// /root/nanobaba/tests/unit/image-storage.test.ts
import { describe, expect, it } from "vitest";
import { buildImageFilePath } from "@/lib/image-storage";

describe("buildImageFilePath", () => {
  it("places images under year and month folders", () => {
    const result = buildImageFilePath("/tmp/images", "entry-1", new Date("2026-03-31T12:00:00.000Z"), "image/jpeg");

    expect(result.absolutePath).toContain("/tmp/images/2026/03/entry-1.jpg");
    expect(result.publicPath).toBe("/api/history/entry-1/image");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/cleanup.test.ts tests/unit/image-storage.test.ts`
Expected: FAIL with missing modules `@/lib/cleanup` and `@/lib/image-storage`

- [ ] **Step 3: Implement database bootstrap and repository**

```ts
// /root/nanobaba/lib/db.ts
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { loadConfig } from "@/lib/config";

const { databaseUrl } = loadConfig();
const dbPath = databaseUrl.replace(/^file:/, "");
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS image_history (
    id TEXT PRIMARY KEY,
    prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    image_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TEXT NOT NULL
  )
`);
```

```ts
// /root/nanobaba/lib/history-repository.ts
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

export type HistoryRow = {
  id: string;
  prompt: string;
  model: string;
  imagePath: string;
  mimeType: string;
  status: "success" | "failed";
  errorMessage: string | null;
  createdAt: string;
};

export function insertHistoryRow(input: Omit<HistoryRow, "id" | "createdAt"> & { id?: string; createdAt?: string }) {
  const row: HistoryRow = {
    id: input.id ?? randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    prompt: input.prompt,
    model: input.model,
    imagePath: input.imagePath,
    mimeType: input.mimeType,
    status: input.status,
    errorMessage: input.errorMessage ?? null,
  };

  db.prepare(`
    INSERT INTO image_history (id, prompt, model, image_path, mime_type, status, error_message, created_at)
    VALUES (@id, @prompt, @model, @imagePath, @mimeType, @status, @errorMessage, @createdAt)
  `).run(row);

  return row;
}
```

- [ ] **Step 4: Implement image path builder and cleanup plan**

```ts
// /root/nanobaba/lib/image-storage.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  return "jpg";
}

export function buildImageFilePath(rootDir: string, id: string, createdAt: Date, mimeType: string) {
  const year = String(createdAt.getUTCFullYear());
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
  const extension = extensionForMimeType(mimeType);
  const dir = join(rootDir, year, month);

  return {
    directory: dir,
    absolutePath: join(dir, `${id}.${extension}`),
    publicPath: `/api/history/${id}/image`,
  };
}

export function writeImageFile(absolutePath: string, buffer: Buffer) {
  mkdirSync(absolutePath.replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(absolutePath, buffer);
}
```

```ts
// /root/nanobaba/lib/cleanup.ts
export type CleanupCandidate = {
  id: string;
  imagePath: string;
  createdAt: string;
};

export function buildCleanupPlan(rows: CleanupCandidate[], now: Date) {
  const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const expired = rows.filter((row) => new Date(row.createdAt).getTime() < cutoff);

  return {
    deleteIds: expired.map((row) => row.id),
    deleteFiles: expired.map((row) => row.imagePath),
  };
}
```

- [ ] **Step 5: Add cleanup runner**

```js
// /root/nanobaba/scripts/cleanup.mjs
import { existsSync, rmSync } from "node:fs";
import { db } from "../lib/db.ts";
import { buildCleanupPlan } from "../lib/cleanup.ts";

const rows = db.prepare(`
  SELECT id, image_path AS imagePath, created_at AS createdAt
  FROM image_history
`).all();

const plan = buildCleanupPlan(rows, new Date());

for (const imagePath of plan.deleteFiles) {
  if (existsSync(imagePath)) rmSync(imagePath);
}

if (plan.deleteIds.length > 0) {
  const placeholders = plan.deleteIds.map(() => "?").join(", ");
  db.prepare(`DELETE FROM image_history WHERE id IN (${placeholders})`).run(...plan.deleteIds);
}

console.log(`cleanup complete: ${plan.deleteIds.length} rows removed`);
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- tests/unit/cleanup.test.ts tests/unit/image-storage.test.ts`
Expected: PASS with `2 passed`

- [ ] **Step 7: Commit**

```bash
git add lib/db.ts lib/history-repository.ts lib/image-storage.ts lib/cleanup.ts scripts/cleanup.mjs tests/unit/image-storage.test.ts tests/unit/cleanup.test.ts
git commit -m "feat: add history storage and cleanup"
```

### Task 3: Add password session auth and protected routes

**Files:**
- Create: `/root/nanobaba/lib/session.ts`
- Create: `/root/nanobaba/app/api/auth/login/route.ts`
- Create: `/root/nanobaba/app/api/auth/logout/route.ts`
- Create: `/root/nanobaba/app/login/page.tsx`
- Create: `/root/nanobaba/components/login-form.tsx`
- Test: `/root/nanobaba/tests/unit/session.test.ts`
- Test: `/root/nanobaba/tests/e2e/auth.spec.ts`

- [ ] **Step 1: Write the failing session test**

```ts
// /root/nanobaba/tests/unit/session.test.ts
import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "@/lib/session";

describe("session token", () => {
  it("round-trips a logged-in marker", async () => {
    const token = await signSessionToken("12345678901234567890123456789012");
    const payload = await verifySessionToken(token, "12345678901234567890123456789012");

    expect(payload.loggedIn).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/session.test.ts`
Expected: FAIL with missing module `@/lib/session`

- [ ] **Step 3: Implement session helpers**

```ts
// /root/nanobaba/lib/session.ts
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "nanobaba_session";

function secretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(secret: string) {
  return new SignJWT({ loggedIn: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey(secret));
}

export async function verifySessionToken(token: string, secret: string) {
  const result = await jwtVerify(token, secretKey(secret));
  return result.payload as { loggedIn: boolean };
}

export const sessionCookieName = COOKIE_NAME;
```

- [ ] **Step 4: Implement login route and login page**

```ts
// /root/nanobaba/app/api/auth/login/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { sessionCookieName, signSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  const { password } = await request.json();
  const config = loadConfig();

  if (password !== config.password) {
    return NextResponse.json({ error: "密码不正确" }, { status: 401 });
  }

  const token = await signSessionToken(config.sessionSecret);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
```

```tsx
// /root/nanobaba/app/login/page.tsx
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[--bg] p-6">
      <div className="mx-auto max-w-md pt-20">
        <LoginForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Implement logout route and basic E2E auth test**

```ts
// /root/nanobaba/app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
```

```ts
// /root/nanobaba/tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("shows login form when logged out", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- tests/unit/session.test.ts`
Expected: PASS with `1 passed`

Run: `npm run test:e2e -- tests/e2e/auth.spec.ts`
Expected: PASS with `1 passed`

- [ ] **Step 7: Commit**

```bash
git add lib/session.ts app/api/auth/login/route.ts app/api/auth/logout/route.ts app/login/page.tsx components/login-form.tsx tests/unit/session.test.ts tests/e2e/auth.spec.ts
git commit -m "feat: add password login"
```

### Task 4: Implement Gemini image generation and history APIs

**Files:**
- Create: `/root/nanobaba/lib/gemini-client.ts`
- Modify: `/root/nanobaba/lib/history-repository.ts`
- Modify: `/root/nanobaba/lib/image-storage.ts`
- Create: `/root/nanobaba/app/api/generate/route.ts`
- Create: `/root/nanobaba/app/api/history/route.ts`
- Create: `/root/nanobaba/app/api/history/[id]/image/route.ts`
- Test: `/root/nanobaba/tests/unit/gemini-client.test.ts`

- [ ] **Step 1: Write the failing Gemini client test**

```ts
// /root/nanobaba/tests/unit/gemini-client.test.ts
import { describe, expect, it, vi } from "vitest";
import { parseImageDataUrl } from "@/lib/gemini-client";

describe("parseImageDataUrl", () => {
  it("extracts mime type and bytes from a data url", () => {
    const result = parseImageDataUrl("data:image/jpeg;base64,aGVsbG8=");

    expect(result.mimeType).toBe("image/jpeg");
    expect(result.buffer.toString("utf8")).toBe("hello");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/gemini-client.test.ts`
Expected: FAIL with missing module `@/lib/gemini-client`

- [ ] **Step 3: Implement Gemini client helpers**

```ts
// /root/nanobaba/lib/gemini-client.ts
import { loadConfig } from "@/lib/config";

export function parseImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("invalid image data url");

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

export async function generateImage(prompt: string) {
  const config = loadConfig();
  const response = await fetch(`${config.proxyBaseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.proxyApiKey}`,
    },
    body: JSON.stringify({
      model: config.imageModel,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`proxy request failed: ${response.status}`);
  }

  const json = await response.json();
  const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) throw new Error("image not found in response");

  return parseImageDataUrl(dataUrl);
}
```

- [ ] **Step 4: Implement generate and history routes**

```ts
// /root/nanobaba/app/api/generate/route.ts
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini-client";
import { insertHistoryRow } from "@/lib/history-repository";
import { buildImageFilePath, writeImageFile } from "@/lib/image-storage";
import { loadConfig } from "@/lib/config";

export async function POST(request: Request) {
  const { prompt } = await request.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "请输入提示词" }, { status: 400 });
  }

  const config = loadConfig();
  const id = randomUUID();
  const createdAt = new Date();

  try {
    const result = await generateImage(prompt);
    const paths = buildImageFilePath(config.imageStorageDir, id, createdAt, result.mimeType);
    writeImageFile(paths.absolutePath, result.buffer);

    insertHistoryRow({
      id,
      prompt,
      model: config.imageModel,
      imagePath: paths.absolutePath,
      mimeType: result.mimeType,
      status: "success",
      errorMessage: null,
      createdAt: createdAt.toISOString(),
    });

    return NextResponse.json({
      id,
      prompt,
      imageUrl: paths.publicPath,
      createdAt: createdAt.toISOString(),
    });
  } catch (error) {
    insertHistoryRow({
      id,
      prompt,
      model: config.imageModel,
      imagePath: "",
      mimeType: "",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "unknown error",
      createdAt: createdAt.toISOString(),
    });

    return NextResponse.json({ error: "生成失败，请稍后再试" }, { status: 502 });
  }
}
```

```ts
// /root/nanobaba/app/api/history/route.ts
import { NextResponse } from "next/server";
import { listRecentHistory } from "@/lib/history-repository";

export async function GET() {
  const items = listRecentHistory();
  return NextResponse.json({ items });
}
```

- [ ] **Step 5: Add image streaming route and query helpers**

```ts
// /root/nanobaba/lib/history-repository.ts
export function listRecentHistory() {
  return db.prepare(`
    SELECT id, prompt, model, mime_type AS mimeType, status, created_at AS createdAt
    FROM image_history
    WHERE status = 'success'
      AND created_at >= datetime('now', '-30 days')
    ORDER BY created_at DESC
  `).all();
}

export function findHistoryById(id: string) {
  return db.prepare(`
    SELECT id, prompt, model, image_path AS imagePath, mime_type AS mimeType, status, created_at AS createdAt
    FROM image_history
    WHERE id = ?
  `).get(id);
}
```

```ts
// /root/nanobaba/app/api/history/[id]/image/route.ts
import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { findHistoryById } from "@/lib/history-repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = findHistoryById(id);
  if (!row?.imagePath) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const buffer = await readFile(row.imagePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- tests/unit/gemini-client.test.ts`
Expected: PASS with `1 passed`

- [ ] **Step 7: Commit**

```bash
git add lib/gemini-client.ts lib/history-repository.ts lib/image-storage.ts app/api/generate/route.ts app/api/history/route.ts app/api/history/[id]/image/route.ts tests/unit/gemini-client.test.ts
git commit -m "feat: add image generation api"
```

### Task 5: Build the login and main application UI

**Files:**
- Create: `/root/nanobaba/components/ui/button.tsx`
- Create: `/root/nanobaba/components/ui/card.tsx`
- Create: `/root/nanobaba/components/ui/input.tsx`
- Create: `/root/nanobaba/components/ui/textarea.tsx`
- Create: `/root/nanobaba/components/ui/alert.tsx`
- Create: `/root/nanobaba/components/prompt-composer.tsx`
- Create: `/root/nanobaba/components/image-result-card.tsx`
- Create: `/root/nanobaba/components/history-list.tsx`
- Create: `/root/nanobaba/components/logout-button.tsx`
- Modify: `/root/nanobaba/app/page.tsx`

- [ ] **Step 1: Write the failing E2E generation test**

```ts
// /root/nanobaba/tests/e2e/generate.spec.ts
import { test, expect } from "@playwright/test";

test("renders the main generator layout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "生成图片" })).toBeVisible();
  await expect(page.getByText("最近历史")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/generate.spec.ts`
Expected: FAIL because the main page and controls are not implemented yet

- [ ] **Step 3: Implement reusable UI primitives**

```tsx
// /root/nanobaba/components/ui/button.tsx
import { cn } from "@/lib/utils";

export function Button({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
```

```ts
// /root/nanobaba/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | undefined | false | null>) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Implement login form and main page layout**

```tsx
// /root/nanobaba/components/login-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setError("密码不正确");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-stone-900">给老婆的生图小站</h1>
      <input
        className="mt-4 w-full rounded-xl border border-stone-300 px-3 py-2"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="请输入密码"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <Button className="mt-4 w-full" type="submit">登录</Button>
    </form>
  );
}
```

```tsx
// /root/nanobaba/app/page.tsx
import { PromptComposer } from "@/components/prompt-composer";
import { ImageResultCard } from "@/components/image-result-card";
import { HistoryList } from "@/components/history-list";
import { LogoutButton } from "@/components/logout-button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[--bg] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-stone-500">私有图片生成</p>
            <h1 className="text-2xl font-semibold text-stone-950">给老婆的生图小站</h1>
          </div>
          <LogoutButton />
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="space-y-6">
            <PromptComposer />
            <ImageResultCard />
          </section>
          <aside>
            <HistoryList />
          </aside>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Implement prompt, result, history, and logout components**

```tsx
// /root/nanobaba/components/prompt-composer.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PromptComposer() {
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setPending(true);
    setError("");
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    setPending(false);

    if (!response.ok) {
      setError("生成失败，请稍后再试");
    }
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">输入提示词</h2>
      <textarea
        className="mt-3 min-h-36 w-full rounded-2xl border border-stone-300 p-3"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="例如：帮我生成一张春天傍晚的花园照片，暖色调，自然光，写实风格"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 flex gap-3">
        <Button disabled={pending}>{pending ? "生成中..." : "生成图片"}</Button>
        <Button type="button" className="bg-stone-200 text-stone-900 hover:bg-stone-300" onClick={() => setPrompt("")}>
          清空
        </Button>
      </div>
    </section>
  );
}
```

```tsx
// /root/nanobaba/components/history-list.tsx
export function HistoryList() {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">最近历史</h2>
        <span className="text-sm text-stone-500">保留 30 天</span>
      </div>
      <p className="mt-4 text-sm text-stone-500">这里会展示最近生成成功的图片记录。</p>
    </section>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/generate.spec.ts`
Expected: PASS with `1 passed`

- [ ] **Step 7: Commit**

```bash
git add components/ui components/login-form.tsx components/prompt-composer.tsx components/image-result-card.tsx components/history-list.tsx components/logout-button.tsx app/page.tsx tests/e2e/generate.spec.ts lib/utils.ts
git commit -m "feat: build generator interface"
```

### Task 6: Wire the UI to live data and finish verification and deployment docs

**Files:**
- Modify: `/root/nanobaba/components/prompt-composer.tsx`
- Modify: `/root/nanobaba/components/image-result-card.tsx`
- Modify: `/root/nanobaba/components/history-list.tsx`
- Modify: `/root/nanobaba/README.md`
- Create: `/root/nanobaba/playwright.config.ts`
- Create: `/root/nanobaba/vitest.config.ts`

- [ ] **Step 1: Write the failing UI state test**

```ts
// /root/nanobaba/tests/e2e/generate.spec.ts
import { test, expect } from "@playwright/test";

test("shows generated image in result area and history", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("例如：帮我生成一张春天傍晚的花园照片，暖色调，自然光，写实风格").fill("一只红苹果，白色背景");
  await page.getByRole("button", { name: "生成图片" }).click();

  await expect(page.getByRole("img", { name: "最新生成图片" })).toBeVisible();
  await expect(page.getByText("一只红苹果，白色背景")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/generate.spec.ts`
Expected: FAIL because result and history are not reading live API data yet

- [ ] **Step 3: Implement live result and history refresh**

```tsx
// /root/nanobaba/components/image-result-card.tsx
"use client";

type ResultState = {
  imageUrl: string;
  prompt: string;
  createdAt: string;
} | null;

export function ImageResultCard({ result }: { result: ResultState }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">当前结果</h2>
      {result ? (
        <div className="mt-4">
          <img className="w-full rounded-2xl border border-stone-200" src={result.imageUrl} alt="最新生成图片" />
          <p className="mt-3 text-sm text-stone-600">{result.prompt}</p>
          <a className="mt-3 inline-flex rounded-xl bg-stone-900 px-4 py-2 text-sm text-white" href={result.imageUrl} download>
            下载图片
          </a>
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">生成完成后，图片会显示在这里。</p>
      )}
    </section>
  );
}
```

```tsx
// /root/nanobaba/components/history-list.tsx
"use client";

import { useEffect, useState } from "react";

type HistoryItem = {
  id: string;
  prompt: string;
  createdAt: string;
};

export function HistoryList() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((response) => response.json())
      .then((data) => setItems(data.items ?? []));
  }, []);

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">最近历史</h2>
        <span className="text-sm text-stone-500">保留 30 天</span>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-stone-200 p-3">
            <p className="text-sm font-medium text-stone-900">{item.prompt}</p>
            <p className="mt-1 text-xs text-stone-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Add test runners and deployment documentation**

```ts
// /root/nanobaba/vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

```ts
// /root/nanobaba/playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
});
```

```md
// /root/nanobaba/README.md
# Nanobaba

## Run locally

1. Copy `.env.example` to `.env`
2. Fill in `APP_PASSWORD`, `SESSION_SECRET`, `GEMINI_PROXY_BASE_URL`, `GEMINI_PROXY_API_KEY`, `GEMINI_IMAGE_MODEL`
3. Install dependencies: `npm install`
4. Start dev server: `npm run dev`

## Verify

- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Cleanup task: `npm run cleanup`

## Deploy on VPS

1. Build the app: `npm run build`
2. Start the app: `npm run start`
3. Put Nginx in front for HTTPS
4. Schedule `npm run cleanup` daily with cron or systemd timer
```

- [ ] **Step 5: Run full verification**

Run: `npm test`
Expected: PASS with all unit tests green

Run: `npm run test:e2e`
Expected: PASS with auth and generation scenarios green

Run: `npm run build`
Expected: PASS with a production Next.js build

- [ ] **Step 6: Commit**

```bash
git add components/prompt-composer.tsx components/image-result-card.tsx components/history-list.tsx README.md vitest.config.ts playwright.config.ts tests/e2e/generate.spec.ts
git commit -m "feat: wire live history and deployment docs"
```

