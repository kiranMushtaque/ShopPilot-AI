import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/shoppilot_db'),
  SESSION_SECRET: z.string().default('shoppilot_local_development_secret_key_change_in_production'),
  AI_PROVIDER: z.enum(['local', 'custom']).default('local'),
  AI_BASE_URL: z.string().default('http://localhost:11434'),
  AI_MODEL: z.string().default('qwen2.5:3b'),
  EMBEDDING_PROVIDER: z.enum(['local']).default('local'),
  EMBEDDING_MODEL: z.string().default('all-minilm-l6-v2'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function getValidatedConfig(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn('⚠️ Environment warning: Some variables using defaults:', parsed.error.format());
    return envSchema.parse({});
  }
  return parsed.data;
}
