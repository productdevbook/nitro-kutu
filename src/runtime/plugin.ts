import type { NitroAppPlugin } from 'nitropack'
import type { LogEntry } from './types'
import { eventHandler, fromNodeMiddleware } from 'h3'
import morgan from 'morgan'
import { createStream } from 'rotating-file-stream'
import { createAnalyticsHandler } from './handlers/analytics'
import { createDashboardHandler } from './handlers/dashboard'
import { createConsoleLogger, shouldLogRequest } from './utils/logger'

export default <NitroAppPlugin> function (nitroApp) {
  const requestCounts = new Map<string, number>()
  const logBuffer: LogEntry[] = []

  const accessLogStream = createStream('access.json', {
    interval: '1d',
    path: './logs',
    compress: 'gzip',
  })

  const fileLogger = morgan(
    '{ "date": ":date[iso]", "method": ":method", "endpoint": ":url", "remote-address": ":remote-addr", "status": :status, "total-time": ":total-time, "user-agent": ":user-agent", "content-length": ":res[content-length]" },',
    {
      stream: accessLogStream,
      skip: req => !shouldLogRequest(req.url || ''),
    },
  )

  const consoleLogger = createConsoleLogger(requestCounts, logBuffer)

  nitroApp.hooks.hook('request', fromNodeMiddleware(consoleLogger))
  nitroApp.hooks.hook('request', fromNodeMiddleware(fileLogger))

  // Add filtered logs to route handlers
  nitroApp.router.add('/api/_analytics/logs', eventHandler(createAnalyticsHandler(logBuffer, requestCounts)))
  nitroApp.router.add('/api/_analytics/dashboard', eventHandler(createDashboardHandler()))
}
