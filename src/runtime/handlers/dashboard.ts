import { useStorage } from 'nitropack/runtime'

export async function createDashboardHandler() {
  const theme: string | null = await useStorage().getItem('kutu:templates:dashboard.html')
  return async () => {
    return theme
  }
}
