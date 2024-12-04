import type { LogEntry } from '../types'

export function createAnalyticsHandler(logBuffer: LogEntry[], requestCounts: Map<string, number>) {
  return () => {
    return {
      success: true,
      data: {
        recentLogs: logBuffer.slice(0, 100),
        statistics: {
          responseTimeDistribution: logBuffer.reduce((acc, log) => {
            const time = Math.floor(Number(log.responseTime) / 100) * 100
            acc[time] = (acc[time] || 0) + 1
            return acc
          }, {} as Record<number, number>),
          statusCodeDistribution: logBuffer.reduce((acc, log) => {
            acc[log.status] = (acc[log.status] || 0) + 1
            return acc
          }, {} as Record<number, number>),
          requestsByCategory: logBuffer.reduce((acc, log) => {
            acc[log.category] = (acc[log.category] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          timeSeriesData: logBuffer.map(log => ({
            timestamp: log.timestamp,
            responseTime: Number(log.responseTime),
            status: log.status,
          })),
        },
        summary: {
          totalRequests: logBuffer.length,
          averageResponseTime: logBuffer.reduce((acc, log) =>
            acc + Number(log.responseTime), 0) / logBuffer.length || 0,
          errorRate: (logBuffer.filter(log => log.status >= 400).length / logBuffer.length) || 0,
          requestsPerMinute: requestCounts.size,
        },
      },
    }
  }
}
