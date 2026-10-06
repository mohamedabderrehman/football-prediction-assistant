import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // API Keys
  FIXTURE_MODE: z.string().default('0').transform(value => value === '1'),
  API_FOOTBALL_KEY: z.string().default(''),
  GROK_API_KEY: z.string().default(''),
  GROK_MODEL: z.string().default('grok-4.20-reasoning'),
  
  // Server
  PORT: z.string().default('3333').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000').transform((val) => 
    val.split(',').map(s => s.trim())
  ),
  
  // Cache
  REDIS_URL: z.string().optional(),
  CACHE_TTL_SECONDS: z.string().default('300').transform(Number),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('30').transform(Number),
}).superRefine((value, ctx) => {
  if (!value.FIXTURE_MODE) {
    for (const key of ['API_FOOTBALL_KEY', 'GROK_API_KEY'] as const)
      if (!value[key]) ctx.addIssue({code: z.ZodIssueCode.custom, path: [key], message: 'Required outside fixture mode'});
  }
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
      console.error('❌ Environment validation failed:');
      issues.forEach(issue => console.error(`   - ${issue}`));
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();
