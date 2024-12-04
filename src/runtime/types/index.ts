export type RequestCategory = 'api' | 'asset' | 'page' | 'auth' | 'static' | 'other'

export interface LogEntry {
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

export interface LogStatistics {
  responseTimeDistribution: Record<number, number>
  statusCodeDistribution: Record<number, number>
  requestsByCategory: Record<string, number>
  timeSeriesData: Array<{
    timestamp: string
    responseTime: number
    status: number
  }>
}
