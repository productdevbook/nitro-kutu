import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function createDashboardHandler() {
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  const template = readFileSync(resolve(__dirname, '../templates/dashboard.html'), 'utf-8')

  return async () => {
    return template
  }
}
