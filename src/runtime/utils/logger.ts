import type { LogEntry } from '../types'
import chalk from 'chalk'
import { format } from 'date-fns'
import morgan from 'morgan'
import { EXCLUDED_PATHS } from './constants'
import {
  formatResponseTime,
  formatSize,
  getCategoryIcon,
  getDetailedMemoryUsage,
  getMethodColor,
  getRequestCategory,
  getStatusIcon,
} from './formatters'

export function shouldLogRequest(url: string): boolean {
  // Allow analytics endpoints
  if (url.startsWith('/api/_analytics/'))
    return true

  return !EXCLUDED_PATHS.some(path => url.startsWith(path))
}

export function createConsoleLogger(requestCounts: Map<string, number>, logBuffer: LogEntry[]) {
  const rateWindow = 60000 // 1 minute window

  return morgan((tokens, req, res) => {
    const reqUrl = tokens.url(req, res) || ''

    // Analytics endpointi için loglama yapmayalım
    if (reqUrl.startsWith('/api/_analytics/'))
      return undefined

    if (!shouldLogRequest(reqUrl))
      return undefined

    const status = Number(tokens.status(req, res))
    const rawDate = tokens.date(req, res, 'iso') || new Date().toISOString()
    const date = format(new Date(rawDate), 'HH:mm:ss')
    const method = tokens.method(req, res) as string
    const responseTime = tokens['total-time'](req, res)
    const contentLength = tokens.res(req, res, 'content-length')
    const category = getRequestCategory(reqUrl)
    const size = contentLength ? formatSize(Number.parseInt(contentLength)) : '-'

    const key = `${category}:${reqUrl}`
    requestCounts.set(key, (requestCounts.get(key) || 0) + 1)
    setTimeout(() => requestCounts.delete(key), rateWindow)

    const requestsPerMinute = requestCounts.get(key) || 1

    // Create log entry
    const logEntry: LogEntry = {
      timestamp: date,
      category,
      method,
      url: reqUrl,
      status,
      responseTime: responseTime ?? '0',
      size,
      memory: getDetailedMemoryUsage(),
      userAgent: tokens['user-agent'](req, res)?.split(' ')[0],
      requestsPerMinute,
    }

    // Add to buffer - her isteği ekleyelim
    logBuffer.unshift(logEntry)
    if (logBuffer.length > 1000)
      logBuffer.pop()

    // Format console output
    const parts = [
      chalk.gray(`${date}`),
      `${getCategoryIcon(category).padEnd(2)}${getStatusIcon(status)}`,
      getMethodColor(method),
      '│',
      status >= 400 ? chalk.red(reqUrl) : chalk.white(reqUrl),
      '│',
      formatResponseTime(responseTime ?? '0'),
      chalk.gray(size),
    ]

    if (status >= 400) {
      parts.push(
        '\n ',
        chalk.red('↳'),
        chalk.gray(`[Memory: ${getDetailedMemoryUsage()}]`),
        chalk.gray(`[UA: ${tokens['user-agent'](req, res)?.split(' ')[0] || '-'}]`),
      )
    }

    if (requestsPerMinute > 10) {
      parts.push(chalk.yellow(`\n ↳ ${requestsPerMinute}/min`))
    }

    return parts.join(' ')
  })
}
