import chalk from 'chalk'

export const EXCLUDED_PATHS = [
  '/favicon.ico',
  '/_nuxt',
  '/__nuxt',
  '/static',
  '/_vercel',
] as const

export const colorCache = {
  method: {
    GET: chalk.cyan,
    POST: chalk.green,
    PUT: chalk.blue,
    DELETE: chalk.red,
    PATCH: chalk.yellow,
  } as const,
  status: {
    success: chalk.green('●'),
    redirect: chalk.blue('○'),
    clientError: chalk.yellow('◐'),
    serverError: chalk.red('◑'),
  } as const,
}

export const timingCategories = {
  fast: { threshold: 100, color: chalk.green },
  medium: { threshold: 300, color: chalk.yellow },
  slow: { threshold: Infinity, color: chalk.red },
}

export const MAX_LOGS = 1000
