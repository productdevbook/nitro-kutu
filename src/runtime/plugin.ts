import type { NitroAppPlugin } from 'nitropack'
import chalk from 'chalk'
import { format } from 'date-fns'
import { eventHandler, fromNodeMiddleware } from 'h3'
import morgan from 'morgan'
import { createStream } from 'rotating-file-stream'

interface LogEntry {
  timestamp: string
  category: RequestCategory
  method: string
  url: string
  status: number
  responseTime: string
  size: string
  memory: string
  userAgent?: string
  requestsPerMinute?: number
}

// Cache color functions
const colorCache = {
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

// Add request timing categories
const timingCategories = {
  fast: { threshold: 100, color: chalk.green },
  medium: { threshold: 300, color: chalk.yellow },
  slow: { threshold: Infinity, color: chalk.red },
}

// Enhanced request categorization
type RequestCategory = 'api' | 'asset' | 'page' | 'auth' | 'static' | 'other'

function getRequestCategory(url: string): RequestCategory {
  if (url.startsWith('/api/'))
    return 'api'
  if (url.startsWith('/auth/'))
    return 'auth'
  if (/\.(?:js|css|png|jpg|gif|svg|ico|woff2?|ttf|eot)$/.test(url))
    return 'asset'
  if (url.startsWith('/static/'))
    return 'static'
  if (url === '/' || !url.includes('.'))
    return 'page'
  return 'other'
}

function getCategoryIcon(category: RequestCategory): string {
  const icons: Record<RequestCategory, string> = {
    api: '⌁',
    asset: '◈',
    page: '□',
    auth: '⚿',
    static: '▤',
    other: '◌',
  }
  return icons[category]
}

function getMethodColor(method: string) {
  // Reduce padding from 6 to 4 characters
  return (colorCache.method[method as keyof typeof colorCache.method] || chalk.white)(method.padEnd(1))
}

function getStatusIcon(status: number) {
  if (status < 300)
    return colorCache.status.success
  if (status < 400)
    return colorCache.status.redirect
  if (status < 500)
    return colorCache.status.clientError
  return colorCache.status.serverError
}

function createProgressBar(value: number, max: number, size: number = 12): string {
  const percentage = Math.min(value / max, 1)
  const filled = Math.round(size * percentage)
  const empty = size - filled

  const filledChar = '━'
  const emptyChar = '╌'

  const bar = chalk.cyan(filledChar.repeat(filled)) + chalk.gray(emptyChar.repeat(empty))
  return `${bar}`
}

function formatResponseTime(time: string) {
  const ms = Number.parseFloat(time)
  const progressBar = createProgressBar(ms, 1000)
  let timing = `${ms}ms`

  if (ms < timingCategories.fast.threshold)
    timing = timingCategories.fast.color(timing)
  else if (ms < timingCategories.medium.threshold)
    timing = timingCategories.medium.color(timing)
  else
    timingCategories.slow.color(timing)

  return `${progressBar} ${timing}`
}

function getDetailedMemoryUsage(): string {
  const { heapUsed, heapTotal, external } = process.memoryUsage()
  return chalk.gray(`Heap: ${formatSize(heapUsed)}/${formatSize(heapTotal)} Ext: ${formatSize(external)}`)
}

function formatSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes}B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

// Add excluded paths configuration
const EXCLUDED_PATHS = [
  '/api/_analytics/logs',
  '/api/_analytics/dashboard',
  '/favicon.ico',
  '/_nuxt', // Nuxt internal paths
  '/__nuxt', // Nuxt internal paths
  '/static',
  '/_vercel', // Add any other paths you want to exclude
] as const

function shouldLogRequest(url: string): boolean {
  return !EXCLUDED_PATHS.some(path => url.startsWith(path))
}

function filterLogBuffer(logs: LogEntry[]): LogEntry[] {
  return logs.filter(log => !EXCLUDED_PATHS.some(path => log.url.startsWith(path)))
}

export default <NitroAppPlugin> function (nitroApp) {
  const requestCounts = new Map<string, number>()
  const rateWindow = 60000 // 1 minute window

  const accessLogStream = createStream('access.json', {
    interval: '1d',
    path: './logs',
    // Add compression
    compress: 'gzip',
  })

  // Modify file logger
  const fileLogger = morgan(
    '{ "date": ":date[iso]", "method": ":method", "endpoint": ":url", "remote-address": ":remote-addr", "status": :status, "total-time": :total-time, "user-agent": ":user-agent", "content-length": ":res[content-length]" },',
    {
      stream: accessLogStream,
      skip: (req: { url: any }) => !shouldLogRequest(req.url || ''),
    },
  )

  // Add circular buffer for logs
  const MAX_LOGS = 1000
  const logBuffer: any[] = []

  // Add type for log entry
  interface LogEntry {
    timestamp: string
    category: RequestCategory
    method: string
    url: string
    status: number
    responseTime: string
    size: string
    memory: string
    userAgent?: string
    requestsPerMinute?: number
  }

  // Enhanced console logger with rate limiting info
  const consoleLogger = morgan((tokens, req, res) => {
    const reqUrl = tokens.url(req, res) || ''

    // Skip logging for excluded paths
    if (!shouldLogRequest(reqUrl)) {
      return undefined
    }

    const status = Number(tokens.status(req, res))
    const rawDate = tokens.date(req, res, 'iso') || new Date().toISOString()
    const date = format(new Date(rawDate), 'HH:mm:ss')
    const method = tokens.method(req, res) as string
    const responseTime = tokens['total-time'](req, res)
    const contentLength = tokens.res(req, res, 'content-length')
    const category = getRequestCategory(reqUrl)
    const size = contentLength ? formatSize(Number.parseInt(contentLength)) : '-'

    // Update request count only for non-excluded paths
    const key = `${category}:${reqUrl}`
    requestCounts.set(key, (requestCounts.get(key) || 0) + 1)
    setTimeout(() => requestCounts.delete(key), rateWindow)

    const requestsPerMinute = requestCounts.get(key) || 1

    // Ensure logBuffer is populated correctly
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

    // Add to circular buffer only if not excluded
    if (shouldLogRequest(reqUrl)) {
      logBuffer.unshift(logEntry)
      if (logBuffer.length > MAX_LOGS) {
        logBuffer.pop()
      }
    }

    const parts = [
      chalk.gray(`${date}`),
      `${getCategoryIcon(category).padEnd(2)}${getStatusIcon(status)}`,
      getMethodColor(method),
      '│', // Add subtle separator
      status >= 400 ? chalk.red(reqUrl) : chalk.white(reqUrl),
      '│', // Add subtle separator
      formatResponseTime(responseTime ?? '0'),
      chalk.gray(size),
    ]

    // Error details with minimal styling
    if (status >= 400) {
      parts.push(
        '\n ', // Slight indent
        chalk.red('↳'),
        chalk.gray(`[Memory: ${getDetailedMemoryUsage()}]`),
        chalk.gray(`[UA: ${tokens['user-agent'](req, res)?.split(' ')[0] || '-'}]`),
      )
    }

    // Simplified rate info
    if (requestsPerMinute > 10) {
      parts.push(chalk.yellow(`\n ↳ ${requestsPerMinute}/min`))
    }

    return parts.join(' ')
  })

  // Add helper functions for statistics
  function getLogStatistics() {
    const filteredLogs = logBuffer.filter(log => shouldLogRequest(log.url))

    return {
      responseTimeDistribution: filteredLogs.reduce((acc, log) => {
        const time = Math.floor(Number(log.responseTime) / 100) * 100
        acc[time] = (acc[time] || 0) + 1
        return acc
      }, {} as Record<number, number>),
      statusCodeDistribution: filteredLogs.reduce((acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1
        return acc
      }, {} as Record<number, number>),
      requestsByCategory: filteredLogs.reduce((acc, log) => {
        acc[log.category] = (acc[log.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      timeSeriesData: filteredLogs.map(log => ({
        timestamp: log.timestamp,
        responseTime: Number(log.responseTime),
        status: log.status,
      })),
    }
  }

  // Add API endpoint
  nitroApp.hooks.hook('request', fromNodeMiddleware(consoleLogger))
  nitroApp.hooks.hook('request', fromNodeMiddleware(fileLogger))

  nitroApp.router.add(
    '/api/_analytics/logs',
    eventHandler({
      handler: (event) => {
        // Filter logs before sending
        const filteredLogs = filterLogBuffer(logBuffer)

        return {
          success: true,
          data: {
            recentLogs: filteredLogs.slice(0, 100), // Last 100 filtered logs
            statistics: {
              responseTimeDistribution: filteredLogs.reduce((acc, log) => {
                const time = Math.floor(Number(log.responseTime) / 100) * 100
                acc[time] = (acc[time] || 0) + 1
                return acc
              }, {} as Record<number, number>),
              statusCodeDistribution: filteredLogs.reduce((acc, log) => {
                acc[log.status] = (acc[log.status] || 0) + 1
                return acc
              }, {} as Record<number, number>),
              requestsByCategory: filteredLogs.reduce((acc, log) => {
                acc[log.category] = (acc[log.category] || 0) + 1
                return acc
              }, {} as Record<string, number>),
              timeSeriesData: filteredLogs.map(log => ({
                timestamp: log.timestamp,
                responseTime: Number(log.responseTime),
                status: log.status,
              })),
            },
            summary: {
              totalRequests: filteredLogs.length,
              averageResponseTime: filteredLogs.reduce((acc, log) =>
                acc + Number(log.responseTime), 0) / filteredLogs.length || 0,
              errorRate: (filteredLogs.filter(log => log.status >= 400).length / filteredLogs.length) || 0,
              requestsPerMinute: [...requestCounts.entries()]
                .filter(([key]) => !EXCLUDED_PATHS.some(path => key.includes(path)))
                .length,
            },
          },
        }
      },
    }),
  )

  // Add HTML dashboard endpoint
  nitroApp.router.add(
    '/api/_analytics/dashboard',
    eventHandler({
      handler: async (event) => {
        // Note: Using backticks for the HTML template
        const html = `
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nitro Analytics Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter var', 'system-ui', '-apple-system', 'sans-serif'],
            },
            animation: {
              'fade-in': 'fadeIn 0.5s ease-out',
              'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
              },
              slideUp: {
                '0%': { transform: 'translateY(10px)', opacity: '0' },
                '100%': { transform: 'translateY(0)', opacity: '1' },
              },
            },
          },
        },
      }
    </script>
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
    <style>
      @supports (font-variation-settings: normal) {
        html { font-family: 'Inter var', system-ui, -apple-system, sans-serif; }
      }
      .glassmorphism {
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
    </style>
</head>
<body class="h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <div id="app" class="min-h-screen flex flex-col">
      <nav class="fixed top-0 left-0 right-0 bg-white/70 dark:bg-gray-800/70 glassmorphism border-b border-gray-200 dark:border-gray-700 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="h-16 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h1 class="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Nitro Analytics Dashboard</h1>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ lastUpdate }}</span>
              <button 
                class="px-4 py-1.5 text-sm rounded-full transition-all duration-200 font-medium"
                :class="autoRefresh ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'"
                @click="toggleRefresh">
                {{ autoRefresh ? 'Pause' : 'Resume' }}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div 
            v-for="item in stats" 
            :key="item.label"
            class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in">
            <div class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ item.label }}</div>
            <div class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{{ item.value }}</div>
          </div>
        </div>

        <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden animate-slide-up">
          <div class="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Recent Requests</h3>
            <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">Total: {{ logs.length }}</span>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-700">
            <div 
              v-for="log in logs" 
              :key="log.timestamp + log.url"
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-150">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 min-w-0">
                  <span 
                    class="px-2.5 py-1 rounded-full text-xs font-medium tracking-wide"
                    :class="getStatusClass(log.status)">
                    {{ log.status }}
                  </span>
                  <span class="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">{{ log.method }}</span>
                  <span class="truncate font-mono text-sm text-gray-500 dark:text-gray-400">{{ log.url }}</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm font-medium" :class="getResponseTimeClass(log.responseTime)">{{ log.responseTime }}ms</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ log.size }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <script>
      const { createApp, ref, onMounted, onUnmounted } = Vue

      const app = createApp({
        setup() {
          const logs = ref([])
          const stats = ref([])
          const autoRefresh = ref(true)
          const lastUpdate = ref('')
          let timer = null

          async function fetchData() {
            try {
              const res = await fetch('/api/_analytics/logs')
              const { data } = await res.json()
              
              logs.value = data.recentLogs || []
              stats.value = [
                { label: 'Total Requests', value: data.summary.totalRequests },
                { label: 'Avg Response Time', value: \`\${Math.round(data.summary.averageResponseTime)}ms\` },
                { label: 'Error Rate', value: \`\${(data.summary.errorRate * 100).toFixed(1)}%\` },
                { label: 'Requests/min', value: data.summary.requestsPerMinute }
              ]
              lastUpdate.value = new Date().toLocaleTimeString()
            } catch (err) {
              console.error('Failed to fetch analytics data:', err)
            }
          }

          function getStatusClass(status) {
            if (status < 300) return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
            if (status < 400) return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400'
            if (status < 500) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
            return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
          }

          function getResponseTimeClass(time) {
            const ms = parseInt(time)
            if (ms < 100) return 'text-green-600 dark:text-green-400'
            if (ms < 300) return 'text-yellow-600 dark:text-yellow-400'
            return 'text-red-600 dark:text-red-400'
          }

          function toggleRefresh() {
            autoRefresh.value = !autoRefresh.value
          }

          function startTimer() {
            timer = setInterval(() => {
              if (autoRefresh.value) fetchData()
            }, 1000)
          }

          onMounted(() => {
            fetchData()
            startTimer()
          })

          onUnmounted(() => {
            if (timer) clearInterval(timer)
          })

          return {
            logs,
            stats,
            autoRefresh,
            lastUpdate,
            getStatusClass,
            getResponseTimeClass,
            toggleRefresh
          }
        }
      })

      app.mount('#app')
    </script>

</body>
</html>`
        // Set response headers
        event.node.res.setHeader('Content-Type', 'text/html')
        return html
      },
    }),
  )
}
