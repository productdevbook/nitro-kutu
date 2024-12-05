import type { Nitro } from 'nitropack'
import type { Nuxt } from 'nuxt/schema'
import { fileURLToPath } from 'node:url'

export function nitroModule(nitro: Nitro) {
  const templateDir = fileURLToPath(new URL('./runtime/templates', import.meta.url))
  // Configure storage for themes
  nitro.options.storage = nitro.options.storage || {}
  nitro.options.storage['kutu:templates'] = {
    driver: 'fs',
    base: templateDir,
  }

  // Add templates directory to bundled storage for production
  nitro.options.bundledStorage = nitro.options.bundledStorage || []
  nitro.options.bundledStorage.push('kutu/templates')

  // Add plugin
  nitro.options.plugins = nitro.options.plugins || []
  nitro.options.plugins.push(
    fileURLToPath(new URL('./runtime/plugin', import.meta.url)),
  )
}

export default function nitroKutuDev(arg1: unknown, arg2: unknown) {
  if ((arg2 as Nuxt)?.options?.nitro) {
    (arg2 as Nuxt).hooks.hookOnce('nitro:config', (nitroConfig) => {
      nitroConfig.modules = nitroConfig.modules || []
      nitroConfig.modules.push(nitroModule)
    })
  }
  else {
    nitroModule(arg1 as Nitro)
  }
}
