import { z } from "zod";

const configSchema = z
  .object({
    APP_PASSWORD: z.string().min(1),
    SESSION_SECRET: z.string().min(32),
    OPENAI_IMAGE_BASE_URL: z.string().url().optional(),
    OPENAI_IMAGE_API_KEY: z.string().min(1).optional(),
    OPENAI_IMAGE_MODEL: z.string().min(1).optional(),
    GEMINI_PROXY_BASE_URL: z.string().url().optional(),
    GEMINI_PROXY_API_KEY: z.string().min(1).optional(),
    GEMINI_IMAGE_MODEL: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1),
    IMAGE_STORAGE_DIR: z.string().min(1),
  })
  .refine(
    (input) => input.OPENAI_IMAGE_BASE_URL ?? input.GEMINI_PROXY_BASE_URL,
    {
      message: "OPENAI_IMAGE_BASE_URL is required",
    },
  )
  .refine((input) => input.OPENAI_IMAGE_API_KEY ?? input.GEMINI_PROXY_API_KEY, {
    message: "OPENAI_IMAGE_API_KEY is required",
  })
  .refine((input) => input.OPENAI_IMAGE_MODEL ?? input.GEMINI_IMAGE_MODEL, {
    message: "OPENAI_IMAGE_MODEL is required",
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
    proxyBaseUrl: (
      parsed.OPENAI_IMAGE_BASE_URL ?? parsed.GEMINI_PROXY_BASE_URL ?? ""
    ).replace(/\/$/, ""),
    proxyApiKey: parsed.OPENAI_IMAGE_API_KEY ?? parsed.GEMINI_PROXY_API_KEY ?? "",
    imageModel: parsed.OPENAI_IMAGE_MODEL ?? parsed.GEMINI_IMAGE_MODEL ?? "",
    databaseUrl: parsed.DATABASE_URL,
    imageStorageDir: parsed.IMAGE_STORAGE_DIR,
  };
}
