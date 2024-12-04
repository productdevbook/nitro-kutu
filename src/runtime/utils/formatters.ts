import type { RequestCategory } from '../types'
import chalk from 'chalk'
import { colorCache, timingCategories } from './constants'

export function getRequestCategory(url: string): RequestCategory {
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

export function getCategoryIcon(category: RequestCategory): string {
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

export function getMethodColor(method: string) {
  return (colorCache.method[method as keyof typeof colorCache.method] || chalk.white)(method.padEnd(1))
}

export function formatSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes}B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function getStatusIcon(status: number) {
  if (status < 300)
    return colorCache.status.success
  if (status < 400)
    return colorCache.status.redirect
  if (status < 500)
    return colorCache.status.clientError
  return colorCache.status.serverError
}

export function createProgressBar(value: number, max: number, size: number = 12): string {
  const percentage = Math.min(value / max, 1)
  const filled = Math.round(size * percentage)
  const empty = size - filled

  const filledChar = '━'
  const emptyChar = '╌'

  return `${chalk.cyan(filledChar.repeat(filled))}${chalk.gray(emptyChar.repeat(empty))}`
}

export function formatResponseTime(time: string) {
  const ms = Number.parseFloat(time)
  const progressBar = createProgressBar(ms, 1000)
  let timing = `${ms}ms`

  if (ms < timingCategories.fast.threshold)
    timing = timingCategories.fast.color(timing)
  else if (ms < timingCategories.medium.threshold)
    timing = timingCategories.medium.color(timing)
  else
    timing = timingCategories.slow.color(timing)

  return `${progressBar} ${timing}`
}

export function getDetailedMemoryUsage(): string {
  const { heapUsed, heapTotal, external } = process.memoryUsage()
  return chalk.gray(`Heap: ${formatSize(heapUsed)}/${formatSize(heapTotal)} Ext: ${formatSize(external)}`)
}
