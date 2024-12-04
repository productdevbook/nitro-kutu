import type { LogEntry } from '../types'
import { shouldLogRequest } from '../utils/logger'

export function createAnalyticsHandler(logBuffer: LogEntry[], requestCounts: Map<string, number>) {
  return () => {
    const filteredLogs = logBuffer.filter(log => shouldLogRequest(log.url))

    return {
      success: true,
      data: {
        recentLogs: filteredLogs.slice(0, 100),
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
            .filter(([key]) => shouldLogRequest(key.split(':')[1]))
            .length,
        },
      },
    }
  }
}
