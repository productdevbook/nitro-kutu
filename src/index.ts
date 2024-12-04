import type { Nitro } from 'nitropack'
import type { Nuxt } from 'nuxt/schema'
import { fileURLToPath } from 'node:url'

declare module 'nitropack' {
  interface NitroOptions {
    kutu?: {
      /**
       * @default By true, /_api/_analytics/dashboard
       */
      ui?: boolean
    }
  }
}

interface Options {
  /**
   * @default By true, /_api/_analytics/dashboard
   */
  ui?: boolean

}

export function nitroModule(nitro: Nitro) {
  // Add plugin to inject bindings to dev server
  nitro.options.plugins = nitro.options.plugins || []
  nitro.options.plugins.push(
    fileURLToPath(new URL('runtime/plugin', import.meta.url)),
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
