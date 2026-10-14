import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  // Adonde el servidor de desarrollo reenvía las llamadas a los microservicios.
  const gateway = env.DEV_GATEWAY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // El navegador llama a /ventas, /inventario y /compras en su mismo origen
      // y Vite lo reenvía al API Gateway: así no hace falta CORS en el backend.
      proxy: Object.fromEntries(
        ['/ventas', '/inventario', '/compras'].map((ruta) => [ruta, { target: gateway, changeOrigin: true }])
      ),
    },
  }
})
