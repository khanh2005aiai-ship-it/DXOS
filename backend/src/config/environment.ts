export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];
export type LogLevel = (typeof LOG_LEVELS)[number];

export interface AppConfiguration {
  environment: NodeEnvironment;
  port: number;
  apiPrefix: string;
  logLevel: LogLevel;
  corsOrigins: string[];
  swaggerEnabled: boolean;
  databaseUrl?: string;
  redisUrl?: string;
  jwtAccessSecret?: string;
  jwtAccessTtlSeconds: number;
  jwtRefreshTtlSeconds: number;
  aiProvider: 'mock' | 'openai' | 'gemini' | 'disabled';
  aiModel: string;
  aiApiKey?: string;
  aiTimeoutMs: number;
  rateLimitLoginLimit: number;
  rateLimitLoginWindowSeconds: number;
  rateLimitRefreshLimit: number;
  rateLimitRefreshWindowSeconds: number;
}

type EnvironmentSource = Record<string, string | undefined>;

const developmentCorsOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function configurationError(name: string, reason: string): never {
  throw new Error('Invalid environment variable ' + name + ': ' + reason);
}

function readEnum<T extends readonly string[]>(
  source: EnvironmentSource,
  name: string,
  allowedValues: T,
  fallback: T[number],
): T[number] {
  const value = source[name] ?? fallback;

  if (!allowedValues.includes(value as T[number])) {
    configurationError(name, 'must be one of: ' + allowedValues.join(', '));
  }

  return value as T[number];
}

function readPort(source: EnvironmentSource): number {
  const value = source.PORT ?? '3000';

  if (!/^\d+$/.test(value)) {
    configurationError('PORT', 'must be an integer between 1 and 65535');
  }

  const port = Number.parseInt(value, 10);
  if (port < 1 || port > 65535) {
    configurationError('PORT', 'must be an integer between 1 and 65535');
  }

  return port;
}

function readApiPrefix(source: EnvironmentSource): string {
  const value = source.API_PREFIX ?? 'api/v1';

  if (!/^[a-z0-9]+(?:\/[a-z0-9]+)*$/.test(value)) {
    configurationError('API_PREFIX', 'must contain lowercase path segments without leading or trailing slashes');
  }

  return value;
}

function readBoolean(source: EnvironmentSource, name: string, fallback: boolean): boolean {
  const value = source[name];

  if (value === undefined || value === '') {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  configurationError(name, 'must be true or false');
}

function parseCorsOrigins(value: string): string[] {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    configurationError('CORS_ORIGINS', 'must contain at least one origin');
  }

  return origins.map((origin) => {
    if (origin === '*') {
      configurationError('CORS_ORIGINS', 'wildcard origins are not supported');
    }

    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      configurationError('CORS_ORIGINS', origin + ' is not a valid origin');
    }

    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
      configurationError('CORS_ORIGINS', origin + ' must be an http(s) origin without a path');
    }

    return origin;
  });
}

function readDatabaseUrl(source: EnvironmentSource, environment: NodeEnvironment): string | undefined {
  const value = source.DATABASE_URL;

  if (!value) {
    if (environment === 'test') {
      return undefined;
    }

    configurationError('DATABASE_URL', 'is required outside the test environment');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    configurationError('DATABASE_URL', 'must be a valid MySQL connection URL');
  }

  if (parsed.protocol !== 'mysql:' || parsed.pathname === '/') {
    configurationError('DATABASE_URL', 'must be a MySQL connection URL with a database name');
  }

  return value;
}

function readRedisUrl(source: EnvironmentSource, environment: NodeEnvironment): string | undefined {
  const value = source.REDIS_URL;

  if (!value) {
    if (environment === 'production') {
      configurationError('REDIS_URL', 'is required in production for distributed authentication rate limiting');
    }
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    configurationError('REDIS_URL', 'must be a valid Redis connection URL');
  }

  if (!['redis:', 'rediss:'].includes(parsed.protocol) || !parsed.hostname) {
    configurationError('REDIS_URL', 'must use the redis:// or rediss:// scheme');
  }

  return value;
}

function readJwtAccessSecret(source: EnvironmentSource, environment: NodeEnvironment): string | undefined {
  const value = source.JWT_ACCESS_SECRET;

  if (!value) {
    if (environment === 'test') {
      return undefined;
    }

    configurationError('JWT_ACCESS_SECRET', 'is required outside the test environment');
  }

  if (value.length < 32 || value === 'replace-before-enabling-authentication') {
    configurationError('JWT_ACCESS_SECRET', 'must be a non-default secret of at least 32 characters');
  }

  return value;
}

function readDurationSeconds(
  source: EnvironmentSource,
  name: string,
  fallback: string,
  minimumSeconds: number,
  maximumSeconds: number,
): number {
  const value = source[name] ?? fallback;
  const match = /^(\d+)(s|m|h|d)$/.exec(value);

  if (!match) {
    configurationError(name, 'must use a positive duration with s, m, h, or d suffix');
  }

  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3_600, d: 86_400 };
  const seconds = Number.parseInt(match[1], 10) * multipliers[match[2]];

  if (!Number.isSafeInteger(seconds) || seconds < minimumSeconds || seconds > maximumSeconds) {
    configurationError(name, `must be between ${minimumSeconds} and ${maximumSeconds} seconds`);
  }

  return seconds;
}

function readBoundedInteger(
  source: EnvironmentSource,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const value = source[name] ?? String(fallback);

  if (!/^\d+$/.test(value)) {
    configurationError(name, `must be an integer between ${minimum} and ${maximum}`);
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    configurationError(name, `must be an integer between ${minimum} and ${maximum}`);
  }

  return parsed;
}

function readAiModel(source: EnvironmentSource, provider: AppConfiguration['aiProvider']): string {
  const defaultModel = provider === 'openai' ? 'gpt-4o-mini' : provider === 'gemini' ? 'gemini-1.5-flash' : 'mock-v1';
  const value = source.AI_MODEL ?? defaultModel;
  if (value.length < 1 || value.length > 100 || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/.test(value)) {
    configurationError('AI_MODEL', 'must be a safe model identifier');
  }
  if (provider === 'mock' && value !== 'mock-v1') {
    configurationError('AI_MODEL', 'must be mock-v1 when AI_PROVIDER is mock or disabled');
  }
  return value;
}

function readAiApiKey(source: EnvironmentSource, provider: AppConfiguration['aiProvider'], environment: NodeEnvironment): string | undefined {
  let value: string | undefined;
  if (provider === 'openai') {
    value = source.AI_API_KEY ?? source.OPENAI_API_KEY;
  } else if (provider === 'gemini') {
    value = source.AI_API_KEY ?? source.GEMINI_API_KEY;
  } else {
    value = source.AI_API_KEY;
  }
  if ((provider === 'openai' || provider === 'gemini') && environment !== 'test' && !value && source.ALLOW_EMPTY_AI_KEY !== 'true') {
    configurationError('AI_API_KEY', 'is required when AI_PROVIDER is ' + provider);
  }
  if (value !== undefined && (value.length < 1 || value.length > 4096)) {
    configurationError('AI_API_KEY', 'must be a non-empty value');
  }
  return value;
}

export function getAppConfiguration(source: EnvironmentSource = process.env): AppConfiguration {
  const environment = readEnum(source, 'NODE_ENV', NODE_ENVIRONMENTS, 'development');
  const corsOriginsValue = source.CORS_ORIGINS;

  if (environment === 'production' && !corsOriginsValue) {
    configurationError('CORS_ORIGINS', 'is required in production');
  }

  const corsOrigins = parseCorsOrigins(corsOriginsValue ?? developmentCorsOrigins.join(','));
  const aiTimeout = source.AI_TIMEOUT_MS ?? '5000';
  if (!/^\d+$/.test(aiTimeout) || Number(aiTimeout) < 1 || Number(aiTimeout) > 30000) configurationError('AI_TIMEOUT_MS', 'must be an integer from 1 to 30000');
  const rateLimitDefaults = environment === 'production'
    ? { loginLimit: 10, refreshLimit: 30 }
    : { loginLimit: 100, refreshLimit: 300 };

  const aiProvider = readEnum(source, 'AI_PROVIDER', ['mock', 'openai', 'gemini', 'disabled'] as const, environment === 'production' ? 'disabled' : 'mock');

  return {
    environment,
    aiProvider,
    aiModel: readAiModel(source, aiProvider),
    aiApiKey: readAiApiKey(source, aiProvider, environment),
    aiTimeoutMs: Number(aiTimeout),
    rateLimitLoginLimit: readBoundedInteger(source, 'RATE_LIMIT_LOGIN_LIMIT', rateLimitDefaults.loginLimit, 1, 10_000),
    rateLimitLoginWindowSeconds: readBoundedInteger(source, 'RATE_LIMIT_LOGIN_WINDOW_SECONDS', 60, 1, 86_400),
    rateLimitRefreshLimit: readBoundedInteger(source, 'RATE_LIMIT_REFRESH_LIMIT', rateLimitDefaults.refreshLimit, 1, 10_000),
    rateLimitRefreshWindowSeconds: readBoundedInteger(source, 'RATE_LIMIT_REFRESH_WINDOW_SECONDS', 60, 1, 86_400),
    port: readPort(source),
    apiPrefix: readApiPrefix(source),
    logLevel: readEnum(source, 'LOG_LEVEL', LOG_LEVELS, 'info'),
    corsOrigins,
    swaggerEnabled: readBoolean(source, 'SWAGGER_ENABLED', environment !== 'production'),
    databaseUrl: readDatabaseUrl(source, environment),
    redisUrl: readRedisUrl(source, environment),
    jwtAccessSecret: readJwtAccessSecret(source, environment),
    jwtAccessTtlSeconds: readDurationSeconds(source, 'JWT_ACCESS_TTL', '15m', 60, 3_600),
    jwtRefreshTtlSeconds: readDurationSeconds(source, 'JWT_REFRESH_TTL', '30d', 3_600, 7_776_000),
  };
}

export function validateEnvironment(source: EnvironmentSource): Record<string, string> {
  const config = getAppConfiguration(source);
  const validated: Record<string, string> = {};

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      validated[key] = value;
    }
  }

  return {
    ...Object.fromEntries(Object.entries(validated).filter(([key]) => key !== 'AI_API_KEY')),
    NODE_ENV: config.environment,
    PORT: String(config.port),
    API_PREFIX: config.apiPrefix,
    LOG_LEVEL: config.logLevel,
    CORS_ORIGINS: config.corsOrigins.join(','),
    SWAGGER_ENABLED: String(config.swaggerEnabled),
    ...(config.databaseUrl ? { DATABASE_URL: config.databaseUrl } : {}),
    ...(config.jwtAccessSecret ? { JWT_ACCESS_SECRET: config.jwtAccessSecret } : {}),
    AI_PROVIDER: config.aiProvider,
    AI_MODEL: config.aiModel,
    JWT_ACCESS_TTL: source.JWT_ACCESS_TTL ?? '15m',
    JWT_REFRESH_TTL: source.JWT_REFRESH_TTL ?? '30d',
    RATE_LIMIT_LOGIN_LIMIT: String(config.rateLimitLoginLimit),
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: String(config.rateLimitLoginWindowSeconds),
    RATE_LIMIT_REFRESH_LIMIT: String(config.rateLimitRefreshLimit),
    RATE_LIMIT_REFRESH_WINDOW_SECONDS: String(config.rateLimitRefreshWindowSeconds),
  };
}
