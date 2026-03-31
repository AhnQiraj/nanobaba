import { z } from "zod";

const configSchema = z.object({
  APP_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  GEMINI_PROXY_BASE_URL: z.string().url(),
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

export function loadConfig(
  input: Record<string, string | undefined> = process.env,
): AppConfig {
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
