import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  ssr: false,
  alias: {
    '@lesson-loop/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
  },
  compatibilityDate: '2024-11-01',
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001',
    },
  },
  typescript: {
    strict: true,
  },
})
