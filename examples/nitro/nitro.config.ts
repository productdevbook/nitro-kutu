import nitroKutu from 'nitro-kutu'

// https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: 'server',
  modules: [nitroKutu],
  compatibilityDate: '2024-12-04',
})
