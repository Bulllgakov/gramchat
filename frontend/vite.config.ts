
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'



export default defineConfig({

  plugins: [react()],

  server: {

    port: 5173,
    
    // ВАЖНО: Больше НЕ используем proxy для /api
    // Все запросы идут напрямую на http://localhost:3000
    // В production используется https://api.gramchat.ru
    
    // Proxy остается только для WebSocket если нужен
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },

  },

})

